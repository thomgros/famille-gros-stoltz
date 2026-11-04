import type { Milestone } from "./types";
import { milestoneEnd, milestoneStart } from "./dates";
import { useCollection } from "./useCollection";

export interface DatedMilestone extends Milestone {
  start: Date;
  end: Date;
}

export function datedMilestones(list: Milestone[], dueDate: string): DatedMilestone[] {
  return list
    .flatMap((m) => {
      const start = milestoneStart(m, dueDate);
      if (!start) return [];
      return [{ ...m, start, end: milestoneEnd(m, dueDate) ?? start }];
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Jalons pas encore terminés, du plus proche au plus lointain. */
export function upcomingMilestones(list: Milestone[], dueDate: string, on: Date, n = 3): DatedMilestone[] {
  return datedMilestones(list, dueDate)
    .filter((m) => m.end.getTime() >= on.getTime())
    .slice(0, n);
}

export const useMilestones = () => useCollection<Milestone>("milestones");
