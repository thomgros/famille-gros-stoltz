import { Link } from "react-router-dom";
import { Card, KindBadge, Page, ProgressBar, SectionTitle } from "../components/ui";
import { FetusIllustration } from "../components/FetusIllustration";
import { fetusWeek, formatSize, formatWeight } from "../data/fetus";
import { diffDays, formatLong, formatRange, plural, pregnancyStatus, today } from "../lib/dates";
import { upcomingMilestones, useMilestones } from "../lib/milestones";
import { useHousehold } from "../lib/store";
import { appointmentStart, formatTime, kindLabel, sortAppointments, useAppointments } from "../lib/appointments";

export function Accueil() {
  const { household } = useHousehold();
  const now = today();
  const p = pregnancyStatus(household.dueDate, now);
  const w = fetusWeek(p.sa);
  const { docs: milestones } = useMilestones();
  const next = upcomingMilestones(milestones, household.dueDate, now, 4);
  const { docs: appointments } = useAppointments();
  const nextRdv = sortAppointments(appointments).find((a) => appointmentStart(a) >= now);

  return (
    <Page
      title={household.name}
      subtitle={formatLong(now)}
      action={
        <Link to="/reglages" aria-label="Réglages" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-muted">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </Link>
      }
    >
      <Card className="overflow-hidden">
        <Link to="/grossesse" className="flex items-center gap-4">
          <FetusIllustration sa={p.sa} sizeCm={w.sizeCm} className="size-28 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-muted">Trimestre {p.trimester} · mois {p.month}</p>
            <p className="tabular text-[34px] font-bold leading-none tracking-tight">
              {p.sa} SA <span className="text-xl font-semibold text-muted">+ {p.saDays} j</span>
            </p>
            <p className="mt-1 text-[15px] text-muted">
              soit {plural(p.sg, "semaine", "semaines")} de grossesse
            </p>
            <p className="mt-2 text-[15px]">
              Taille de {w.emoji ? `${w.emoji} ` : ""}
              <strong>{w.fruit}</strong>
            </p>
            <p className="text-sm text-muted">
              {formatSize(w.sizeCm)} · {formatWeight(w.weightG)}
            </p>
          </div>
        </Link>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">
            {p.born ? "Le terme est passé" : `J − ${p.daysLeft}`}
          </p>
          <p className="text-sm text-muted">Terme le {formatRange(p.due)}</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={p.progress} label="Avancement de la grossesse" />
        </div>
        <p className="mt-2 text-sm text-muted tabular">{Math.round(p.progress * 100)} % du chemin parcouru</p>
      </Card>

      {nextRdv && (
        <div>
          <SectionTitle to="/grossesse?vue=calendrier">Prochain rendez-vous</SectionTitle>
          <Link to="/grossesse?vue=calendrier">
            <Card className="flex items-center gap-3">
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

      <div>
        <SectionTitle to="/grossesse?vue=frise">À venir</SectionTitle>
        <Card className="divide-y divide-line p-0">
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
