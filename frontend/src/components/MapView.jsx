import React from "react";
import { MapPin, Compass, ShieldAlert, Crosshair } from "lucide-react";

export default function MapView({ device, activeAlerts = [], onMapClick }) {
  const isSOS = device?.status === "ALERTE SOS" || activeAlerts.length > 0;
  
  // Map dimensions
  const width = 600;
  const height = 320;
  
  // Abidjan coordinates anchor (approximate Cocody/Plateau center)
  // Lat: 5.3484, Lng: -3.9774
  // We'll map coordinates around this center to pixels
  const centerLat = 5.3484;
  const centerLng = -3.9774;
  const scale = 4000; // zoom factor for coordinate mapping
  
  // Convert lat/lng to SVG coordinates
  const getXY = (lat, lng) => {
    if (!lat || !lng) return { x: width / 2, y: height / 2 };
    
    // Simple Mercator-like projection scale around center
    const x = width / 2 + (lng - centerLng) * scale;
    // Latitude decreases as y increases in SVG
    const y = height / 2 - (lat - centerLat) * scale;
    
    // Constrain to map bounds
    return {
      x: Math.max(20, Math.min(width - 20, x)),
      y: Math.max(20, Math.min(height - 20, y))
    };
  };

  const handleSVGClick = (e) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Inverse transformation to get new lat/lng
    const newLng = centerLng + (clickX - width / 2) / scale;
    const newLat = centerLat - (clickY - height / 2) / scale;
    
    onMapClick(newLat, newLng);
  };

  const { x, y } = device ? getXY(device.latitude, device.longitude) : { x: width/2, y: height/2 };

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Crosshair size={18} style={{ color: isSOS ? "var(--color-danger)" : "var(--color-primary)" }} />
          Carte de Localisation SOS (Interactif)
        </h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Cliquez sur la carte pour déplacer le bracelet
        </span>
      </div>

      <div 
        onClick={handleSVGClick}
        style={{
          width: "100%",
          height: `${height}px`,
          backgroundColor: "#080c16",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          cursor: "crosshair",
          border: `1px solid ${isSOS ? "rgba(255, 45, 85, 0.2)" : "var(--border-glass)"}`
        }}
      >
        {/* Background Grid Pattern */}
        <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Simulated Rivers / Lagoon (Ebrie Lagoon style curves) */}
          <path 
            d="M -50 200 C 150 180, 200 240, 350 210 C 450 190, 500 260, 650 230" 
            fill="none" 
            stroke="rgba(0, 217, 255, 0.08)" 
            strokeWidth="30" 
            strokeLinecap="round" 
          />
          <path 
            d="M 120 -50 C 150 100, 100 180, 180 230" 
            fill="none" 
            stroke="rgba(0, 217, 255, 0.04)" 
            strokeWidth="15" 
            strokeLinecap="round" 
          />

          {/* Simulated Major Roads (Glowing vector lines) */}
          <path d="M 50 0 L 250 320" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <path d="M 0 120 L 600 180" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <path d="M 300 0 C 320 120, 280 200, 450 320" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          
          {/* District Labels */}
          <text x="120" y="80" fill="rgba(255,255,255,0.15)" fontSize="11" fontWeight="bold" fontFamily="monospace">COCODY</text>
          <text x="350" y="140" fill="rgba(255,255,255,0.15)" fontSize="11" fontWeight="bold" fontFamily="monospace">PLATEAU</text>
          <text x="450" y="70" fill="rgba(255,255,255,0.1)" fontSize="10" fontWeight="bold" fontFamily="monospace">RIVIERA</text>
          <text x="80" y="270" fill="rgba(255,255,255,0.1)" fontSize="10" fontWeight="bold" fontFamily="monospace">MARCORY</text>

          {/* Active SOS Zones or Alerts (pulser behind current location if SOS) */}
          {isSOS && (
            <>
              <circle cx={x} cy={y} r="45" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" opacity="0.3" className="pulse-sos" />
              <circle cx={x} cy={y} r="25" fill="none" stroke="var(--color-danger)" strokeWidth="2" opacity="0.5" className="pulse-sos" />
            </>
          )}

          {/* Device Location Pointer */}
          {device && (
            <g>
              {/* Radar beam effect */}
              <circle 
                cx={x} 
                cy={y} 
                r="15" 
                fill={isSOS ? "rgba(255, 45, 85, 0.15)" : "rgba(0, 217, 255, 0.1)"} 
                stroke={isSOS ? "var(--color-danger)" : "var(--color-primary)"} 
                strokeWidth="1"
                className="pulse-active"
              />
              {/* Core dot */}
              <circle 
                cx={x} 
                cy={y} 
                r="5" 
                fill={isSOS ? "var(--color-danger)" : "var(--color-primary)"} 
                style={{ filter: `drop-shadow(0 0 5px ${isSOS ? "var(--color-danger)" : "var(--color-primary)"})` }}
              />
            </g>
          )}
        </svg>

        {/* Floating Map HUD */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          background: "rgba(11, 15, 25, 0.85)",
          border: "1px solid var(--border-glass)",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          fontSize: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-primary)", fontWeight: "bold" }}>
            <Compass size={12} />
            <span>TELEMETRIE LIVE</span>
          </div>
          <div>Cible: Bracelet {device?.id || "N/A"}</div>
          <div>Statut: <span style={{ color: isSOS ? "var(--color-danger)" : "var(--color-success)", fontWeight: "bold" }}>{device?.status}</span></div>
          <div>Signal: 100% (GPS)</div>
        </div>

        {isSOS && (
          <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(255, 45, 85, 0.9)",
            color: "white",
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            boxShadow: "0 0 10px rgba(255,45,85,0.5)",
            animation: "fadeIn 0.3s ease"
          }}>
            <ShieldAlert size={14} className="pulse-active" />
            <span>DÉTRESSE SOS ACTIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}
