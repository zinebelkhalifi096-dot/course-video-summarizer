import { useState } from "react";
import ReactMarkdown from "react-markdown";
import ChatBox from "../components/ChatBox";
import Presenter from "../components/Presenter";
import { exportNotes, fmtDuration, fmtTime, section } from "../utils";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "transcript", label: "Transcript" },
  { id: "key", label: "Key Points" },
  { id: "concepts", label: "Concepts" },
];
const SOURCES = { subtitles: "Sous-titres YouTube", whisper: "Whisper" };

export default function Course({
  course,
  video,
  error,
  initialStart,
  presenter,
  messages,
  update,
  onBack,
  onToggleDone,
}) {
  const [start, setStart] = useState(initialStart);
  const [tab, setTab] = useState("summary");

  function md(text) {
    return (
      <div className="md">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  function tabContent() {
    if (tab === "transcript") {
      return (
        <div className="segments">
          {video.segments.map((s, i) => (
            <button key={i} className="seg" onClick={() => setStart(s.start)}>
              <span className="ts">{fmtTime(s.start)}</span> {s.text}
            </button>
          ))}
        </div>
      );
    }
    if (tab === "key") {
      const t = section(video.summary, ["points clés", "points cles", "key points"]);
      return md(t ?? video.summary);
    }
    if (tab === "concepts") {
      const t = section(video.summary, ["définition", "definition", "concept"]);
      return md(t ?? "Aucune définition détectée dans ce résumé.");
    }
    return (
      <>
        {presenter && <Presenter text={video.summary} lang={video.language} />}
        {md(video.summary)}
      </>
    );
  }

  return (
    <div>
      <div className="crumbs">
        <button className="link-btn" onClick={onBack}>
          ← My Library
        </button>
        <span>›</span>
        <span className="crumb-title">{course.title}</span>
        <div className="crumb-actions">
          <label className="check">
            <input
              type="checkbox"
              checked={course.done}
              onChange={() => onToggleDone(course.id)}
            />
            Terminé
          </label>
          <button
            className="pill"
            disabled={!video}
            onClick={() => exportNotes(video)}
          >
            Export Notes
          </button>
        </div>
      </div>

      {!video && !error && <p className="muted">Chargement du cours...</p>}
      {error && !video && <p className="error">{error}</p>}

      {video && (
        <div className="course-grid">
          <div className="card">
            <iframe
              key={start}
              title="video"
              src={`https://www.youtube.com/embed/${video.video_id}?start=${Math.floor(
                start
              )}${start > 0 ? "&autoplay=1" : ""}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <div className="meta">
              {video.duration > 0 && <span>⏱ {fmtDuration(video.duration)}</span>}
              <span>🌐 {video.language}</span>
              {video.source && <span>📝 {SOURCES[video.source] || video.source}</span>}
            </div>
            <div className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? "on" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tabContent()}
          </div>

          <div className="card course-chat">
            <h3 style={{ marginTop: 0 }}>Ask about this course...</h3>
            <ChatBox
              videoId={course.id}
              messages={messages}
              update={update}
              onSeek={setStart}
            />
            <div className="hint">💡 Clique sur un timestamp pour revenir à la vidéo</div>
          </div>
        </div>
      )}
    </div>
  );
}