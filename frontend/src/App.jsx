import React, { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Device from "./pages/Device";
import LostItems from "./pages/LostItems";
import LostDocuments from "./pages/LostDocuments";
import Contacts from "./pages/Contacts";

import { api, API_BASE_URL } from "./api";

function AppContent() {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [device, setDevice] = useState(null);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const isApiConnectedRef = useRef(false);
  const location = useLocation();

  // Load user session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("safeguardian_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    if (token) localStorage.setItem("safeguardian_token", token);
    localStorage.setItem("safeguardian_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("safeguardian_user");
    localStorage.removeItem("safeguardian_token");
  };

  // Fetch telemetry and alerts
  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, deviceRes] = await Promise.all([
        api("/alerts"),
        api("/device")
      ]);

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }

      if (deviceRes.ok) {
        const deviceData = await deviceRes.json();
        setDevice(deviceData);
      }
      
      setIsApiConnected(true);
      isApiConnectedRef.current = true;
    } catch (error) {
      console.error("API connection failed", error);
      setIsApiConnected(false);
      isApiConnectedRef.current = false;
    }
  }, []);

  // Poll API every 3s only when user is logged in
  useEffect(() => {
    if (!user) return;

    let timeout;

    const poll = () => {
      const baseInterval = 3000;
      const maxInterval = 30000;
      const delay = Math.min(baseInterval * Math.pow(2, retryCount.current), maxInterval);

      timeout = setTimeout(async () => {
        await fetchData();
        retryCount.current = isApiConnectedRef.current
          ? 0
          : Math.min(retryCount.current + 1, 5);
        poll();
      }, delay);
    };

    fetchData();
    poll();
    return () => clearTimeout(timeout);
  }, [fetchData, user]);

  // Resolve Alert Handler
  const handleResolveAlert = async (alertId) => {
    try {
      const response = await api(`/alerts/${alertId}/resolve`, { method: "PUT" });
      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "RÉSOLU" } : a));
        fetchData();
      }
    } catch (error) {
      console.error("Failed to resolve alert", error);
    }
  };

  // Update Device GPS coordinates
  const handleUpdateCoordinates = async (lat, lng) => {
    try {
      const response = await api("/device", {
        method: "PUT",
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      if (response.ok) {
        const updatedDevice = await response.json();
        setDevice(updatedDevice);
      }
    } catch (error) {
      console.error("Failed to update GPS positions", error);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-main)",
        fontFamily: "var(--font-display)"
      }}>
        <div className="pulse-active" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>
          Chargement de SafeGuardian...
        </div>
      </div>
    );
  }

  const isPublicPage = ["/", "/login", "/register"].includes(location.pathname);

  // If not logged in, redirect to home page or login pages
  if (!user && !isPublicPage) {
    return <Navigate to="/" replace />;
  }

  // If logged in, redirect away from landing/login pages to dashboard
  if (user && isPublicPage && location.pathname !== "/") {
    return <Navigate to="/dashboard" replace />;
  }

  // Active SOS alert banners at the top of the dashboard if there's any active alert
  const activeUrgentAlerts = alerts.filter(a => a.status === "URGENT");

  return (
    <div className="app-container">
      {!isPublicPage && <Sidebar />}
      
      <div className="main-content" style={isPublicPage ? { marginLeft: 0 } : {}}>
        {!isPublicPage && (
          <Navbar 
            user={user} 
            onLogout={handleLogout} 
            isApiConnected={isApiConnected} 
            alerts={alerts}
          />
        )}

        {/* SOS Alert Bar */}
        {!isPublicPage && activeUrgentAlerts.length > 0 && (
          <div style={{
            background: "linear-gradient(90deg, #ff2d55, #d3003b)",
            color: "white",
            padding: "0.85rem 2rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "pulseSOS 2.5s infinite",
            position: "sticky",
            top: "72px",
            zIndex: 99
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="pulse-active" style={{ width: "10px", height: "10px", borderRadius: "50%", background: "white" }} />
              <span>DANGER : {activeUrgentAlerts.length} signalement(s) SOS actif(s) sur le réseau !</span>
            </div>
            <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>Veuillez intervenir ou notifier les secours locaux.</span>
          </div>
        )}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />} />
          <Route path="/register" element={<Register apiBaseUrl={API_BASE_URL} />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <Dashboard 
              alerts={alerts} 
              device={device} 
              onResolveAlert={handleResolveAlert}
              onUpdateCoordinates={handleUpdateCoordinates}
            />
          } />
          <Route path="/alerts" element={
            <Alerts 
              alerts={alerts} 
              onResolveAlert={handleResolveAlert} 
              apiBaseUrl={API_BASE_URL}
            />
          } />
          <Route path="/device" element={
            <Device 
              device={device} 
              onUpdateCoordinates={handleUpdateCoordinates}
              apiBaseUrl={API_BASE_URL}
              fetchData={fetchData}
            />
          } />
          <Route path="/lost-items" element={<LostItems apiBaseUrl={API_BASE_URL} />} />
          <Route path="/lost-documents" element={<LostDocuments apiBaseUrl={API_BASE_URL} />} />
          <Route path="/contacts" element={<Contacts apiBaseUrl={API_BASE_URL} />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
