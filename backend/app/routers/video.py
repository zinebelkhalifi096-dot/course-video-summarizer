import json
import re
import time
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.services.download import AUDIO_DIR, download_audio, get_video_info
from app.services.rag import INDEX_DIR
from app.services.subtitles import fetch_subtitles
from app.services.summarize import summarize_text
from app.services.transcribe import transcribe_audio

router = APIRouter(prefix="/videos", tags=["videos"])

DATA_DIR = Path("data/videos")
DATA_DIR.mkdir(parents=True, exist_ok=True)

ID_RE = re.compile(r"^[A-Za-z0-9_-]{6,20}$")


class VideoRequest(BaseModel):
    url: HttpUrl
    language: str = "auto"
    summary_length: Literal["short", "medium", "detailed"] = "medium"


class DoneUpdate(BaseModel):
    done: bool


def _path(video_id: str) -> Path:
    if not ID_RE.match(video_id):
        raise HTTPException(status_code=400, detail="Identifiant de vidéo invalide")
    return DATA_DIR / f"{video_id}.json"


def _read(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


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

    path = _path(info["video_id"])
    previous = _read(path) if path.exists() else {}

    result = {
        "video_id": info["video_id"],
        "title": info["title"],
        "duration": info["duration"],
        "language": transcript["language"],
        "source": source,
        "summary": summary,
        "transcript": transcript["text"],
        "segments": transcript["segments"],
        "added_at": previous.get("added_at") or int(time.time() * 1000),
        "done": previous.get("done", False),
    }
    _write(path, result)
    return result


@router.get("")
def list_videos():
    items = []
    for path in DATA_DIR.glob("*.json"):
        try:
            data = _read(path)
        except (OSError, json.JSONDecodeError):
            continue
        items.append(
            {
                "video_id": data.get("video_id", path.stem),
                "title": data.get("title") or path.stem,
                "duration": data.get("duration") or 0,
                "language": data.get("language"),
                "source": data.get("source"),
                "added_at": data.get("added_at") or int(path.stat().st_mtime * 1000),
                "done": bool(data.get("done", False)),
            }
        )
    items.sort(key=lambda v: v["added_at"], reverse=True)
    return items


@router.get("/{video_id}")
def get_video(video_id: str):
    path = _path(video_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    return _read(path)


@router.patch("/{video_id}")
def update_video(video_id: str, body: DoneUpdate):
    path = _path(video_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    data = _read(path)
    data["done"] = body.done
    _write(path, data)
    return {"video_id": video_id, "done": body.done}


@router.delete("/{video_id}")
def delete_video(video_id: str):
    path = _path(video_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
    path.unlink()
    (INDEX_DIR / f"{video_id}.json").unlink(missing_ok=True)
    (AUDIO_DIR / f"{video_id}.mp3").unlink(missing_ok=True)
    return {"deleted": video_id}