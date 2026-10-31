import json
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.services.download import download_audio, get_video_info
from app.services.subtitles import fetch_subtitles
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
    url = str(req.url)

    # 1. Infos de la vidéo (rapide, sans téléchargement)
    try:
        info = get_video_info(url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Vidéo inaccessible : {e}")

    # 2. Sous-titres YouTube d'abord (quelques secondes)
    transcript = fetch_subtitles(info["video_id"], req.language)
    source = "subtitles"

    # 3. Sinon : téléchargement de l'audio + Whisper (plus lent)
    if transcript is None:
        source = "whisper"
        try:
            video = download_audio(url)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Téléchargement impossible : {e}"
            )
        try:
            transcript = transcribe_audio(video["audio_path"], req.language)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Transcription impossible : {e}"
            )

    # 4. Résumé
    try:
        summary = summarize_text(transcript["text"], req.summary_length)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Résumé impossible (Ollama est-il lancé ?) : {e}",
        )

    result = {
        "video_id": info["video_id"],
        "title": info["title"],
        "duration": info["duration"],
        "language": transcript["language"],
        "source": source,
        "summary": summary,
        "transcript": transcript["text"],
        "segments": transcript["segments"],
    }

    path = DATA_DIR / f"{info['video_id']}.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


@router.get("/{video_id}")
def get_video(video_id: str):
    path = DATA_DIR / f"{video_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    return json.loads(path.read_text(encoding="utf-8"))