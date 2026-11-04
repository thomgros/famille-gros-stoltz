// Calendrier inspiré de l'app Calendrier de l'iPhone : grille du mois, point sous les jours
// qui ont quelque chose, liste du jour sélectionné, ajout d'un rendez-vous en feuille.

import { useMemo, useRef, useState } from "react";
import { diffDays, formatLong, formatMonth, saAt, today } from "../lib/dates";
import { datedMilestones, useMilestones } from "../lib/milestones";
import { appointmentDay, formatTime, kindLabel, sortAppointments, useAppointments } from "../lib/appointments";
import { useHousehold } from "../lib/store";
import type { Appointment, MilestoneKind } from "../lib/types";
import { RendezVousSheet } from "./RendezVousSheet";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const sameDay = (a: Date, b: Date) => diffDays(a, b) === 0;

interface DayEvent {
  id: string;
  title: string;
  color: string;
  time: string;
  subtitle?: string;
  appointment?: Appointment;
}

export function Calendrier() {
  const { household } = useHousehold();
  const now = today();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(now);
  const [sheet, setSheet] = useState<{ appointment?: Appointment; day: Date } | null>(null);
  const { docs: milestoneDocs } = useMilestones();
  const { docs: appointments, save, remove } = useAppointments();
  const milestones = useMemo(() => datedMilestones(milestoneDocs, household.dueDate), [milestoneDocs, household.dueDate]);

  function eventsOn(d: Date): DayEvent[] {
    const rdv = sortAppointments(appointments.filter((a) => sameDay(appointmentDay(a), d))).map((a) => ({
      id: a.id,
      title: a.title,
      color: "var(--k-medical)",
      time: a.allDay ? "journée" : formatTime(a.start),
      subtitle: [kindLabel(a.kind), a.location].filter(Boolean).join(" · "),
      appointment: a,
    }));
    const jalons = milestones
      .filter((m) => m.start <= d && m.end >= d)
      .map((m) => ({
        id: m.id,
        title: m.title,
        color: `var(--k-${m.kind as MilestoneKind})`,
        time: "journée",
        subtitle: sameDay(m.start, m.end) ? undefined : "Période à prévoir",
      }));
    return [...rdv, ...jalons];
  }

  // Un point sous le jour : rendez-vous, ou début / jour unique d'un jalon (pas chaque jour d'une période).
  function hasDot(d: Date) {
    return appointments.some((a) => sameDay(appointmentDay(a), d)) || milestones.some((m) => sameDay(m.start, d));
  }

  const cells = useMemo(() => {
    const first = (month.getDay() + 6) % 7; // lundi = 0
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const goToday = () => {
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(now);
  };

  // Glisser à gauche / à droite pour changer de mois.
  const touchX = useRef<number | null>(null);

  const events = eventsOn(selected);
  const sa = saAt(household.dueDate, selected);

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="whitespace-nowrap text-[22px] font-bold">
          <span className="text-accent">{formatMonth(month).split(" ")[0]}</span>{" "}
          <span className="font-semibold text-muted">{month.getFullYear()}</span>
        </h2>
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={goToday} className="rounded-full px-2 py-1.5 text-[15px] font-medium text-accent">
            Aujourd'hui
          </button>
          <button type="button" onClick={() => shift(-1)} aria-label="Mois précédent" className="grid size-8 place-items-center text-2xl text-accent">
            ‹
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Mois suivant" className="grid size-8 place-items-center text-2xl text-accent">
            ›
          </button>
          <button
            type="button"
            onClick={() => setSheet({ day: selected })}
            aria-label="Nouveau rendez-vous"
            className="grid size-9 place-items-center text-[28px] font-light leading-none text-accent"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="rounded-3xl border border-line bg-surface px-2 pb-2 pt-3"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) shift(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold text-muted">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`x${i}`} />;
            const isToday = sameDay(d, now);
            const isSel = sameDay(d, selected);
            const weekend = (d.getDay() + 6) % 7 >= 5;
            const dot = hasDot(d);
            return (
              <button
                key={d.getDate()}
                type="button"
                onClick={() => setSelected(d)}
                className="flex h-12 flex-col items-center justify-start gap-1 pt-1"
                aria-label={formatLong(d)}
                aria-pressed={isSel}
              >
                <span
                  className={`tabular grid size-8 place-items-center rounded-full text-[17px] ${
                    isSel && isToday
                      ? "bg-today font-semibold text-white"
                      : isSel
                        ? "bg-ink font-semibold text-bg"
                        : isToday
                          ? "font-semibold text-today"
                          : weekend
                            ? "text-muted"
                            : ""
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className={`size-1.5 rounded-full ${dot ? "bg-muted/70" : ""}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between px-1 pb-2">
          <p className="font-semibold first-letter:uppercase">{formatLong(selected)}</p>
          {sa >= 0 && sa <= 42 && <p className="tabular text-sm text-muted">{sa} SA</p>}
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {events.length === 0 && (
            <button type="button" onClick={() => setSheet({ day: selected })} className="w-full px-4 py-4 text-left text-[15px] text-muted">
              Aucun événement. <span className="text-accent">Ajouter un rendez-vous</span>
            </button>
          )}
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              disabled={!e.appointment}
              onClick={() => e.appointment && setSheet({ appointment: e.appointment, day: selected })}
              className="flex w-full items-stretch gap-3 px-4 py-3 text-left disabled:cursor-default"
            >
              <span className="w-1 shrink-0 rounded-full" style={{ background: e.color }} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{e.title}</span>
                {e.subtitle && <span className="block text-sm text-muted">{e.subtitle}</span>}
              </span>
              <span className="tabular shrink-0 text-sm text-muted">{e.time}</span>
            </button>
          ))}
        </div>
      </div>

      {sheet && (
        <RendezVousSheet
          initial={sheet.appointment}
          day={sheet.day}
          onClose={() => setSheet(null)}
          onSave={(a) => {
            save(a);
            setSelected(appointmentDay(a));
            setMonth(new Date(appointmentDay(a).getFullYear(), appointmentDay(a).getMonth(), 1));
            setSheet(null);
          }}
          onDelete={(id) => {
            remove(id);
            setSheet(null);
          }}
        />
      )}
    </div>
  );
}
