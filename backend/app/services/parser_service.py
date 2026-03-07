from typing import Any, Dict

from fastapi import UploadFile


async def parse_resume_file(file: UploadFile) -> Dict[str, Any]:
    content = await file.read()
    text = content.decode(errors="ignore")
    # TODO: integrate advanced parsing (e.g., PyResParser, custom rules, or LLM-based extraction)
    return {
        "raw_text": text,
        "summary": text[:500],
    }

