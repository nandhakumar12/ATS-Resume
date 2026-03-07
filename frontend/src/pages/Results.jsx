import React, { useState, useEffect } from "react";
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
    <div className="results-page">
      <h1>ATS Score & Skill Gaps</h1>
      <form onSubmit={handleScore} className="results-form">
        <div className="form-row">
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste resume text here..."
          />
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
          />
        </div>
        <button type="submit">Compute ATS Score</button>
      </form>
      {status && <p className="status-text">{status}</p>}
      {score && (
        <div className="results-panels">
          <ScoreCard score={score} />
          <SkillGapChart score={score} />
        </div>
      )}
    </div>
  );
};

export default Results;

