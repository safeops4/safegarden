import React, { useState, useEffect } from "react";
import { Users, Plus, Phone, Mail, Trash2, ShieldAlert, Shield } from "lucide-react";
import { api } from "../api";

export default function Contacts({ apiBaseUrl }) {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Famille");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await api("/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch emergency contacts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      const response = await api("/contacts", {
        method: "POST",
        body: JSON.stringify({ name, relation, phone, email })
      });
      if (response.ok) {
        setName("");
        setPhone("");
        setEmail("");
        setRelation("Famille");
        setShowForm(false);
        fetchContacts();
      }
    } catch (error) {
      console.error("Failed to add contact", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce contact d'urgence ?")) return;

    try {
      const response = await api(`/contacts/${contactId}`, { method: "DELETE" });
      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error("Failed to delete contact", error);
    }
  };

  return (
    <div className="page-wrapper">
      {/* National emergency numbers */}
      <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "2rem", background: "rgba(255, 45, 85, 0.05)", border: "1px solid rgba(255, 45, 85, 0.15)" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={18} style={{ color: "var(--color-danger)" }} />
          Numéros d'Urgence Nationaux (Côte d'Ivoire)
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {[
            { label: "Police Secours", number: "111", color: "var(--color-danger)" },
            { label: "Pompiers", number: "112", color: "var(--color-warning)" },
            { label: "SAMU", number: "185", color: "var(--color-success)" },
            { label: "Police Nationale", number: "170", color: "var(--color-primary)" },
            { label: "Gendarmerie", number: "180", color: "var(--color-primary)" }
          ].map((e, i) => (
            <a key={i} href={`tel:${e.number}`} style={{
              flex: "1 1 100px", padding: "0.6rem 1rem", borderRadius: "8px",
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-glass)",
              textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
              transition: "all 0.3s ease"
            }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: e.color }}>{e.number}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{e.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Contacts d'Urgence</h1>
          <p style={{ color: "var(--text-secondary)" }}>Gérez votre cercle de confiance (famille, voisins, forces de l'ordre) notifiés lors de SOS.</p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
          style={{ height: "46px" }}
        >
          <Plus size={18} />
          Ajouter un contact
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Ajouter un Contact d'Urgence</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">Nom complet</label>
                <input
                  id="contact-name"
                  className="form-control"
                  placeholder="Ex: Koffi Kouame"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-relation">Relation / Cercle</label>
                <select
                  id="contact-relation"
                  className="form-control"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Famille">Famille</option>
                  <option value="Ami">Ami / Proche</option>
                  <option value="Voisin">Voisin / Quartier</option>
                  <option value="Secours">Secours / Police</option>
                  <option value="Santé">Médecin / Santé</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-phone">Numéro de Téléphone</label>
                <input
                  id="contact-phone"
                  className="form-control"
                  placeholder="Ex: +225 0708091011"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">Email (Optionnel)</label>
                <input
                  id="contact-email"
                  type="email"
                  className="form-control"
                  placeholder="Ex: koffi@mail.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Ajout..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts Grid */}
      <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem" }}>Cercle Enregistré ({contacts.length})</h3>

      {loading && contacts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          Chargement des contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Users size={40} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontWeight: 600 }}>Aucun contact d'urgence</span>
          <span style={{ fontSize: "0.85rem" }}>Veuillez renseigner au moins un proche à contacter en cas de déclenchement d'un SOS.</span>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem"
        }}>
          {contacts.map((contact) => (
            <div key={contact.id} className="glass-panel glass-panel-interactive" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}>{contact.name}</span>
                  <span className={`badge ${contact.relation === "Secours" ? "badge-urgent" : "badge-info"}`}>
                    {contact.relation}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.75rem" }}>
                  <a 
                    href={`tel:${contact.phone}`} 
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
                  >
                    <Phone size={14} />
                    {contact.phone}
                  </a>
                  {contact.email && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Mail size={14} />
                      {contact.email}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleDelete(contact.id)}
                  style={{
                    background: "rgba(255, 45, 85, 0.05)",
                    border: "1px solid rgba(255, 45, 85, 0.2)",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-danger)",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  title="Supprimer le contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
