/* STUB (WP0). WP2-internal: the schedule from DEMO (§5.2.2) driving the one useTimeline clock.
   WP2 owns this hook and its return shape. */
import type { Audience } from "../data/types";
import type { RunProgress } from "../contracts";

export interface RunSchedule { endMs: number; marks: number[] }

export function useRun(audience: Audience): { schedule: RunSchedule; progress: RunProgress } {
  void audience;
  return { schedule: { endMs: 0, marks: [] }, progress: { act: 0, actProgress: 0, overall: 0, done: true } };
}
