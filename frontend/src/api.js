const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifie que le backend tourne.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Une erreur est survenue"
    );
  }
  return data;
}

const post = (path, body) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const analyzeVideo = (url, summary_length) =>
  post("/videos", { url, summary_length });
export const getVideo = (id) => request(`/videos/${id}`);
export const askChat = (video_id, question) =>
  post("/chat", { video_id, question });