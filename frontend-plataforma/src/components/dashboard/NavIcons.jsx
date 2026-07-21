/** Ícones SVG do menu lateral da plataforma (currentColor). */
function Svg({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="20"
      height="20"
      {...props}
    >
      {children}
    </svg>
  );
}

const ICONS = {
  inicio: (
    <Svg>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Svg>
  ),
  explorar: (
    <Svg>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  ),
  cursos: (
    <Svg>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
    </Svg>
  ),
  trilhas: (
    <Svg>
      <path d="M4 19c2-6 4-9 8-9s6 3 8 9" />
      <circle cx="12" cy="7" r="2.5" />
    </Svg>
  ),
  aovivo: (
    <Svg>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m10 9 5 3-5 3V9z" />
    </Svg>
  ),
  progresso: (
    <Svg>
      <path d="M4 19V5M4 19h16" />
      <path d="m8 14 3-4 3 2 4-6" />
    </Svg>
  ),
  certificados: (
    <Svg>
      <circle cx="12" cy="9" r="5" />
      <path d="M9.5 13.5 8 21l4-2 4 2-1.5-7.5" />
    </Svg>
  ),
  biblioteca: (
    <Svg>
      <path d="M4 4h5a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4z" />
      <path d="M20 4h-5a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h5V4z" />
    </Svg>
  ),
  comunicados: (
    <Svg>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a4 4 0 0 1 0 6M17.5 7a7 7 0 0 1 0 10" />
    </Svg>
  ),
  ajuda: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      <path d="M12 17h.01" />
    </Svg>
  ),
  menu: (
    <Svg>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  ),
  fechar: (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
};

export default function NavIcon({ name }) {
  return ICONS[name] || null;
}
