import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Accueil", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { to: "/grossesse", label: "Grossesse", icon: "M12 21c-4.4 0-8-3.4-8-8 0-4.8 4-9 8-9s8 4.2 8 9c0 4.6-3.6 8-8 8Zm-1-11.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" },
  { to: "/listes", label: "Listes", icon: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" },
  { to: "/comparatifs", label: "Comparatifs", icon: "M4 20V10M10 20V4M16 20v-7M21 20H3" },
  { to: "/chat", label: "Chat", icon: "M4 5h16v11H9l-5 4z" },
];

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 backdrop-blur-xl pb-safe" aria-label="Navigation principale">
      <ul className="mx-auto flex max-w-xl justify-around px-1 pt-1.5">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium ${isActive ? "text-accent" : "text-muted"}`
              }
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={t.icon} />
              </svg>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
