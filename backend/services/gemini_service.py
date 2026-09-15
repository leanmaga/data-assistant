import os
import google.generativeai as genai
from typing import Optional

# Global model instance
model: Optional[genai.GenerativeModel] = None

def setup_gemini():
    """Initialize Gemini API with API key"""
    global model
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        model = None
        print("⚠️ GOOGLE_API_KEY is not set; Gemini generation is disabled")
        return None
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    print("✅ Gemini API initialized successfully")
    return model

def get_model() -> genai.GenerativeModel:
    """Get the configured Gemini model"""
    global model
    
    if model is None:
        setup_gemini()

    if model is None:
        raise RuntimeError("GOOGLE_API_KEY environment variable not set")
    
    return model

async def generate_with_gemini(
    prompt: str,
    temperature: float = 1.0,
    max_tokens: int = 8000,
    response_format: str = "application/json"
) -> str:
    """
    Generate content using Gemini API
    
    Args:
        prompt: The prompt to send to Gemini
        temperature: Temperature for generation (0.0-2.0)
        max_tokens: Maximum tokens in response
        response_format: MIME type for response format
    
    Returns:
        Generated text response
    """
    model = get_model()
    
    generation_config = {
        "temperature": temperature,
        "max_output_tokens": max_tokens,
        "response_mime_type": response_format
    }
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return response.text
    except Exception as e:
        print(f"❌ Gemini API error: {str(e)}")
        raise