// Fonction Supabase « chat » : pose la question à une IA avec les consignes de l'app.
//
// À déployer dans Supabase > Edge Functions > « Deploy a new function » > « Via Editor »,
// nom : chat. Secret à ajouter (Edge Functions > Secrets), l'un ou l'autre :
//   GEMINI_API_KEY   (Google Gemini, offre gratuite)  ← utilisé en priorité
//   MISTRAL_API_KEY  (Mistral, offre payante à l'usage)
// Facultatif : GEMINI_MODEL ou MISTRAL_MODEL pour changer de modèle.
//
// Sécurité : Supabase vérifie que l'appel vient d'un utilisateur connecté, puis cette
// fonction vérifie qu'il fait partie d'un foyer. La clé ne quitte jamais le serveur.

import { createClient } from "npm:@supabase/supabase-js@2.47.10";

// Modèles essayés dans l'ordre : si l'un est surchargé (503) ou saturé (429), on passe au suivant.
const GEMINI_MODELS = [
  ...(Deno.env.get("GEMINI_MODEL") ? [Deno.env.get("GEMINI_MODEL")!] : []),
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
];
const MISTRAL_MODEL = Deno.env.get("MISTRAL_MODEL") ?? "mistral-small-latest";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Tu es l'assistant de l'app « Famille Gros-Stoltz ». Thomas et Julia, qui vivent à Paris, attendent un bébé. Julia est enceinte. Tu réponds à leurs questions sur ce qui est autorisé ou non pendant la grossesse : aliments, boissons, substances, médicaments, cosmétiques, produits ménagers, activités, voyages.

Règles :
- Appuie-toi sur les recommandations officielles françaises : Santé publique France et le site « 1000 premiers jours », l'ANSES, la HAS, l'ANSM, et le CRAT (lecrat.fr) pour les médicaments. Si une recommandation française existe, c'est elle qui compte.
- Sois concret et bref : 2 à 5 phrases, en français simple, en vouvoyant. Donne le « comment » quand c'est utile (bien cuit, croûte retirée, quantité maximale par jour…).
- Médicaments et compléments : ne donne jamais de posologie. Indique ce que disent les repères généraux, puis dis toujours de demander confirmation au médecin, à la sage-femme ou au pharmacien. Le verdict ne peut pas être « ok » pour un médicament.
- Toxoplasmose : si la réponse en dépend, précise que cela dépend du statut immunitaire de Julia (sérologie).
- Si la question décrit des symptômes inquiétants (saignements, douleurs fortes, fièvre, bébé qui bouge moins, perte de liquide), dis d'appeler la maternité ou le 15 sans attendre.
- Si tu n'es pas sûr, dis-le et mets le verdict « inconnu ».
- Si la question n'a rien à voir avec la grossesse, réponds poliment que tu ne traites que ce sujet.

Réponds uniquement avec un objet JSON de la forme :
{"verdict": "ok" | "precaution" | "eviter" | "inconnu", "titre": "réponse en quelques mots", "reponse": "2 à 5 phrases", "sources": ["Santé publique France", "…"]}
« ok » = autorisé ; « precaution » = possible avec des précautions ou avec modération ; « eviter » = à éviter pendant la grossesse.`;

interface Turn {
  role: "user" | "assistant";
  content: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const mistralKey = Deno.env.get("MISTRAL_API_KEY");
  if (!geminiKey && !mistralKey) return json({ error: "Aucune clé d'IA configurée dans Supabase (secret GEMINI_API_KEY)." }, 500);

  // Seuls les membres d'un foyer peuvent utiliser le chat.
  const auth = req.headers.get("Authorization") ?? "";
  // Clé publique du projet : celle de l'environnement, sinon celle envoyée par l'app (nouveau système « publishable »).
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || req.headers.get("apikey") || "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, publicKey, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return json({ error: "Non connecté" }, 401);
  const { data: member } = await sb.from("household_members").select("household_id").eq("user_id", userData.user.id).maybeSingle();
  if (!member) return json({ error: "Réservé aux membres du foyer" }, 403);

  let body: { mode?: string; messages?: Turn[]; sa?: number; sujet?: string; precisions?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide" }, 400);
  }

  if (body.mode === "comparatif") return await creerComparatif(body.sujet, body.precisions, geminiKey, mistralKey);
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (history.length === 0 || history[history.length - 1].role !== "user") return json({ error: "Question manquante" }, 400);

  const context = typeof body.sa === "number" && body.sa >= 0 && body.sa <= 45 ? `\n\nAujourd'hui, Julia est à ${body.sa} semaines d'aménorrhée (SA).` : "";

  const system = SYSTEM + context;
  let text: string;
  try {
    text = geminiKey ? await askGemini(geminiKey, system, history) : await askMistral(mistralKey!, system, history);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err.status === 429 && !geminiKey) return json({ error: "Trop de questions d'un coup. Réessayez dans une minute." }, 429);
    return json({ error: err.message ?? "Le service d'IA ne répond pas." }, 502);
  }

  // Certains modèles entourent le JSON de ```json … ``` : on l'extrait.
  text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(text);
    const verdict = ["ok", "precaution", "eviter", "inconnu"].includes(parsed.verdict) ? parsed.verdict : "inconnu";
    return json({
      verdict,
      titre: String(parsed.titre ?? "").slice(0, 120),
      reponse: String(parsed.reponse ?? text).slice(0, 2000),
      sources: Array.isArray(parsed.sources) ? parsed.sources.map(String).slice(0, 5) : [],
    });
  } catch {
    // Réponse non JSON : on la renvoie telle quelle.
    return json({ verdict: "inconnu", titre: "", reponse: text.slice(0, 2000), sources: [] });
  }
});

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface GeminiResult {
  text: string;
  sources: { title: string; url: string }[];
}

async function askGemini(key: string, system: string, history: Turn[]): Promise<string> {
  return (await callGemini(key, system, history, { search: false, maxTokens: 4096 })).text;
}

/** search : recherche Google pour des informations à jour (prix, disponibilité). */
async function callGemini(key: string, system: string, history: Turn[], opts: { search: boolean; maxTokens: number }): Promise<GeminiResult> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    // La recherche Google ne se combine pas avec le mode JSON : on demande alors le JSON dans le texte.
    ...(opts.search ? { tools: [{ google_search: {} }] } : {}),
    generationConfig: { temperature: 0.2, maxOutputTokens: opts.maxTokens, ...(opts.search ? {} : { responseMimeType: "application/json" }) },
  });
  let last: ApiError | null = null;
  for (const model of [...new Set(GEMINI_MODELS)]) {
    // Deux essais par modèle, avec une courte pause, avant de passer au suivant.
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body,
      });
      if (r.ok) {
        const data = await r.json();
        const cand = data?.candidates?.[0];
        const parts: { text?: string }[] = cand?.content?.parts ?? [];
        const text = parts.map((p) => p.text ?? "").join("");
        const chunks: { web?: { uri?: string; title?: string } }[] = cand?.groundingMetadata?.groundingChunks ?? [];
        const sources = chunks
          .filter((c) => c.web?.uri)
          .map((c) => ({ title: String(c.web!.title ?? "source"), url: String(c.web!.uri) }))
          .slice(0, 8);
        if (text) return { text, sources };
        last = new ApiError(502, "Gemini n'a pas donné de réponse (question peut-être bloquée par ses filtres).");
        break;
      }
      const detail = (await r.text()).slice(0, 200);
      last = new ApiError(r.status, `Gemini a répondu ${r.status} : ${detail}`);
      if (r.status === 404) break; // modèle inconnu : on passe directement au suivant
      if (r.status !== 503 && r.status !== 429 && r.status !== 500) throw last; // clé refusée, requête invalide…
      await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
    }
  }
  if (last && (last.status === 503 || last.status === 429)) {
    throw new ApiError(503, "Les serveurs gratuits de Google sont saturés en ce moment. Réessayez dans quelques minutes.");
  }
  throw last ?? new ApiError(502, "Gemini ne répond pas.");
}

async function askMistral(key: string, system: string, history: Turn[]): Promise<string> {
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, ...history],
    }),
  });
  if (!r.ok) throw new ApiError(r.status, `Mistral a répondu ${r.status} : ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------- Comparatifs générés

const COMPARATIF_SYSTEM = `Tu prépares des comparatifs d'équipement pour bébé pour Thomas et Julia, futurs parents. Le bébé naît début juillet 2027. Ils vivent dans un appartement à Paris 18e, sans voiture (métro, train, taxi, à pied).

Leurs priorités, dans cet ordre :
1. La sécurité du bébé : normes européennes en vigueur (EN, i-Size, EN 71…), rappels de produits connus, recommandations officielles (couchage, portage…). Écarte tout ce qui n'est pas sûr, et dis pourquoi.
2. Les matières les plus saines possibles : coton bio GOTS, OEKO-TEX Standard 100, bois massif huilé ou peint à l'eau, verre, inox, silicone platine, sans PVC, sans phtalates, sans BPA, sans retardateurs de flamme, sans parfum, le moins de perturbateurs endocriniens possible. Méfiance envers MDF, aggloméré, contreplaqué, mélamine, « bambou » à la mélamine, vernis solvantés.
3. La praticité dans un appartement parisien sans voiture, puis la durée d'usage et la revente.
4. Le prix.

Règles :
- Produits réellement vendus en France aujourd'hui, prix en euros constatés chez des vendeurs français. Si un prix est incertain, mets la fourchette la plus honnête possible.
- 5 à 8 produits : 1 « reco » (parfois 2 si deux usages différents), 2 ou 3 « alternative », éventuellement des « autre », et au moins 1 « ecarte » avec la raison dans les points faibles.
- Points forts et faibles courts et concrets (matière, norme, poids, taille, durée d'usage).
- Conseils : 3 à 6 phrases utiles (quand acheter, ce qu'il faut vérifier sur l'étiquette, occasion ou pas, sécurité).
- Ne jamais inventer une certification : écris « à vérifier » si tu n'es pas sûr.

Réponds uniquement avec un objet JSON, sans texte autour :
{"title": "Sujet court", "emoji": "un emoji", "statusNote": "1 phrase de synthèse : ce qu'on recommande et pourquoi", "intro": "ce qui a été comparé (facultatif)", "criteria": ["5 à 8 critères courts"], "buyWindow": "quand acheter, par ex. « vers 5 mois (déc. 2027) »", "itemCategory": "Sommeil | Change | Toilette et santé | Repas | Vêtements | Sorties et transports | Éveil | Sécurité de l'appartement | Grand équipement", "itemPriority": "P1 (pour la naissance) | P2 (plus tard) | P3 (optionnel)", "options": [{"name": "Marque Modèle", "role": "reco | alternative | autre | ecarte", "tag": "facultatif, ex. Petit budget", "priceMin": 0, "priceMax": 0, "pros": ["…"], "cons": ["…"], "specs": {"Matière": "…", "Norme": "…"}}], "tips": ["…"]}`;

const CATEGORIES = ["Sommeil", "Change", "Toilette et santé", "Repas", "Vêtements", "Sorties et transports", "Éveil", "Sécurité de l'appartement", "Grand équipement"];
const ROLES = ["reco", "alternative", "autre", "ecarte"];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, n) : []);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 && n < 100000 ? Math.round(n * 100) / 100 : undefined;
};

function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("JSON introuvable");
  }
}

async function creerComparatif(sujetRaw: unknown, precisionsRaw: unknown, geminiKey?: string, mistralKey?: string) {
  const sujet = str(sujetRaw, 120);
  const precisions = str(precisionsRaw, 600);
  if (!sujet) return json({ error: "Indiquez le sujet du comparatif." }, 400);

  const question = `Prépare le comparatif : « ${sujet} ».${precisions ? `\nPrécisions des parents : ${precisions}` : ""}`;
  const turns: Turn[] = [{ role: "user", content: question }];

  let text = "";
  let sources: { title: string; url: string }[] = [];
  try {
    if (geminiKey) {
      try {
        ({ text, sources } = await callGemini(geminiKey, COMPARATIF_SYSTEM, turns, { search: true, maxTokens: 8192 }));
      } catch (e) {
        // Recherche Google indisponible (quota, modèle) : on refait sans recherche.
        const err = e as ApiError;
        if (err.status === 401 || err.status === 403) throw e;
        ({ text, sources } = await callGemini(geminiKey, COMPARATIF_SYSTEM, turns, { search: false, maxTokens: 8192 }));
      }
    } else {
      text = await askMistral(mistralKey!, COMPARATIF_SYSTEM, turns);
    }
  } catch (e) {
    const err = e as { message?: string };
    return json({ error: err.message ?? "Le service d'IA ne répond pas." }, 502);
  }

  let raw: Record<string, unknown>;
  try {
    raw = extractJson(text) as Record<string, unknown>;
  } catch {
    return json({ error: "L'IA n'a pas rendu un comparatif lisible. Réessayez." }, 502);
  }

  const options = (Array.isArray(raw.options) ? raw.options : [])
    .slice(0, 10)
    .map((o: Record<string, unknown>) => {
      const specsIn = o.specs && typeof o.specs === "object" ? (o.specs as Record<string, unknown>) : {};
      const specs = Object.fromEntries(
        Object.entries(specsIn)
          .slice(0, 8)
          .map(([k, v]) => [str(k, 40), str(String(v ?? ""), 160)])
          .filter(([k, v]) => k && v),
      );
      const priceMin = num(o.priceMin);
      return {
        name: str(o.name, 100),
        role: ROLES.includes(String(o.role)) ? String(o.role) : "autre",
        tag: str(o.tag, 60) || undefined,
        priceMin,
        priceMax: num(o.priceMax) ?? priceMin,
        pros: strList(o.pros, 6, 200),
        cons: strList(o.cons, 6, 200),
        specs: Object.keys(specs).length ? specs : undefined,
      };
    })
    .filter((o) => o.name);
  if (options.length === 0) return json({ error: "L'IA n'a proposé aucun produit. Précisez le sujet et réessayez." }, 502);

  const category = str(raw.itemCategory, 40);
  const prio = str(raw.itemPriority, 4).slice(0, 2);
  return json({
    title: str(raw.title, 80) || sujet,
    emoji: str(raw.emoji, 8) || undefined,
    statusNote: str(raw.statusNote, 400) || undefined,
    intro: str(raw.intro, 400) || undefined,
    criteria: strList(raw.criteria, 10, 80),
    buyWindow: str(raw.buyWindow, 80) || undefined,
    itemCategory: CATEGORIES.includes(category) ? category : "Grand équipement",
    itemPriority: ["P1", "P2", "P3"].includes(prio) ? prio : "P1",
    options,
    tips: strList(raw.tips, 8, 400),
    webSources: sources,
  });
}
