import React, { useState } from "react";
import { 
  Smartphone, 
  BatteryCharging, 
  MapPin, 
  Radio, 
  RefreshCw, 
  ShieldAlert,
  Send,
  Zap
} from "lucide-react";
import DeviceStatus from "../components/DeviceStatus";
import { api } from "../api";

const DISTRICT_PRESETS = [
  { name: "Cocody (Université)", lat: 5.3484, lng: -3.9774 },
  { name: "Plateau (Mairie)", lat: 5.3248, lng: -4.0191 },
  { name: "Marcory (Zone 4)", lat: 5.2974, lng: -3.9822 },
  { name: "Yopougon (Bel Air)", lat: 5.3412, lng: -4.0628 },
  { name: "Riviera (3e Pont)", lat: 5.3621, lng: -3.9452 }
];

export default function Device({ device, onUpdateCoordinates, apiBaseUrl, fetchData }) {
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [loading, setLoading] = useState(false);

  if (!device) return null;

  // Change battery level
  const handleUpdateBattery = async (newLevel) => {
    try {
      const response = await api("/device", {
        method: "PUT",
        body: JSON.stringify({ battery: Math.max(0, Math.min(100, newLevel)) })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update battery", error);
    }
  };

  // Simulate ESP32 Button Signal
  const handleSimulateESP32Click = async () => {
    setLoading(true);
    try {
      const response = await api("/esp32/button", {
        method: "POST",
        body: JSON.stringify({
          user: `Bracelet ${device.id}`,
          message: "SOS déclenché (Pulsation longue sur le bouton physique du bracelet)",
          location: `Abidjan (Simulé: ${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)})`
        })
      });
      if (response.ok) {
        alert("Signal discret ESP32 envoyé avec succès ! Alerte SOS déclenchée.");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to send ESP32 button click", error);
      alert("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLocationSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onUpdateCoordinates(lat, lng);
      setCustomLat("");
      setCustomLng("");
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Gestion du Bracelet IoT</h1>
        <p style={{ color: "var(--text-secondary)" }}>Supervision technique et simulateur de signal physique pour test.</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        alignItems: "start"
      }} className="responsive-dashboard-layout">
        
        {/* Left Column: Real-time Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <DeviceStatus device={device} />

          {/* Quick Simulation Options */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} style={{ color: "var(--color-warning)" }} />
              Simuler l'État de Charge
            </h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button 
                onClick={() => handleUpdateBattery(device.battery - 10)} 
                className="btn btn-secondary"
                disabled={device.battery <= 0}
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                Décharger (-10%)
              </button>
              <button 
                onClick={() => handleUpdateBattery(device.battery + 10)} 
                className="btn btn-secondary"
                disabled={device.battery >= 100}
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                Recharger (+10%)
              </button>
              <button 
                onClick={() => handleUpdateBattery(100)} 
                className="btn btn-success"
                style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                <BatteryCharging size={14} />
                Plein (100%)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Simulators & GPS Control */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ESP32 Hardware Signal Simulator */}
          <div className="glass-panel" style={{
            padding: "1.5rem",
            border: "1px solid rgba(255, 45, 85, 0.3)",
            background: "rgba(255, 45, 85, 0.02)"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)" }}>
              <ShieldAlert size={18} />
              Simulateur Hardware ESP32
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Simule l'envoi d'un signal HTTP par le module ESP32 lorsque le citoyen appuie sur le bouton physique du bracelet connecté.
            </p>
            <button 
              onClick={handleSimulateESP32Click} 
              className="btn btn-danger"
              style={{ width: "100%", height: "46px" }}
              disabled={loading}
            >
              <Radio size={16} className={loading ? "pulse-active" : ""} />
              Simuler Clic Bouton Physique SOS
            </button>
          </div>

          {/* GPS Simulation */}
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={18} style={{ color: "var(--color-primary)" }} />
              Simuler le Déplacement GPS
            </h3>

            {/* Presets Grid */}
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="form-label" style={{ marginBottom: "0.75rem" }}>Destinations prédéfinies (Abidjan)</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {DISTRICT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.8rem",
                      justifyContent: "flex-start",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    onClick={() => onUpdateCoordinates(preset.lat, preset.lng)}
                  >
                    <MapPin size={12} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Coordinates */}
            <form onSubmit={handleCustomLocationSubmit} style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.25rem" }}>
              <span className="form-label" style={{ marginBottom: "0.75rem" }}>Coordonnées Manuelles</span>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    placeholder="Latitude (ex: 5.34)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    placeholder="Longitude (ex: -3.97)"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.6rem" }}>
                <Send size={14} />
                Mettre à jour la position
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
