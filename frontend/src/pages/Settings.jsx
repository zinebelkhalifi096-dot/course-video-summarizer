import { useState } from "react";

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "on" : ""}`}
      aria-pressed={on}
      onClick={() => onChange(!on)}
    />
  );
}

export default function Settings({ settings, onChange, onReset }) {
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [saved, setSaved] = useState(false);

  function save() {
    onChange({ name: name.trim() || "Zineb", email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function reset() {
    if (window.confirm("Supprimer tous les cours de la bibliothèque ?")) onReset();
  }

  return (
    <div>
      <h1 className="page-title">Settings ⚙️</h1>
      <p className="muted">Personnalisez votre expérience</p>

      <div className="settings-grid">
        <section className="card">
          <h3>Profile Information</h3>
          <p className="muted">Mettez à jour vos informations</p>
          <div className="profile-top">
            <div className="big-avatar">{(name || "?").charAt(0).toUpperCase()}</div>
          </div>
          <label className="field">
            Nom
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Email
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn-brown" onClick={save}>
            {saved ? "Enregistré ✓" : "Save Changes"}
          </button>
        </section>

        <section className="card">
          <h3>Learning Preferences</h3>
          <p className="muted">Personnalisez votre étude</p>

          <div className="pref">
            <span>Présentateur animé (onglet Summary)</span>
            <Toggle
              on={settings.presenter}
              onChange={(v) => onChange({ presenter: v })}
            />
          </div>
          <div className="pref">
            <span>Enregistrer l'historique du chat</span>
            <Toggle
              on={settings.saveHistory}
              onChange={(v) => onChange({ saveHistory: v })}
            />
          </div>
          <div className="pref">
            <span>Longueur des résumés</span>
            <select
              className="select"
              value={settings.summaryLength}
              onChange={(e) => onChange({ summaryLength: e.target.value })}
            >
              <option value="short">Court</option>
              <option value="medium">Moyen</option>
              <option value="detailed">Détaillé</option>
            </select>
          </div>
          <div className="pref">
            <span>Bibliothèque</span>
            <button className="pill" onClick={reset}>
              Réinitialiser
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}