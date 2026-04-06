import React, { useEffect, useState } from "react";
import { fetchResumeHistory, fetchJobs } from "../services/api";
import CandidatePanel from "../components/CandidatePanel";

const Dashboard = ({ globalScore, setGlobalScore }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [resumeData, jobData] = await Promise.all([
          fetchResumeHistory(),
          fetchJobs(),
        ]);
        setItems(resumeData || []);
        const jobList = jobData || [];
        setJobs(jobList);
        if (jobList.length > 0) setSelectedJob(jobList[0]);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (candidate) => {
    setSelected(candidate);
  };

  const handleDelete = (deletedId) => {
    setItems((prev) => prev.filter((r) => r.id !== deletedId));
    setSelected(null);
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
        {/* Left Sidebar: Job Selector + Candidate List */}
        <div className="card resume-history">
          {/* Job Selector */}
          <div style={{ marginBottom: "1.2rem" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>Score Against Job</h2>
            {jobs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No jobs found. Create one first.</p>
            ) : (
              <select
                id="job-selector"
                value={selectedJob?.id || ""}
                onChange={(e) => {
                  const job = jobs.find((j) => j.id === e.target.value);
                  setSelectedJob(job || null);
                }}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            )}
            {selectedJob && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                {selectedJob.description?.slice(0, 80)}…
              </div>
            )}
          </div>

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
                selectedJob={selectedJob}
                onRecalculate={setGlobalScore}
                onDelete={handleDelete}
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
