// Modèle de données partagé (repris de la spec, partie 1, avec les ajouts validés).
// Les tables Supabase de l'étape 2 suivront exactement ces formes.

export type Member = "thomas" | "julia" | "both";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type Status = "todo" | "in_progress" | "done";

export interface Household {
  id: string;
  name: string; // "Famille Gros-Stoltz"
  dueDate: string; // terme prévu, ISO "2027-06-25"
  city: string;
}

/** Date relative à un jalon, pour que tout se recale si le terme change. */
export interface RelativeDate {
  milestone: "dueDate" | "ddr";
  offsetDays: number;
}

export type MilestoneKind = "medical" | "admin" | "achat" | "vie" | "garde" | "voyage";

export interface Milestone {
  id: string;
  title: string;
  kind: MilestoneKind;
  date?: string; // ISO
  endDate?: string; // ISO, pour une période (ex. fenêtre d'échographie)
  relativeTo?: RelativeDate; // remplace date si présent
  description?: string;
  approximate?: boolean; // « fin mars », « vers déc. »
}

export type AppointmentKind =
  | "echo"
  | "sage_femme"
  | "gyneco"
  | "prise_de_sang"
  | "prepa_naissance"
  | "autre";

export interface Appointment {
  id: string;
  title: string;
  kind: AppointmentKind;
  start: string; // ISO date + heure
  location?: string;
  practitioner?: string;
  notes?: string;
  attendees: Member;
}

export interface Task {
  id: string;
  title: string;
  category: "admin" | "sante" | "garde" | "achats" | "maison" | "voyage" | "naissance";
  priority: Priority;
  dueDate?: string;
  dueLabel?: string; // libellé d'origine : « avant fin déc. 2026 »
  relativeTo?: RelativeDate;
  owner: Member;
  status: Status;
  notes?: string;
  link?: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: string;
  priority: "P1" | "P2" | "P3";
  category: string;
  tip?: string;
  healthyMaterial: boolean;
  plannedPrice?: number;
  paidPrice?: number;
  link?: string;
  buyBy?: string;
  purchased: boolean;
  purchasedBy?: Member;
  comparisonId?: string;
}

export interface Product {
  id: string;
  name: string;
  role: "reco" | "alternative" | "ecarte";
  priceMin?: number;
  priceMax?: number;
  pros: string[];
  cons: string[];
  specs?: Record<string, string>;
}

export interface Comparison {
  id: string;
  title: string;
  status: "a_decider" | "choisi" | "achete";
  criteria: string[];
  options: Product[];
  chosenProductId?: string;
  buyWindow?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  author: "thomas" | "julia" | "assistant";
  content: string;
  verdict?: "ok" | "precaution" | "eviter";
  createdAt: string;
}
