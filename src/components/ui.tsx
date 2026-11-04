import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MilestoneKind } from "../lib/types";

export function Page({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-safe pb-28">
      <header className="flex items-end justify-between gap-3 pb-4 pt-2">
        <div className="min-w-0">
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        </div>
        {action}
      </header>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, to }: { children: ReactNode; to?: string }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {to && (
        <Link to={to} className="text-sm font-medium text-accent">
          Tout voir
        </Link>
      )}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  );
}

export const KIND_LABEL: Record<MilestoneKind, string> = {
  medical: "Médical",
  admin: "Démarche",
  achat: "Achat",
  vie: "Vie",
  garde: "Garde",
  voyage: "Voyage",
};

export function KindBadge({ kind }: { kind: MilestoneKind }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: `var(--k-${kind})`, background: `color-mix(in srgb, var(--k-${kind}) 14%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: `var(--k-${kind})` }} />
      {KIND_LABEL[kind]}
    </span>
  );
}

export function KindDot({ kind }: { kind: MilestoneKind }) {
  return <span className="block size-3 rounded-full ring-4 ring-surface" style={{ background: `var(--k-${kind})` }} />;
}

export function ComingSoon({ step, title, items }: { step: number; title: string; items: string[] }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-accent">Étape {step}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-[15px] text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>·</span>
            {i}
          </li>
        ))}
      </ul>
    </Card>
  );
}
