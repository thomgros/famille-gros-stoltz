// Repères généraux pendant la grossesse, d'après les recommandations françaises
// (Santé publique France / 1000 premiers jours, ANSES, ANSM, CRAT).
// Fiche fixe, lisible sans connexion. À confirmer avec la sage-femme ou le médecin.

export type Verdict = "ok" | "precaution" | "eviter" | "inconnu";

export interface Repere {
  sujet: string;
  verdict: Verdict;
  detail: string;
}

export const REPERES: { titre: string; emoji: string; items: Repere[] }[] = [
  {
    titre: "Boissons et substances",
    emoji: "🥤",
    items: [
      { sujet: "Alcool", verdict: "eviter", detail: "Zéro alcool pendant toute la grossesse, même un verre." },
      { sujet: "Tabac, cigarette électronique, cannabis", verdict: "eviter", detail: "À arrêter. La sage-femme peut orienter vers une aide à l'arrêt." },
      { sujet: "Café, thé, boissons énergisantes", verdict: "precaution", detail: "Limiter la caféine : pas plus de 2 tasses de café par jour environ. Éviter les boissons énergisantes." },
      { sujet: "Réglisse", verdict: "precaution", detail: "Pas en grande quantité (bonbons, boissons à la réglisse)." },
      { sujet: "Soja (tofu, boissons au soja)", verdict: "precaution", detail: "Limiter : pas plus d'un produit à base de soja par jour." },
    ],
  },
  {
    titre: "Aliments",
    emoji: "🍽️",
    items: [
      { sujet: "Fromages au lait cru", verdict: "eviter", detail: "Risque de listériose. Possibles : fromages pasteurisés, et pâtes pressées cuites (comté, emmental, parmesan) en retirant la croûte. Cuit au four : possible." },
      { sujet: "Viande crue ou peu cuite (tartare, carpaccio, rosé)", verdict: "eviter", detail: "Bien cuire la viande à cœur." },
      { sujet: "Charcuterie (jambon cru, saucisson, pâtés, rillettes, foie gras)", verdict: "eviter", detail: "Possible : jambon cuit sous vide. Les lardons bien cuits sont possibles." },
      { sujet: "Poisson cru, sushis, poisson fumé, coquillages crus", verdict: "eviter", detail: "Possible : poisson et fruits de mer bien cuits." },
      { sujet: "Œufs crus ou peu cuits (mayonnaise maison, mousse au chocolat)", verdict: "eviter", detail: "Œufs bien cuits, jaune compris. Les mayonnaises industrielles sont possibles." },
      { sujet: "Graines germées crues", verdict: "eviter", detail: "Possible si elles sont cuites." },
      { sujet: "Poissons prédateurs (espadon, marlin, requin, lamproie)", verdict: "eviter", detail: "À cause du mercure. Thon, bar, dorade, lotte : à limiter. Les autres poissons sont recommandés 2 fois par semaine, dont un gras (sardine, maquereau)." },
      { sujet: "Fruits, légumes et herbes crus", verdict: "precaution", detail: "Bien laver et éplucher. Si Julia n'est pas immunisée contre la toxoplasmose, encore plus de vigilance (terre, viande crue, litière du chat)." },
    ],
  },
  {
    titre: "Médicaments et soins",
    emoji: "💊",
    items: [
      { sujet: "Tout médicament, même sans ordonnance", verdict: "precaution", detail: "Toujours demander au médecin, à la sage-femme ou au pharmacien. Le site lecrat.fr fait référence." },
      { sujet: "Anti-inflammatoires (ibuprofène, aspirine contre la douleur)", verdict: "eviter", detail: "Interdits à partir du 6e mois (24 SA), à éviter avant sauf avis médical." },
      { sujet: "Huiles essentielles", verdict: "eviter", detail: "À éviter, surtout au 1er trimestre, sauf avis médical." },
      { sujet: "Compléments alimentaires et tisanes", verdict: "precaution", detail: "Seulement sur conseil. L'acide folique (vitamine B9) est en général prescrit en début de grossesse." },
    ],
  },
  {
    titre: "Quotidien",
    emoji: "🏠",
    items: [
      { sujet: "Litière du chat, jardinage", verdict: "precaution", detail: "Gants, ou laisser quelqu'un d'autre s'en charger, en cas de non-immunité à la toxoplasmose." },
      { sujet: "Peinture, produits ménagers forts, solvants", verdict: "precaution", detail: "Aérer, porter des gants, privilégier les produits sans solvant. Laisser les gros travaux à quelqu'un d'autre." },
      { sujet: "Bain chaud, sauna, hammam", verdict: "precaution", detail: "Bain tiède possible. Éviter les fortes chaleurs (sauna, hammam, jacuzzi)." },
      { sujet: "Activité physique douce (marche, natation, yoga prénatal)", verdict: "ok", detail: "Recommandée, sauf contre-indication médicale." },
    ],
  },
];
