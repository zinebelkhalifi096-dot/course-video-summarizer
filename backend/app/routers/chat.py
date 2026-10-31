import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])

DATA_DIR = Path("data/videos")


class ChatRequest(BaseModel):
    video_id: str = Field(pattern=r"^[A-Za-z0-9_-]+$")
    question: str = Field(min_length=2)


@router.post("")
def chat(req: ChatRequest):
    path = DATA_DIR / f"{req.video_id}.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Vidéo introuvable : traite-la d'abord avec POST /videos",
        )

    video = json.loads(path.read_text(encoding="utf-8"))

    try:
        return answer_question(req.video_id, req.question, video["segments"])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat impossible (Ollama lancé ? nomic-embed-text installé ?) : {e}",
        )