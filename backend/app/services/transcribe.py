from faster_whisper import WhisperModel

_model = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel("small", device="cpu", compute_type="int8")
    return _model


def transcribe_audio(audio_path: str, language: str = "auto") -> dict:
    model = get_model()
    segments, info = model.transcribe(
        audio_path,
        language=None if language in (None, "auto") else language,
        vad_filter=True,
    )

    result = [
        {"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
        for s in segments
    ]

    return {
        "language": info.language,
        "segments": result,
        "text": " ".join(seg["text"] for seg in result),
    }