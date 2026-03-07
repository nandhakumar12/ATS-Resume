from typing import List, Tuple

import spacy


_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_md")
    return _nlp


def compute_semantic_similarity(resume_text: str, job_description: str) -> float:
    nlp = get_nlp()
    resume_doc = nlp(resume_text)
    job_doc = nlp(job_description)
    return float(resume_doc.similarity(job_doc))


def extract_skills(text: str) -> List[str]:
    # Simple placeholder; later you can plug a more advanced NER or custom skill extractor
    doc = get_nlp()(text)
    tokens = [t.text for t in doc if not t.is_stop and not t.is_punct]
    return list({t.lower() for t in tokens})


def analyze_skill_gap(
    resume_text: str, job_description: str
) -> Tuple[List[str], List[str]]:
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))
    matched = sorted(list(resume_skills & job_skills))
    missing = sorted(list(job_skills - resume_skills))
    return matched, missing

