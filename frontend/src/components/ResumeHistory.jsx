import React, { useEffect, useState } from "react";
import { fetchResumeHistory } from "../services/api";

const ResumeHistory = ({ onSelect }) => {
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
        <ul style={{ listStyleMode: 'none', padding: 0 }}>
          {items.map((r, i) => (
            <li
              key={r.id || i}
              onClick={() => onSelect && onSelect(r)}
              style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <strong>{r.filename}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResumeHistory;

