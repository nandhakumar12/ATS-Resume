import pytest
from app.services.similarity_engine import (
    compute_semantic_similarity,
    extract_skills,
    analyze_skill_gap
)

def test_extract_skills():
    text = "Python, Java and Cloud computing."
    skills = extract_skills(text)
    assert "python" in skills
    assert "java" in skills
    assert "cloud" in skills

def test_analyze_skill_gap():
    resume = "I am a Python developer with AWS experience."
    job = "Looking for a Python developer with Azure and AWS."
    
    matched, missing = analyze_skill_gap(resume, job)
    
    # Python and AWS should be matched
    assert "python" in matched
    assert "aws" in matched
    
    # Azure should be missing
    assert "azure" in missing

def test_semantic_similarity_basic():
    text1 = "Python developer with cloud experience"
    text2 = "Python developer with cloud experience"
    similarity = compute_semantic_similarity(text1, text2)
    assert similarity > 0.9  # Should be very high for identical text
