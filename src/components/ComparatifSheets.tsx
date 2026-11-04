// Feuilles de saisie des comparatifs : un produit (prix, points forts…) et le comparatif lui-même.

import { useState } from "react";
import { DeleteButton, field, Group, Row, Segmented, Select, Sheet } from "./sheet";
import { supabase } from "../lib/supabase";
import { ROLES } from "../lib/comparisons";
import { parseEuro } from "../lib/lists";
import { newId } from "../lib/useCollection";
import type { Comparison, Product } from "../lib/types";

const priceInput = "w-24 rounded-lg bg-surface-2 px-2 py-1.5 text-right text-[16px] tabular outline-none";
const fmt = (n?: number) => (n === undefined ? "" : String(n).replace(".", ","));
const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function ProduitSheet({ initial, onClose, onSave, onDelete }: { initial?: Product; onClose: () => void; onSave: (p: Product) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Product["role"]>(initial?.role ?? "alternative");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [lo, setLo] = useState(fmt(initial?.priceMin));
  const [hi, setHi] = useState(fmt(initial?.priceMax));
  const [unit, setUnit] = useState(initial?.priceUnit ?? "");
  const [pros, setPros] = useState((initial?.pros ?? []).join("\n"));
  const [cons, setCons] = useState((initial?.cons ?? []).join("\n"));
  const [confirm, setConfirm] = useState(false);

  function submit() {
    const priceMin = parseEuro(lo);
    const priceMax = parseEuro(hi) ?? priceMin;
    onSave({
      ...(initial ?? {}),
      id: initial?.id ?? newId(),
      name: name.trim(),
      role,
      tag: tag.trim() || undefined,
      priceMin,
      priceMax,
      priceUnit: unit.trim() || undefined,
      pros: lines(pros),
      cons: lines(cons),
    });
  }

  return (
    <Sheet title={initial ? "Produit" : "Nouveau produit"} onCancel={onClose} onDone={submit} doneLabel={initial ? "OK" : "Ajouter"} canDone={!!name.trim()}>
      <Group>
        <input autoFocus={!initial} placeholder="Nom du produit" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        <input placeholder="Étiquette (ex. Petit budget)" value={tag} onChange={(e) => setTag(e.target.value)} className={field} />
        <Row label="Place">
          <Select value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
        </Row>
      </Group>

      <Group footer="Mettez le même prix deux fois pour un prix unique.">
        <Row label="Prix de">
          <input inputMode="decimal" placeholder="—" value={lo} onChange={(e) => setLo(e.target.value)} className={priceInput} />
          <span className="text-muted">€</span>
        </Row>
        <Row label="à">
          <input inputMode="decimal" placeholder="—" value={hi} onChange={(e) => setHi(e.target.value)} className={priceInput} />
          <span className="text-muted">€</span>
        </Row>
        <input placeholder="Unité (ex. / mois), facultatif" value={unit} onChange={(e) => setUnit(e.target.value)} className={field} />
      </Group>

      <Group footer="Un point par ligne.">
        <textarea placeholder="Points forts" rows={4} value={pros} onChange={(e) => setPros(e.target.value)} className={`${field} resize-none`} />
      </Group>
      <Group footer="Un point par ligne.">
        <textarea placeholder="Points faibles" rows={3} value={cons} onChange={(e) => setCons(e.target.value)} className={`${field} resize-none`} />
      </Group>

      {initial && (
        <DeleteButton label="Retirer ce produit" confirming={confirm} onAsk={() => setConfirm(true)} onCancel={() => setConfirm(false)} onConfirm={() => onDelete(initial.id)} />
      )}
    </Sheet>
  );
}

async function generate(sujet: string, precisions: string): Promise<Comparison> {
  if (!supabase) throw new Error("La création par l'IA fonctionne une fois connecté à votre foyer.");
  const { data, error } = await supabase.functions.invoke("chat", { body: { mode: "comparatif", sujet, precisions } });
  if (error || !data) {
    const ctx = (error as { context?: Response } | null)?.context;
    let msg = "Pas de connexion, ou le service ne répond pas. Réessayez dans un instant.";
    if (ctx && typeof ctx.status === "number") {
      msg = ctx.status === 404 ? "La fonction « chat » n'est pas installée dans Supabase." : `Erreur ${ctx.status}.`;
      try {
        const b = await ctx.json();
        if (b?.error) msg = b.error;
      } catch {
        /* corps illisible */
      }
    }
    throw new Error(msg);
  }
  return {
    ...data,
    id: newId(),
    status: "a_decider",
    shoppable: true,
    generatedAt: new Date().toISOString(),
    options: (data.options as Omit<Product, "id">[]).map((o) => ({ ...o, id: newId() })),
  } as Comparison;
}

export function ComparatifSheet({ initial, onClose, onSave, onDelete }: { initial?: Comparison; onClose: () => void; onSave: (c: Comparison) => void; onDelete: (id: string) => void }) {
  const [mode, setMode] = useState<"ia" | "main">(initial ? "main" : "ia");
  const [sujet, setSujet] = useState("");
  const [precisions, setPrecisions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [criteria, setCriteria] = useState((initial?.criteria ?? []).join("\n"));
  const [buyWindow, setBuyWindow] = useState(initial?.buyWindow ?? "");
  const [shoppable, setShoppable] = useState(initial?.shoppable !== false);
  const [confirm, setConfirm] = useState(false);

  async function submitIa() {
    setBusy(true);
    setError(null);
    try {
      onSave(await generate(sujet.trim(), precisions.trim()));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (mode === "ia") return void submitIa();
    onSave({
      status: "a_decider",
      options: [],
      ...(initial ?? {}),
      id: initial?.id ?? newId(),
      title: title.trim(),
      emoji: emoji.trim() || undefined,
      criteria: lines(criteria),
      buyWindow: buyWindow.trim() || undefined,
      shoppable,
    } as Comparison);
  }

  return (
    <Sheet
      title={initial ? "Comparatif" : "Nouveau comparatif"}
      onCancel={() => !busy && onClose()}
      onDone={submit}
      doneLabel={initial ? "OK" : busy ? "…" : "Créer"}
      canDone={mode === "ia" ? !!sujet.trim() && !busy : !!title.trim()}
    >
      {!initial && (
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "ia", label: "✨ Avec l'IA" },
            { value: "main", label: "À la main" },
          ]}
        />
      )}

      {mode === "ia" && !initial ? (
        <>
          <Group footer="L'IA prépare la fiche complète : critères, produit recommandé, alternatives, écartés, prix, conseils. Priorité à la sécurité de bébé et aux matières saines.">
            <input autoFocus placeholder="Sujet (ex. Chaise haute, siège auto, transat…)" value={sujet} onChange={(e) => setSujet(e.target.value)} className={field} />
            <textarea
              placeholder="Précisions (facultatif) : budget, taille de la pièce, marque déjà repérée…"
              rows={3}
              value={precisions}
              onChange={(e) => setPrecisions(e.target.value)}
              className={`${field} resize-none`}
            />
          </Group>
          {busy && (
            <div className="rounded-[12px] bg-tone-soft px-4 py-3 text-[15px]">
              <p className="animate-pulse font-medium text-tone-strong">Recherche des produits et des prix…</p>
              <p className="mt-1 text-sm text-muted">Cela prend souvent 20 à 60 secondes. Gardez la feuille ouverte.</p>
            </div>
          )}
          {error && (
            <div className="rounded-[12px] bg-surface px-4 py-3 text-[15px]">
              <p className="font-semibold text-danger">Pas de comparatif</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </>
      ) : (
        <>
      <Group>
        <input autoFocus={!initial} placeholder="Sujet (ex. Chaise haute)" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        <input placeholder="Emoji (facultatif) 🪑" value={emoji} onChange={(e) => setEmoji(e.target.value)} className={field} maxLength={4} />
        <input placeholder="Quand acheter (ex. vers 6 mois)" value={buyWindow} onChange={(e) => setBuyWindow(e.target.value)} className={field} />
      </Group>
      <Group footer="Un critère par ligne.">
        <textarea placeholder="Critères (ex. Bois massif)" rows={4} value={criteria} onChange={(e) => setCriteria(e.target.value)} className={`${field} resize-none`} />
      </Group>
      <Group footer="Si oui, « Choisir » ajoute le produit à la liste d'achats.">
        <Row label="C'est un achat">
          <Select
            value={shoppable ? "oui" : "non"}
            onChange={(v) => setShoppable(v === "oui")}
            options={[
              { value: "oui", label: "Oui" },
              { value: "non", label: "Non" },
            ]}
          />
        </Row>
      </Group>
        </>
      )}
      {initial && (
        <DeleteButton label="🗑 Supprimer ce comparatif" confirming={confirm} onAsk={() => setConfirm(true)} onCancel={() => setConfirm(false)} onConfirm={() => onDelete(initial.id)} />
      )}
    </Sheet>
  );
}
