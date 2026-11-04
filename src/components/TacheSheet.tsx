import { useState } from "react";
import { DeleteButton, field, Group, pill, Row, Select, Sheet, Toggle } from "./sheet";
import { MEMBERS, PRIORITIES, TASK_CATEGORIES, taskDue } from "../lib/lists";
import { toISO } from "../lib/dates";
import { newId } from "../lib/useCollection";
import type { Member, Priority, Task } from "../lib/types";

interface Props {
  initial?: Task;
  dueDate: string; // terme du foyer, pour afficher les échéances relatives
  me?: Member;
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
}

export function TacheSheet({ initial, dueDate, me, onClose, onSave, onDelete }: Props) {
  const resolved = initial ? taskDue(initial, dueDate) : undefined;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [hasDate, setHasDate] = useState(!!resolved);
  const [date, setDate] = useState(resolved ? toISO(resolved) : toISO(new Date()));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "P1");
  const [category, setCategory] = useState<Task["category"]>(initial?.category ?? "maison");
  const [owner, setOwner] = useState<Member>(initial?.owner ?? "both");
  const [done, setDone] = useState(initial?.status === "done");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [confirm, setConfirm] = useState(false);

  // Si la date n'a pas été touchée, on garde l'échéance relative (elle suit le terme).
  const dateUnchanged = resolved && hasDate && toISO(resolved) === date;

  function submit() {
    const base: Task = {
      ...(initial ?? { id: newId(), status: "todo" }),
      title: title.trim(),
      priority,
      category,
      owner,
      status: done ? "done" : initial?.status === "done" ? "todo" : (initial?.status ?? "todo"),
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
    } as Task;
    if (done && initial?.status !== "done") {
      base.doneBy = me;
      base.doneAt = new Date().toISOString();
    }
    if (!done) {
      delete base.doneBy;
      delete base.doneAt;
    }
    if (!hasDate) {
      delete base.dueDate;
      delete base.relativeTo;
      delete base.dueLabel;
    } else if (!dateUnchanged) {
      base.dueDate = date;
      delete base.relativeTo;
      delete base.dueLabel;
    }
    onSave(base);
  }

  return (
    <Sheet title={initial ? "Tâche" : "Nouvelle tâche"} onCancel={onClose} onDone={submit} doneLabel={initial ? "OK" : "Ajouter"} canDone={!!title.trim()}>
      <Group>
        <textarea autoFocus={!initial} rows={2} placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} resize-none`} />
        <Row label="Fait">
          <Toggle checked={done} onChange={setDone} label="Fait" />
        </Row>
      </Group>

      <Group footer={initial?.dueLabel && dateUnchanged ? `Repère du projet : ${initial.dueLabel}` : undefined}>
        <Row label="Échéance">
          <Toggle checked={hasDate} onChange={setHasDate} label="Échéance" />
        </Row>
        {hasDate && (
          <Row label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={pill} />
          </Row>
        )}
      </Group>

      <Group>
        <Row label="Priorité">
          <Select value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
        </Row>
        <Row label="Catégorie">
          <Select value={category} onChange={setCategory} options={TASK_CATEGORIES} />
        </Row>
        <Row label="Qui s'en occupe">
          <Select value={owner} onChange={setOwner} options={MEMBERS} />
        </Row>
      </Group>

      <Group>
        <textarea placeholder="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${field} resize-none`} />
        <input type="url" inputMode="url" placeholder="Lien (site, formulaire…)" value={link} onChange={(e) => setLink(e.target.value)} className={field} />
      </Group>

      {initial && (
        <DeleteButton label="Supprimer la tâche" confirming={confirm} onAsk={() => setConfirm(true)} onCancel={() => setConfirm(false)} onConfirm={() => onDelete(initial.id)} />
      )}
    </Sheet>
  );
}
