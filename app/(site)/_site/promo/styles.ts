/* The promo's class names: promo.css is a global stylesheet with every class prefixed pm- (see its
   header for why it is not a CSS module). Importing this module loads the stylesheet. */
import "./promo.css";

export const s = {
  anim: "pm-anim",
  band: "pm-band",
  bloom: "pm-bloom",
  card: "pm-card",
  cta: "pm-cta",
  ctaRise: "pm-ctaRise",
  ctaRow: "pm-ctaRow",
  dock: "pm-dock",
  eyebrow: "pm-eyebrow",
  face: "pm-face",
  glyph: "pm-glyph",
  head: "pm-head",
  headText: "pm-headText",
  launcher: "pm-launcher",
  mask: "pm-mask",
  maskIn: "pm-maskIn",
  media: "pm-media",
  moonG: "pm-moonG",
  reveal: "pm-reveal",
  rise: "pm-rise",
  scrim: "pm-scrim",
  stack: "pm-stack",
  thumb: "pm-thumb",
  xG: "pm-xG",
} as const;
