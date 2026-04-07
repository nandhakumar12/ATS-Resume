from typing import Any, Dict
from fastapi import UploadFile
import os
import time
from pdfminer.high_level import extract_text
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
        # Extract the full raw text so Gemini AI can actually read the whole document
        # instead of just the poorly-parsed skills array from pyresparser
        try:
            raw = extract_text(file_path)
        except Exception:
            raw = ""
            
        from pyresparser import ResumeParser
        data = ResumeParser(file_path).get_extracted_data()
        data['raw_text'] = raw
            
        data['file_url'] = f"/api/uploads/{unique_filename}"
        return data
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e

