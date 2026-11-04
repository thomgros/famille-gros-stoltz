import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Page } from "../components/ui";
import { Chip, Segmented } from "../components/sheet";
import { ComparatifSheet, ProduitSheet } from "../components/ComparatifSheets";
import { effectiveStatus, itemForChoice, linkedItemId, priceText, ROLES, STATUS, statusInfo, useComparisons } from "../lib/comparisons";
import { useItems } from "../lib/lists";
import type { Comparison, Product } from "../lib/types";

function StatusPill({ status }: { status: Comparison["status"] }) {
  const s = statusInfo(status);
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------- Liste

export function Comparatifs() {
  const { docs, save, remove } = useComparisons();
  const { docs: items } = useItems();
  const [filter, setFilter] = useState<Comparison["status"] | "all">("all");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const withStatus = docs.map((c) => ({ c, status: effectiveStatus(c, items) }));
  const visible = withStatus.filter(({ status }) => filter === "all" || status === filter);
  const count = (s: Comparison["status"]) => withStatus.filter((x) => x.status === s).length;

  return (
    <Page
      tone="sky"
      title="Comparatifs"
      subtitle="Nos choix d'équipement"
      action={
        <button type="button" onClick={() => setCreating(true)} className="rounded-full bg-white/70 px-3 py-1.5 text-[15px] font-medium text-tone-strong ring-1 ring-tone-mid/50">
          + Nouveau
        </button>
      }
    >
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Tous · {docs.length}
        </Chip>
        {STATUS.map((s) => (
          <Chip key={s.value} active={filter === s.value} onClick={() => setFilter(s.value)}>
            {s.label} · {count(s.value)}
          </Chip>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map(({ c, status }) => {
          const reco = c.options.filter((o) => o.role === "reco");
          const chosen = c.options.find((o) => o.id === c.chosenProductId);
          return (
            <Link key={c.id} to={`/comparatifs/${c.id}`} className="block">
              <Card className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tone-soft text-2xl" aria-hidden>
                  {c.emoji ?? "🔎"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">{c.title}</p>
                    <StatusPill status={status} />
                  </div>
                  {chosen ? (
                    <p className="mt-1 text-[14px]">
                      <span className="text-muted">Choisi : </span>
                      <span className="font-medium">{chosen.name}</span>
                      {priceText(chosen) && <span className="text-muted"> · {priceText(chosen)}</span>}
                    </p>
                  ) : reco.length > 0 ? (
                    <p className="mt-1 text-[14px]">
                      <span className="text-muted">Reco : </span>
                      <span className="font-medium">{reco.map((r) => r.name).join(" ou ")}</span>
                      {reco.length === 1 && priceText(reco[0]) && <span className="text-muted"> · {priceText(reco[0])}</span>}
                    </p>
                  ) : (
                    <p className="mt-1 text-[14px] text-muted">{c.options.length} options</p>
                  )}
                  {c.buyWindow && <p className="mt-0.5 text-[13px] text-tone-strong">🗓 {c.buyWindow}</p>}
                </div>
              </Card>
            </Link>
          );
        })}
        {visible.length === 0 && <Card tint className="text-center text-[15px] text-muted">Aucun comparatif ici.</Card>}
      </div>

      {creating && (
        <ComparatifSheet
          onClose={() => setCreating(false)}
          onSave={(c) => {
            save(c);
            setCreating(false);
            navigate(`/comparatifs/${c.id}`);
          }}
          onDelete={(id) => remove(id)}
        />
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- Fiche

export function Comparatif() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { docs, save, remove, loading } = useComparisons();
  const { docs: items, save: saveItem, remove: removeItem } = useItems();
  const [editingProduct, setEditingProduct] = useState<Product | "new" | null>(null);
  const [editingComp, setEditingComp] = useState(false);
  const c = docs.find((x) => x.id === id);

  if (!c) {
    return (
      <Page tone="sky" title="Comparatif">
        <Card tint className="text-center text-[15px] text-muted">
          {loading ? "Chargement…" : "Ce comparatif n'existe plus."} <Link to="/comparatifs" className="text-tone-strong">Retour</Link>
        </Card>
      </Page>
    );
  }

  const comp = c;
  const linked = items.find((i) => i.id === linkedItemId(comp));
  const status = effectiveStatus(comp, items);
  const shoppable = comp.shoppable !== false;

  function choose(p: Product) {
    if (comp.chosenProductId === p.id) {
      // Annuler le choix ; on retire l'article des achats s'il n'a pas encore été acheté.
      save({ ...comp, chosenProductId: undefined, status: "a_decider" });
      if (linked && !linked.purchased) removeItem(linked.id);
      return;
    }
    save({ ...comp, chosenProductId: p.id, status: linked?.purchased ? "achete" : "choisi" });
    if (shoppable) saveItem(itemForChoice(comp, p, linked));
  }

  function setStatus(s: Comparison["status"]) {
    save({ ...comp, status: s });
    if (linked && s === "achete" && !linked.purchased) saveItem({ ...linked, purchased: true, purchasedAt: new Date().toISOString() });
    if (linked && s !== "achete" && linked.purchased) saveItem({ ...linked, purchased: false, purchasedAt: undefined, purchasedBy: undefined });
  }

  function saveProduct(p: Product) {
    const exists = comp.options.some((o) => o.id === p.id);
    const options = exists ? comp.options.map((o) => (o.id === p.id ? p : o)) : [...comp.options, p];
    save({ ...comp, options });
    // Garde l'article d'achat à jour si c'est le produit choisi.
    if (shoppable && comp.chosenProductId === p.id && linked) saveItem(itemForChoice(comp, p, linked));
    setEditingProduct(null);
  }

  function removeProduct(pid: string) {
    save({ ...comp, options: comp.options.filter((o) => o.id !== pid), chosenProductId: comp.chosenProductId === pid ? undefined : comp.chosenProductId });
    setEditingProduct(null);
  }

  const chosen = comp.options.find((o) => o.id === comp.chosenProductId);

  return (
    <Page
      tone="sky"
      title={`${comp.emoji ? comp.emoji + " " : ""}${comp.title}`}
      back={{ to: "/comparatifs", label: "Comparatifs" }}
      action={
        <button type="button" onClick={() => setEditingComp(true)} className="rounded-full bg-white/70 px-3 py-1.5 text-[15px] font-medium text-tone-strong ring-1 ring-tone-mid/50">
          Modifier
        </button>
      }
    >
      <Segmented value={status} onChange={setStatus} options={STATUS.map((s) => ({ value: s.value, label: s.label }))} />

      <Card tint>
        {comp.statusNote && <p className="text-[15px]">{comp.statusNote}</p>}
        {chosen && (
          <p className={`${comp.statusNote ? "mt-2" : ""} text-[15px]`}>
            ✅ Choisi : <strong>{chosen.name}</strong>
            {shoppable && (linked ? <span className="text-muted"> · dans les achats{linked.purchased ? ", acheté" : ""}</span> : null)}
          </p>
        )}
        {chosen && shoppable && !linked && (
          <button type="button" onClick={() => saveItem(itemForChoice(comp, chosen))} className="mt-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-tone-strong">
            Ajouter aux achats
          </button>
        )}
        {comp.buyWindow && <p className="mt-2 text-[15px] text-tone-strong">🗓 À acheter : {comp.buyWindow}</p>}
        {comp.intro && <p className="mt-2 text-sm text-muted">{comp.intro}</p>}
        {comp.criteria.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {comp.criteria.map((k) => (
              <span key={k} className="rounded-full bg-white/70 px-2.5 py-1 text-[13px]">
                {k}
              </span>
            ))}
          </div>
        )}
      </Card>

      {ROLES.map((r) => {
        const list = comp.options.filter((o) => o.role === r.value);
        if (list.length === 0) return null;
        return (
          <div key={r.value}>
            <h2 className="flex items-center gap-2 px-1 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-tone-strong">
              <span className="size-2 rounded-full bg-tone-mid" aria-hidden />
              {r.title}
            </h2>
            <div className="space-y-2.5">
              {list.map((p) => (
                <ProductCard key={p.id} p={p} chosen={comp.chosenProductId === p.id} shoppable={shoppable} onChoose={() => choose(p)} onEdit={() => setEditingProduct(p)} />
              ))}
            </div>
          </div>
        );
      })}

      <button type="button" onClick={() => setEditingProduct("new")} className="w-full rounded-2xl border border-dashed border-tone-mid py-3 text-[15px] font-medium text-tone-strong">
        + Ajouter un produit
      </button>

      {comp.tips && comp.tips.length > 0 && (
        <Card tint>
          <p className="font-semibold text-tone-strong">💡 Conseils</p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-snug">
            {comp.tips.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-tone-strong" aria-hidden>
                  •
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <label className="block">
          <span className="text-sm font-semibold">Nos notes</span>
          <textarea
            key={comp.id}
            defaultValue={comp.notes ?? ""}
            onBlur={(e) => e.target.value !== (comp.notes ?? "") && save({ ...comp, notes: e.target.value || undefined })}
            rows={3}
            placeholder="Essayé en magasin, avis de la sage-femme…"
            className="mt-2 block w-full resize-none rounded-2xl bg-surface-2 px-3 py-2.5 text-[15px] outline-none placeholder:text-muted"
          />
        </label>
      </Card>

      {comp.sourceUrl && (
        <a href={comp.sourceUrl} target="_blank" rel="noreferrer" className="block px-1 text-sm font-medium text-tone-strong">
          Voir le comparatif d'origine ↗
        </a>
      )}

      {editingProduct && (
        <ProduitSheet initial={editingProduct === "new" ? undefined : editingProduct} onClose={() => setEditingProduct(null)} onSave={saveProduct} onDelete={removeProduct} />
      )}
      {editingComp && (
        <ComparatifSheet
          initial={comp}
          onClose={() => setEditingComp(false)}
          onSave={(n) => {
            save(n);
            setEditingComp(false);
          }}
          onDelete={(cid) => {
            remove(cid);
            if (linked && !linked.purchased) removeItem(linked.id);
            navigate("/comparatifs");
          }}
        />
      )}
    </Page>
  );
}

function ProductCard({ p, chosen, shoppable, onChoose, onEdit }: { p: Product; chosen: boolean; shoppable: boolean; onChoose: () => void; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const specs = Object.entries(p.specs ?? {});
  const dim = p.role === "ecarte";
  return (
    <section className={`rounded-3xl border p-4 ${chosen ? "border-tone-strong/50 bg-tone-soft/70 ring-2 ring-tone-mid" : "border-line bg-surface"} ${dim ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.tag && <p className="text-[12px] font-semibold uppercase tracking-wide text-tone-strong">{p.tag}</p>}
          <p className="font-semibold leading-snug">{p.name}</p>
        </div>
        {priceText(p) && <p className="tabular shrink-0 text-right text-[15px] font-semibold">{priceText(p)}</p>}
      </div>
      {(p.pros.length > 0 || p.cons.length > 0) && (
        <ul className="mt-2 space-y-1 text-[14px] leading-snug">
          {p.pros.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="font-bold" style={{ color: "var(--k-garde)" }} aria-label="Point fort">
                +
              </span>
              {x}
            </li>
          ))}
          {p.cons.map((x) => (
            <li key={x} className="flex gap-2 text-muted">
              <span className="font-bold" style={{ color: "var(--k-achat)" }} aria-label="Point faible">
                −
              </span>
              {x}
            </li>
          ))}
        </ul>
      )}
      {specs.length > 0 && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-[13px] font-medium text-tone-strong">
            {open ? "Masquer le détail" : "Voir le détail"}
          </button>
          {open && (
            <dl className="mt-1.5 divide-y divide-line rounded-2xl bg-surface-2/70 px-3 text-[13px]">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
      <div className="mt-3 flex gap-2">
        {!dim && (
          <button
            type="button"
            onClick={onChoose}
            className={`flex-1 rounded-full py-2 text-[14px] font-semibold ${chosen ? "bg-tone-strong text-white" : "bg-tone-mid text-ink"}`}
          >
            {chosen ? "✓ Choisi" : shoppable ? "Choisir et ajouter aux achats" : "Choisir"}
          </button>
        )}
        <button type="button" onClick={onEdit} className="rounded-full bg-surface-2 px-4 py-2 text-[14px] font-medium">
          Modifier
        </button>
      </div>
    </section>
  );
}
