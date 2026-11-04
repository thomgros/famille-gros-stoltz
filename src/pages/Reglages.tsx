import { Link } from "react-router-dom";
import { Card, Page } from "../components/ui";
import { formatDayYear, pregnancyStatus, toISO } from "../lib/dates";
import { DEFAULT_HOUSEHOLD, useHousehold } from "../lib/store";

export function Reglages() {
  const { household, update } = useHousehold();
  const p = pregnancyStatus(household.dueDate);

  return (
    <Page
      title="Réglages"
      action={
        <Link to="/" className="text-sm font-medium text-accent">
          Fermer
        </Link>
      }
    >
      <Card>
        <label className="block">
          <span className="text-sm font-semibold">Date du terme</span>
          <input
            type="date"
            value={household.dueDate}
            onChange={(e) => e.target.value && update({ dueDate: e.target.value })}
            className="mt-2 block w-full rounded-2xl border border-line bg-surface-2 px-3 py-3 text-base"
          />
        </label>
        <dl className="mt-4 space-y-2 text-[15px]">
          <Row label="Début de grossesse (DDR théorique)" value={formatDayYear(p.ddr)} />
          <Row label="Terme à 41 SA (convention française)" value={formatDayYear(p.dueFr41)} />
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Toutes les semaines et les jalons sont calculés depuis cette date. Mettez celle donnée par la 1re échographie. Selon la
          maternité, le terme est posé à 40 SA ou à 41 SA.
        </p>
        {household.dueDate !== DEFAULT_HOUSEHOLD.dueDate && (
          <button
            type="button"
            onClick={() => update({ dueDate: DEFAULT_HOUSEHOLD.dueDate })}
            className="mt-3 text-sm font-medium text-accent"
          >
            Revenir au {formatDayYear(new Date(2027, 5, 25))}
          </button>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold">Membres du foyer</p>
        <p className="mt-2 text-[15px]">Thomas · Julia</p>
        <p className="mt-2 text-sm text-muted">
          Les comptes et le partage en temps réel arrivent à l'étape 2. Pour l'instant, les réglages restent sur cet appareil.
        </p>
      </Card>

      <p className="px-1 text-xs text-muted">Version de test · {toISO(new Date())}</p>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular shrink-0 font-medium">{value}</dd>
    </div>
  );
}
