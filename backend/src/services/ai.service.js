const LostItemModel = require("../models/lostItem.model");
const LostDocumentModel = require("../models/lostDocument.model");
const FoundItemModel = require("../models/foundItem.model");
const FoundDocumentModel = require("../models/foundDocument.model");
const AlertModel = require("../models/alert.model");
const UserModel = require("../models/user.model");

function tokenize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\sà-ÿ]/g, "").split(/\s+/).filter(Boolean);
}

function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const len = tokens.length || 1;
  for (const k in tf) tf[k] /= len;
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const k of allKeys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const inter = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

function scoreItem(queryTokens, queryTf, itemTokens, itemTf) {
  const cos = cosineSimilarity(queryTf, itemTf);
  const jac = jaccardSimilarity(queryTokens, itemTokens);
  return cos * 0.6 + jac * 0.4;
}

const AIService = {
  matchLostItems(foundItem) {
    const lostItems = LostItemModel.getAll();
    const queryTokens = tokenize(foundItem.name + " " + (foundItem.description || ""));
    const queryTf = termFrequency(queryTokens);
    return lostItems
      .map(item => {
        const itemTokens = tokenize(item.name + " " + (item.description || ""));
        const itemTf = termFrequency(itemTokens);
        return { ...item, score: scoreItem(queryTokens, queryTf, itemTokens, itemTf), matchType: "lost_item" };
      })
      .filter(m => m.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },

  matchLostDocuments(foundDoc) {
    const lostDocs = LostDocumentModel.getAll();
    const queryTokens = tokenize(foundDoc.owner_name + " " + (foundDoc.type || "") + " " + (foundDoc.number || ""));
    const queryTf = termFrequency(queryTokens);
    return lostDocs
      .map(doc => {
        const docTokens = tokenize(doc.owner_name + " " + (doc.type || "") + " " + (doc.number || ""));
        const docTf = termFrequency(docTokens);
        const nameTokens = tokenize(foundDoc.owner_name);
        const docNameTokens = tokenize(doc.owner_name);
        const nameJaccard = jaccardSimilarity(nameTokens, docNameTokens);
        const tfidf = scoreItem(queryTokens, queryTf, docTokens, docTf);
        return { ...doc, score: Math.max(tfidf, nameJaccard), matchType: "lost_document" };
      })
      .filter(m => m.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },

  query(text) {
    const qTokens = tokenize(text);
    const qTf = termFrequency(qTokens);

    const lostItems = LostItemModel.getAll().map(item => ({
      ...item,
      tokens: tokenize(item.name + " " + (item.description || "")),
      tf: null
    }));
    const lostDocs = LostDocumentModel.getAll().map(doc => ({
      ...doc,
      tokens: tokenize(doc.owner_name + " " + (doc.type || "")),
      tf: null
    }));
    const foundItems = FoundItemModel.getAll().map(item => ({
      ...item,
      tokens: tokenize(item.name + " " + (item.description || "")),
      tf: null
    }));
    const foundDocs = FoundDocumentModel.getAll().map(doc => ({
      ...doc,
      tokens: tokenize(doc.owner_name + " " + (doc.type || "")),
      tf: null
    }));

    const all = [
      ...lostItems.map(i => ({ ...i, category: "Objet perdu" })),
      ...lostDocs.map(d => ({ ...d, category: "Document perdu" })),
      ...foundItems.map(i => ({ ...i, category: "Objet trouvé" })),
      ...foundDocs.map(d => ({ ...d, category: "Document trouvé" }))
    ];

    return all
      .map(item => {
        const itemTf = termFrequency(item.tokens);
        return { ...item, score: cosineSimilarity(qTf, itemTf) };
      })
      .filter(m => m.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ tokens, tf, ...rest }) => rest);
  },

  detectAnomalies() {
    const alerts = AlertModel.getAll();
    const users = UserModel.getAll();
    const issues = [];

    const urgentAlerts = alerts.filter(a => a.status === "URGENT" || a.status === "PENDING");
    if (urgentAlerts.length > 3) {
      issues.push({
        type: "ALERT_STORM",
        severity: "high",
        message: `${urgentAlerts.length} alertes simultanées — possible attaque coordonnée ou défaillance technique.`,
        count: urgentAlerts.length
      });
    }

    const recentAlerts = alerts.filter(a => {
      const d = new Date(a.date);
      return Date.now() - d.getTime() < 3600000;
    });
    const userAlertCounts = {};
    for (const a of recentAlerts) {
      const key = a.user_id || a.user;
      userAlertCounts[key] = (userAlertCounts[key] || 0) + 1;
    }
    for (const [userId, count] of Object.entries(userAlertCounts)) {
      if (count >= 3) {
        const user = users.find(u => u.id == userId || u.name === userId);
        issues.push({
          type: "RAPID_ALERTS",
          severity: "medium",
          message: `${user ? user.name : userId} a déclenché ${count} alertes en 1h — possible fausse alerte ou urgence réelle.`,
          userId,
          count
        });
      }
    }

    return issues;
  }
};

module.exports = AIService;