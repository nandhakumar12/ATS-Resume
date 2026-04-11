import pytest
import io
from fastapi import UploadFile
from unittest.mock import patch, MagicMock
from app.services.parser_service import parse_resume_file

@pytest.mark.asyncio
@patch('app.services.parser_service.extract_text')
@patch('app.services.parser_service.ResumeParser')
@patch('builtins.open', new_callable=MagicMock)
@patch('os.path.exists', return_value=True)
@patch('os.remove')
async def test_parse_resume_file(mock_remove, mock_exists, mock_open, MockResumeParser, mock_extract):
    # Mock extract_text
    mock_extract.return_value = "Mocked Resume Text"
    
    # Mock ResumeParser
    parser_instance = MockResumeParser.return_value
    parser_instance.get_extracted_data.return_value = {
        "name": "John Doe",
        "skills": ["Python", "AWS"]
    }
    
    # Create a mock UploadFile
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read.return_value = b"dummy content"
    
    result = await parse_resume_file(mock_file)
    
    assert result["name"] == "John Doe"
    assert result["raw_text"] == "Mocked Resume Text"
    assert "file_url" in result
    assert "/api/uploads/" in result["file_url"]
