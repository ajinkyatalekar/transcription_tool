from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_server.routers import server
from pydantic import BaseModel
import whisper_timestamped
import base64
import io
import tempfile
import os

# You might need to add this to your startup script if you have permission issues
import subprocess

# Check if Docker socket permissions need to be adjusted (if not running as root)
try:
    subprocess.run(["docker", "info"], check=True)
except:
    # Try to fix permissions if you have sudo access
    subprocess.run(["sudo", "chmod", "666", "/var/run/docker.sock"])

app = FastAPI(openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://main.d32j7a46oq8pb3.amplifyapp.com", # production
        "https://dev.d32j7a46oq8pb3.amplifyapp.com", # dev
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(server.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "api_version": "0.0.2"
    }

class RunRequest(BaseModel):
    data: str 

@app.post("/run")
def run_script(request: RunRequest):
    return {"output": f"You sent: {request.data}"}

class WhisperRequest(BaseModel):
    audio_base64: str
    language: str = "en"  # Default to English
    model_size: str = "tiny"  # Default to tiny model

@app.post("/transcribe")
def transcribe_audio(request: WhisperRequest):
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(request.audio_base64)
        
        # Create a temporary file to save the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        try:
            # Load the audio using whisper_timestamped
            audio = whisper_timestamped.load_audio(temp_file_path)
            
            # Load the model
            model = whisper_timestamped.load_model("tiny", device="cpu")
            
            # Transcribe with timestamped words
            result = whisper_timestamped.transcribe(
                model, 
                audio, 
                language=request.language,
                beam_size=5,
                best_of=5,
                temperature=(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
            )
            
            return {
                "success": True,
                "transcription": result
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }