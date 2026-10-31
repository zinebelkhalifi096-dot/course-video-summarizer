import sys

from app.services.download import download_audio
from app.services.transcribe import transcribe_audio

url = sys.argv[1]

print("Téléchargement de l'audio...")
video = download_audio(url)
print(f"OK : {video['title']} ({video['duration']} s)")

print("Transcription...")
transcript = transcribe_audio(video["audio_path"])
print(f"Langue détectée : {transcript['language']}")

for seg in transcript["segments"][:5]:
    print(f"[{seg['start']} - {seg['end']}] {seg['text']}")