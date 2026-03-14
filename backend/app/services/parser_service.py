from typing import Any, Dict
from fastapi import UploadFile
import os
import time

async def parse_resume_file(file: UploadFile) -> Dict[str, Any]:
    content = await file.read()
    
    safe_filename = file.filename.replace(" ", "_").replace("/", "_")
    unique_filename = f"{int(time.time())}_{safe_filename}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    try:
        from pyresparser import ResumeParser
        data = ResumeParser(file_path).get_extracted_data()
        data['file_url'] = f"/api/uploads/{unique_filename}"
        return data
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e

