import { useState } from "react";
import CourseCard from "../components/CourseCard";

export default function Library({ library, query, onOpen, onChat, onDelete }) {
  const [filter, setFilter] = useState("all");

  const list = library
    .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    .filter((c) =>
      filter === "all" ? true : filter === "done" ? c.done : !c.done
    )
    .sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div>
      <div className="lib-head">
        <div>
          <h1 className="page-title">My Library 📚</h1>
          <p className="muted">Retrouve et gère tous tes cours</p>
        </div>
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tous les cours</option>
          <option value="todo">À voir</option>
          <option value="done">Terminés</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          Aucun cours trouvé. Ajoute une vidéo depuis la page d'accueil.
        </div>
      ) : (
        <div className="courses-grid">
          {list.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onOpen={onOpen}
              onChat={onChat}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}