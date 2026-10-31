import CapArt from "./CapArt";

const ITEMS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "library", label: "My Library", icon: "▶" },
  { id: "chat", label: "Chat Assistant", icon: "💬" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ page, onNavigate, name }) {
  const active = page === "course" ? "library" : page;
  return (
    <aside className="sidebar">
      <div className="logo-block">
        <div className="logo-icon">📖</div>
        <div className="logo-name">StudyFlow</div>
        <div className="logo-sub">Your personal learning space</div>
      </div>
      <nav>
        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${active === it.id ? "on" : ""}`}
            onClick={() => onNavigate(it.id)}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="quote">
        <CapArt />
        <p>"Learn smarter, not harder."</p>
      </div>
      <div className="user-chip">
        <span className="avatar-dot">{(name || "?").charAt(0).toUpperCase()}</span>
        <span className="nav-label">{name}</span>
      </div>
    </aside>
  );
}