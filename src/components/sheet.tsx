// Briques communes des feuilles de saisie, façon réglages iOS :
// barre Annuler / titre / OK, groupes arrondis, lignes libellé + valeur, interrupteur.

import { useEffect, type ReactNode } from "react";

export const field = "block w-full bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-muted";
export const pill = "min-w-0 max-w-[10.5rem] rounded-lg bg-surface-2 px-2 py-1.5 text-[16px] tabular";
export const select = "min-w-0 bg-transparent text-right text-[17px] text-muted outline-none";

export function Sheet({
  title,
  onCancel,
  onDone,
  doneLabel = "OK",
  canDone = true,
  children,
}: {
  title: string;
  onCancel: () => void;
  onDone: () => void;
  doneLabel?: string;
  canDone?: boolean;
  children: ReactNode;
}) {
  // Bloque le défilement de la page derrière la feuille.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/30" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[14px] bg-bg pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
          <button type="button" onClick={onCancel} className="text-[17px] text-tone-strong">
            Annuler
          </button>
          <p className="truncate text-[17px] font-semibold">{title}</p>
          <button type="button" onClick={onDone} disabled={!canDone} className="text-[17px] font-semibold text-tone-strong disabled:opacity-35">
            {doneLabel}
          </button>
        </div>
        <div className="space-y-6 overflow-y-auto px-4 pb-6 pt-3">{children}</div>
      </div>
    </div>
  );
}

export function Group({ children, footer }: { children: ReactNode; footer?: string }) {
  return (
    <div>
      <div className="divide-y divide-line overflow-hidden rounded-[12px] bg-surface">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-[13px] text-muted">{footer}</p>}
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
      <span className="shrink-0 text-[17px]">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${checked ? "bg-success" : "bg-surface-2 ring-1 ring-line"}`}
    >
      <span className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-[left] ${checked ? "left-[22px]" : "left-[2px]"}`} />
    </button>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={select}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DeleteButton({ label, confirming, onAsk, onCancel, onConfirm }: { label: string; confirming: boolean; onAsk: () => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Group>
      {confirming ? (
        <div className="flex">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-[17px] text-tone-strong">
            Garder
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 py-3 text-[17px] font-semibold text-danger">
            Supprimer
          </button>
        </div>
      ) : (
        <button type="button" onClick={onAsk} className="w-full py-3 text-[17px] text-danger">
          {label}
        </button>
      )}
    </Group>
  );
}

/** Rond à cocher façon app Rappels. */
export function CheckCircle({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="grid size-11 shrink-0 place-items-center"
    >
      <span
        className={`grid size-[24px] place-items-center rounded-full border-2 transition-colors ${
          checked ? "border-tone-mid bg-tone-mid text-ink" : "border-muted/50"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
        )}
      </span>
    </button>
  );
}

/** Puce de filtre horizontale. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[14px] font-medium ${active ? "border-tone-mid bg-tone-mid text-ink" : "border-line bg-surface text-ink"}`}
    >
      {children}
    </button>
  );
}

/** Contrôle segmenté façon iOS. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="grid gap-0.5 rounded-[12px] bg-white/55 p-1 text-[14px] font-medium ring-1 ring-tone-mid/40" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist">
      {options.map((v) => (
        <button
          key={v.value}
          type="button"
          role="tab"
          aria-selected={value === v.value}
          onClick={() => onChange(v.value)}
          className={`rounded-[9px] py-1.5 ${value === v.value ? "bg-tone-mid font-semibold text-ink shadow-sm" : "text-muted"}`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
