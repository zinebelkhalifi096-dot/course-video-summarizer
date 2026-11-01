import ChatBox from "../components/ChatBox";
import Icon from "../components/Icon";
import { thumb } from "../utils";

export default function ChatPage({ library, chats, updateChat, selectedId, onSelect, onSeek }) {
  const ready = library.filter((c) => c.status === "ready");
  const current = ready.find((c) => c.id === selectedId) || ready[0];

  if (!current) {
    return (
      <div>
        <h1 className="page-title">
          <Icon name="chat" size={30} /> Chat Assistant
        </h1>
        <p className="muted">
          Ajoute d'abord un cours depuis la page d'accueil pour pouvoir lui
          poser des questions.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <aside className="card courses-list">
        <h3>
          <Icon name="book" size={18} /> Your Courses
        </h3>
        {ready.map((c) => (
          <button
            key={c.id}
            className={`course-item ${c.id === current.id ? "on" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <img src={thumb(c.id)} alt="" />
            <span>{c.title}</span>
          </button>
        ))}
        <button className="pill" onClick={() => updateChat(current.id, () => [])}>
          <Icon name="plus" size={16} /> New Chat
        </button>
      </aside>

      <section className="card chat-panel">
        <div className="chat-head">
          <div>
            <h2>
              <Icon name="chat" size={26} /> Chat Assistant
            </h2>
            <p className="muted">Posez vos questions sur « {current.title} »</p>
          </div>
          <span className="rag-badge">RAG activé</span>
        </div>
        <ChatBox
          key={current.id}
          videoId={current.id}
          messages={chats[current.id] || []}
          update={(fn) => updateChat(current.id, fn)}
          onSeek={(sec) => onSeek(current.id, sec)}
        />
      </section>
    </div>
  );
}