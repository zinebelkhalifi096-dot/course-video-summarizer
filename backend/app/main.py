from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, video

app = FastAPI(title="Course Video Summarizer")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}