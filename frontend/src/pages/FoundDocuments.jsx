import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Plus, ShieldCheck, Scan, MapPin, Camera, User, CheckCircle, X } from "lucide-react";
import { api } from "../api";

function QrScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner = null;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode("qr-reader");
      setScanning(true);
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {}
      ).catch((err) => {
        setError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
        setScanning(false);
      });
    }).catch(() => {
      setError("Bibliothèque de scan non disponible.");
    });

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Camera size={18} style={{ color: "var(--color-primary)" }} /> Scanner un QR Code
        </h4>
        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", height: "auto" }} onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div id="qr-reader" style={{ width: "100%", maxWidth: "350px", margin: "0 auto" }} />
      {scanning && <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Scannez le QR code du document...</p>}
      {error && <p style={{ textAlign: "center", color: "#ff2d55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}

export default function FoundDocuments({ apiBaseUrl }) {
  const [documents, setDocuments] = useState([]);
  const [type, setType] = useState("CNI");
  const [ownerName, setOwnerName] = useState("");
  const [number, setNumber] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState(null);
  const [matchedInfo, setMatchedInfo] = useState(null);
  const [aiMatches, setAiMatches] = useState([]);
  const [aiMatchesLoading, setAiMatchesLoading] = useState(null);

  const fetchAIMatches = async (docId) => {
    setAiMatchesLoading(docId);
    try {
      const res = await api(`/ai/match-found-document/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setAiMatches(prev => ({ ...prev, [docId]: data }));
      }
    } catch (e) { console.error(e); }
    setAiMatchesLoading(null);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api("/found-documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch found documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [apiBaseUrl]);

  const handleScanResult = useCallback((decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.ownerName) setOwnerName(data.ownerName);
      if (data.type) setType(data.type);
      if (data.number) setNumber(data.number);
      if (!showForm) setShowForm(true);
      setShowScanner(false);
      setNotification({ type: "success", message: "QR Code scanné avec succès !" });
      setTimeout(() => setNotification(null), 3000);
    } catch {
      setOwnerName(decodedText);
      if (!showForm) setShowForm(true);
      setShowScanner(false);
      setNotification({ type: "success", message: "Texte scanné, vérifiez les champs." });
      setTimeout(() => setNotification(null), 3000);
    }
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerName.trim()) return;

    setSubmitting(true);
    try {
      const response = await api("/found-documents", {
        method: "POST",
        body: JSON.stringify({ type, ownerName, number, location })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.ownerMatched) {
          setMatchedInfo({ ownerName, count: result.matchedCount });
        }
        setOwnerName("");
        setNumber("");
        setLocation("");
        setShowForm(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to declare found document", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Documents Retrouvés</h1>
          <p style={{ color: "var(--text-secondary)" }}>Déposez les pièces d'identité retrouvées. Le propriétaire sera notifié automatiquement.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setShowScanner(!showScanner)} className="btn btn-secondary" style={{ height: "46px" }}>
            <Scan size={18} />
            Scanner
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ height: "46px" }}>
            <Plus size={18} />
            Déposer un document
          </button>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          borderRadius: "10px",
          background: notification.type === "success" ? "rgba(0, 200, 83, 0.15)" : "rgba(255, 45, 85, 0.15)",
          border: `1px solid ${notification.type === "success" ? "rgba(0, 200, 83, 0.3)" : "rgba(255, 45, 85, 0.3)"}`,
          color: notification.type === "success" ? "#00c853" : "#ff2d55",
          fontWeight: 500
        }}>
          {notification.message}
        </div>
      )}

      {matchedInfo && (
        <div style={{
          padding: "1rem",
          marginBottom: "1rem",
          borderRadius: "10px",
          background: "rgba(0, 217, 255, 0.1)",
          border: "1px solid rgba(0, 217, 255, 0.2)",
          color: "var(--color-primary)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <CheckCircle size={20} />
          Propriétaire trouvé dans la base ! {matchedInfo.count} notification(s) envoyée(s) à {matchedInfo.ownerName}.
        </div>
      )}

      {showScanner && (
        <QrScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />
      )}

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Dépôt de document retrouvé</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="fd-type">Type de document</label>
                <select id="fd-type" className="form-control" value={type} onChange={(e) => setType(e.target.value)} disabled={submitting}>
                  <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Permis de Conduire">Permis de Conduire</option>
                  <option value="Carte Grise">Carte Grise</option>
                  <option value="Autre">Autre Document</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fd-owner">Nom complet du titulaire</label>
                <input id="fd-owner" className="form-control" placeholder="Ex: Koffi Kouassi Koffi" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required disabled={submitting} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fd-num">Numéro / Référence</label>
                <input id="fd-num" className="form-control" placeholder="Ex: CI01928374" value={number} onChange={(e) => setNumber(e.target.value)} disabled={submitting} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fd-loc">Lieu de dépôt</label>
                <input id="fd-loc" className="form-control" placeholder="Commissariat, mairie..." value={location} onChange={(e) => setLocation(e.target.value)} disabled={submitting} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Dépôt..." : "Déposer le document"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          Registre des Documents Trouvés ({documents.length})
        </h3>
        {loading && documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Chargement...</div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={40} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600 }}>Aucun document déposé</span>
            <span style={{ fontSize: "0.85rem" }}>Scannez ou déposez les documents retrouvés pour notifier leur propriétaire.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Nom Titulaire</th>
                  <th>Numéro</th>
                  <th>Lieu de dépôt</th>
                  <th>Déposé par</th>
                  <th>Date</th>
                  <th>Propriétaire notifié</th>
                  <th>Statut</th>
                  <th>IA 🔍</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 700, color: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ShieldCheck size={16} style={{ color: "var(--color-primary)" }} />
                        {doc.type}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{doc.owner_name}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--color-primary)", fontSize: "0.9rem" }}>{doc.number || "-"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                        {doc.location || "Non précisé"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <User size={14} />
                        {doc.declared_by || "Anonyme"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(doc.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      {doc.notified ? (
                        <span className="badge badge-resolved" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <CheckCircle size={14} /> Notifié
                        </span>
                      ) : (
                        <span className="badge badge-warning">Non notifié</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${doc.status === "Récupéré" ? "badge-resolved" : "badge-info"}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <button className="btn btn-secondary" style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                        onClick={() => fetchAIMatches(doc.id)} disabled={aiMatchesLoading === doc.id}>
                        {aiMatchesLoading === doc.id ? "..." : "🔍"}
                      </button>
                      {aiMatches[doc.id] && aiMatches[doc.id].length > 0 && (
                        <div style={{ position: "absolute", background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0.5rem", zIndex: 10, fontSize: "0.75rem", marginTop: "0.25rem", maxWidth: "200px" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.25rem" }}>Correspondances:</div>
                          {aiMatches[doc.id].map((m, i) => (
                            <div key={i} style={{ borderBottom: i < aiMatches[doc.id].length - 1 ? "1px solid var(--border-glass)" : "none", padding: "0.25rem 0" }}>
                              {m.owner_name} ({m.type}) — {(m.score * 100).toFixed(0)}%
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}