import type { Item, Member, Priority, Task } from "./types";
import { useCollection } from "./useCollection";
import { addDays, diffDays, parseISO, resolveRelative } from "./dates";

export const useTasks = () => useCollection<Task>("tasks");
export const useItems = () => useCollection<Item>("items");

export const TASK_CATEGORIES: { value: Task["category"]; label: string }[] = [
  { value: "admin", label: "Démarches" },
  { value: "garde", label: "Garde" },
  { value: "sante", label: "Santé" },
  { value: "achats", label: "Achats" },
  { value: "maison", label: "Maison" },
  { value: "naissance", label: "Naissance" },
  { value: "voyage", label: "Voyage" },
];
/** Couleur (variable CSS) de chaque catégorie de tâche. */
export const TASK_CATEGORY_COLOR: Record<Task["category"], string> = {
  admin: "var(--k-admin)",
  garde: "var(--k-garde)",
  sante: "var(--k-medical)",
  achats: "var(--k-achat)",
  maison: "var(--k-maison)",
  naissance: "var(--k-naissance)",
  voyage: "var(--k-voyage)",
};

/** Emoji et couleur de chaque catégorie d'achat. */
export const ITEM_CATEGORY_STYLE: Record<string, { emoji: string; color: string }> = {
  Sommeil: { emoji: "🌙", color: "var(--k-admin)" },
  Change: { emoji: "🧷", color: "var(--k-medical)" },
  "Toilette et santé": { emoji: "🛁", color: "var(--k-garde)" },
  Repas: { emoji: "🍼", color: "var(--k-achat)" },
  Vêtements: { emoji: "👕", color: "var(--k-naissance)" },
  "Sorties et transports": { emoji: "👶", color: "var(--k-voyage)" },
  Éveil: { emoji: "🧸", color: "var(--k-maison)" },
  "Sécurité de l'appartement": { emoji: "🔒", color: "var(--k-medical)" },
  "Grand équipement": { emoji: "🛏️", color: "var(--k-admin)" },
  Autre: { emoji: "✨", color: "var(--k-maison)" },
};
export const itemCategoryStyle = (c: string) => ITEM_CATEGORY_STYLE[c] ?? ITEM_CATEGORY_STYLE.Autre;

export const taskCategoryLabel = (c: Task["category"]) => TASK_CATEGORIES.find((x) => x.value === c)?.label ?? c;

export const PRIORITIES: { value: Priority; label: string; short: string }[] = [
  { value: "P0", label: "Prioritaire (date fixe)", short: "Prioritaire" },
  { value: "P1", label: "Avant la naissance", short: "Important" },
  { value: "P2", label: "Plus tard", short: "Plus tard" },
  { value: "P3", label: "Optionnel", short: "Optionnel" },
];

export const MEMBERS: { value: Member; label: string }[] = [
  { value: "both", label: "Les deux" },
  { value: "julia", label: "Julia" },
  { value: "thomas", label: "Thomas" },
];
export const memberLabel = (m?: Member) => MEMBERS.find((x) => x.value === m)?.label ?? "";

export const ITEM_PRIORITIES: { value: Item["priority"]; label: string }[] = [
  { value: "P1", label: "Naissance" },
  { value: "P2", label: "Plus tard" },
  { value: "P3", label: "Optionnel" },
];

export const ITEM_CATEGORIES = [
  "Sommeil",
  "Change",
  "Toilette et santé",
  "Repas",
  "Vêtements",
  "Sorties et transports",
  "Éveil",
  "Sécurité de l'appartement",
  "Grand équipement",
  "Autre",
];

/** Échéance effective d'une tâche (date fixe ou recalculée depuis le terme). */
export function taskDue(t: Task, dueDate: string): Date | undefined {
  if (t.relativeTo) return resolveRelative(t.relativeTo, dueDate);
  return t.dueDate ? parseISO(t.dueDate) : undefined;
}

export type TaskFilter = "all" | "late" | "week" | "month" | "mine";

export function matchesFilter(t: Task, f: TaskFilter, due: Date | undefined, now: Date, me?: Member): boolean {
  if (f === "all") return true;
  if (f === "mine") return t.owner === me || t.owner === "both";
  if (!due) return false;
  const d = diffDays(due, now);
  if (f === "late") return d < 0;
  if (f === "week") return d >= 0 && due <= addDays(now, 6 - ((now.getDay() + 6) % 7));
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && d >= 0;
}

export const euro = (n?: number) =>
  n === undefined ? "" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 });

export function parseEuro(s: string): number | undefined {
  const n = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}
