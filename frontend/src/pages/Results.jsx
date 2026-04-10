import { useState, useEffect } from "react";
import { scoreResume } from "../services/api";
import ScoreCard from "../components/ScoreCard";
import SkillGapChart from "../components/SkillGapChart";

const Results = ({ globalScore, setGlobalScore }) => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [score, setScore] = useState(globalScore || null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (globalScore) {
      setScore(globalScore);
    }
  }, [globalScore]);

  const handleScore = async (e) => {
    e.preventDefault();
    setStatus("Scoring resume...");
    try {
      const result = await scoreResume({
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setScore(result);
      if (setGlobalScore) setGlobalScore(result);
      setStatus("Done.");
    } catch (err) {
      console.error(err);
      setStatus("Scoring failed. Check console.");
    }
  };

  return (
    <div className="results-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>ATS Manual Scoring Engine</h1>
      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleScore} className="results-form" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>Raw Resume Text</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text or parsed skills here..."
                style={{
                  width: "100%", height: "150px", padding: "1rem", background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)", borderRadius: "8px", color: "var(--text)", resize: "vertical"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)" }}>Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                style={{
                  width: "100%", height: "150px", padding: "1rem", background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)", borderRadius: "8px", color: "var(--text)", resize: "vertical"
                }}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ maxWidth: "300px", margin: "0 auto" }}>
            Compute ATS Score
          </button>
        </form>
        {status && <p style={{ marginTop: "1rem", textAlign: "center", color: "var(--accent)" }}>{status}</p>}
      </div>
      
      {score && (
        <div className="results-panels" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ScoreCard score={score} />
          <div className="glass-card">
            <SkillGapChart score={score} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;

