import { useState } from "react";
import { scoreResume, deleteResume, updateResumeSkills } from "../services/api";
import SkillGapChart from "./SkillGapChart";

/* Animated SVG ring for overall score */
const ScoreRing = ({ value = 0, label = "ATS Score" }) => {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--yellow)" : "var(--red)";

    return (
        <div className="score-ring-container">
            <svg width="130" height="130" className="ring-svg">
                <circle className="ring-bg" cx="65" cy="65" r={r} />
                <circle
                    className="ring-val"
                    cx="65" cy="65" r={r}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    stroke={color}
                    transform="rotate(-90 65 65)"
                />
                <text x="65" y="65" textAnchor="middle" dominantBaseline="central" className="ring-text" style={{ fill: color, fontSize: "1.5rem", fontWeight: "bold" }}>
                    {Math.round(value)}<tspan fill="var(--text-muted)" fontSize="0.8rem">/100</tspan>
                </text>
            </svg>
            <div className="ring-label">{label}</div>
        </div>
    );
};

const Bar = ({ label, value = 0 }) => (
    <div className="breakdown-row">
        <div className="breakdown-label">
            <span>{label}</span>
            <span>{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="breakdown-bar-bg">
            <div className="breakdown-bar-fill" style={{ width: `${Math.min(value * 100, 100)}%` }} />
        </div>
    </div>
);

const CandidatePanel = ({ candidate, selectedJob, onRecalculate, onDelete }) => {
    const [editedSkills, setEditedSkills] = useState([]);
    const [removedParsedSkills, setRemovedParsedSkills] = useState([]);
    const [newSkill, setNewSkill] = useState("");
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [apiError, setApiError] = useState(null);

    const parsed = candidate?.parsed_data || {};
    const resumeId = candidate?.id;
    const fileUrl = parsed?.file_url;
    const existingSkills = (parsed?.skills || []).filter(s => !removedParsedSkills.includes(s));
    const allSkills = [...new Set([...existingSkills, ...editedSkills])];

    const handleAddSkill = () => {
        const trimmed = newSkill.trim().toLowerCase();
        if (trimmed && !allSkills.includes(trimmed)) {
            setEditedSkills((prev) => [...prev, trimmed]);
        }
        setNewSkill("");
    };

    const handleRemoveSkill = (skill, isExisting = false) => {
        if (isExisting) {
            setRemovedParsedSkills((prev) => [...prev, skill]);
        } else {
            setEditedSkills((prev) => prev.filter((s) => s !== skill));
        }
    };

    const handleDelete = async () => {
        if (!resumeId || !window.confirm(`Delete "${candidate.filename}"?`)) return;
        setDeleting(true);
        try {
            await deleteResume(resumeId);
            if (onDelete) onDelete(resumeId);
        } catch (err) {
            alert("Delete failed: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleRecalculate = async () => {
        setLoading(true);
        setApiError(null);
        try {
            if (resumeId) {
                await updateResumeSkills(resumeId, allSkills);
            }
            const resumeText = parsed.raw_text || (allSkills.join(" ") + " " + (parsed.designation || []).join(" "));
            const jobDesc = selectedJob?.description || "Software Engineer Python AWS Cloud";
            const jobTitle = selectedJob?.title || "the role";
            const result = await scoreResume({
                resume_id: resumeId,
                resume_text: resumeText,
                job_description: jobDesc,
                job_title: jobTitle,
            });
            setScore(result);
            if (onRecalculate) onRecalculate(result);
        } catch (err) {
            console.error("Analysis failed", err);
            setApiError(err.message || "An unexpected error occurred during analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="candidate-panel">
            {/* Left: PDF Viewer (Glass) */}
            <div className="pdf-viewer-wrapper glass-card">
                {fileUrl ? (
                    <iframe
                        src={fileUrl}
                        title="Resume Preview"
                        style={{ width: "100%", minHeight: 700, border: "none" }}
                    />
                ) : (
                    <div className="pdf-placeholder">
                        <span>📄</span>
                        <span>No PDF preview available</span>
                    </div>
                )}
            </div>

            {/* Right: AI Analysis (Glass) */}
            <div className="analysis-panel">
                
                {/* Score Section */}
                <div className="glass-card analysis-grid">
                    <div className="score-summary">
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                            <ScoreRing value={score?.overall_score || 0} label="ATS Score" />
                            {score?.ai_score != null && (
                                <ScoreRing value={score.ai_score} label="Gemini AI" />
                            )}
                        </div>
                        <div className="simple-breakdown">
                            <Bar label="Semantic Match" value={score?.semantic_similarity || 0} />
                            <Bar label="Experience" value={score?.experience_alignment || 0} />
                        </div>
                    </div>
                    <div className="visual-gap">
                        <SkillGapChart score={score} />
                    </div>
                </div>

                {/* AI Expert Analysis Section (XAI) */}
                {score && score.ai_feedback && (
                    <div className="glass-card ai-insights">
                        <div className="section-title ai-gradient-text">✨ AI Expert Analysis</div>
                        <p className="ai-reasoning">{score.ai_feedback}</p>
                        
                        <div className="insights-grid">
                            <div className="insight-col">
                                <div className="insight-label strengths">Key Strengths</div>
                                <ul className="insight-list">
                                    {(score.strengths || []).map((s, i) => (
                                        <li key={i} className="strength-item">✓ {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="insight-col">
                                <div className="insight-label improvements">Gaps to Address</div>
                                <ul className="insight-list">
                                    {(score.improvements || []).map((s, i) => (
                                        <li key={i} className="improvement-item">⚠ {s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Skills Editor */}
                <div className="glass-card">
                    <div className="section-title">Parsed Skills</div>
                    <div className="skills-grid">
                        {allSkills.map((s) => (
                            <span key={s} className="skill-tag">
                                {s}
                                <button onClick={() => handleRemoveSkill(s, existingSkills.includes(s))}>×</button>
                            </span>
                        ))}
                    </div>
                    <div className="add-skill-row">
                        <input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                            placeholder="Add skill..."
                        />
                        <button onClick={handleAddSkill}>Add</button>
                    </div>
                    {apiError && (
                        <div className="error-banner" style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--red)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.85rem" }}>
                            <strong>Analysis Error:</strong> {apiError}
                        </div>
                    )}
                    <button className="btn-primary recalc-btn" onClick={handleRecalculate} disabled={loading}>
                        {loading ? "Analyzing..." : "⚡ Run AI Analysis"}
                    </button>
                </div>

                {/* Meta Info */}
                <div className="glass-card candidate-meta">
                    <div className="meta-row">
                        <span>Candidate:</span>
                        <strong>{parsed.name || "Anonymous Candidate"}</strong>
                    </div>
                    <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete Candidate Data"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidatePanel;
