// Foyer et session.
// - Avec Supabase configuré : connexion par lien magique, foyer partagé, temps réel.
// - Sans Supabase (variables absentes) : mode local, réglages gardés sur l'appareil.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Household } from "./types";
import { runSeed } from "./seed";

const LOCAL_KEY = "fgs.household.v1";

export const DEFAULT_HOUSEHOLD: Household = {
  id: "local",
  name: "Famille Gros-Stoltz",
  dueDate: "2027-06-25",
  city: "Paris 18e",
};

export type MemberName = "thomas" | "julia";

export interface Membership {
  member: MemberName;
  inviteCode: string;
  members: MemberName[];
}

type State =
  | { phase: "loading" }
  | { phase: "signed_out" }
  | { phase: "no_household"; session: Session }
  | { phase: "ready"; household: Household; membership?: Membership; session?: Session };

interface Ctx {
  state: State;
  household: Household;
  membership?: Membership;
  update: (patch: Partial<Household>) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const HouseholdContext = createContext<Ctx | null>(null);

function loadLocal(): Household {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...DEFAULT_HOUSEHOLD, ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible */
  }
  return DEFAULT_HOUSEHOLD;
}

function saveLocal(h: Household) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(h));
  } catch {
    /* ignoré */
  }
}

interface HouseholdRow {
  id: string;
  name: string;
  due_date: string;
  city: string | null;
  invite_code: string;
  seed_version: number;
}

const fromRow = (r: HouseholdRow): Household => ({ id: r.id, name: r.name, dueDate: r.due_date, city: r.city ?? "" });

async function loadRemote(session: Session): Promise<State> {
  const sb = supabase!;
  const { data: mine, error } = await sb
    .from("household_members")
    .select("household_id, member")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!mine) return { phase: "no_household", session };

  const [{ data: h, error: e1 }, { data: all, error: e2 }] = await Promise.all([
    sb.from("households").select("*").eq("id", mine.household_id).single<HouseholdRow>(),
    sb.from("household_members").select("member").eq("household_id", mine.household_id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  await runSeed(h.id, h.seed_version);
  return {
    phase: "ready",
    session,
    household: fromRow(h),
    membership: {
      member: mine.member as MemberName,
      inviteCode: h.invite_code,
      members: (all ?? []).map((m) => m.member as MemberName),
    },
  };
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() =>
    supabase ? { phase: "loading" } : { phase: "ready", household: loadLocal() },
  );

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s) return setState({ phase: "signed_out" });
    try {
      setState(await loadRemote(s));
    } catch (e) {
      console.error(e);
      setState({ phase: "no_household", session: s });
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  // Temps réel : si l'autre parent change la date du terme, on la reçoit.
  const householdId = state.phase === "ready" ? state.household.id : undefined;
  useEffect(() => {
    if (!supabase || !householdId || householdId === "local") return;
    const ch = supabase
      .channel(`household-${householdId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "households", filter: `id=eq.${householdId}` }, (p) => {
        const row = p.new as HouseholdRow;
        setState((s) => (s.phase === "ready" ? { ...s, household: fromRow(row) } : s));
      })
      .subscribe();
    return () => {
      void supabase!.removeChannel(ch);
    };
  }, [householdId]);

  const update = useCallback(
    (patch: Partial<Household>) => {
      setState((s) => {
        if (s.phase !== "ready") return s;
        const next = { ...s.household, ...patch };
        if (!supabase) saveLocal(next);
        else
          void supabase
            .from("households")
            .update({ name: next.name, due_date: next.dueDate, city: next.city })
            .eq("id", next.id)
            .then(({ error }) => error && console.error(error));
        return { ...s, household: next };
      });
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const household = state.phase === "ready" ? state.household : DEFAULT_HOUSEHOLD;
  const membership = state.phase === "ready" ? state.membership : undefined;

  return (
    <HouseholdContext.Provider value={{ state, household, membership, update, refresh, signOut }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): Ctx {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold hors du HouseholdProvider");
  return ctx;
}
