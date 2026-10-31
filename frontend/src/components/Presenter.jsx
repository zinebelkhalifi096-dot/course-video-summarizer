import { useEffect, useMemo, useRef, useState } from "react";

const LANGS = { fr: "fr-FR", en: "en-US", ar: "ar-SA", es: "es-ES" };

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

export default function Presenter({ text, lang }) {
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
    <div className={`presenter ${talking ? "talking" : ""}`}>
      <svg viewBox="0 0 170 200" className="avatar" aria-hidden="true">
        <path d="M20 200 C20 150 50 135 80 135 C110 135 140 150 140 200 Z" fill="#7a5a40" />
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
        <circle cx="54" cy="102" r="6" fill="#e59a8a" opacity="0.4" />
        <circle cx="106" cy="102" r="6" fill="#e59a8a" opacity="0.4" />
        <ellipse className="mouth" cx="80" cy="108" rx="9" ry="3" fill="#7f1d1d" />
        <g className="arm">
          <path
            d="M126 152 C150 142 160 122 152 100"
            stroke="#7a5a40"
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
    </div>
  );
}