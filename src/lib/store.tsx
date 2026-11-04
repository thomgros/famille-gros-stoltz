// Étape 1 : réglages du foyer gardés sur l'appareil.
// À l'étape 2, ce module sera branché sur Supabase (même API pour les pages),
// et Thomas et Julia partageront les mêmes données en temps réel.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Household } from "./types";

const KEY = "fgs.household.v1";

export const DEFAULT_HOUSEHOLD: Household = {
  id: "local",
  name: "Famille Gros-Stoltz",
  dueDate: "2027-06-25",
  city: "Paris 18e",
};

function load(): Household {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_HOUSEHOLD, ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible (navigation privée) : on garde les valeurs par défaut */
  }
  return DEFAULT_HOUSEHOLD;
}

interface Ctx {
  household: Household;
  update: (patch: Partial<Household>) => void;
}

const HouseholdContext = createContext<Ctx | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useState<Household>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(household));
    } catch {
      /* ignoré */
    }
  }, [household]);

  return (
    <HouseholdContext.Provider value={{ household, update: (p) => setHousehold((h) => ({ ...h, ...p })) }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): Ctx {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold hors du HouseholdProvider");
  return ctx;
}
