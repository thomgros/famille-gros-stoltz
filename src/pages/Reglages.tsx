import { useState } from "react";
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

      <Membres />

      <p className="px-1 text-xs text-muted">Version de test · {toISO(new Date())}</p>
    </Page>
  );
}

const NAMES = { thomas: "Thomas", julia: "Julia" } as const;

function Membres() {
  const { membership, signOut, state } = useHousehold();
  const [copied, setCopied] = useState(false);

  if (!membership) {
    return (
      <Card>
        <p className="text-sm font-semibold">Membres du foyer</p>
        <p className="mt-2 text-sm text-muted">Mode local : les données restent sur cet appareil. Le partage s'active quand Supabase est configuré.</p>
      </Card>
    );
  }

  const link = `${window.location.origin}/?code=${membership.inviteCode}`;
  const other = membership.member === "thomas" ? "julia" : "thomas";
  const otherJoined = membership.members.includes(other);
  const email = state.phase === "ready" ? state.session?.user.email : undefined;

  async function share() {
    const text = `Rejoins le foyer Famille Gros-Stoltz : ${link}`;
    try {
      if (navigator.share) await navigator.share({ title: "Famille Gros-Stoltz", text, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      }
    } catch {
      /* partage annulé */
    }
  }

  return (
    <Card>
      <p className="text-sm font-semibold">Membres du foyer</p>
      <ul className="mt-2 space-y-1 text-[15px]">
        {(["thomas", "julia"] as const).map((m) => (
          <li key={m} className="flex justify-between">
            <span>
              {NAMES[m]}
              {m === membership.member ? " (vous)" : ""}
            </span>
            <span className="text-muted">{membership.members.includes(m) ? "connecté·e" : "pas encore"}</span>
          </li>
        ))}
      </ul>
      {!otherJoined && (
        <div className="mt-4 rounded-2xl bg-accent-soft p-3">
          <p className="text-[15px]">
            Invitez {NAMES[other]} avec ce lien, ou le code <strong className="tracking-widest">{membership.inviteCode}</strong>.
          </p>
          <button type="button" onClick={() => void share()} className="mt-3 w-full rounded-2xl bg-accent py-3 font-semibold text-on-accent">
            {copied ? "Lien copié" : `Envoyer l'invitation à ${NAMES[other]}`}
          </button>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="truncate text-muted">{email}</span>
        <button type="button" onClick={() => void signOut()} className="shrink-0 font-medium text-accent">
          Se déconnecter
        </button>
      </div>
    </Card>
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
