from typing import Any, Dict

from fastapi import UploadFile


async def parse_resume_file(file: UploadFile) -> Dict[str, Any]:
    content = await file.read()
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from pyresparser import ResumeParser
        # On Windows there might be issues if file is not closed, but NamedTemporaryFile exits context here
        data = ResumeParser(tmp_path).get_extracted_data()
        return data
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

