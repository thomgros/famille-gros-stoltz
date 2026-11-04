import type { Appointment, AppointmentKind } from "./types";
import { useCollection } from "./useCollection";
import { parseISO } from "./dates";

export const useAppointments = () => useCollection<Appointment>("appointments");

export const APPOINTMENT_KINDS: { value: AppointmentKind; label: string }[] = [
  { value: "echo", label: "Échographie" },
  { value: "sage_femme", label: "Sage-femme" },
  { value: "gyneco", label: "Gynécologue" },
  { value: "prise_de_sang", label: "Prise de sang" },
  { value: "prepa_naissance", label: "Préparation à la naissance" },
  { value: "autre", label: "Autre" },
];

export const kindLabel = (k: AppointmentKind) => APPOINTMENT_KINDS.find((x) => x.value === k)?.label ?? "Autre";

/** Jour (minuit local) du rendez-vous. */
export const appointmentDay = (a: Appointment) => parseISO(a.start.slice(0, 10));

/** Date + heure locale exacte du début (minuit si toute la journée). */
export function appointmentStart(a: Appointment): Date {
  const d = appointmentDay(a);
  if (!a.allDay && a.start.length > 10) {
    const [h, m] = a.start.slice(11, 16).split(":").map(Number);
    d.setHours(h, m);
  }
  return d;
}

export const formatTime = (iso?: string) => (iso && iso.length > 10 ? iso.slice(11, 16).replace(":", " h ") : "");

export function sortAppointments(list: Appointment[]): Appointment[] {
  return [...list].sort((a, b) => appointmentStart(a).getTime() - appointmentStart(b).getTime());
}
