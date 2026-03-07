import React from "react";

const SkillGapChart = ({ score }) => {
  if (!score) {
    return (
      <div className="skill-gap-chart">
        <h2>Skill Gap Analysis</h2>
        <p>No analysis yet.</p>
      </div>
    );
  }

  return (
    <div className="skill-gap-chart">
      <h2>Skill Gap Analysis</h2>
      <div className="skills-section">
        <h3>Matched Skills</h3>
        <ul>
          {score.matched_skills?.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="skills-section">
        <h3>Missing Skills</h3>
        <ul>
          {score.missing_skills?.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <p className="recommendation">{score.recommendation}</p>
    </div>
  );
};

export default SkillGapChart;

