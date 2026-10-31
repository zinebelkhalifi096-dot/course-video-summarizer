export default function CapArt({ className = "" }) {
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden="true">
      <rect x="30" y="122" width="140" height="22" rx="4" fill="#b98a5e" />
      <rect x="40" y="102" width="120" height="20" rx="4" fill="#d9b48a" />
      <rect x="50" y="82" width="100" height="20" rx="4" fill="#a67c52" />
      <path d="M54 62 V88 C54 100 146 100 146 88 V62 L100 82 Z" fill="#4a3b31" />
      <polygon points="100,16 182,48 100,80 18,48" fill="#3b2f27" />
      <line x1="170" y1="52" x2="170" y2="88" stroke="#c9a27e" strokeWidth="3" />
      <circle cx="170" cy="92" r="5" fill="#c9a27e" />
    </svg>
  );
}