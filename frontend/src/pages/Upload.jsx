import React, { useState } from "react";
import { uploadResume } from "../services/api";

const Upload = () => {
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
      await uploadResume(file, jobDescription);
      setStatus("Uploaded successfully. Go to Results to view ATS score.");
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
    </div>
  );
};

export default Upload;

