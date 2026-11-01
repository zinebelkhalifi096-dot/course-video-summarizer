import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { askChat } from "../api";
import Icon from "./Icon";

const EXAMPLES = [
  "Quels sont les points clés ?",
  "Résume en 3 phrases",
  "Quelles définitions retenir ?",
];

export default function ChatBox({ videoId, messages, update, onSeek }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, asking]);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || asking) return;
    update((m) => [...m, { role: "user", text }]);
    setQuestion("");
    setAsking(true);
    try {
      const data = await askChat(videoId, text);
      update((m) => [
        ...m,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      update((m) => [
        ...m,
        { role: "assistant", text: `Erreur : ${err.message}`, sources: [] },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="chatbox">
      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="muted">
            Pose une question sur ce cours : les réponses citent les passages de
            la vidéo.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <ReactMarkdown>{m.text}</ReactMarkdown>
            {m.sources?.length > 0 && (
              <div className="sources">
                <span>Références :</span>
                {m.sources.map((s, j) => (
                  <button
                    key={j}
                    type="button"
                    className="ts-btn"
                    title={s.text}
                    onClick={() => onSeek(s.start)}
                  >
                    <Icon name="play" size={10} /> {s.timestamp}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {asking && <p className="muted">Réflexion...</p>}
      </div>

      <div className="chips">
        {EXAMPLES.map((e) => (
          <button key={e} type="button" className="chip" onClick={() => ask(e)}>
            {e}
          </button>
        ))}
      </div>

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input
          placeholder="Posez votre question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="send" disabled={asking} aria-label="Envoyer">
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}