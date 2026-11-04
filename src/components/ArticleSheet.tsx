import { useState } from "react";
import { DeleteButton, field, Group, Row, Select, Sheet, Toggle } from "./sheet";
import { ITEM_CATEGORIES, ITEM_PRIORITIES, MEMBERS, parseEuro } from "../lib/lists";
import { newId } from "../lib/useCollection";
import type { Item, Member } from "../lib/types";

interface Props {
  initial?: Item;
  defaultCategory?: string;
  me?: Member;
  onClose: () => void;
  onSave: (i: Item) => void;
  onDelete: (id: string) => void;
}

const priceInput = "w-28 rounded-lg bg-surface-2 px-2 py-1.5 text-right text-[16px] tabular outline-none";
const fmt = (n?: number) => (n === undefined ? "" : String(n).replace(".", ","));

export function ArticleSheet({ initial, defaultCategory, me, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [priority, setPriority] = useState<Item["priority"]>(initial?.priority ?? "P1");
  const [category, setCategory] = useState(initial?.category ?? defaultCategory ?? "Autre");
  const [planned, setPlanned] = useState(fmt(initial?.plannedPrice));
  const [paid, setPaid] = useState(fmt(initial?.paidPrice));
  const [link, setLink] = useState(initial?.link ?? "");
  const [purchased, setPurchased] = useState(initial?.purchased ?? false);
  const [by, setBy] = useState<Member>(initial?.purchasedBy ?? me ?? "both");
  const [tip, setTip] = useState(initial?.tip ?? "");
  const [healthy, setHealthy] = useState(initial?.healthyMaterial ?? false);
  const [confirm, setConfirm] = useState(false);

  const categories = ITEM_CATEGORIES.includes(category) ? ITEM_CATEGORIES : [category, ...ITEM_CATEGORIES];

  function submit() {
    onSave({
      ...(initial ?? {}),
      id: initial?.id ?? newId(),
      name: name.trim(),
      quantity: quantity.trim(),
      priority,
      category,
      plannedPrice: parseEuro(planned),
      paidPrice: parseEuro(paid),
      link: link.trim() || undefined,
      purchased,
      purchasedBy: purchased ? by : undefined,
      purchasedAt: purchased ? (initial?.purchasedAt ?? new Date().toISOString()) : undefined,
      tip: tip.trim() || undefined,
      healthyMaterial: healthy,
    });
  }

  return (
    <Sheet title={initial ? "Article" : "Nouvel article"} onCancel={onClose} onDone={submit} doneLabel={initial ? "OK" : "Ajouter"} canDone={!!name.trim()}>
      <Group>
        <input autoFocus={!initial} placeholder="Article" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        <input placeholder="Quantité (ex. 2 à 3)" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={field} />
      </Group>

      <Group>
        <Row label="Acheté">
          <Toggle checked={purchased} onChange={setPurchased} label="Acheté" />
        </Row>
        {purchased && (
          <Row label="Par">
            <Select value={by} onChange={setBy} options={MEMBERS} />
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Prix prévu">
          <input inputMode="decimal" placeholder="0" value={planned} onChange={(e) => setPlanned(e.target.value)} className={priceInput} />
          <span className="text-muted">€</span>
        </Row>
        <Row label="Prix payé">
          <input inputMode="decimal" placeholder="0" value={paid} onChange={(e) => setPaid(e.target.value)} className={priceInput} />
          <span className="text-muted">€</span>
        </Row>
        <input type="url" inputMode="url" placeholder="Lien d'achat" value={link} onChange={(e) => setLink(e.target.value)} className={field} />
      </Group>

      <Group>
        <Row label="Quand">
          <Select value={priority} onChange={setPriority} options={ITEM_PRIORITIES} />
        </Row>
        <Row label="Catégorie">
          <Select value={category} onChange={setCategory} options={categories.map((c) => ({ value: c, label: c }))} />
        </Row>
        <Row label="Matière saine">
          <Toggle checked={healthy} onChange={setHealthy} label="Matière saine" />
        </Row>
      </Group>

      <Group>
        <textarea placeholder="Conseil, modèle choisi, taille…" rows={3} value={tip} onChange={(e) => setTip(e.target.value)} className={`${field} resize-none`} />
      </Group>

      {initial && (
        <DeleteButton label="Supprimer l'article" confirming={confirm} onAsk={() => setConfirm(true)} onCancel={() => setConfirm(false)} onConfirm={() => onDelete(initial.id)} />
      )}
    </Sheet>
  );
}
