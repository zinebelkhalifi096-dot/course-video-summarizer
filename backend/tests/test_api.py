import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import video as video_router

FAKE_ID = "abcDEF12345"
URL = f"https://www.youtube.com/watch?v={FAKE_ID}"

TRANSCRIPT = {
    "language": "fr",
    "segments": [{"start": 0.0, "end": 2.0, "text": "Bonjour"}],
    "text": "Bonjour tout le monde",
}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(video_router, "DATA_DIR", tmp_path)
    monkeypatch.setattr(video_router, "INDEX_DIR", tmp_path / "index")
    monkeypatch.setattr(video_router, "AUDIO_DIR", tmp_path / "audio")
    monkeypatch.setattr(
        video_router,
        "get_video_info",
        lambda url: {"video_id": FAKE_ID, "title": "Cours de test", "duration": 120},
    )
    monkeypatch.setattr(
        video_router, "fetch_subtitles", lambda video_id, language="auto": TRANSCRIPT
    )
    monkeypatch.setattr(
        video_router, "summarize_text", lambda text, length="medium": "Résumé de test"
    )
    return TestClient(app)


def create(client):
    return client.post("/videos", json={"url": URL, "summary_length": "short"})


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_create_video_uses_subtitles(client):
    res = create(client)
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "subtitles"
    assert body["summary"] == "Résumé de test"
    assert body["done"] is False


def test_create_video_falls_back_to_whisper(client, monkeypatch):
    monkeypatch.setattr(video_router, "fetch_subtitles", lambda video_id, language="auto": None)
    monkeypatch.setattr(video_router, "download_audio", lambda url: {"audio_path": "x.mp3"})
    monkeypatch.setattr(video_router, "transcribe_audio", lambda path, language="auto": TRANSCRIPT)
    res = create(client)
    assert res.status_code == 200
    assert res.json()["source"] == "whisper"


def test_invalid_url_is_rejected(client):
    res = client.post("/videos", json={"url": "pas-un-lien"})
    assert res.status_code == 422


def test_list_and_get(client):
    assert client.get("/videos").json() == []
    create(client)
    items = client.get("/videos").json()
    assert len(items) == 1
    assert items[0]["video_id"] == FAKE_ID
    assert items[0]["title"] == "Cours de test"
    detail = client.get(f"/videos/{FAKE_ID}").json()
    assert detail["segments"][0]["text"] == "Bonjour"


def test_mark_done_and_keep_it_on_reanalysis(client):
    create(client)
    res = client.patch(f"/videos/{FAKE_ID}", json={"done": True})
    assert res.status_code == 200
    assert client.get("/videos").json()[0]["done"] is True
    create(client)
    assert client.get("/videos").json()[0]["done"] is True


def test_delete(client):
    create(client)
    assert client.delete(f"/videos/{FAKE_ID}").status_code == 200
    assert client.get(f"/videos/{FAKE_ID}").status_code == 404
    assert client.get("/videos").json() == []


def test_unknown_and_invalid_ids(client):
    assert client.get("/videos/zzzzzzzzzzz").status_code == 404
    assert client.get("/videos/a").status_code == 400
    assert client.delete("/videos/zzzzzzzzzzz").status_code == 404


def test_chat_unknown_video(client):
    res = client.post("/chat", json={"video_id": "zzzzzzzzzzz", "question": "Bonjour ?"})
    assert res.status_code == 404