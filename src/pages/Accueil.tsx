import { Link } from "react-router-dom";
import { Card, KindBadge, Page, ProgressBar, SectionTitle } from "../components/ui";
import { FetusIllustration } from "../components/FetusIllustration";
import { fetusWeek, formatSize, formatWeight } from "../data/fetus";
import { diffDays, formatLong, formatRange, plural, pregnancyStatus, today } from "../lib/dates";
import { upcomingMilestones, useMilestones } from "../lib/milestones";
import { useHousehold } from "../lib/store";
import { appointmentStart, formatTime, kindLabel, sortAppointments, useAppointments } from "../lib/appointments";
import { memberLabel, taskDue, useItems, useTasks } from "../lib/lists";
import { CheckCircle } from "../components/sheet";

export function Accueil() {
  const { household } = useHousehold();
  const now = today();
  const p = pregnancyStatus(household.dueDate, now);
  const w = fetusWeek(p.sa);
  const { docs: milestones } = useMilestones();
  const next = upcomingMilestones(milestones, household.dueDate, now, 4);
  const { docs: appointments } = useAppointments();
  const nextRdv = sortAppointments(appointments).find((a) => appointmentStart(a) >= now);
  const { membership } = useHousehold();
  const h = household;
  const { docs: tasks, save: saveTask } = useTasks();
  const nextTasks = tasks
    .filter((t) => t.status !== "done")
    .map((t) => ({ t, due: taskDue(t, h.dueDate) }))
    .filter((x): x is { t: typeof x.t; due: Date } => !!x.due)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 5);
  const { docs: items } = useItems();
  const birthItems = items.filter((i) => i.priority === "P1");
  const boughtBirth = birthItems.filter((i) => i.purchased).length;
  const bought = items.filter((i) => i.purchased).length;

  return (
    <Page
      tone="butter"
      title={household.name}
      subtitle={formatLong(now)}
      action={
        <Link to="/reglages" aria-label="Réglages" className="grid size-10 place-items-center rounded-full bg-white/70 text-tone-strong ring-1 ring-tone-mid/50">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </Link>
      }
    >
      <section className="overflow-hidden rounded-3xl bg-hero p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <Link to="/grossesse" className="flex items-center gap-4">
          <FetusIllustration sa={p.sa} sizeCm={w.sizeCm} className="size-28 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--k-achat)" }}>
              Trimestre {p.trimester} · mois {p.month}
            </p>
            <p className="tabular text-[34px] font-bold leading-none tracking-tight">
              {p.sa} SA <span className="text-xl font-semibold text-muted">+ {p.saDays} j</span>
            </p>
            <p className="mt-1 text-[15px] text-muted">soit {plural(p.sg, "semaine", "semaines")} de grossesse</p>
            <p className="mt-2 text-[15px]">
              Taille de {w.emoji ? `${w.emoji} ` : ""}
              <strong>{w.fruit}</strong>
            </p>
            <p className="text-sm text-muted">
              {formatSize(w.sizeCm)} · {formatWeight(w.weightG)}
            </p>
          </div>
        </Link>
        <div className="mt-4 rounded-2xl bg-white/55 px-3.5 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="tabular text-xl font-bold">{p.born ? "Le terme est passé" : `J − ${p.daysLeft}`}</p>
            <p className="text-sm text-muted">Terme le {formatRange(p.due)}</p>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={p.progress} label="Avancement de la grossesse" />
          </div>
          <p className="mt-1.5 text-sm text-muted tabular">{Math.round(p.progress * 100)} % du chemin parcouru</p>
        </div>
      </section>

      {nextTasks.length > 0 && (
        <div className="tone-mint">
          <SectionTitle to="/listes">Prochaines tâches</SectionTitle>
          <Card tint className="divide-y divide-tone-mid/40 p-0">
            {nextTasks.map(({ t, due }) => {
              const late = diffDays(due, now) < 0;
              return (
                <div key={t.id} className="flex items-start gap-1 py-1 pl-1.5 pr-4">
                  <CheckCircle
                    checked={false}
                    onToggle={() => saveTask({ ...t, status: "done", doneBy: membership?.member, doneAt: new Date().toISOString() })}
                    label={`Marquer « ${t.title} » comme faite`}
                  />
                  <Link to="/listes" className="min-w-0 flex-1 py-2.5">
                    <p className="leading-snug">{t.title}</p>
                    <p className={`mt-0.5 text-[13px] ${late ? "font-semibold text-danger" : "text-muted"}`}>
                      {late ? "En retard · " : ""}
                      {t.relativeTo && t.dueLabel ? t.dueLabel : formatRange(due)} · {memberLabel(t.owner)}
                    </p>
                  </Link>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {items.length > 0 && (
        <Link to="/listes?vue=achats" className="tone-peach block">
          <Card tint>
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-tone-strong">🛍️ Achats</p>
              <p className="tabular text-sm text-muted">
                {bought} / {items.length}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted tabular">
              Pour la naissance : {boughtBirth} / {birthItems.length}
            </p>
            <div className="mt-2">
              <ProgressBar value={birthItems.length ? boughtBirth / birthItems.length : 0} label="Achats pour la naissance" />
            </div>
          </Card>
        </Link>
      )}

      {nextRdv && (
        <div className="tone-sky">
          <SectionTitle to="/grossesse?vue=calendrier">Prochain rendez-vous</SectionTitle>
          <Link to="/grossesse?vue=calendrier">
            <Card tint className="flex items-center gap-3">
              <span className="w-1 self-stretch rounded-full" style={{ background: "var(--k-medical)" }} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{nextRdv.title}</p>
                <p className="text-sm text-muted">
                  {[kindLabel(nextRdv.kind), nextRdv.location].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium first-letter:uppercase">{formatLong(appointmentStart(nextRdv))}</p>
                {!nextRdv.allDay && <p className="tabular text-sm text-muted">{formatTime(nextRdv.start)}</p>}
              </div>
            </Card>
          </Link>
        </div>
      )}

      <div className="tone-lavender">
        <SectionTitle to="/grossesse?vue=frise">À venir</SectionTitle>
        <Card tint className="divide-y divide-tone-mid/40 p-0">
          {next.map((m) => {
            const inDays = diffDays(m.start, now);
            const ongoing = inDays <= 0;
            return (
              <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{m.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {m.approximate ? "vers le " : ""}
                    {formatRange(m.start, m.end)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <KindBadge kind={m.kind} />
                  <span className="text-xs text-muted tabular">{ongoing ? "en cours" : `dans ${plural(inDays, "jour", "jours")}`}</span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </Page>
  );
}
