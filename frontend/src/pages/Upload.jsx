import { useState } from "react";
import { uploadResume } from "../services/api";

const Upload = ({ setGlobalScore, setPage }) => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a resume file.");
      return;
    }
    setStatus("Uploading and parsing...");
    try {
      const { scoreResume } = await import("../services/api");
      const result = await uploadResume(file, jobDescription);

      if (jobDescription && result.parsed_data) {
        setStatus("Computing ATS Score...");
        const parsed = result.parsed_data;
        const resumeText = [
          ...(parsed.skills || []),
          ...(parsed.experience || []),
          ...(parsed.degree || []),
          ...(parsed.designation || []),
          parsed.total_experience ? `Experience: ${parsed.total_experience} years` : ""
        ].join(" ");

        const scoreResult = await scoreResume({
          resume_text: resumeText || file.name,
          job_description: jobDescription
        });

        if (setGlobalScore) setGlobalScore(scoreResult);
        setStatus("Analysis Complete! Redirecting to Results...");
        setTimeout(() => {
          if (setPage) setPage("results");
        }, 1500);
      } else {
        setStatus("Uploaded successfully. Redirecting to Dashboard...");
        setTimeout(() => {
          if (setPage) setPage("dashboard");
        }, 1500);
      }
    } catch (err) {
      setStatus(`Error: ${err.message || "Upload failed. Check console for details."}`);
      console.error(err);
    }
  };

  return (
    <div className="upload-page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Upload Candidate Resume</h1>
      <div className="glass-card">
        <form onSubmit={handleSubmit} className="upload-form" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Resume File (PDF/DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)",
                border: "1px dashed var(--glass-border)", borderRadius: "8px", color: "var(--text)"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Job Description (Optional for instant scoring)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description here..."
              style={{
                width: "100%", minHeight: "120px", padding: "0.75rem", background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--glass-border)", borderRadius: "8px", color: "var(--text)", resize: "vertical"
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>
            Upload & Analyze
          </button>
        </form>
        {status && (
          <p style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--accent)" }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default Upload;
