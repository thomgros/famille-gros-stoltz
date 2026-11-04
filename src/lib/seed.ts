// Données initiales (parties 3 à 7 du fichier projet), écrites une seule fois par foyer.
// Chaque version de seed est appliquée une seule fois. Elle peut ajouter des collections
// (sans écraser ce que Thomas et Julia ont modifié), en corriger quelques éléments précis,
// ou en retirer.

import { supabase } from "./supabase";
import milestones from "../../seed/milestones.json";

type Doc = { id: string };

interface SeedStep {
  version: number;
  /** Nouveaux éléments : ajoutés seulement s'ils n'existent pas déjà. */
  collections?: Record<string, Doc[]>;
  /** Corrections : remplacent la version existante de ces éléments précis. */
  overwrite?: Record<string, Doc[]>;
  /** Éléments à retirer des foyers déjà créés. */
  removals?: Record<string, string[]>;
  /** Change la date du terme si elle vaut encore l'ancienne valeur par défaut. */
  dueDate?: { from: string; to: string };
}

const byId = (ids: string[]) => (milestones as Doc[]).filter((m) => ids.includes(m.id));

export const SEED_STEPS: SeedStep[] = [
  { version: 1, collections: { milestones } },
  { version: 2, removals: { milestones: ["voyage-usa"] } },
  // Terme donné par la gynécologue : 3 juil. 2027 (41 SA). Échographies calculées depuis la DDR.
  { version: 3, dueDate: { from: "2027-06-25", to: "2027-07-03" }, overwrite: { milestones: byId(["echo-1", "echo-2", "echo-3"]) } },
];

export const LATEST_SEED = Math.max(...SEED_STEPS.map((s) => s.version));

const toRows = (householdId: string, cols: Record<string, Doc[]> = {}) =>
  Object.entries(cols).flatMap(([collection, docs]) => docs.map((d) => ({ household_id: householdId, collection, id: d.id, data: d })));

export async function runSeed(householdId: string, currentVersion: number) {
  if (!supabase || currentVersion >= LATEST_SEED) return;
  const sb = supabase;
  for (const step of SEED_STEPS.filter((s) => s.version > currentVersion)) {
    const added = toRows(householdId, step.collections);
    // ignoreDuplicates : si l'autre parent a lancé le seed en même temps, pas de doublon.
    if (added.length) {
      const { error } = await sb.from("docs").upsert(added, { onConflict: "household_id,collection,id", ignoreDuplicates: true });
      if (error) throw error;
    }
    const fixed = toRows(householdId, step.overwrite);
    if (fixed.length) {
      const { error } = await sb.from("docs").upsert(fixed, { onConflict: "household_id,collection,id" });
      if (error) throw error;
    }
    for (const [collection, ids] of Object.entries(step.removals ?? {})) {
      const { error } = await sb.from("docs").delete().eq("household_id", householdId).eq("collection", collection).in("id", ids);
      if (error) throw error;
    }
    if (step.dueDate) {
      const { error } = await sb.from("households").update({ due_date: step.dueDate.to }).eq("id", householdId).eq("due_date", step.dueDate.from);
      if (error) throw error;
    }
    const { error } = await sb.from("households").update({ seed_version: step.version }).eq("id", householdId);
    if (error) throw error;
  }
}

/** Données de départ en mode local (sans Supabase) : le seed final, déjà à jour. */
export const LOCAL_SEED: Record<string, Doc[]> = { milestones };
