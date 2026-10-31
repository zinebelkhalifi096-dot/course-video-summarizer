import os
from pathlib import Path

import yt_dlp
from dotenv import load_dotenv

load_dotenv()

AUDIO_DIR = Path("data/audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def get_video_info(url: str) -> dict:
    """Récupère id, titre et durée SANS télécharger la vidéo."""
    opts = {
        "noplaylist": True,
        "quiet": True,
        "skip_download": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    return {
        "video_id": info["id"],
        "title": info.get("title"),
        "duration": info.get("duration"),
    }


def download_audio(url: str) -> dict:
    opts = {
        "format": "bestaudio/best",
        "outtmpl": str(AUDIO_DIR / "%(id)s.%(ext)s"),
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "128",
            }
        ],
        "noplaylist": True,
        "quiet": True,
    }

    ffmpeg_dir = os.getenv("FFMPEG_DIR")
    if ffmpeg_dir:
        opts["ffmpeg_location"] = ffmpeg_dir.strip()

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)

    video_id = info["id"]
    return {
        "video_id": video_id,
        "title": info.get("title"),
        "duration": info.get("duration"),
        "audio_path": str(AUDIO_DIR / f"{video_id}.mp3"),
    }