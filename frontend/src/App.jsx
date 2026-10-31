import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DEMO_ID = "scfeshQ9Pvs";

const STEPS = [
  "Téléchargement de l'audio",
  "Transcription (Whisper)",
  "Résumé (LLM local)",
];

const FEATURES = [
  {
    icon: "📝",
    title: "Résumé structuré",
    text: "Titre, points clés et définitions générés automatiquement.",
  },
  {
    icon: "💬",
    title: "Chat avec la vidéo",
    text: "Pose tes questions, les réponses citent les passages utiles.",
  },
  {
    icon: "⏱️",
    title: "Timestamps cliquables",
    text: "Clique sur un moment pour sauter directement à cet endroit.",
  },
];

const SUGGESTIONS = [
  "Quels sont les points clés ?",
  "Résume en 3 phrases",
  "Quelles définitions retenir ?",
];

const LANGS = { fr: "fr-FR", en: "en-US", ar: "ar-SA", es: "es-ES" };

function fmt(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function clean(md) {
  return md
    .replace(/[*#_`>]/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/^\s*\d+\.\s*/gm, "")
    .replace(/([^.!?:\n])\n+/g, "$1. ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function Presenter({ text, lang }) {
  const spoken = useMemo(() => clean(text), [text]);
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const bubbleRef = useRef(null);
  const typing = shown < spoken.length;
  const talking = typing || speaking;

  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= spoken.length) {
          clearInterval(id);
          return n;
        }
        return n + 2;
      });
    }, 30);
    return () => clearInterval(id);
  }, [spoken, run]);

  useEffect(() => {
    const el = bubbleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggleSpeech() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = LANGS[lang] || "fr-FR";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function replay() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setRun((r) => r + 1);
  }

  return (
    <section className={`glass presenter ${talking ? "talking" : ""}`}>
      <svg viewBox="0 0 170 200" className="avatar" aria-hidden="true">
        <path d="M20 200 C20 150 50 135 80 135 C110 135 140 150 140 200 Z" fill="#6366f1" />
        <rect x="70" y="116" width="20" height="24" rx="8" fill="#f1c0a0" />
        <ellipse cx="80" cy="85" rx="36" ry="40" fill="#f5c9a9" />
        <path
          d="M43 84 C38 38 70 26 92 30 C118 35 124 62 117 84 C111 62 96 52 80 52 C62 52 50 62 43 84 Z"
          fill="#3b2a20"
        />
        <rect x="52" y="72" width="16" height="4" rx="2" fill="#3b2a20" />
        <rect x="92" y="72" width="16" height="4" rx="2" fill="#3b2a20" />
        <ellipse className="eye" cx="64" cy="87" rx="4.5" ry="5.5" fill="#1f2937" />
        <ellipse className="eye" cx="96" cy="87" rx="4.5" ry="5.5" fill="#1f2937" />
        <circle cx="54" cy="102" r="6" fill="#f472b6" opacity="0.35" />
        <circle cx="106" cy="102" r="6" fill="#f472b6" opacity="0.35" />
        <ellipse className="mouth" cx="80" cy="108" rx="9" ry="3" fill="#7f1d1d" />
        <g className="arm">
          <path
            d="M126 152 C150 142 160 122 152 100"
            stroke="#6366f1"
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="152" cy="96" r="9" fill="#f5c9a9" />
        </g>
      </svg>

      <div className="bubble">
        <div className="bubble-head">
          <strong>Je t'explique la vidéo</strong>
          <div className="bubble-actions">
            <button type="button" className="mini" onClick={toggleSpeech}>
              {speaking ? "⏹ Arrêter" : "🔊 Écouter"}
            </button>
            <button type="button" className="mini" onClick={replay}>
              ↻ Rejouer
            </button>
          </div>
        </div>
        <div className="bubble-text" ref={bubbleRef}>
          {spoken.slice(0, shown)}
          {typing && <span className="cursor">|</span>}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [length, setLength] = useState("medium");
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [start, setStart] = useState(0);
  const [tab, setTab] = useState("summary");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      20000
    );
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, asking]);

  async function load(request) {
    setError("");
    setVideo(null);
    setMessages([]);
    setStart(0);
    setTab("summary");
    setLoading(true);
    try {
      const res = await request();
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Lien invalide"
        );
      }
      setVideo(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Impossible de joindre le serveur. Vérifie que le backend tourne."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function analyze(e) {
    e.preventDefault();
    load(() =>
      fetch(`${API}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, summary_length: length }),
      })
    );
  }

  function loadDemo() {
    load(() => fetch(`${API}/videos/${DEMO_ID}`));
  }

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || !video || asking) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: video.video_id, question: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Erreur"
        );
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Erreur : ${err.message}`, sources: [] },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <header className="nav">
        <div className="brand">
          <span className="logo">▶</span> Course Video Summarizer
        </div>
        <a
          className="nav-link"
          href="https://github.com/zinebelkhalifi096-dot/course-video-summarizer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-text">
            <span className="badge">IA locale · Whisper · Ollama · RAG</span>
            <h1>
              Comprends une vidéo de cours <span className="grad">en quelques minutes</span>
            </h1>
            <p className="subtitle">
              Colle un lien YouTube : obtiens un résumé clair, la transcription
              et un assistant pour poser tes questions.
            </p>

            <form className="input-card" onSubmit={analyze}>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="short">Court</option>
                <option value="medium">Moyen</option>
                <option value="detailed">Détaillé</option>
              </select>
              <button className="btn" disabled={loading}>
                {loading ? "Analyse..." : "Analyser"}
              </button>
            </form>

            <button type="button" className="link-btn" onClick={loadDemo} disabled={loading}>
              ✨ Voir un exemple
            </button>
          </div>
          <img
            src="/laptop.webp"
            alt="Ordinateur portable avec un cours en ligne"
            className="hero-art"
          />
        </section>

        {loading && (
          <section className="glass steps">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}
              >
                <span className="dot">{i < step ? "✓" : i + 1}</span>
                {label}
              </div>
            ))}
            <p className="info">Cela peut prendre quelques minutes selon la durée de la vidéo.</p>
          </section>
        )}

        {error && <p className="error">{error}</p>}

        {!video && !loading && (
          <section className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass feature">
                <div className="f-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </section>
        )}

        {video && (
          <>
            <Presenter
              key={video.video_id}
              text={video.summary}
              lang={video.language}
            />

            <section className="grid">
              <div className="glass">
                <h2 className="video-title">{video.title}</h2>
                <p className="meta">
                  {fmt(video.duration)} · langue : {video.language}
                </p>
                <iframe
                  key={start}
                  title="video"
                  src={`https://www.youtube.com/embed/${video.video_id}?start=${Math.floor(
                    start
                  )}${start > 0 ? "&autoplay=1" : ""}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                <div className="tabs">
                  <button
                    className={tab === "summary" ? "tab on" : "tab"}
                    onClick={() => setTab("summary")}
                  >
                    Résumé
                  </button>
                  <button
                    className={tab === "transcript" ? "tab on" : "tab"}
                    onClick={() => setTab("transcript")}
                  >
                    Transcription
                  </button>
                </div>
                {tab === "summary" ? (
                  <div className="md">
                    <ReactMarkdown>{video.summary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="segments">
                    {video.segments.map((s, i) => (
                      <button key={i} className="seg" onClick={() => setStart(s.start)}>
                        <span className="ts">{fmt(s.start)}</span> {s.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass chat">
                <h2>Pose une question</h2>
                <div className="messages" ref={messagesRef}>
                  {messages.length === 0 && (
                    <div className="suggestions">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} className="chip" onClick={() => ask(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.role}`}>
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                      {m.sources?.length > 0 && (
                        <div className="sources">
                          {m.sources.map((s, j) => (
                            <button
                              key={j}
                              type="button"
                              className="ts-btn"
                              title={s.text}
                              onClick={() => setStart(s.start)}
                            >
                              ▶ {s.timestamp}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {asking && <p className="info">Réflexion...</p>}
                </div>
                <form
                  className="chat-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask();
                  }}
                >
                  <input
                    placeholder="Ta question sur la vidéo"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button className="btn" disabled={asking}>
                    Envoyer
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        Fait par Zineb El Khalifi · React, FastAPI, Whisper, Ollama
      </footer>
    </>
  );
}