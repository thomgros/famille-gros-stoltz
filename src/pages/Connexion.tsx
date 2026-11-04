import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useHousehold, type MemberName } from "../lib/store";
import { Card } from "../components/ui";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 pt-safe pb-safe">
      <img src="/icon.svg" alt="" className="mx-auto mb-4 size-20 rounded-[22px]" />
      <h1 className="text-center text-[28px] font-bold tracking-tight">Famille Gros-Stoltz</h1>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

const input = "mt-2 block w-full rounded-2xl border border-line bg-surface-2 px-3 py-3 text-base";
const button = "w-full rounded-2xl bg-accent-fill py-3.5 font-semibold text-on-accent disabled:opacity-50";

export function Connexion() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.search },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <Shell>
      <Card>
        {sent ? (
          <>
            <p className="font-semibold">Regardez vos e-mails</p>
            <p className="mt-2 text-[15px] text-muted">
              Un lien de connexion a été envoyé à <strong className="text-ink">{email}</strong>. Ouvrez-le sur ce téléphone.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm font-medium text-accent">
              Changer d'adresse
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label className="block">
              <span className="text-sm font-semibold">Votre adresse e-mail</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            <p className="mt-2 text-sm text-muted">Pas de mot de passe : vous recevez un lien pour vous connecter.</p>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <button type="submit" disabled={busy} className={`${button} mt-4`}>
              {busy ? "Envoi…" : "Recevoir le lien"}
            </button>
          </form>
        )}
      </Card>
    </Shell>
  );
}

export function Foyer() {
  const { refresh, signOut } = useHousehold();
  const fromLink = new URLSearchParams(window.location.search).get("code") ?? "";
  const [mode, setMode] = useState<"create" | "join">(fromLink ? "join" : "create");
  const [member, setMember] = useState<MemberName>(fromLink ? "julia" : "thomas");
  const [code, setCode] = useState(fromLink);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === "create"
        ? await supabase!.rpc("create_household", { p_member: member })
        : await supabase!.rpc("join_household", { p_code: code, p_member: member });
    setBusy(false);
    if (error) return setError(error.message);
    window.history.replaceState(null, "", "/");
    await refresh();
  }

  return (
    <Shell>
      <Card>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1 text-sm font-medium">
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 ${mode === m ? "bg-surface shadow-sm" : "text-muted"}`}
            >
              {m === "create" ? "Créer le foyer" : "Rejoindre"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-4">
          <p className="text-sm font-semibold">Vous êtes</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["thomas", "julia"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMember(m)}
                className={`rounded-2xl border py-3 font-medium ${member === m ? "border-accent bg-accent-soft" : "border-line"}`}
              >
                {m === "thomas" ? "Thomas" : "Julia"}
              </button>
            ))}
          </div>
          {mode === "join" && (
            <label className="mt-4 block">
              <span className="text-sm font-semibold">Code d'invitation</span>
              <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={`${input} tracking-[0.3em]`} maxLength={6} />
            </label>
          )}
          <p className="mt-3 text-sm text-muted">
            {mode === "create"
              ? "Le foyer est créé avec toutes les données du projet. Vous inviterez l'autre parent depuis les Réglages."
              : "Le code se trouve dans les Réglages de l'autre parent."}
          </p>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className={`${button} mt-4`}>
            {busy ? "Un instant…" : mode === "create" ? "Créer le foyer" : "Rejoindre le foyer"}
          </button>
        </form>
      </Card>
      <button type="button" onClick={() => void signOut()} className="w-full text-sm text-muted">
        Se déconnecter
      </button>
    </Shell>
  );
}

export function Chargement() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <img src="/icon.svg" alt="Chargement" className="size-16 animate-pulse rounded-[18px]" />
    </div>
  );
}
