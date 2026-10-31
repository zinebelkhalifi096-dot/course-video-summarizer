import json
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.services.download import download_audio
from app.services.summarize import summarize_text
from app.services.transcribe import transcribe_audio

router = APIRouter(prefix="/videos", tags=["videos"])

DATA_DIR = Path("data/videos")
DATA_DIR.mkdir(parents=True, exist_ok=True)


class VideoRequest(BaseModel):
    url: HttpUrl
    language: str = "auto"
    summary_length: Literal["short", "medium", "detailed"] = "medium"


@router.post("")
def create_video(req: VideoRequest):
    try:
        video = download_audio(str(req.url))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Téléchargement impossible : {e}")

    transcript = transcribe_audio(video["audio_path"], req.language)

    try:
        summary = summarize_text(transcript["text"], req.summary_length)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Résumé impossible (Ollama est-il lancé ?) : {e}",
        )

    result = {
        "video_id": video["video_id"],
        "title": video["title"],
        "duration": video["duration"],
        "language": transcript["language"],
        "summary": summary,
        "transcript": transcript["text"],
        "segments": transcript["segments"],
    }

    path = DATA_DIR / f"{video['video_id']}.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


@router.get("/{video_id}")
def get_video(video_id: str):
    path = DATA_DIR / f"{video_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    return json.loads(path.read_text(encoding="utf-8"))