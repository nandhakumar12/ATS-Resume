import React, { useEffect, useState } from "react";
import { fetchResumeHistory } from "../services/api";
import CandidatePanel from "../components/CandidatePanel";
import SkillGapChart from "../components/SkillGapChart";

const Dashboard = ({ globalScore, setGlobalScore }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchResumeHistory();
        setItems(data || []);
      } catch (err) {
        console.error("Failed to load resume history", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (candidate) => {
    setSelected(candidate);
  };

  return (
    <div className="dashboard">
      <header>
        <h1>AI-Powered ATS Dashboard</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>
          Click any candidate to view their resume and AI analysis side-by-side
        </p>
      </header>

      <div className="dashboard-layout">
        {/* Left Sidebar: Candidate List */}
        <div className="card resume-history">
          <h2>Candidates</h2>
          {loading && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</p>}
          {!loading && items.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No resumes uploaded yet.</p>
          )}
          {!loading && items.length > 0 && (
            <ul>
              {items.map((r, i) => (
                <li
                  key={r.id || i}
                  className={selected?.filename === r.filename ? "selected" : ""}
                  onClick={() => handleSelect(r)}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.1rem" }}>{r.filename}</div>
                  {r.parsed_data?.name && (
                    <div style={{ fontSize: "0.78rem", opacity: 0.6 }}>{r.parsed_data.name}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Candidate Panel or Placeholder */}
        <div>
          {selected ? (
            <>
              <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Viewing: <strong style={{ color: "var(--text)" }}>{selected.filename}</strong>
              </div>
              <CandidatePanel
                candidate={selected}
                onRecalculate={setGlobalScore}
              />
            </>
          ) : (
            <div className="no-candidate">
              <span className="icon">👈</span>
              <strong>Select a candidate</strong>
              <span>Click on any name in the sidebar to view their resume and AI analysis</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
