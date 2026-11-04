// Fonction Supabase « chat » : pose la question à Mistral avec les consignes de l'app.
//
// À déployer dans Supabase > Edge Functions > « Deploy a new function » > « Via Editor »,
// nom : chat. Secret à ajouter (Edge Functions > Secrets) : MISTRAL_API_KEY.
//
// Sécurité : Supabase vérifie que l'appel vient d'un utilisateur connecté, puis cette
// fonction vérifie qu'il fait partie d'un foyer. La clé Mistral ne quitte jamais le serveur.

import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const MODEL = Deno.env.get("MISTRAL_MODEL") ?? "mistral-small-latest";

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

  const key = Deno.env.get("MISTRAL_API_KEY");
  if (!key) return json({ error: "La clé Mistral n'est pas configurée (secret MISTRAL_API_KEY)." }, 500);

  // Seuls les membres d'un foyer peuvent utiliser le chat.
  const auth = req.headers.get("Authorization") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return json({ error: "Non connecté" }, 401);
  const { data: member } = await sb.from("household_members").select("household_id").eq("user_id", userData.user.id).maybeSingle();
  if (!member) return json({ error: "Réservé aux membres du foyer" }, 403);

  let body: { messages?: Turn[]; sa?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide" }, 400);
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (history.length === 0 || history[history.length - 1].role !== "user") return json({ error: "Question manquante" }, 400);

  const context = typeof body.sa === "number" && body.sa >= 0 && body.sa <= 45 ? `\n\nAujourd'hui, Julia est à ${body.sa} semaines d'aménorrhée (SA).` : "";

  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM + context }, ...history],
    }),
  });

  if (r.status === 429) return json({ error: "Trop de questions d'un coup pour l'offre gratuite de Mistral. Réessayez dans une minute." }, 429);
  if (!r.ok) return json({ error: `Mistral a répondu ${r.status}`, detail: (await r.text()).slice(0, 300) }, 502);

  const data = await r.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
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
