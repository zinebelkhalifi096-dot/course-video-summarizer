from youtube_transcript_api import YouTubeTranscriptApi

MIN_CHARS = 200  # en dessous, les sous-titres sont inutilisables -> on passe à Whisper


def fetch_subtitles(video_id: str, language: str = "auto") -> dict | None:
    """Renvoie la transcription au même format que transcribe_audio(),
    ou None si la vidéo n'a pas de sous-titres exploitables."""
    try:
        api = YouTubeTranscriptApi()
        transcripts = list(api.list(video_id))

        if language not in (None, "auto"):
            transcripts = [
                t for t in transcripts if t.language_code.split("-")[0] == language
            ]
        if not transcripts:
            return None

        # Sous-titres écrits par un humain d'abord, générés automatiquement ensuite
        transcripts.sort(key=lambda t: t.is_generated)
        chosen = transcripts[0]
        fetched = chosen.fetch()

        segments = []
        for s in fetched:
            text = " ".join(s.text.split())
            if not text:
                continue
            segments.append(
                {
                    "start": round(s.start, 2),
                    "end": round(s.start + s.duration, 2),
                    "text": text,
                }
            )
    except Exception:
        return None

    full_text = " ".join(seg["text"] for seg in segments)
    if len(full_text) < MIN_CHARS:
        return None

    return {
        "language": chosen.language_code.split("-")[0],
        "segments": segments,
        "text": full_text,
    }