import React from "react";

const ScoreCard = ({ score }) => {
  if (!score) {
    return (
      <div className="score-card">
        <h2>ATS Score</h2>
        <p>No score computed yet.</p>
      </div>
    );
  }

  return (
    <div className="score-card">
      <h2>ATS Score</h2>
      <div className="score-gauge">
        <span className="score-value">{score.overall_score}</span>
        <span className="score-unit">/ 100</span>
      </div>
      <ul className="score-breakdown">
        <li>Semantic Similarity: {score.semantic_similarity}</li>
        <li>Skill Match: {score.skill_match}</li>
        <li>Experience Alignment: {score.experience_alignment}</li>
        <li>Keyword Score: {score.keyword_score}</li>
      </ul>
    </div>
  );
};

export default ScoreCard;

