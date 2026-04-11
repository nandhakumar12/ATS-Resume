import pytest
from unittest.mock import MagicMock, patch
from app.services.scoring_engine import score_resume_against_job

@patch('app.services.gemini_service.GeminiService')
def test_score_resume_against_job(MockGemini):
    # Setup mock
    instance = MockGemini.return_value
    instance.analyze_resume.return_value = {
        "score": 85,
        "reasoning": "Strong match with cloud skills.",
        "strengths": ["Python", "AWS"],
        "improvements": ["Containerization"]
    }
    
    resume_text = "Experienced Python developer with AWS knowledge."
    job_desc = "Python developer needed for AWS cloud projects. Knowledge of Docker is a plus."
    
    result = score_resume_against_job(resume_text, job_desc)
    
    # Assertions
    assert result.overall_score > 0
    assert result.ai_score == 85
    assert "Python" in result.matched_skills
    assert "aws" in result.matched_skills
    assert "Python" in result.strengths
    assert "Containerization" in result.improvements

def test_score_logic_fallback():
    # Test that SPACY logic runs even if Gemini fails or is mocked out wrongly
    with patch('app.services.gemini_service.GeminiService') as MockGemini:
        MockGemini.side_effect = Exception("Gemini Down")
        
        resume_text = "Python Developer"
        job_desc = "Java Developer"
        
        result = score_resume_against_job(resume_text, job_desc)
        
        assert result.ai_score is None # AI failed
        assert result.overall_score >= 0 # SPACY still worked
