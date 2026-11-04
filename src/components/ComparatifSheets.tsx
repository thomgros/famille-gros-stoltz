// Feuilles de saisie des comparatifs : un produit (prix, points forts…) et le comparatif lui-même.

import { useState } from "react";
import { DeleteButton, field, Group, Row, Select, Sheet } from "./sheet";
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

export function ComparatifSheet({ initial, onClose, onSave, onDelete }: { initial?: Comparison; onClose: () => void; onSave: (c: Comparison) => void; onDelete: (id: string) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [criteria, setCriteria] = useState((initial?.criteria ?? []).join("\n"));
  const [buyWindow, setBuyWindow] = useState(initial?.buyWindow ?? "");
  const [shoppable, setShoppable] = useState(initial?.shoppable !== false);
  const [confirm, setConfirm] = useState(false);

  function submit() {
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
    <Sheet title={initial ? "Comparatif" : "Nouveau comparatif"} onCancel={onClose} onDone={submit} doneLabel={initial ? "OK" : "Créer"} canDone={!!title.trim()}>
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
      {initial && (
        <DeleteButton label="Supprimer le comparatif" confirming={confirm} onAsk={() => setConfirm(true)} onCancel={() => setConfirm(false)} onConfirm={() => onDelete(initial.id)} />
      )}
    </Sheet>
  );
}
