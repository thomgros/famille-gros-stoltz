import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SwipeRow, UndoToast } from "../components/SwipeRow";
import { useSearchParams } from "react-router-dom";
import { Card, Page, ProgressBar } from "../components/ui";
import { CheckCircle, Chip, Segmented } from "../components/sheet";
import { TacheSheet } from "../components/TacheSheet";
import { ArticleSheet } from "../components/ArticleSheet";
import { diffDays, formatDay, formatDayYear, formatMonth, toISO, today } from "../lib/dates";
import { euro, itemCategoryStyle, TASK_CATEGORY_COLOR, ITEM_CATEGORIES, ITEM_PRIORITIES, matchesFilter, memberLabel, TASK_CATEGORIES, taskCategoryLabel, taskDue, useItems, useTasks, type TaskFilter } from "../lib/lists";
import { useHousehold } from "../lib/store";
import { newId } from "../lib/useCollection";
import type { Item, Task } from "../lib/types";

type View = "todo" | "achats";

export function Listes() {
  const [params, setParams] = useSearchParams();
  const view = (params.get("vue") as View | null) ?? "todo";
  return (
    <Page title="Listes" tone={view === "todo" ? "mint" : "peach"} subtitle={view === "todo" ? "À faire ensemble" : "Pour l'arrivée de bébé et après"}>
      <Segmented
        value={view}
        onChange={(v) => setParams(v === "todo" ? {} : { vue: v }, { replace: true })}
        options={[
          { value: "todo", label: "To-do" },
          { value: "achats", label: "Achats" },
        ]}
      />
      {view === "todo" ? <Todo /> : <Achats />}
    </Page>
  );
}

// ---------------------------------------------------------------- Annuler une suppression

function useUndo() {
  const [undo, setUndo] = useState<{ text: string; restore: () => void } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), 5000);
    return () => window.clearTimeout(t);
  }, [undo]);
  const toast = undo ? <UndoToast text={undo.text} onUndo={undo.restore} onClose={() => setUndo(null)} /> : null;
  return { setUndo, toast };
}

const short = (s: string) => (s.length > 32 ? s.slice(0, 30) + "…" : s);

/** Bouton discret en bas d'un groupe pour y ajouter un élément. */
function AddHere({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 px-4 py-3 text-left text-[15px] font-medium text-tone-strong">
      <span className="text-xl leading-none" aria-hidden>
        +
      </span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------- To-do

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "late", label: "En retard" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "mine", label: "Pour moi" },
];

function Todo() {
  const { household, membership } = useHousehold();
  const me = membership?.member;
  const { docs: tasks, save, remove, loading } = useTasks();
  const now = today();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [category, setCategory] = useState<Task["category"] | "all">("all");
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Task | { defaults: { date?: string; category?: Task["category"] } } | null>(null);
  const [quick, setQuick] = useState("");
  const { setUndo, toast } = useUndo();

  function deleteTask(t: Task) {
    remove(t.id);
    setUndo({ text: `« ${short(t.title)} » supprimée`, restore: () => save(t) });
  }

  /** Date proposée pour une tâche ajoutée dans un mois : aujourd'hui pour le mois en cours, sinon le 1er du mois. */
  function dateForMonth(d: Date) {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return toISO(first < now ? now : first);
  }

  const withDue = useMemo(
    () => tasks.map((t) => ({ t, due: taskDue(t, household.dueDate) })).sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity) || a.t.priority.localeCompare(b.t.priority)),
    [tasks, household.dueDate],
  );
  const open = withDue.filter(({ t }) => t.status !== "done");
  const doneCount = tasks.length - open.length;
  const lateCount = open.filter(({ t, due }) => matchesFilter(t, "late", due, now)).length;

  const visible = withDue.filter(
    ({ t, due }) => (showDone || t.status !== "done") && (category === "all" || t.category === category) && matchesFilter(t, filter, due, now, me),
  );

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; month?: Date; rows: typeof visible }>();
    for (const r of visible) {
      const key = r.due ? `${r.due.getFullYear()}-${String(r.due.getMonth()).padStart(2, "0")}` : "z";
      const label = r.due ? formatMonth(r.due) : "Sans date";
      if (!map.has(key)) map.set(key, { label, month: r.due, rows: [] });
      map.get(key)!.rows.push(r);
    }
    return [...map.values()];
  }, [visible]);

  function toggle(t: Task) {
    const done = t.status !== "done";
    save({ ...t, status: done ? "done" : "todo", doneBy: done ? me : undefined, doneAt: done ? new Date().toISOString() : undefined });
  }

  function addQuick(e: FormEvent) {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    save({ id: newId(), title, category: category === "all" ? "maison" : category, priority: "P1", owner: "both", status: "todo" });
    setQuick("");
  }

  return (
    <>
      <form onSubmit={addQuick} className="flex items-center gap-2 rounded-2xl border border-tone-mid/50 bg-white/75 px-3">
        <span className="text-2xl font-light text-tone-strong" aria-hidden>
          +
        </span>
        <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Ajouter une tâche" className="min-w-0 flex-1 bg-transparent py-3 text-[17px] outline-none placeholder:text-muted" enterKeyHint="done" />
        <button type="button" onClick={() => setEditing({ defaults: { category: category === "all" ? undefined : category } })} className="text-sm font-medium text-tone-strong">
          Détails
        </button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
            {f.value === "late" && lateCount > 0 ? ` · ${lateCount}` : ""}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 -mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          Toutes catégories
        </Chip>
        {TASK_CATEGORIES.filter((c) => tasks.some((t) => t.category === c.value)).map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <p className="px-1 text-sm text-muted">
        {open.length} à faire · {doneCount} faite{doneCount > 1 ? "s" : ""}
        {doneCount > 0 && (
          <button type="button" onClick={() => setShowDone((v) => !v)} className="ml-2 font-medium text-tone-strong">
            {showDone ? "Masquer les faites" : "Afficher les faites"}
          </button>
        )}
      </p>

      {!loading && visible.length === 0 && <Card className="text-center text-[15px] text-muted">Rien ici. Bravo, ou changez de filtre.</Card>}

      {groups.map((g) => (
        <div key={g.label}>
          <h2 className="flex items-center gap-2 px-1 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-tone-strong">
            <span className="size-2 rounded-full bg-tone-mid" aria-hidden />
            {g.label}
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-tone-mid/40 bg-surface">
            {g.rows.map(({ t, due }) => {
              const done = t.status === "done";
              const late = !done && due && diffDays(due, now) < 0;
              return (
                <SwipeRow key={t.id} onDelete={() => deleteTask(t)}>
                <div role="button" tabIndex={0} onClick={() => setEditing(t)} onKeyDown={(e) => e.key === "Enter" && setEditing(t)} className="relative flex cursor-pointer items-start gap-1 py-1.5 pl-2.5 pr-4">
                  <span className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full" style={{ background: TASK_CATEGORY_COLOR[t.category], opacity: done ? 0.35 : 1 }} aria-hidden />
                  <CheckCircle checked={done} onToggle={() => toggle(t)} label={done ? `Marquer « ${t.title} » à faire` : `Marquer « ${t.title} » comme faite`} />
                  <div className="min-w-0 flex-1 py-2">
                    <p className={`leading-snug ${done ? "text-muted line-through" : ""}`}>{t.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                      {due && <span className={late ? "font-semibold text-danger" : ""}>{late ? "En retard · " : ""}{t.relativeTo && t.dueLabel ? t.dueLabel : formatDayYear(due)}</span>}
                      <span>{memberLabel(t.owner)}</span>
                      <span className="font-medium" style={{ color: TASK_CATEGORY_COLOR[t.category] }}>{taskCategoryLabel(t.category)}</span>
                      {t.priority === "P0" && !done && <span className="rounded-full bg-tone-soft px-1.5 font-semibold text-tone-strong">Prioritaire</span>}
                      {done && t.doneBy && <span>fait par {memberLabel(t.doneBy)}</span>}
                    </p>
                  </div>
                </div>
                </SwipeRow>
              );
            })}
            <AddHere
              label={g.month ? `Ajouter en ${g.label.toLowerCase()}` : "Ajouter sans date"}
              onClick={() => setEditing({ defaults: { date: g.month ? dateForMonth(g.month) : undefined, category: category === "all" ? undefined : category } })}
            />
          </div>
        </div>
      ))}

      {editing && (
        <TacheSheet
          initial={"defaults" in editing ? undefined : editing}
          defaults={"defaults" in editing ? editing.defaults : undefined}
          dueDate={household.dueDate}
          me={me}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            save(t);
            setEditing(null);
          }}
          onDelete={(id) => {
            const t = tasks.find((x) => x.id === id);
            if (t) deleteTask(t);
            setEditing(null);
          }}
        />
      )}
      <p className="px-1 text-center text-[12px] text-muted">Glissez une tâche vers la gauche pour la supprimer.</p>
      {toast}
    </>
  );
}

// ---------------------------------------------------------------- Achats

function Achats() {
  const { membership } = useHousehold();
  const me = membership?.member;
  const { docs: items, save, remove } = useItems();
  const [priority, setPriority] = useState<Item["priority"] | "all">("P1");
  const [hideBought, setHideBought] = useState(false);
  const [editing, setEditing] = useState<Item | { defaults: { category?: string; priority?: Item["priority"] } } | null>(null);
  const { setUndo, toast } = useUndo();

  function deleteItem(i: Item) {
    remove(i.id);
    setUndo({ text: `« ${short(i.name)} » supprimé`, restore: () => save(i) });
  }

  const scope = items.filter((i) => priority === "all" || i.priority === priority);
  const bought = scope.filter((i) => i.purchased).length;
  const planned = scope.reduce((s, i) => s + (i.plannedPrice ?? 0), 0);
  const paid = scope.reduce((s, i) => s + (i.purchased ? (i.paidPrice ?? 0) : 0), 0);

  const groups = useMemo(() => {
    const order = (c: string) => {
      const i = ITEM_CATEGORIES.indexOf(c);
      return i === -1 ? 99 : i;
    };
    const map = new Map<string, Item[]>();
    for (const i of scope) {
      if (hideBought && i.purchased) continue;
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return [...map.entries()]
      .sort(([a], [b]) => order(a) - order(b))
      .map(([cat, list]) => [cat, [...list].sort((a, b) => Number(a.purchased) - Number(b.purchased))] as const);
  }, [scope, hideBought]);

  const count = (p: Item["priority"]) => items.filter((i) => i.priority === p && !i.purchased).length;

  return (
    <>
      <Card className="border-transparent bg-tone-hero">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold tabular">
            {bought} / {scope.length} acheté{bought > 1 ? "s" : ""}
          </p>
          <button type="button" onClick={() => setEditing({ defaults: { priority: priority === "all" ? undefined : priority } })} className="rounded-full bg-white/70 px-3 py-1 text-[15px] font-medium text-tone-strong">
            + Ajouter
          </button>
        </div>
        <div className="mt-3">
          <ProgressBar value={scope.length ? bought / scope.length : 0} label="Articles achetés" />
        </div>
        {(planned > 0 || paid > 0) && (
          <p className="mt-2 text-sm text-muted tabular">
            Prévu {euro(planned)} · payé {euro(paid)}
          </p>
        )}
      </Card>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ITEM_PRIORITIES.map((p) => (
          <Chip key={p.value} active={priority === p.value} onClick={() => setPriority(p.value)}>
            {p.label} · {count(p.value)}
          </Chip>
        ))}
        <Chip active={priority === "all"} onClick={() => setPriority("all")}>
          Tout
        </Chip>
        <Chip active={hideBought} onClick={() => setHideBought((v) => !v)}>
          {hideBought ? "Afficher achetés" : "Masquer achetés"}
        </Chip>
      </div>

      {groups.map(([cat, list]) => {
        const st = itemCategoryStyle(cat);
        return (
        <div key={cat}>
          <h2 className="flex items-center gap-2 px-1 pb-1.5 text-[13px] font-semibold uppercase tracking-wide" style={{ color: st.color }}>
            <span className="grid size-7 place-items-center rounded-full text-[15px]" style={{ background: `color-mix(in srgb, ${st.color} 16%, transparent)` }} aria-hidden>
              {st.emoji}
            </span>
            {cat}
            <span className="font-medium normal-case text-muted">· {list.filter((i) => i.purchased).length}/{list.length}</span>
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-3xl border" style={{ borderColor: `color-mix(in srgb, ${st.color} 25%, transparent)`, background: `color-mix(in srgb, ${st.color} 5%, var(--surface))` }}>
            {list.map((i) => (
              <SwipeRow key={i.id} onDelete={() => deleteItem(i)}>
              <div role="button" tabIndex={0} onClick={() => setEditing(i)} onKeyDown={(e) => e.key === "Enter" && setEditing(i)} className="flex cursor-pointer items-start gap-1 py-1.5 pl-1.5 pr-4">
                <CheckCircle
                  checked={i.purchased}
                  onToggle={() =>
                    save({ ...i, purchased: !i.purchased, purchasedBy: !i.purchased ? me : undefined, purchasedAt: !i.purchased ? new Date().toISOString() : undefined })
                  }
                  label={i.purchased ? `Marquer « ${i.name} » à acheter` : `Marquer « ${i.name} » acheté`}
                />
                <div className="min-w-0 flex-1 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`leading-snug ${i.purchased ? "text-muted line-through" : ""}`}>{i.name}</p>
                    {(i.paidPrice ?? i.plannedPrice) !== undefined && (
                      <span className="tabular shrink-0 text-sm text-muted">{euro(i.purchased ? (i.paidPrice ?? i.plannedPrice) : i.plannedPrice)}</span>
                    )}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                    {i.quantity && <span>× {i.quantity}</span>}
                    {i.healthyMaterial && <span className="rounded-full px-1.5 font-semibold" style={{ color: "var(--k-garde)", background: "color-mix(in srgb, var(--k-garde) 14%, transparent)" }}>matière saine</span>}
                    {i.purchased && i.purchasedBy && <span>acheté par {memberLabel(i.purchasedBy)}{i.purchasedAt ? ` le ${formatDay(new Date(i.purchasedAt))}` : ""}</span>}
                  </p>
                  {i.tip && !i.purchased && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{i.tip}</p>}
                </div>
              </div>
              </SwipeRow>
            ))}
            <AddHere label={`Ajouter dans ${cat}`} onClick={() => setEditing({ defaults: { category: cat, priority: priority === "all" ? undefined : priority } })} />
          </div>
        </div>
        );
      })}

      {editing && (
        <ArticleSheet
          initial={"defaults" in editing ? undefined : editing}
          defaultCategory={"defaults" in editing ? editing.defaults.category : undefined}
          defaultPriority={"defaults" in editing ? editing.defaults.priority : undefined}
          me={me}
          onClose={() => setEditing(null)}
          onSave={(i) => {
            save(i);
            setEditing(null);
          }}
          onDelete={(id) => {
            const i = items.find((x) => x.id === id);
            if (i) deleteItem(i);
            setEditing(null);
          }}
        />
      )}
      <p className="px-1 text-center text-[12px] text-muted">Glissez un article vers la gauche pour le supprimer.</p>
      {toast}
    </>
  );
}
