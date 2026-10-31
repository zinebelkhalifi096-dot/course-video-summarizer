import os

import ollama
from dotenv import load_dotenv

load_dotenv()

MODEL = os.getenv("LLM_MODEL", "qwen2.5").strip()
CHUNK_SIZE = 6000

LENGTHS = {
    "short": "5 lignes maximum",
    "medium": "une dizaine de lignes",
    "detailed": "détaillé et complet",
}


def _ask(prompt: str) -> str:
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"].strip()


def _chunks(text: str, size: int = CHUNK_SIZE) -> list[str]:
    chunks, current, length = [], [], 0
    for word in text.split():
        if length + len(word) + 1 > size and current:
            chunks.append(" ".join(current))
            current, length = [], 0
        current.append(word)
        length += len(word) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


def summarize_text(text: str, length: str = "medium") -> str:
    chunks = _chunks(text)

    if len(chunks) == 1:
        notes = text
    else:
        parts = [
            _ask(
                "Résume ce passage d'une vidéo de cours en points clés, "
                f"dans la langue du texte :\n\n{chunk}"
            )
            for chunk in chunks
        ]
        notes = "\n\n".join(parts)

    prompt = f"""Voici le contenu d'une vidéo de cours.
Produis, dans la même langue que le contenu :
1. Un titre
2. Un résumé ({LENGTHS[length]})
3. Les points clés (liste)
4. Les définitions importantes (si présentes)

Contenu :
{notes}"""
    return _ask(prompt)