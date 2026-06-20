const AIService = require("../services/ai.service");
const FoundItemModel = require("../models/foundItem.model");
const FoundDocumentModel = require("../models/foundDocument.model");

const AIController = {
  matchItem(req, res) {
    const { name, description } = req.body;
    const virtual = { name: name || "", description: description || "" };
    const matches = AIService.matchLostItems(virtual);
    res.json(matches);
  },

  matchDocument(req, res) {
    const { ownerName, type, number } = req.body;
    const virtual = { owner_name: ownerName || "", type: type || "", number: number || "" };
    const matches = AIService.matchLostDocuments(virtual);
    res.json(matches);
  },

  matchFoundItem(req, res) {
    const { id } = req.params;
    const item = FoundItemModel.getAll().find(i => i.id === id);
    if (!item) return res.status(404).json({ success: false, message: "Objet trouvé introuvable" });
    const matches = AIService.matchLostItems(item);
    res.json(matches);
  },

  matchFoundDocument(req, res) {
    const { id } = req.params;
    const doc = FoundDocumentModel.getAll().find(d => d.id === id);
    if (!doc) return res.status(404).json({ success: false, message: "Document trouvé introuvable" });
    const matches = AIService.matchLostDocuments(doc);
    res.json(matches);
  },

  search(req, res) {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const results = AIService.query(q);
    res.json(results);
  },

  anomalies(req, res) {
    const issues = AIService.detectAnomalies();
    res.json(issues);
  },

  chat(req, res) {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Bonjour ! Comment puis-je vous aider ?" });

    const msg = message.toLowerCase().trim();

    const responses = [
      { keywords: ["bonjour", "salut", "hello", "bonsoir"], reply: "Bonjour ! Je suis l'assistant SafeGuardian. Posez-moi une question sur l'application." },
      { keywords: ["alerte", "sos", "urgence", "détresse"], reply: "Pour déclencher une alerte SOS : appuyez longuement (3s) sur le bouton du bracelet, ou via l'application dans la page Alertes. Les secours (police → pompiers → voisins) seront notifiés automatiquement." },
      { keywords: ["objet", "perdu", "trouvé"], reply: "Vous pouvez déclarer un objet perdu dans 'Objets Perdus' et un objet trouvé dans 'Objets Retrouvés'. Le système cherche automatiquement des correspondances entre les deux." },
      { keywords: ["document", "cni", "passeport", "identité"], reply: "Les documents officiels (CNI, passeport, permis) peuvent être déclarés dans 'Documents Perdus'. Si quelqu'un trouve votre document et le dépose dans 'Documents Retrouvés', vous recevrez une notification automatique par SMS/email." },
      { keywords: ["bracelet", "bague", "esp32", "désactivation", "sommeil"], reply: "Le bracelet peut être désactivé temporairement (pour dormir, se doucher, faire du sport) depuis la page 'Bracelet Connecté'. La désactivation est limitée à 24h max pour des raisons de sécurité." },
      { keywords: ["qr", "code", "scanner"], reply: "Chaque objet ou document déclaré génère un QR code unique. Scannez-le avec la caméra dans 'Documents Retrouvés' pour pré-remplir les informations du propriétaire." },
      { keywords: ["compte", "inscription", "register", "connexion"], reply: "Créez un compte via la page d'inscription (email + mot de passe). Un ID unique vous sera attribué pour votre bracelet connecté." },
      { keywords: ["contact", "urgent", "secours", "police"], reply: "Contacts d'urgence : Police 111, Pompiers 112. Vous pouvez aussi enregistrer vos proches dans la page 'Contacts Urgence'." },
      { keywords: ["retrait", "forcé", "vol"], reply: "Le bracelet détecte le retrait forcé et déclenche immédiatement une alerte SOS avec votre dernière position connue." },
      { keywords: ["précieux", "bijou", "valeur"], reply: "Dans 'Objets Précieux', vous pouvez enregistrer vos biens de valeur avec photo. Chaque bien reçoit un QR code pour faciliter la récupération en cas de perte." },
      { keywords: ["donnée", "privé", "sécurité", "confidentialité"], reply: "Vos données sont chiffrées et stockées de manière sécurisée. Le bracelet ne transmet votre position qu'en cas d'urgence, jamais en continu." },
      { keywords: ["merci"], reply: "De rien ! Je reste à votre disposition. N'hésitez pas si vous avez d'autres questions." }
    ];

    for (const { keywords, reply } of responses) {
      if (keywords.some(k => msg.includes(k))) {
        const anomalyCheck = AIService.detectAnomalies();
        const anomalyNote = anomalyCheck.length > 0
          ? "\n\n⚠️ Attention : " + anomalyCheck[0].message
          : "";
        return res.json({ reply: reply + anomalyNote });
      }
    }

    const searchResults = AIService.query(msg);
    if (searchResults.length > 0) {
      return res.json({
        reply: `Voici ce que j'ai trouvé dans la base de données qui correspond à votre recherche :\n${searchResults.slice(0, 3).map(r => `• ${r.category} : ${r.name || r.owner_name} (pertinence: ${(r.score * 100).toFixed(0)}%)`).join("\n")}\n\nConsultez les sections correspondantes pour plus de détails.`,
        results: searchResults
      });
    }

    res.json({ reply: "Je n'ai pas compris votre demande. Essayez de reformuler ou tapez 'aide' pour voir mes fonctionnalités. Je peux vous renseigner sur : alertes SOS, objets perdus/trouvés, documents, bracelet, QR codes, comptes, contacts d'urgence, etc." });
  }
};

module.exports = AIController;