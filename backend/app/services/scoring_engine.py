import sys
import os
import logging

from app.models.resume import ResumeScore
from app.services.similarity_engine import analyze_skill_gap, compute_semantic_similarity

# Import the custom CloudResumeSanitizer library
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../../libraries/sanitizer/src')
))
from sanitizer import ResumeSanitizer

logger = logging.getLogger(__name__)

# Initialize the sanitizer once (singleton pattern)
_sanitizer = ResumeSanitizer()


def score_resume_against_job(resume_text: str, job_description: str, job_title: str = "the role") -> ResumeScore:
    """
    Hybrid scoring pipeline:
    Step 1: Sanitize (CloudResumeSanitizer) -> remove PII to reduce Algorithmic Bias.
    Step 2: Local NLP (spaCy) -> extract skills and semantic similarity.
    Step 3: Gemini AI -> generate final contextual score and Explainable AI feedback.
    """

    # --- Step 1: PII Redaction via CloudResumeSanitizer ---
    sanitized_resume = _sanitizer.sanitize_text(resume_text)
    logger.info("Resume sanitized successfully.")

    # --- Step 2: Local NLP Analysis (spaCy baseline) ---
    semantic_similarity = compute_semantic_similarity(sanitized_resume, job_description)
    matched_skills, missing_skills = analyze_skill_gap(sanitized_resume, job_description)

    total_skills = max(len(matched_skills) + len(missing_skills), 1)
    skill_match = len(matched_skills) / total_skills
    experience_alignment = semantic_similarity
    keyword_score = skill_match

    spacy_overall_score = (
        0.35 * skill_match
        + 0.30 * semantic_similarity
        + 0.20 * experience_alignment
        + 0.15 * keyword_score
    )

    recommendation = "Strengthen skills: " + ", ".join(missing_skills) if missing_skills else "Strong fit for the role."

    # --- Step 3: Gemini AI Analysis (XAI Scoring) ---
    ai_score = None
    ai_feedback = None
    strengths = None
    improvements = None

    try:
        from app.services.gemini_service import GeminiService
        gemini = GeminiService()
        gemini_result = gemini.analyze_resume(sanitized_resume, job_description, job_title)
        ai_score = float(gemini_result.get("score", 0))
        ai_feedback = gemini_result.get("reasoning", "")
        strengths = gemini_result.get("strengths", [])
        improvements = gemini_result.get("improvements", [])
        logger.info(f"Gemini analysis complete. AI Score: {ai_score}")
    except Exception as e:
        logger.warning(f"Gemini AI analysis skipped (API key not set or unavailable): {e}")

    return ResumeScore(
        overall_score=float(round(spacy_overall_score * 100, 2)),
        semantic_similarity=float(round(semantic_similarity, 3)),
        skill_match=float(round(skill_match, 3)),
        experience_alignment=float(round(experience_alignment, 3)),
        keyword_score=float(round(keyword_score, 3)),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        recommendation=recommendation,
        ai_score=ai_score,
        ai_feedback=ai_feedback,
        strengths=strengths,
        improvements=improvements,
    )
