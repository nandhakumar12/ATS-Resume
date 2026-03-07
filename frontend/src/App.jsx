import React from "react";
import "./styles.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Callback from "./pages/Callback";

// ── Route detection ──────────────────────────────────────────────────────────
function isCallbackPage() {
  return window.location.search.startsWith("?code=");
}

// ── Inner app (has access to AuthContext) ─────────────────────────────────────
function AppInner() {
  const { user, loading, logout, getIdToken } = useAuth();
  const [page, setPage] = React.useState(isCallbackPage() ? "callback" : "dashboard");
  const [globalScore, setGlobalScore] = React.useState(null);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  // Unauthenticated — show login or callback handler
  if (!user) {
    if (page === "callback") return <Callback setPage={setPage} />;
    return <Login />;
  }

  const renderPage = () => {
    switch (page) {
      case "callback": return <Callback setPage={setPage} />;
      case "upload": return <Upload setGlobalScore={setGlobalScore} setPage={setPage} />;
      case "results": return <Results globalScore={globalScore} setGlobalScore={setGlobalScore} />;
      default: return <Dashboard globalScore={globalScore} setGlobalScore={setGlobalScore} />;
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <span className="brand">AI ATS</span>
        <div className="nav-links">
          <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>
          <button className={page === "upload" ? "active" : ""} onClick={() => setPage("upload")}>Upload</button>
          <button className={page === "results" ? "active" : ""} onClick={() => setPage("results")}>Results</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{user.email}</span>
          <button
            onClick={logout}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--red)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            Sign Out
          </button>
        </div>
      </nav>
      <div className="app-content">{renderPage()}</div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
