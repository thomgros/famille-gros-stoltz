import type { Comparison, Item, Product } from "./types";
import { useCollection } from "./useCollection";
import { euro } from "./lists";

export const useComparisons = () => useCollection<Comparison>("comparisons");

export const STATUS: { value: Comparison["status"]; label: string; color: string }[] = [
  { value: "a_decider", label: "À décider", color: "var(--k-achat)" },
  { value: "choisi", label: "Choisi", color: "var(--k-medical)" },
  { value: "achete", label: "Acheté", color: "var(--k-garde)" },
];
export const statusInfo = (s: Comparison["status"]) => STATUS.find((x) => x.value === s) ?? STATUS[0];

export const ROLES: { value: Product["role"]; label: string; title: string }[] = [
  { value: "reco", label: "Recommandé", title: "Recommandé" },
  { value: "alternative", label: "Alternative", title: "Alternatives" },
  { value: "autre", label: "Aussi comparé", title: "Aussi comparés" },
  { value: "ecarte", label: "Écarté", title: "Écartés" },
];

export function priceText(p: Product): string {
  const unit = p.priceUnit ? ` ${p.priceUnit}` : "";
  if (p.priceMin === undefined && p.priceMax === undefined) return p.priceLabel ?? "";
  const lo = p.priceMin ?? p.priceMax!;
  const hi = p.priceMax ?? p.priceMin!;
  return lo === hi ? `${euro(lo)}${unit}` : `${euro(lo)} – ${euro(hi)}${unit}`;
}

/** Identifiant de l'article créé dans les achats quand on choisit un produit. */
export const linkedItemId = (c: Comparison) => `cmp-${c.id}`;

/** Statut affiché : « Acheté » dès que l'article lié est coché dans les achats. */
export function effectiveStatus(c: Comparison, items: Item[]): Comparison["status"] {
  const linked = items.find((i) => i.id === linkedItemId(c));
  return linked?.purchased ? "achete" : c.status;
}

export function itemForChoice(c: Comparison, p: Product, existing?: Item): Item {
  const planned = p.priceUnit ? undefined : (p.priceMax ?? p.priceMin);
  return {
    healthyMaterial: false,
    purchased: false,
    ...existing,
    id: linkedItemId(c),
    name: `${c.title} : ${p.name}`,
    quantity: existing?.quantity ?? "1",
    priority: existing?.priority ?? c.itemPriority ?? "P1",
    category: existing?.category ?? c.itemCategory ?? "Grand équipement",
    plannedPrice: planned ?? existing?.plannedPrice,
    comparisonId: c.id,
    tip: [p.tag, c.buyWindow ? `À acheter : ${c.buyWindow}` : undefined].filter(Boolean).join(" · ") || undefined,
  };
}
