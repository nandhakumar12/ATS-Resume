from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ResumeCreate(BaseModel):
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    resume_text: str
    job_description: str


class ResumeResponse(BaseModel):
    id: str
    owner_id: str
    filename: str
    parsed_data: Dict[str, Any]


class JobCreate(BaseModel):
    title: str
    description: str


class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    created_by: str


class ResumeScore(BaseModel):
    overall_score: float
    semantic_similarity: float
    skill_match: float
    experience_alignment: float
    keyword_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    # Gemini AI Explainable AI (XAI) fields
    ai_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[str]] = None


class ResumeScoreResponse(ResumeScore):
    resume_id: Optional[int] = None
    job_id: Optional[int] = None

