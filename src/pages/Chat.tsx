import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Page } from "../components/ui";
import { Segmented } from "../components/sheet";
import { REPERES, type Verdict } from "../data/reperes";
import { supabase } from "../lib/supabase";
import { useHousehold } from "../lib/store";
import { newId, useCollection } from "../lib/useCollection";
import { pregnancyStatus } from "../lib/dates";
import type { ChatMessage } from "../lib/types";

const VERDICT: Record<Verdict, { label: string; emoji: string; color: string }> = {
  ok: { label: "Autorisé", emoji: "✅", color: "var(--k-garde)" },
  precaution: { label: "Avec précautions", emoji: "⚠️", color: "var(--k-vie)" },
  eviter: { label: "À éviter", emoji: "❌", color: "var(--k-naissance)" },
  inconnu: { label: "Pas sûr", emoji: "❔", color: "var(--muted)" },
};

function VerdictBadge({ v }: { v: Verdict }) {
  const s = VERDICT[v];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}>
      {s.emoji} {s.label}
    </span>
  );
}

const SUGGESTIONS = ["Je peux manger des sushis ?", "Le comté, c'est autorisé ?", "Combien de cafés par jour ?", "Le Doliprane, c'est bon ?", "Une teinture pour les cheveux ?", "Le saumon fumé ?"];
const NAMES = { thomas: "Thomas", julia: "Julia" } as const;

type View = "chat" | "reperes";

export function Chat() {
  const [params, setParams] = useSearchParams();
  const view = (params.get("vue") as View | null) ?? "chat";
  return (
    <Page tone="rose" title="Chat" subtitle="Aliments et substances">
      <Segmented
        value={view}
        onChange={(v) => setParams(v === "chat" ? {} : { vue: v }, { replace: true })}
        options={[
          { value: "chat", label: "Poser une question" },
          { value: "reperes", label: "Repères" },
        ]}
      />
      {view === "chat" ? <Conversation /> : <Reperes />}
    </Page>
  );
}

async function explainError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.status === "number") {
    if (ctx.status === 404) return "Le chat n'est pas encore installé dans Supabase (fonction « chat » introuvable).";
    try {
      const body = await ctx.json();
      if (body?.error) return body.error;
    } catch {
      /* corps illisible */
    }
    return `Erreur ${ctx.status}.`;
  }
  return "Pas de connexion, ou le service ne répond pas. Réessayez dans un instant.";
}

function Conversation() {
  const { household, membership } = useHousehold();
  const me = membership?.member;
  const { docs, save, remove } = useCollection<ChatMessage>("chat");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = [...docs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setError(null);
    if (!supabase || !me) {
      setError("Le chat fonctionne une fois connecté à votre foyer.");
      return;
    }
    const userMsg: ChatMessage = { id: newId(), author: me, content: question, createdAt: new Date().toISOString() };
    save(userMsg);
    setText("");
    setBusy(true);
    // On envoie les derniers échanges pour que l'IA comprenne les questions de suivi.
    const history = [...messages, userMsg].slice(-8).map((m) => ({
      role: m.author === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.author === "assistant" ? `${m.title ? m.title + ". " : ""}${m.content}` : m.content,
    }));
    const { data, error: err } = await supabase.functions.invoke("chat", { body: { messages: history, sa: pregnancyStatus(household.dueDate).sa } });
    setBusy(false);
    if (err || !data) {
      setError(await explainError(err));
      return;
    }
    save({
      id: newId(),
      author: "assistant",
      content: data.reponse,
      title: data.titre || undefined,
      verdict: data.verdict,
      sources: data.sources,
      createdAt: new Date().toISOString(),
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(text);
  }

  return (
    <>
      {messages.length === 0 && (
        <Card tint>
          <p className="font-semibold text-tone-strong">Posez une question 👋</p>
          <p className="mt-1 text-[15px]">Un aliment, une boisson, un médicament, un cosmétique… La réponse s'appuie sur les recommandations françaises. Julia et Thomas voient les mêmes échanges.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => void ask(s)} className="rounded-full bg-white/75 px-3 py-1.5 text-[14px]">
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {messages.map((m) =>
          m.author === "assistant" ? (
            <div key={m.id} className="mr-6 rounded-3xl rounded-tl-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                {m.verdict && <VerdictBadge v={m.verdict} />}
                {m.title && <p className="font-semibold">{m.title}</p>}
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed">{m.content}</p>
              {m.sources && m.sources.length > 0 && <p className="mt-2 text-[12px] text-muted">Sources : {m.sources.join(", ")}</p>}
            </div>
          ) : (
            <div key={m.id} className="ml-10 flex flex-col items-end">
              <p className="pb-0.5 pr-2 text-[11px] text-muted">{NAMES[m.author as "thomas" | "julia"] ?? ""}</p>
              <div className="group relative rounded-3xl rounded-tr-lg bg-tone-mid px-4 py-2.5 text-[15px]">
                {m.content}
                {m.author === me && (
                  <button type="button" onClick={() => remove(m.id)} className="absolute -left-7 top-1/2 hidden -translate-y-1/2 text-muted group-hover:block" aria-label="Supprimer la question">
                    ×
                  </button>
                )}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="mr-6 rounded-3xl rounded-tl-lg border border-line bg-surface px-4 py-3 text-[15px] text-muted">
            <span className="animate-pulse">Recherche dans les recommandations…</span>
          </div>
        )}
        {error && (
          <Card tint className="text-[15px]">
            <p className="font-semibold text-danger">Pas de réponse</p>
            <p className="mt-1">{error}</p>
          </Card>
        )}
        <div ref={endRef} />
      </div>

      <p className="px-1 text-[12px] leading-snug text-muted">
        Réponses générées par une IA (Google Gemini) : elles peuvent se tromper. Pour un médicament ou un symptôme, demandez au médecin, à la sage-femme ou au pharmacien. En cas d'urgence : maternité ou 15.
      </p>

      <form onSubmit={submit} className="sticky bottom-[84px] z-10 flex items-end gap-2 rounded-3xl border border-tone-mid/60 bg-surface/95 p-1.5 pl-4 shadow-sm backdrop-blur">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(text);
            }
          }}
          rows={1}
          placeholder="Ex. : je peux manger du foie gras ?"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent py-2 text-[16px] outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={busy || !text.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-tone-strong text-white disabled:opacity-35" aria-label="Envoyer">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </>
  );
}

function Reperes() {
  return (
    <>
      <p className="px-1 text-[14px] text-muted">Repères généraux d'après les recommandations françaises. Disponibles sans connexion. À confirmer avec la sage-femme ou le médecin.</p>
      {REPERES.map((g) => (
        <div key={g.titre}>
          <h2 className="flex items-center gap-2 px-1 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-tone-strong">
            <span aria-hidden>{g.emoji}</span>
            {g.titre}
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-tone-mid/40 bg-surface">
            {g.items.map((r) => (
              <div key={r.sujet} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{r.sujet}</p>
                  <VerdictBadge v={r.verdict} />
                </div>
                <p className="mt-1 text-[14px] leading-snug text-muted">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="px-1 text-[13px] text-muted">
        Pour aller plus loin : 1000-premiers-jours.fr, lecrat.fr (médicaments), ameli.fr.
      </p>
    </>
  );
}
