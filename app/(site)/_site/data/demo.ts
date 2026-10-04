import raw from "./demo.json";
import type { DemoData } from "./types";
/* resolveJsonModule widens literals; correctness comes from the typed bind. */
export const DEMO = raw as unknown as DemoData;
