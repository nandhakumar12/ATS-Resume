import React, { useState } from "react";
import { scoreResume, deleteResume, updateResumeSkills } from "../services/api";

/* Animated SVG ring for overall score */
const ScoreRing = ({ value = 0 }) => {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    const color = value >= 70 ? "#34d399" : value >= 50 ? "#fbbf24" : "#f87171";

    return (
        <svg width="130" height="130" className="ring-svg">
            <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#666666" />
                </linearGradient>
            </defs>
            <circle className="ring-bg" cx="65" cy="65" r={r} />
            <circle
                className="ring-val"
                cx="65" cy="65" r={r}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                stroke={color}
            />
            <text x="65" y="62" textAnchor="middle" className="ring-text" style={{ fill: color, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {Math.round(value)}
            </text>
            <text x="65" y="78" textAnchor="middle" fontSize="10" fill="#64748b" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                / 100
            </text>
        </svg>
    );
};

const Bar = ({ label, value = 0 }) => (
    <div className="breakdown-row">
        <div className="breakdown-label">
            <span>{label}</span>
            <span>{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="breakdown-bar-bg">
            <div className="breakdown-bar-fill" style={{ width: `${Math.min(value * 100, 100)}%` }} />
        </div>
    </div>
);

const CandidatePanel = ({ candidate, onRecalculate, onDelete }) => {
    const [editedSkills, setEditedSkills] = useState([]);
    const [newSkill, setNewSkill] = useState("");
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const parsed = candidate?.parsed_data || {};
    const resumeId = candidate?.id;
    const fileUrl = parsed?.file_url;
    const existingSkills = parsed?.skills || [];
    const allSkills = [...new Set([...existingSkills, ...editedSkills])];

    const handleAddSkill = () => {
        const trimmed = newSkill.trim().toLowerCase();
        if (trimmed && !allSkills.includes(trimmed)) {
            setEditedSkills((prev) => [...prev, trimmed]);
        }
        setNewSkill("");
    };

    const handleRemoveSkill = (skill) => {
        setEditedSkills((prev) => prev.filter((s) => s !== skill));
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
        try {
            // Persist edited skills to DynamoDB first
            if (editedSkills.length > 0 && resumeId) {
                await updateResumeSkills(resumeId, editedSkills);
            }
            const resumeText = allSkills.join(" ") + " " + (parsed.designation || []).join(" ");
            const result = await scoreResume({
                resume_text: resumeText,
                job_description: "DevOps Engineer AWS Kubernetes Docker Terraform CI/CD Jenkins Python Bash Grafana Prometheus"
            });
            setScore(result);
            if (onRecalculate) onRecalculate(result);
        } finally {
            setLoading(false);
        }
    };

    const displayScore = score;

    return (
        <div className="candidate-panel">
            {/* Left: PDF Viewer */}
            <div className="pdf-viewer-wrapper card" style={{ padding: 0 }}>
                {fileUrl ? (
                    <iframe
                        src={fileUrl}
                        title="Resume Preview"
                        style={{ width: "100%", minHeight: 620, border: "none" }}
                    />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 620, color: "var(--text-muted)", flexDirection: "column", gap: "0.5rem" }}>
                        <span style={{ fontSize: "3rem" }}>📄</span>
                        <span>No PDF preview available</span>
                        <small>Re-upload the resume to enable preview</small>
                    </div>
                )}
            </div>

            {/* Right: AI Breakdown */}
            <div className="analysis-panel">

                {/* Score Ring */}
                <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: "1rem", color: "var(--accent)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>ATS Score</div>
                    {displayScore ? (
                        <>
                            <div className="score-ring-wrap">
                                <ScoreRing value={displayScore.overall_score} />
                                <div className="score-breakdown" style={{ flex: 1 }}>
                                    <Bar label="Semantic Similarity" value={displayScore.semantic_similarity} />
                                    <Bar label="Skill Match" value={displayScore.skill_match} />
                                    <Bar label="Experience Alignment" value={displayScore.experience_alignment} />
                                    <Bar label="Keyword Score" value={displayScore.keyword_score} />
                                </div>
                            </div>
                            {displayScore.recommendation && (
                                <p className="recommendation-box">{displayScore.recommendation}</p>
                            )}
                        </>
                    ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No score computed yet. Add a job description and recalculate.</p>
                    )}
                </div>

                {/* Editable Skills */}
                <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Parsed Skills <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", fontSize: "0.75rem" }}>(click × to remove)</span>
                    </div>
                    <div className="skills-grid">
                        {existingSkills.map((s) => (
                            <span key={s} className="skill-tag matched">{s}</span>
                        ))}
                        {editedSkills.map((s) => (
                            <span key={s} className="skill-tag custom">
                                {s}
                                <button onClick={() => handleRemoveSkill(s)} aria-label={`Remove ${s}`}>×</button>
                            </span>
                        ))}
                    </div>
                    <div className="add-skill-row">
                        <input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                            placeholder="Add missing skill (e.g. AWS EC2)..."
                        />
                        <button className="btn-add" onClick={handleAddSkill}>Add</button>
                    </div>
                    <button className="recalc-btn" onClick={handleRecalculate} disabled={loading}>
                        {loading ? "Recalculating…" : "⚡ Recalculate ATS Score"}
                    </button>
                </div>

                {/* Basic Info + Delete */}
                <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--purple)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Candidate Info</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.88rem" }}>
                        {parsed.name && <div><span style={{ color: "var(--text-muted)" }}>Name: </span>{parsed.name}</div>}
                        {parsed.email && <div><span style={{ color: "var(--text-muted)" }}>Email: </span>{parsed.email}</div>}
                        {parsed.mobile_number && <div><span style={{ color: "var(--text-muted)" }}>Phone: </span>{parsed.mobile_number}</div>}
                        {parsed.total_experience != null && <div><span style={{ color: "var(--text-muted)" }}>Experience: </span>{parsed.total_experience} yrs</div>}
                        {parsed.degree?.length > 0 && <div><span style={{ color: "var(--text-muted)" }}>Degree: </span>{(parsed.degree || []).join(", ")}</div>}
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            marginTop: "1rem",
                            width: "100%",
                            padding: "0.6rem",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--red)",
                            background: "rgba(248,113,113,0.08)",
                            color: "var(--red)",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            fontFamily: "Inter, sans-serif",
                            transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#000000"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.color = "var(--red)"; }}
                    >
                        {deleting ? "Deleting…" : "🗑 Delete Resume"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidatePanel;
