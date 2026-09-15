from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from services.schema_parser import parse_ddl_schema
from services.data_generator import generate_synthetic_data, modify_data
from services.gemini_service import setup_gemini

app = FastAPI(title="Data Assistant API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
setup_gemini()

# Request/Response Models
class SchemaParseRequest(BaseModel):
    ddl_text: str

class SchemaParseResponse(BaseModel):
    schema: Dict[str, Any]

class DataGenerateRequest(BaseModel):
    schema: Dict[str, Any]
    prompt_instructions: str
    num_rows: int = 1000
    temperature: float = 1.0
    max_tokens: int = 100

class DataGenerateResponse(BaseModel):
    data: Dict[str, List[Dict[str, Any]]]

class DataModifyRequest(BaseModel):
    table_name: str
    current_data: List[Dict[str, Any]]
    instructions: str
    temperature: float = 1.0

class DataModifyResponse(BaseModel):
    data: List[Dict[str, Any]]

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Parse DDL Schema
@app.post("/api/schema/parse", response_model=SchemaParseResponse)
async def parse_schema(request: SchemaParseRequest):
    try:
        schema = parse_ddl_schema(request.ddl_text)
        return SchemaParseResponse(schema=schema)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse schema: {str(e)}")

# Generate synthetic data
@app.post("/api/data/generate", response_model=DataGenerateResponse)
async def generate_data(request: DataGenerateRequest):
    try:
        data = await generate_synthetic_data(
            schema_info=request.schema,
            prompt_instructions=request.prompt_instructions,
            num_rows=request.num_rows,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return DataGenerateResponse(data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate data: {str(e)}")

# Modify data
@app.post("/api/data/modify", response_model=DataModifyResponse)
async def modify_table_data(request: DataModifyRequest):
    try:
        modified_data = await modify_data(
            table_name=request.table_name,
            current_data=request.current_data,
            instructions=request.instructions,
            temperature=request.temperature
        )
        return DataModifyResponse(data=modified_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to modify data: {str(e)}")

# Store data in PostgreSQL
@app.post("/api/data/store")
async def store_data(data: Dict[str, List[Dict[str, Any]]]):
    # TODO: Implement PostgreSQL storage
    return {"status": "success", "message": "Data stored successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)