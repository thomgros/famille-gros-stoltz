// Données initiales (parties 3 à 7 du fichier projet), écrites une seule fois par foyer.
// Chaque version de seed n'ajoute que de nouvelles collections : ce que Thomas et Julia
// ont modifié ou supprimé n'est jamais écrasé.

import { supabase } from "./supabase";
import milestones from "../../seed/milestones.json";

interface SeedStep {
  version: number;
  collections: Record<string, { id: string }[]>;
}

export const SEED_STEPS: SeedStep[] = [{ version: 1, collections: { milestones } }];

export const LATEST_SEED = Math.max(...SEED_STEPS.map((s) => s.version));

export async function runSeed(householdId: string, currentVersion: number) {
  if (!supabase || currentVersion >= LATEST_SEED) return;
  for (const step of SEED_STEPS.filter((s) => s.version > currentVersion)) {
    const rows = Object.entries(step.collections).flatMap(([collection, docs]) =>
      docs.map((d) => ({ household_id: householdId, collection, id: d.id, data: d })),
    );
    // ignoreDuplicates : si l'autre parent a lancé le seed en même temps, pas de doublon.
    const { error } = await supabase.from("docs").upsert(rows, { onConflict: "household_id,collection,id", ignoreDuplicates: true });
    if (error) throw error;
    const { error: e2 } = await supabase.from("households").update({ seed_version: step.version }).eq("id", householdId);
    if (e2) throw e2;
  }
}

/** Données utilisées en mode local (sans Supabase). */
export const LOCAL_SEED: Record<string, { id: string }[]> = Object.assign({}, ...SEED_STEPS.map((s) => s.collections));
