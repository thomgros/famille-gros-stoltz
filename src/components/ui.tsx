import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MilestoneKind } from "../lib/types";

export type Tone = "butter" | "lavender" | "mint" | "peach" | "sky" | "rose";

export function Page({
  title,
  subtitle,
  back,
  action,
  tone = "butter",
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { to: string; label: string };
  action?: ReactNode;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div className={`tone-${tone} relative isolate min-h-dvh`}>
      <div className="page-band absolute inset-x-0 top-0 -z-10 h-80" aria-hidden />
      <div className="mx-auto max-w-xl px-4 pt-safe pb-28">
        <header className="flex items-end justify-between gap-3 pb-4 pt-2">
          <div className="min-w-0">
            {back && (
              <Link to={back.to} className="-ml-1 inline-flex items-center gap-0.5 py-1 text-[15px] font-medium text-tone-strong">
                <span className="text-xl leading-none" aria-hidden>
                  ‹
                </span>
                {back.label}
              </Link>
            )}
            {subtitle && <p className="text-sm font-medium text-tone-strong">{subtitle}</p>}
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
          </div>
          {action}
        </header>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

/** tint : la carte prend une teinte pastel (celle de la page, ou celle du parent `tone-…`). */
export function Card({ children, className = "", tint = false }: { children: ReactNode; className?: string; tint?: boolean }) {
  return (
    <section className={`rounded-3xl border p-4 ${tint ? "border-tone-mid/40 bg-tone-soft/55" : "border-line bg-surface"} ${className}`}>{children}</section>
  );
}

export function SectionTitle({ children, to }: { children: ReactNode; to?: string }) {
  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-tone-strong">
        <span className="size-2 rounded-full bg-tone-mid" aria-hidden />
        {children}
      </h2>
      {to && (
        <Link to={to} className="text-sm font-medium text-tone-strong">
          Tout voir
        </Link>
      )}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-white/70"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-tone-mid transition-[width] duration-500" style={{ width: `${Math.max(2, value * 100)}%` }} />
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
    <Card tint>
      <p className="text-sm font-semibold text-tone-strong">Étape {step}</p>
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
