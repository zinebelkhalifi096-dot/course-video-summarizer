import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { analyzeVideo, getVideo, listVideos, removeVideo, setDone } from "./api";
import { extractVideoId, useLocalStorage } from "./utils";
import Icon from "./components/Icon";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Library from "./pages/Library";
import ChatPage from "./pages/ChatPage";
import Settings from "./pages/Settings";
import Course from "./pages/Course";

const DEMO_ID = "scfeshQ9Pvs";
const DEFAULTS = {
  name: "Zineb",
  email: "",
  summaryLength: "medium",
  presenter: true,
  saveHistory: true,
};

export default function App() {
  const [page, setPage] = useState("home");
  const pageRef = useRef(page);
  const [courseId, setCourseId] = useState(null);
  const [courseStart, setCourseStart] = useState(0);
  const [chatId, setChatId] = useState(null);
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [pending, setPending] = useState([]);
  const [stored, setStored] = useLocalStorage("sf_settings", DEFAULTS);
  const settings = { ...DEFAULTS, ...stored };
  const [cache, setCache] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [chats, setChats] = useState(() => {
    try {
      return settings.saveHistory
        ? JSON.parse(localStorage.getItem("sf_chats") || "{}")
        : {};
    } catch {
      return {};
    }
  });

  const library = [
    ...pending,
    ...videos.filter((v) => !pending.some((p) => p.id === v.id)),
  ];

  const refresh = useCallback(
    () =>
      listVideos()
        .then(setVideos)
        .catch((err) => setError(err.message)),
    []
  );

  useEffect(() => {
    localStorage.removeItem("sf_library");
    refresh();
  }, [refresh]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    try {
      if (settings.saveHistory) {
        localStorage.setItem("sf_chats", JSON.stringify(chats));
      } else {
        localStorage.removeItem("sf_chats");
      }
    } catch {
      /* stockage indisponible */
    }
  }, [chats, settings.saveHistory]);

  useEffect(() => {
    if (page !== "course" || !courseId || cache[courseId]) return;
    getVideo(courseId)
      .then((d) => setCache((c) => ({ ...c, [courseId]: d })))
      .catch((err) => setLoadError(err.message));
  }, [page, courseId, cache]);

  const updateSettings = (patch) =>
    setStored((s) => ({ ...DEFAULTS, ...s, ...patch }));

  const updateChat = (videoId, fn) =>
    setChats((prev) => ({ ...prev, [videoId]: fn(prev[videoId] || []) }));

  function openCourse(id, start = 0) {
    setLoadError("");
    setCourseId(id);
    setCourseStart(start);
    setPage("course");
  }

  function openChat(id) {
    setChatId(id);
    setPage("chat");
  }

  async function handleAnalyze(url) {
    setError("");
    const id = extractVideoId(url);
    if (!id) {
      setError("Lien YouTube invalide.");
      return;
    }
    if (videos.some((v) => v.id === id)) {
      openCourse(id);
      return;
    }
    setBusy(true);
    setPending((p) => [
      {
        id,
        title: "Analyse en cours...",
        duration: 0,
        addedAt: Date.now(),
        status: "processing",
        done: false,
      },
      ...p.filter((c) => c.id !== id),
    ]);
    try {
      const data = await analyzeVideo(url, settings.summaryLength);
      setCache((c) => ({ ...c, [id]: data }));
      setPending((p) => p.filter((c) => c.id !== id));
      await refresh();
      if (pageRef.current === "home") openCourse(id);
    } catch (err) {
      setPending((p) =>
        p.map((c) =>
          c.id === id ? { ...c, status: "error", error: err.message, title: url } : c
        )
      );
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDemo() {
    setError("");
    try {
      const data = await getVideo(DEMO_ID);
      setCache((c) => ({ ...c, [DEMO_ID]: data }));
      openCourse(DEMO_ID);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCourse(id) {
    setPending((p) => p.filter((c) => c.id !== id));
    if (videos.some((v) => v.id === id)) {
      try {
        await removeVideo(id);
        await refresh();
      } catch (err) {
        setError(err.message);
      }
    }
    setChats((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (courseId === id) setCourseId(null);
  }

  async function toggleDone(id) {
    const current = videos.find((v) => v.id === id);
    if (!current) return;
    const done = !current.done;
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, done } : v)));
    try {
      await setDone(id, done);
    } catch (err) {
      setError(err.message);
      refresh();
    }
  }

  async function resetLibrary() {
    try {
      await Promise.all(videos.map((v) => removeVideo(v.id)));
    } catch (err) {
      setError(err.message);
    }
    setPending([]);
    setChats({});
    setCache({});
    setCourseId(null);
    await refresh();
  }

  const course = library.find((c) => c.id === courseId);

  return (
    <div className="shell">
      <Sidebar page={page} onNavigate={setPage} name={settings.name} />
      <div className="main">
        <header className="topbar">
          <div className="search">
            <input
              placeholder="Rechercher dans mes cours..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage("library");
              }}
            />
          </div>
          <div className="top-actions">
            <span className="bell">
              <Icon name="bell" size={18} />
            </span>
            <span className="avatar-dot">
              {(settings.name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="content">
          {page === "home" && (
            <Home
              name={settings.name}
              library={library}
              busy={busy}
              error={error}
              onAnalyze={handleAnalyze}
              onDemo={handleDemo}
              onOpen={openCourse}
              onChat={openChat}
            />
          )}
          {page === "library" && (
            <Library
              library={library}
              query={query}
              onOpen={openCourse}
              onChat={openChat}
              onDelete={deleteCourse}
            />
          )}
          {page === "chat" && (
            <ChatPage
              library={library}
              chats={chats}
              updateChat={updateChat}
              selectedId={chatId}
              onSelect={setChatId}
              onSeek={openCourse}
            />
          )}
          {page === "settings" && (
            <Settings
              settings={settings}
              onChange={updateSettings}
              onReset={resetLibrary}
            />
          )}
          {page === "course" &&
            (course ? (
              <Course
                key={`${course.id}-${courseStart}`}
                course={course}
                video={cache[course.id]}
                error={loadError}
                initialStart={courseStart}
                presenter={settings.presenter}
                messages={chats[course.id] || []}
                update={(fn) => updateChat(course.id, fn)}
                onBack={() => setPage("library")}
                onToggleDone={toggleDone}
              />
            ) : (
              <p className="muted">Cours introuvable.</p>
            ))}
        </main>
      </div>
    </div>
  );
}