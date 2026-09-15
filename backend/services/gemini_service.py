import os
import asyncio
from typing import Optional

from google import genai
from google.genai import types

# Global model instance
client: Optional[genai.Client] = None
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
MODEL_FALLBACKS = ("gemini-2.5-flash", "gemini-flash-lite-latest")

def setup_gemini():
    """Initialize Gemini API with API key"""
    global client
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        client = None
        print("⚠️ GOOGLE_API_KEY is not set; Gemini generation is disabled")
        return None
    
    client = genai.Client(api_key=api_key)
    
    print("✅ Gemini API initialized successfully")
    return client

def get_client() -> genai.Client:
    """Get the configured Gemini client"""
    global client
    
    if client is None:
        setup_gemini()

    if client is None:
        raise RuntimeError("GOOGLE_API_KEY environment variable not set")
    
    return client

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
    gemini_client = get_client()
    
    models_to_try = (MODEL_NAME,) + tuple(
        model_name for model_name in MODEL_FALLBACKS if model_name != MODEL_NAME
    )
    last_error = None

    for model_name in models_to_try:
        try:
            response = await asyncio.to_thread(
                gemini_client.models.generate_content,
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    response_mime_type=response_format,
                ),
            )
            return response.text
        except Exception as error:
            last_error = error
            error_text = str(error)
            if "503" not in error_text and "UNAVAILABLE" not in error_text and "404" not in error_text:
                break
            print(f"⚠️ Gemini model '{model_name}' unavailable; trying fallback")

    print(f"❌ Gemini API error: {str(last_error)}")
    raise last_error