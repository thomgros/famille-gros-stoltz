import { useEffect, useMemo, useRef, useState } from "react";
import { Card, KindBadge, KindDot, Page, SectionTitle } from "../components/ui";
import { FetusIllustration } from "../components/FetusIllustration";
import { fetusWeek, formatSize, formatWeight } from "../data/fetus";
import { addDays, diffDays, formatDay, formatMonth, formatRange, pregnancyStatus, saAt, today } from "../lib/dates";
import { datedMilestones, useMilestones } from "../lib/milestones";
import { useHousehold } from "../lib/store";
import { useSearchParams } from "react-router-dom";
import { Calendrier } from "../components/Calendrier";
import { Segmented } from "../components/sheet";

type View = "semaine" | "calendrier" | "frise";
const VIEWS: { value: View; label: string }[] = [
  { value: "semaine", label: "Semaine" },
  { value: "calendrier", label: "Calendrier" },
  { value: "frise", label: "Frise" },
];

export function Grossesse() {
  const { household } = useHousehold();
  const now = today();
  const p = pregnancyStatus(household.dueDate, now);
  const currentSa = Math.min(41, Math.max(4, p.sa));
  const [sa, setSa] = useState(currentSa);
  const w = fetusWeek(sa);
  const weekStart = addDays(p.ddr, sa * 7);
  const [params, setParams] = useSearchParams();
  const view = (params.get("vue") as View | null) ?? "semaine";
  const setView = (v: View) => setParams(v === "semaine" ? {} : { vue: v }, { replace: true });

  return (
    <Page tone="lavender" title="Grossesse" subtitle={`Aujourd'hui : ${p.sa} SA + ${p.saDays} j · ${p.sg} SG`}>
      <Segmented value={view} onChange={setView} options={VIEWS} />
      {view === "calendrier" && <Calendrier />}
      {view === "frise" && <Timeline dueDate={household.dueDate} now={now} />}
      {view === "semaine" && (
      <Card className="border-transparent bg-tone-hero">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSa((s) => Math.max(4, s - 1))}
            disabled={sa <= 4}
            className="grid size-11 place-items-center rounded-full bg-white/70 text-xl text-tone-strong disabled:opacity-30"
            aria-label="Semaine précédente"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="tabular text-2xl font-bold">{sa} SA</p>
            <p className="text-sm text-muted">
              {sa - 2} SG · semaine du {formatDay(weekStart)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSa((s) => Math.min(41, s + 1))}
            disabled={sa >= 41}
            className="grid size-11 place-items-center rounded-full bg-white/70 text-xl text-tone-strong disabled:opacity-30"
            aria-label="Semaine suivante"
          >
            ›
          </button>
        </div>

        <FetusIllustration sa={sa} sizeCm={w.sizeCm} className="mx-auto my-4 size-52" />

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Taille" value={formatSize(w.sizeCm)} />
          <Stat label="Poids" value={formatWeight(w.weightG)} />
          <Stat label="Comme" value={w.emoji ?? "≈"} />
        </div>
        <p className="mt-3 text-center text-[15px]">
          À peu près la taille {w.fruit.startsWith("un") ? "d'" : "de "}
          <strong>{w.fruit}</strong>
        </p>
        <p className="mt-4 text-[15px] leading-relaxed">{w.development}</p>
        {w.forParents && <p className="mt-2 rounded-2xl bg-white/60 px-3 py-2 text-[15px]">💛 {w.forParents}</p>}
        {sa !== currentSa && (
          <button type="button" onClick={() => setSa(currentSa)} className="mt-4 w-full rounded-2xl bg-white/60 py-2.5 text-sm font-medium text-tone-strong">
            Revenir à cette semaine
          </button>
        )}
        <p className="mt-3 text-xs text-ink/60">Moyennes indicatives. Taille tête-fesses jusqu'à 20 SA, puis tête-talons. L'échographie fait foi.</p>
      </Card>

      )}
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-2 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular text-lg font-semibold">{value}</p>
    </div>
  );
}

function Timeline({ dueDate, now }: { dueDate: string; now: Date }) {
  const [showPast, setShowPast] = useState(false);
  const todayRef = useRef<HTMLLIElement>(null);
  const { docs: milestones } = useMilestones();
  const all = useMemo(() => datedMilestones(milestones, dueDate), [milestones, dueDate]);
  const past = all.filter((m) => m.end < now);
  const visible = showPast ? all : all.filter((m) => m.end >= now);

  // Regroupe par mois de début.
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const m of visible) {
      const k = `${m.start.getFullYear()}-${m.start.getMonth()}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.values()];
  }, [visible]);

  useEffect(() => {
    if (showPast) todayRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [showPast]);

  return (
    <div>
      <SectionTitle>Frise et jalons</SectionTitle>
      {past.length > 0 && (
        <button type="button" onClick={() => setShowPast((v) => !v)} className="mb-2 px-1 text-sm font-medium text-tone-strong">
          {showPast ? "Masquer les jalons passés" : `Afficher les ${past.length} jalons passés`}
        </button>
      )}
      <Card tint className="px-3">
        <ol className="relative">
          <span className="absolute bottom-2 left-[9px] top-2 w-px bg-line" aria-hidden />
          {groups.map((g) => (
            <li key={g[0].id} className="relative pb-2">
              <p className="pb-2 pl-7 pt-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{formatMonth(g[0].start)}</p>
              <ul className="space-y-3">
                {g.map((m) => {
                  const done = m.end < now;
                  const ongoing = m.start <= now && m.end >= now;
                  const saStart = saAt(dueDate, m.start);
                  const saEnd = saAt(dueDate, m.end);
                  const saLabel =
                    saStart >= 0 && saStart <= 42
                      ? saStart === saEnd || saEnd > 42
                        ? `${saStart} SA`
                        : `${saStart}-${saEnd} SA`
                      : null;
                  return (
                    <li key={m.id} ref={ongoing ? todayRef : undefined} className={`relative flex gap-3 ${done ? "opacity-55" : ""}`}>
                      <div className="pt-1.5">
                        <KindDot kind={m.kind} />
                      </div>
                      <div className={`min-w-0 flex-1 rounded-2xl px-3 py-2 ${ongoing ? "bg-white/70" : ""}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-snug">{m.title}</p>
                          {ongoing && <span className="text-xs font-semibold text-accent">en cours</span>}
                        </div>
                        <p className="mt-0.5 text-sm text-muted tabular">
                          {m.approximate ? "vers le " : ""}
                          {formatRange(m.start, m.end)}
                          {saLabel ? ` · ${saLabel}` : ""}
                          {!done && !ongoing ? ` · J − ${diffDays(m.start, now)}` : ""}
                        </p>
                        {m.description && <p className="mt-1 text-sm leading-relaxed">{m.description}</p>}
                        <div className="mt-1.5">
                          <KindBadge kind={m.kind} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </Card>
      <p className="mt-2 px-1 text-xs text-muted">Dates médicales : repères habituels en France, à confirmer avec la sage-femme ou le gynécologue. Vos rendez-vous sont dans l'onglet Calendrier.</p>
    </div>
  );
}
