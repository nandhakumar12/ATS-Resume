import React, { useState } from "react";
import { uploadResume } from "../services/api";
import ScoreCard from "../components/ScoreCard";
import SkillGapChart from "../components/SkillGapChart";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState("");
  const [score, setScore] = useState(null);

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
        // Construct a raw text representation from the parsed data for the scoring engine
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

        setScore(scoreResult);
        setStatus("Analysis Complete!");
      } else {
        setStatus("Uploaded successfully. Go to Results to view ATS score.");
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
          Job Description (optional)
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the target job description here..."
          />
        </label>
        <button type="submit">Upload & Analyze</button>
      </form>
      {status && <p className="status-text">{status}</p>}
      {score && (
        <div className="results-panels" style={{ marginTop: '2rem' }}>
          <ScoreCard score={score} />
          <SkillGapChart score={score} />
        </div>
      )}
    </div>
  );
};

export default Upload;
