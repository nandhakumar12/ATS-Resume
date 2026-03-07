from typing import Any, Dict

from fastapi import UploadFile


async def parse_resume_file(file: UploadFile) -> Dict[str, Any]:
    content = await file.read()
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    from pyresparser import ResumeParser
    data = ResumeParser(tmp_path).get_extracted_data()
    return data

