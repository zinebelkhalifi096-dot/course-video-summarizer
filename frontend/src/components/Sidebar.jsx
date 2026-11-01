import CapArt from "./CapArt";
import Icon from "./Icon";

const ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "library", label: "My Library", icon: "playcircle" },
  { id: "chat", label: "Chat Assistant", icon: "chat" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ page, onNavigate, name }) {
  const active = page === "course" ? "library" : page;
  return (
    <aside className="sidebar">
      <div className="logo-block">
        <div className="logo-icon">
          <Icon name="book" size={38} />
        </div>
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
            <span className="nav-icon">
              <Icon name={it.icon} size={20} />
            </span>
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