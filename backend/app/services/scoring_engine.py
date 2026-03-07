from app.models.resume import ResumeScore
from app.services.similarity_engine import analyze_skill_gap, compute_semantic_similarity


def score_resume_against_job(resume_text: str, job_description: str) -> ResumeScore:
    semantic_similarity = compute_semantic_similarity(resume_text, job_description)
    matched_skills, missing_skills = analyze_skill_gap(resume_text, job_description)

    # Simple heuristic scores; you can later learn weights with ML
    total_skills = max(len(matched_skills) + len(missing_skills), 1)
    skill_match = len(matched_skills) / total_skills

    experience_alignment = semantic_similarity  # placeholder proxy
    keyword_score = skill_match  # placeholder

    overall_score = (
        0.35 * skill_match
        + 0.30 * semantic_similarity
        + 0.20 * experience_alignment
        + 0.15 * keyword_score
    )

    recommendation = "Strengthen skills: " + ", ".join(missing_skills) if missing_skills else "Strong fit for the role."

    return ResumeScore(
        overall_score=float(round(overall_score * 100, 2)),
        semantic_similarity=float(round(semantic_similarity, 3)),
        skill_match=float(round(skill_match, 3)),
        experience_alignment=float(round(experience_alignment, 3)),
        keyword_score=float(round(keyword_score, 3)),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        recommendation=recommendation,
    )

