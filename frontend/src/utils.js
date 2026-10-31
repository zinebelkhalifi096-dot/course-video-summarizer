import { useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* stockage indisponible */
    }
  }, [key, value]);
  return [value, setValue];
}

export function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function fmtTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtDuration(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m || 1}min`;
}

export const fmtDate = (ts) => new Date(ts).toLocaleDateString("fr-FR");

export function section(summary, keywords) {
  const blocks = summary.split(/\n(?=\s*(?:\d+\.\s|#{1,3}\s))/);
  const found = blocks.find((b) => {
    const first = b.split("\n")[0].toLowerCase();
    return keywords.some((k) => first.includes(k));
  });
  if (!found) return null;
  const body = found.split("\n").slice(1).join("\n").trim();
  return body || null;
}

export function exportNotes(video) {
  const lines = video.segments.map((s) => `[${fmtTime(s.start)}] ${s.text}`);
  const md = `# ${video.title}\n\n## Résumé\n\n${video.summary}\n\n## Transcription\n\n${lines.join("\n")}\n`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${video.video_id}-notes.md`;
  a.click();
  URL.revokeObjectURL(url);
}