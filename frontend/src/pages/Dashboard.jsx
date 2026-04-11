import { useEffect, useState } from "react";
import { fetchResumeHistory, fetchJobs, createJob, checkHealth } from "../services/api";
import CandidatePanel from "../components/CandidatePanel";

const Dashboard = ({ setGlobalScore }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [isHealthy, setIsHealthy] = useState(true);

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

    // --- Health Check Polling (CPP LO5: Observability) ---
    const healthInterval = setInterval(async () => {
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch (err) {
        setIsHealthy(false);
      }
    }, 30000);

    return () => clearInterval(healthInterval);
  }, []);

  const handleSelect = (candidate) => {
    setSelected(candidate);
  };

  const handleDelete = (deletedId) => {
    setItems((prev) => prev.filter((r) => r.id !== deletedId));
    setSelected(null);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc) return;
    try {
      const created = await createJob({ title: newJobTitle, description: newJobDesc });
      setJobs((prev) => [...prev, created]);
      setSelectedJob(created);
      setShowJobModal(false);
      setNewJobTitle("");
      setNewJobDesc("");
    } catch (err) {
      console.error("Failed to create job", err);
      alert("Failed to create job.");
    }
  };

  return (
    <div className="dashboard">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>AI-Powered ATS Dashboard</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Click any candidate to view their resume and AI analysis side-by-side
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(255,255,255,0.05)", padding: "0.5rem 0.8rem", borderRadius: "20px", border: "1px solid var(--glass-border)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: isHealthy ? "#10b981" : "#ef4444", boxShadow: isHealthy ? "0 0 10px #10b981" : "0 0 10px #ef4444" }}></div>
          <span style={{ fontSize: "0.8rem", fontWeight: 500, color: isHealthy ? "#d1fae5" : "#fee2e2" }}>
            {isHealthy ? "Cloud System: Healthy" : "Cloud System: Error"}
          </span>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Left Sidebar: Job Selector + Candidate List */}
        <div className="card resume-history">
          {/* Job Selector */}
          <div style={{ marginBottom: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ marginBottom: 0 }}>Score Against Job</h2>
              <button 
                onClick={() => setShowJobModal(true)}
                style={{ background: "rgba(139, 92, 246, 0.2)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.5)", borderRadius: "6px", padding: "0.2rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}
              >
                + New
              </button>
            </div>
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

      {/* Create Job Modal */}
      {showJobModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Create New Job</h2>
            <form onSubmit={handleCreateJob} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Job Title</label>
                <input required value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Job Description</label>
                <textarea required value={newJobDesc} onChange={e => setNewJobDesc(e.target.value)} style={{ width: "100%", height: "120px", padding: "0.75rem", borderRadius: "8px", background: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowJobModal(false)} style={{ flex: 1, padding: "0.75rem", background: "rgba(0,0,0,0.05)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
