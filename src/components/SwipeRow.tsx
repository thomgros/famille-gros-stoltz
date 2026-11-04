// Ligne qui se glisse vers la gauche pour supprimer, comme dans Mail ou Rappels sur iPhone.
// - Petit glissement : le bouton rouge « Supprimer » apparaît, on le touche pour confirmer.
// - Grand glissement : suppression directe.
// - Toucher la ligne quand le bouton est visible : la ligne se referme.

import { useRef, useState, type ReactNode } from "react";

const REVEAL = 96; // largeur du bouton
const FULL = 0.55; // au-delà de 55 % de la largeur, on supprime directement

export function SwipeRow({ onDelete, children, label = "Supprimer" }: { onDelete: () => void; children: ReactNode; label?: string }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; dx: number; axis: "h" | "v" | null } | null>(null);
  const moved = useRef(false);

  function remove() {
    setLeaving(true);
    setDx(-(ref.current?.offsetWidth ?? 400));
    window.setTimeout(onDelete, 180);
  }

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ background: "inherit" }}>
      <button
        type="button"
        onClick={remove}
        tabIndex={dx < 0 ? 0 : -1}
        aria-hidden={dx >= 0}
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-danger pr-5 text-[15px] font-semibold text-white"
        style={{ width: Math.max(REVEAL, -dx) }}
      >
        {label}
      </button>
      <div
        className="relative touch-pan-y select-none"
        style={{
          background: "inherit",
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 180ms ease-out",
          opacity: leaving ? 0.4 : 1,
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY, dx, axis: null };
          moved.current = false;
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const ddx = e.clientX - s.x;
          const ddy = e.clientY - s.y;
          if (!s.axis && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) {
            s.axis = Math.abs(ddx) > Math.abs(ddy) ? "h" : "v";
            if (s.axis === "h") {
              setDragging(true);
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }
          }
          if (s.axis === "h") {
            moved.current = true;
            setDx(Math.min(0, s.dx + ddx));
          }
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          setDragging(false);
          if (!s || s.axis !== "h") return;
          const width = ref.current?.offsetWidth ?? 400;
          if (-dx > width * FULL) remove();
          else setDx(-dx > REVEAL / 2 ? -REVEAL : 0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDx(0);
        }}
        // Après un glissement, ou si le bouton est visible, un toucher referme la ligne au lieu d'ouvrir la fiche.
        onClickCapture={(e) => {
          if (moved.current) {
            // Clic émis à la fin du glissement : on l'ignore, la ligne reste ouverte.
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
          } else if (dx !== 0) {
            // Ligne ouverte : un toucher la referme.
            e.stopPropagation();
            e.preventDefault();
            setDx(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Bandeau « Supprimé · Annuler » affiché quelques secondes au-dessus de la barre d'onglets. */
export function UndoToast({ text, onUndo, onClose }: { text: string; onUndo: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-[92px] z-30 flex justify-center px-4" role="status">
      <div className="flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-[15px] text-bg shadow-lg">
        <span className="min-w-0 flex-1 truncate">{text}</span>
        <button
          type="button"
          onClick={() => {
            onUndo();
            onClose();
          }}
          className="shrink-0 font-semibold text-tone-mid"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
