import seed from "../../seed/milestones.json";
import type { Milestone } from "./types";
import { milestoneEnd, milestoneStart } from "./dates";

export const MILESTONES = seed as Milestone[];

export interface DatedMilestone extends Milestone {
  start: Date;
  end: Date;
}

export function datedMilestones(dueDate: string): DatedMilestone[] {
  return MILESTONES.flatMap((m) => {
    const start = milestoneStart(m, dueDate);
    if (!start) return [];
    return [{ ...m, start, end: milestoneEnd(m, dueDate) ?? start }];
  }).sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Jalons pas encore terminés, du plus proche au plus lointain. */
export function upcomingMilestones(dueDate: string, on: Date, n = 3): DatedMilestone[] {
  return datedMilestones(dueDate)
    .filter((m) => m.end.getTime() >= on.getTime())
    .slice(0, n);
}
