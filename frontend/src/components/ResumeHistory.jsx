import React, { useEffect, useState } from "react";
import { fetchResumeHistory } from "../services/api";

const ResumeHistory = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchResumeHistory();
        setItems(data || []);
      } catch (err) {
        console.error("Failed to load resume history", err);
      }
    })();
  }, []);

  return (
    <div className="resume-history">
      <h2>Resume History</h2>
      {items.length === 0 ? (
        <p>No resumes uploaded yet.</p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <strong>{r.filename}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResumeHistory;

