// Feuille « Nouveau rendez-vous », sur le modèle de l'app Calendrier de l'iPhone :
// barre Annuler / titre / Ajouter, groupes de champs arrondis, interrupteur « Toute la journée ».

import { useEffect, useState, type ReactNode } from "react";
import { toISO } from "../lib/dates";
import { APPOINTMENT_KINDS } from "../lib/appointments";
import { newId } from "../lib/useCollection";
import type { Appointment, AppointmentKind, Member } from "../lib/types";

interface Props {
  initial?: Appointment;
  day: Date;
  onClose: () => void;
  onSave: (a: Appointment) => void;
  onDelete: (id: string) => void;
}

const WHO: { value: Member; label: string }[] = [
  { value: "julia", label: "Julia" },
  { value: "thomas", label: "Thomas" },
  { value: "both", label: "Les deux" },
];

function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(Math.min(23, h + 1)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function RendezVousSheet({ initial, day, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [practitioner, setPractitioner] = useState(initial?.practitioner ?? "");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [date, setDate] = useState(initial?.start.slice(0, 10) ?? toISO(day));
  const [startTime, setStartTime] = useState(initial && initial.start.length > 10 ? initial.start.slice(11, 16) : "09:00");
  const [endDate, setEndDate] = useState(initial?.end?.slice(0, 10) ?? initial?.start.slice(0, 10) ?? toISO(day));
  const [endTime, setEndTime] = useState(initial?.end && initial.end.length > 10 ? initial.end.slice(11, 16) : addHour(startTime));
  const [kind, setKind] = useState<AppointmentKind>(initial?.kind ?? "sage_femme");
  const [attendees, setAttendees] = useState<Member>(initial?.attendees ?? "both");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Bloque le défilement de la page derrière la feuille.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Comme sur iPhone : si le début passe après la fin, la fin suit.
  function changeStart(d: string, t: string) {
    setDate(d);
    setStartTime(t);
    if (`${d}T${t}` >= `${endDate}T${endTime}`) {
      setEndDate(d);
      setEndTime(addHour(t));
    }
  }

  function submit() {
    const end = allDay ? (endDate > date ? endDate : undefined) : `${endDate}T${endTime}`;
    onSave({
      id: initial?.id ?? newId(),
      title: title.trim(),
      kind,
      allDay,
      start: allDay ? date : `${date}T${startTime}`,
      end,
      location: location.trim() || undefined,
      practitioner: practitioner.trim() || undefined,
      notes: notes.trim() || undefined,
      attendees,
    });
  }

  const canSave = title.trim().length > 0 && !!date;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        className="mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[14px] bg-bg pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <button type="button" onClick={onClose} className="text-[17px] text-tone-strong">
            Annuler
          </button>
          <p className="text-[17px] font-semibold">{initial ? "Rendez-vous" : "Nouveau rendez-vous"}</p>
          <button type="button" onClick={submit} disabled={!canSave} className="text-[17px] font-semibold text-tone-strong disabled:opacity-35">
            {initial ? "OK" : "Ajouter"}
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-4 pb-6 pt-3">
          <Group>
            <input autoFocus={!initial} placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
            <input placeholder="Lieu" value={location} onChange={(e) => setLocation(e.target.value)} className={field} />
          </Group>

          <Group>
            <Row label="Toute la journée">
              <Toggle checked={allDay} onChange={setAllDay} />
            </Row>
            <Row label="Début">
              <input type="date" value={date} onChange={(e) => changeStart(e.target.value, startTime)} className={pill} />
              {!allDay && <input type="time" value={startTime} onChange={(e) => changeStart(date, e.target.value)} className={pill} />}
            </Row>
            <Row label="Fin">
              <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} className={pill} />
              {!allDay && <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={pill} />}
            </Row>
          </Group>

          <Group>
            <Row label="Type">
              <select value={kind} onChange={(e) => setKind(e.target.value as AppointmentKind)} className={select}>
                {APPOINTMENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Qui y va">
              <select value={attendees} onChange={(e) => setAttendees(e.target.value as Member)} className={select}>
                {WHO.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Row>
            <input placeholder="Praticien (Dr …, sage-femme …)" value={practitioner} onChange={(e) => setPractitioner(e.target.value)} className={field} />
          </Group>

          <Group>
            <textarea placeholder="Notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${field} resize-none`} />
          </Group>

          {initial && (
            <Group>
              {confirmDelete ? (
                <div className="flex">
                  <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-3 text-[17px] text-tone-strong">
                    Garder
                  </button>
                  <button type="button" onClick={() => onDelete(initial.id)} className="flex-1 py-3 text-[17px] font-semibold text-danger">
                    Supprimer
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="w-full py-3 text-[17px] text-danger">
                  Supprimer le rendez-vous
                </button>
              )}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

const field = "block w-full bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-muted";
const pill = "min-w-0 max-w-[10.5rem] rounded-lg bg-surface-2 px-2 py-1.5 text-[16px] tabular";
const select = "min-w-0 bg-transparent text-right text-[17px] text-muted outline-none";

function Group({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line overflow-hidden rounded-[12px] bg-surface">{children}</div>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
      <span className="shrink-0 text-[17px]">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors ${checked ? "bg-success" : "bg-surface-2 ring-1 ring-line"}`}
    >
      <span className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-[left] ${checked ? "left-[22px]" : "left-[2px]"}`} />
    </button>
  );
}
