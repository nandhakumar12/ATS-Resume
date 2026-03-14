import React, { useState } from "react";
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
      setStatus("Upload failed. Check console for details.");
      console.error(err);
    }
  };

  return (
    <div className="upload-page">
      <h1>Upload Resume</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <label>
          Resume File
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        <label>
          JobDescription (optional)
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the target job description here..."
          />
        </label>
        <button type="submit">Upload & Analyze</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
};

export default Upload;
