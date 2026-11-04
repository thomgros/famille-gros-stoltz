// Une collection partagée (tâches, achats, jalons…), synchronisée en temps réel.
// Les écritures sont appliquées tout de suite à l'écran, puis envoyées à Supabase.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useHousehold } from "./store";
import { LOCAL_SEED } from "./seed";

interface DocRow<T> {
  household_id: string;
  collection: string;
  id: string;
  data: T;
}

const localKey = (c: string) => `fgs.col.${c}.v1`;

function readLocal<T extends { id: string }>(collection: string): T[] {
  try {
    const raw = localStorage.getItem(localKey(collection));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignoré */
  }
  return (LOCAL_SEED[collection] as T[] | undefined) ?? [];
}

function writeLocal<T>(collection: string, docs: T[]) {
  try {
    localStorage.setItem(localKey(collection), JSON.stringify(docs));
  } catch {
    /* ignoré */
  }
}

export function useCollection<T extends { id: string }>(collection: string) {
  const { household } = useHousehold();
  const remote = !!supabase && household.id !== "local";
  const [docs, setDocs] = useState<T[]>(() => (remote ? [] : readLocal<T>(collection)));
  const [loading, setLoading] = useState(remote);

  useEffect(() => {
    if (!remote) return;
    const sb = supabase!;
    let alive = true;
    setLoading(true);
    void sb
      .from("docs")
      .select("id, data")
      .eq("household_id", household.id)
      .eq("collection", collection)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.error(error);
        setDocs((data ?? []).map((r) => r.data as T));
        setLoading(false);
      });

    const ch = sb
      .channel(`docs-${household.id}-${collection}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: `household_id=eq.${household.id}` }, (p) => {
        if (p.eventType === "DELETE") {
          const old = p.old as Partial<DocRow<T>>;
          if (old.collection !== collection || old.household_id !== household.id) return;
          setDocs((d) => d.filter((x) => x.id !== old.id));
          return;
        }
        const row = p.new as DocRow<T>;
        if (row.collection !== collection) return;
        setDocs((d) => {
          const i = d.findIndex((x) => x.id === row.id);
          if (i === -1) return [...d, row.data];
          const next = d.slice();
          next[i] = row.data;
          return next;
        });
      })
      .subscribe();

    return () => {
      alive = false;
      void sb.removeChannel(ch);
    };
  }, [remote, household.id, collection]);

  const save = useCallback(
    (doc: T) => {
      setDocs((d) => {
        const i = d.findIndex((x) => x.id === doc.id);
        const next = i === -1 ? [...d, doc] : d.map((x) => (x.id === doc.id ? doc : x));
        if (!remote) writeLocal(collection, next);
        return next;
      });
      if (remote)
        void supabase!
          .from("docs")
          .upsert({ household_id: household.id, collection, id: doc.id, data: doc }, { onConflict: "household_id,collection,id" })
          .then(({ error }) => error && console.error(error));
    },
    [remote, household.id, collection],
  );

  const remove = useCallback(
    (id: string) => {
      setDocs((d) => {
        const next = d.filter((x) => x.id !== id);
        if (!remote) writeLocal(collection, next);
        return next;
      });
      if (remote)
        void supabase!
          .from("docs")
          .delete()
          .eq("household_id", household.id)
          .eq("collection", collection)
          .eq("id", id)
          .then(({ error }) => error && console.error(error));
    },
    [remote, household.id, collection],
  );

  return { docs, loading, save, remove };
}

export function newId(): string {
  return crypto.randomUUID();
}
