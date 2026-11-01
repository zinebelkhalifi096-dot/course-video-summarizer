import { useState } from "react";
import CapArt from "../components/CapArt";
import CourseCard from "../components/CourseCard";
import Icon from "../components/Icon";
import { fmtDuration } from "../utils";

const FEATURES = [
  { icon: "playcircle", title: "Transcription automatique", text: "Sous-titres YouTube, ou Whisper en secours" },
  { icon: "sparkles", title: "Résumé intelligent", text: "Des résumés clairs et structurés" },
  { icon: "chat", title: "Chat IA (RAG)", text: "Posez vos questions sur le cours" },
  { icon: "zap", title: "Accès rapide", text: "Vos notes toujours à portée" },
];

const CIRCLE = 2 * Math.PI * 52;

export default function Home({ name, library, busy, error, onAnalyze, onDemo, onOpen, onChat }) {
  const [url, setUrl] = useState("");

  const recent = [...library].sort((a, b) => b.addedAt - a.addedAt).slice(0, 3);
  const total = library.length;
  const done = library.filter((c) => c.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const seconds = library.reduce((s, c) => s + (c.duration || 0), 0);

  function submit(e) {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  }

  return (
    <div className="home-grid">
      <div>
        <div className="hero">
          <div>
            <h1>Bonjour {name} !</h1>
            <p>Prêt à apprendre aujourd'hui ?</p>
          </div>
          <CapArt className="hero-art" />
        </div>

        <form className="url-card" onSubmit={submit}>
          <Icon name="youtube" size={30} className="yt-icon" />
          <input
            type="url"
            required
            placeholder="Collez le lien YouTube de votre cours..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="btn-brown" disabled={busy}>
            <Icon name="sparkles" size={18} />
            {busy ? "Analyse..." : "Générer mon espace"}
          </button>
        </form>
        {busy && (
          <p className="muted">
            Analyse en cours : quelques secondes si la vidéo a des sous-titres,
            quelques minutes sinon (Whisper).
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <button type="button" className="link-btn" onClick={onDemo}>
          Voir un exemple
        </button>

        <div className="features">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature">
              <span className="f-icon">
                <Icon name={f.icon} size={26} />
              </span>
              <div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="section-title">
          <h2>
            <Icon name="grid" size={22} /> Mes cours récents
          </h2>
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            Aucun cours pour l'instant. Colle un lien YouTube ci-dessus.
          </div>
        ) : (
          <div className="courses-grid">
            {recent.map((c) => (
              <CourseCard key={c.id} course={c} onOpen={onOpen} onChat={onChat} />
            ))}
          </div>
        )}
      </div>

      <aside className="progress-panel">
        <h3>
          <Icon name="chart" size={20} /> Ma progression
        </h3>
        <div className="ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#ead9c4" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#7a5a40"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * CIRCLE} ${CIRCLE}`}
            />
          </svg>
          <div className="ring-text">{percent}%</div>
        </div>
        <p className="muted" style={{ textAlign: "center" }}>
          {done} / {total} cours terminés
        </p>
        <div className="stat">
          <span className="f-icon">
            <Icon name="clock" size={22} />
          </span>
          <div>
            <b>{fmtDuration(seconds) || "0min"}</b>
            <span className="muted">Durée totale des cours</span>
          </div>
        </div>
        <div className="stat">
          <span className="f-icon">
            <Icon name="calendar" size={22} />
          </span>
          <div>
            <b>{total}</b>
            <span className="muted">Cours au total</span>
          </div>
        </div>
        <div className="kudos">
          <Icon name="star" size={18} />
          {done > 0 ? "Tu fais du super travail !" : "Ajoute ton premier cours !"}
        </div>
      </aside>
    </div>
  );
}