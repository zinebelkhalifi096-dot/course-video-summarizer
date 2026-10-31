import { fmtDate, fmtDuration, thumb } from "../utils";

const LABELS = { ready: "Prêt", processing: "Analyse...", error: "Erreur" };

export default function CourseCard({ course, onOpen, onChat, onDelete }) {
  const ready = course.status === "ready";
  return (
    <article className="course-card">
      <div className="thumb">
        <img src={thumb(course.id)} alt="" loading="lazy" />
        <span className={`badge-status st-${course.status}`}>
          {LABELS[course.status]}
        </span>
        {course.duration > 0 && (
          <span className="badge-time">⏱ {fmtDuration(course.duration)}</span>
        )}
      </div>
      <h3>{course.title}</h3>
      <p className="date">📅 Ajouté le {fmtDate(course.addedAt)}</p>
      <div className="progress-row">
        <div className="progress">
          <span style={{ width: course.done ? "100%" : "0%" }} />
        </div>
        {course.done ? "Terminé" : "À voir"}
      </div>
      <div className="card-actions">
        <button
          className="pill primary"
          disabled={!ready}
          onClick={() => onOpen(course.id)}
        >
          ▶ {course.done ? "Revoir" : "Voir le cours"}
        </button>
        <button
          className="icon-btn"
          title="Chat"
          disabled={!ready}
          onClick={() => onChat(course.id)}
        >
          💬
        </button>
        {onDelete && (
          <button
            className="icon-btn"
            title="Supprimer"
            onClick={() => onDelete(course.id)}
          >
            🗑
          </button>
        )}
      </div>
      {course.status === "error" && <p className="card-error">{course.error}</p>}
    </article>
  );
}