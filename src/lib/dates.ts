// Tout dérive d'une seule valeur : la date de terme donnée par la gynécologue.
// Convention française : terme = 41 SA = DDR théorique + 287 jours = conception + 273 jours.
// Exemple : terme le 3 juil. 2027 → DDR le 19 sept. 2026 → conception le 3 oct. 2026.

import type { Milestone, RelativeDate } from "./types";

const DAY = 86_400_000;

/** "2027-06-25" → Date locale à minuit (pas de décalage de fuseau). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

/** Nombre de jours entiers de b à a, insensible aux changements d'heure. */
export function diffDays(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ua - ub) / DAY);
}

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export const PREGNANCY_DAYS = 287; // 41 SA

export function ddrFromDueDate(dueDate: string): Date {
  return addDays(parseISO(dueDate), -PREGNANCY_DAYS);
}

export interface PregnancyStatus {
  ddr: Date;
  due: Date;
  due40: Date; // DDR + 40 SA, convention internationale
  conception: Date;
  daysSinceDdr: number;
  sa: number; // semaines d'aménorrhée révolues
  saDays: number; // jours en plus
  sg: number; // semaines de grossesse révolues (SA − 2)
  trimester: 1 | 2 | 3;
  daysLeft: number;
  progress: number; // 0 → 1
  born: boolean; // terme dépassé
  month: number; // mois de grossesse en cours (1-9)
}

export function pregnancyStatus(dueDate: string, on: Date = today()): PregnancyStatus {
  const ddr = ddrFromDueDate(dueDate);
  const due = parseISO(dueDate);
  const daysSinceDdr = diffDays(on, ddr);
  const sa = Math.floor(daysSinceDdr / 7);
  const saDays = ((daysSinceDdr % 7) + 7) % 7;
  // Découpage français : T1 jusqu'à 15 SA + 6 j, T2 jusqu'à 28 SA + 6 j, T3 ensuite.
  const trimester: 1 | 2 | 3 = sa < 16 ? 1 : sa < 29 ? 2 : 3;
  // Mois de grossesse comptés depuis la fécondation (DDR + 14 j).
  const daysSinceConception = daysSinceDdr - 14;
  const month = Math.min(9, Math.max(1, Math.floor(daysSinceConception / 30.4) + 1));
  return {
    ddr,
    due,
    due40: addDays(ddr, 280),
    conception: addDays(ddr, 14),
    daysSinceDdr,
    sa,
    saDays,
    sg: Math.max(0, sa - 2),
    trimester,
    daysLeft: diffDays(due, on),
    progress: Math.min(1, Math.max(0, daysSinceDdr / PREGNANCY_DAYS)),
    born: daysSinceDdr >= PREGNANCY_DAYS,
    month,
  };
}

/** SA (révolues) à une date donnée. */
export function saAt(dueDate: string, d: Date): number {
  return Math.floor(diffDays(d, ddrFromDueDate(dueDate)) / 7);
}

export function resolveRelative(rel: RelativeDate, dueDate: string): Date {
  const base = rel.milestone === "dueDate" ? parseISO(dueDate) : ddrFromDueDate(dueDate);
  return addDays(base, rel.offsetDays);
}

export function milestoneStart(m: Milestone, dueDate: string): Date | undefined {
  if (m.relativeTo) return resolveRelative(m.relativeTo, dueDate);
  return m.date ? parseISO(m.date) : undefined;
}

export function milestoneEnd(m: Milestone, dueDate: string): Date | undefined {
  if (m.endRelativeTo) return resolveRelative(m.endRelativeTo, dueDate);
  return m.endDate ? parseISO(m.endDate) : milestoneStart(m, dueDate);
}

// ---- Formatage en français ----

const fmtDay = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const fmtDayYear = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const fmtLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmtMonth = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export const formatDay = (d: Date) => fmtDay.format(d);
export const formatDayYear = (d: Date) => fmtDayYear.format(d);
export const formatLong = (d: Date) => fmtLong.format(d);
export const formatMonth = (d: Date) => {
  const s = fmtMonth.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function formatRange(start: Date, end?: Date): string {
  if (!end || diffDays(end, start) === 0) return formatDayYear(start);
  if (start.getFullYear() === end.getFullYear()) return `${formatDay(start)} → ${formatDayYear(end)}`;
  return `${formatDayYear(start)} → ${formatDayYear(end)}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${Math.abs(n) > 1 ? many : one}`;
}
