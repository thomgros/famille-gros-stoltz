// Repères moyens de développement, semaine d'aménorrhée par semaine d'aménorrhée.
// Taille : longueur cranio-caudale (tête-fesses) jusqu'à 20 SA, puis taille tête-talons.
// Ce sont des moyennes : chaque bébé grandit à son rythme, l'échographie fait foi.

export interface FetusWeek {
  sa: number;
  sizeCm: number;
  weightG?: number;
  fruit: string;
  emoji?: string;
  development: string;
  forParents?: string;
}

export const FETUS_WEEKS: FetusWeek[] = [
  { sa: 4, sizeCm: 0.1, fruit: "une graine de pavot", development: "L'œuf s'implante dans l'utérus. Le placenta commence à se former.", forParents: "Le test de grossesse devient positif." },
  { sa: 5, sizeCm: 0.2, fruit: "une graine de sésame", development: "Le tube neural, futur cerveau et moelle épinière, se forme." },
  { sa: 6, sizeCm: 0.5, fruit: "une lentille", development: "Le cœur commence à battre. Les ébauches des yeux et des oreilles apparaissent." },
  { sa: 7, sizeCm: 1, fruit: "une myrtille", emoji: "🫐", development: "Les bourgeons des bras et des jambes poussent. Le cerveau grandit très vite." },
  { sa: 8, sizeCm: 1.6, weightG: 1, fruit: "une framboise", development: "Les doigts commencent à se dessiner. Il bouge déjà, mais on ne le sent pas." },
  { sa: 9, sizeCm: 2.3, weightG: 2, fruit: "une cerise", emoji: "🍒", development: "Les paupières, le nez et les oreilles prennent forme." },
  { sa: 10, sizeCm: 3.1, weightG: 4, fruit: "une fraise", emoji: "🍓", development: "Tous les organes sont ébauchés : l'embryon devient un fœtus." },
  { sa: 11, sizeCm: 4.1, weightG: 7, fruit: "une figue", development: "Les os commencent à durcir, les ongles apparaissent." },
  { sa: 12, sizeCm: 5.4, weightG: 14, fruit: "un citron vert", emoji: "🍋‍🟩", development: "Il a ses premiers réflexes et peut ouvrir et fermer les mains.", forParents: "Période de la 1re échographie (11 à 14 SA)." },
  { sa: 13, sizeCm: 7.4, weightG: 23, fruit: "un citron", emoji: "🍋", development: "Les empreintes digitales se forment." },
  { sa: 14, sizeCm: 8.7, weightG: 43, fruit: "une pêche", emoji: "🍑", development: "Il peut sucer son pouce et faire des grimaces." },
  { sa: 15, sizeCm: 10, weightG: 70, fruit: "une pomme", emoji: "🍎", development: "Il perçoit la lumière à travers ses paupières fermées." },
  { sa: 16, sizeCm: 11.6, weightG: 100, fruit: "un avocat", emoji: "🥑", development: "Ses mouvements deviennent coordonnés.", forParents: "Début du 2e trimestre." },
  { sa: 17, sizeCm: 13, weightG: 140, fruit: "une poire", emoji: "🍐", development: "Le squelette, encore souple, se transforme en os." },
  { sa: 18, sizeCm: 14.2, weightG: 190, fruit: "un poivron", emoji: "🫑", development: "Il commence à entendre les sons, d'abord ceux du corps de sa mère." },
  { sa: 19, sizeCm: 15.3, weightG: 240, fruit: "une mangue", emoji: "🥭", development: "Une crème protectrice, le vernix, recouvre sa peau." },
  { sa: 20, sizeCm: 16.4, weightG: 300, fruit: "une banane", emoji: "🍌", development: "Il est à mi-parcours.", forParents: "Les premiers mouvements se sentent souvent entre 18 et 22 SA." },
  { sa: 21, sizeCm: 26.7, weightG: 360, fruit: "une carotte", emoji: "🥕", development: "Il avale du liquide amniotique, ce qui entraîne son système digestif." },
  { sa: 22, sizeCm: 27.8, weightG: 430, fruit: "une papaye", development: "Les sourcils et les cheveux apparaissent.", forParents: "Période de la 2e échographie (20 à 25 SA)." },
  { sa: 23, sizeCm: 28.9, weightG: 500, fruit: "un pamplemousse", development: "Il reconnaît peu à peu la voix de ses parents." },
  { sa: 24, sizeCm: 30, weightG: 600, fruit: "un épi de maïs", emoji: "🌽", development: "Les poumons fabriquent leurs premières substances pour respirer plus tard." },
  { sa: 25, sizeCm: 34.6, weightG: 660, fruit: "un chou-fleur", development: "Ses mains serrent ce qu'elles touchent, comme le cordon." },
  { sa: 26, sizeCm: 35.6, weightG: 760, fruit: "une laitue", emoji: "🥬", development: "Il alterne des phases de sommeil et d'éveil." },
  { sa: 27, sizeCm: 36.6, weightG: 875, fruit: "un chou", development: "Il commence à ouvrir les yeux." },
  { sa: 28, sizeCm: 37.6, weightG: 1000, fruit: "une aubergine", emoji: "🍆", development: "Il rêve : le sommeil paradoxal apparaît." },
  { sa: 29, sizeCm: 38.6, weightG: 1150, fruit: "une courge butternut", development: "Ses muscles et ses poumons mûrissent.", forParents: "Début du 3e trimestre." },
  { sa: 30, sizeCm: 39.9, weightG: 1300, fruit: "un gros concombre", emoji: "🥒", development: "Le cerveau se plisse et se développe beaucoup." },
  { sa: 31, sizeCm: 41.1, weightG: 1500, fruit: "une noix de coco", emoji: "🥥", development: "Il tourne la tête vers les sons et la lumière." },
  { sa: 32, sizeCm: 42.4, weightG: 1700, fruit: "un ananas", emoji: "🍍", development: "Il prend souvent la position tête en bas.", forParents: "Période de la 3e échographie (30 à 35 SA)." },
  { sa: 33, sizeCm: 43.7, weightG: 1900, fruit: "un céleri-rave", development: "Ses os durcissent, sauf ceux du crâne qui restent souples pour la naissance." },
  { sa: 34, sizeCm: 45, weightG: 2100, fruit: "un melon", emoji: "🍈", development: "Ses ongles atteignent le bout des doigts.", forParents: "Début du congé maternité (6 semaines avant le terme)." },
  { sa: 35, sizeCm: 46.2, weightG: 2400, fruit: "un melon miel", development: "Il prend environ 200 g par semaine." },
  { sa: 36, sizeCm: 47.4, weightG: 2600, fruit: "une laitue romaine", development: "Il a moins de place et bouge plus lentement." },
  { sa: 37, sizeCm: 48.6, weightG: 2850, fruit: "une blette", development: "Il est considéré à terme : il peut naître à tout moment." },
  { sa: 38, sizeCm: 49.8, weightG: 3100, fruit: "un poireau", development: "Ses poumons sont prêts à respirer." },
  { sa: 39, sizeCm: 50.7, weightG: 3300, fruit: "une petite pastèque", emoji: "🍉", development: "Il continue de faire des réserves." },
  { sa: 40, sizeCm: 51.2, weightG: 3400, fruit: "une citrouille", emoji: "🎃", development: "Il est prêt à rencontrer ses parents." },
  { sa: 41, sizeCm: 51.5, weightG: 3500, fruit: "une pastèque", emoji: "🍉", development: "Terme français (41 SA). Le suivi devient rapproché à la maternité." },
];

export function fetusWeek(sa: number): FetusWeek {
  const clamped = Math.min(41, Math.max(4, sa));
  return FETUS_WEEKS.find((w) => w.sa === clamped)!;
}

export function formatSize(cm: number): string {
  if (cm < 1) return `${Math.round(cm * 10)} mm`;
  return `${cm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} cm`;
}

export function formatWeight(g?: number): string {
  if (g === undefined) return "< 1 g";
  if (g < 1000) return `${g} g`;
  return `${(g / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg`;
}
