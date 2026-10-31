import json
import os
from pathlib import Path

import numpy as np
import ollama
from dotenv import load_dotenv

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5").strip()
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text").strip()

INDEX_DIR = Path("data/index")
INDEX_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_CHARS = 600


def _fmt(seconds: float) -> str:
    seconds = int(seconds)
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


def _chunk_segments(segments: list[dict]) -> list[dict]:
    chunks, text, start = [], "", None
    for seg in segments:
        if start is None:
            start = seg["start"]
        text += " " + seg["text"]
        if len(text) >= CHUNK_CHARS:
            chunks.append({"start": start, "text": text.strip()})
            text, start = "", None
    if text.strip():
        chunks.append({"start": start, "text": text.strip()})
    return chunks


def _embed(texts: list[str]) -> np.ndarray:
    res = ollama.embed(model=EMBED_MODEL, input=texts)
    return np.array(res["embeddings"], dtype=np.float32)


def build_index(video_id: str, segments: list[dict]) -> dict:
    chunks = _chunk_segments(segments)
    vectors = _embed([c["text"] for c in chunks])
    data = {"chunks": chunks, "vectors": vectors.tolist()}
    path = INDEX_DIR / f"{video_id}.json"
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return data


def retrieve(video_id: str, question: str, segments: list[dict], k: int = 4) -> list[dict]:
    path = INDEX_DIR / f"{video_id}.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
    else:
        data = build_index(video_id, segments)

    vectors = np.array(data["vectors"], dtype=np.float32)
    q = _embed([question])[0]
    sims = vectors @ q / (np.linalg.norm(vectors, axis=1) * np.linalg.norm(q) + 1e-9)
    top = sorted(np.argsort(sims)[::-1][:k])
    return [data["chunks"][i] for i in top]


def answer_question(video_id: str, question: str, segments: list[dict]) -> dict:
    passages = retrieve(video_id, question, segments)
    context = "\n\n".join(f"[{_fmt(p['start'])}] {p['text']}" for p in passages)

    prompt = f"""Tu es un assistant qui répond à des questions sur une vidéo de cours.
Réponds uniquement à partir des extraits ci-dessous, dans la langue de la question.
Si la réponse n'y est pas, dis que la vidéo n'en parle pas.
Indique les moments utiles au format [mm:ss].

Extraits :
{context}

Question : {question}"""

    response = ollama.chat(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    return {
        "answer": response["message"]["content"].strip(),
        "sources": [
            {"start": p["start"], "timestamp": _fmt(p["start"]), "text": p["text"]}
            for p in passages
        ],
    }