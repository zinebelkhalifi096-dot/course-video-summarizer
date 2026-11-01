from app.services import subtitles
from app.services.rag import _chunk_segments, _fmt
from app.services.summarize import _chunks


class Snippet:
    def __init__(self, start, duration, text):
        self.start = start
        self.duration = duration
        self.text = text


class FakeTranscript:
    def __init__(self, code, generated, text):
        self.language_code = code
        self.is_generated = generated
        self._text = text

    def fetch(self):
        return [Snippet(0.0, 3.0, self._text)]


def fake_api(transcripts):
    class Api:
        def list(self, video_id):
            return transcripts

    return Api


def test_fmt():
    assert _fmt(75) == "01:15"
    assert _fmt(5) == "00:05"


def test_summary_chunks_respect_size_and_keep_all_words():
    text = " ".join(["mot"] * 5000)
    parts = _chunks(text, 1000)
    assert len(parts) > 1
    assert all(len(p) <= 1000 for p in parts)
    assert " ".join(parts).split() == text.split()


def test_chunk_segments_keeps_start_times():
    segments = [{"start": i * 2.0, "end": i * 2.0 + 2, "text": "x" * 100} for i in range(20)]
    chunks = _chunk_segments(segments)
    assert chunks[0]["start"] == 0.0
    assert len(chunks) > 1
    assert all(c["text"] for c in chunks)


def test_subtitles_prefers_human_over_generated(monkeypatch):
    transcripts = [
        FakeTranscript("fr", True, "auto " * 100),
        FakeTranscript("fr", False, "humain " * 100),
    ]
    monkeypatch.setattr(subtitles, "YouTubeTranscriptApi", fake_api(transcripts))
    result = subtitles.fetch_subtitles("abcDEF12345")
    assert result["language"] == "fr"
    assert result["text"].startswith("humain")


def test_subtitles_too_short_returns_none(monkeypatch):
    monkeypatch.setattr(
        subtitles, "YouTubeTranscriptApi", fake_api([FakeTranscript("fr", False, "court")])
    )
    assert subtitles.fetch_subtitles("abcDEF12345") is None


def test_subtitles_error_returns_none(monkeypatch):
    class Boom:
        def list(self, video_id):
            raise RuntimeError("pas de réseau")

    monkeypatch.setattr(subtitles, "YouTubeTranscriptApi", Boom)
    assert subtitles.fetch_subtitles("abcDEF12345") is None