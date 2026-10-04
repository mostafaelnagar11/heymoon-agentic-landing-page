/* The design tokens, in TypeScript, for the places CSS classes cannot
   reach: SVG strokes, inline styles, canvas.

   Same values as tailwind.config.ts, and both were read off the Figma
   rather than typed from memory. Import from here rather than writing a
   hex. */

export const T = {
  ink: "#12151B",
  main: "#4D2FB0",
  mainMid: "#6848D1",
  mainLight: "#7A47CE",
  mainGlow: "#A65FED",
  lilac: "#F3EFFC",
  paper: "#FAFAFA",
  line: "#EBEBEB",
  orange: "#FF8400",
  green: "#25A333",
  lime: "#4FEA57",
  sun: "#FFE538",
  night: "#161722",
  danger: "#D70015",
} as const;

/* Shared class recipes, declared once. */
export const CARD = "rounded-card bg-white shadow-card";
export const ROW = "flex items-center justify-between border-b border-line py-4 last:border-0";
export const LABEL = "text-row font-medium text-ink-90";
export const VALUE = "text-body font-medium text-ink-90";
