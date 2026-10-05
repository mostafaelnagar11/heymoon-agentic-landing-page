# HeyMoon agentic landing page

HeyMoon.AI's marketing site for its two audiences, brands and creators, plus the two agentic product
prototypes it sends visitors into. One Next.js project.

```bash
npm install
npm run dev
```

Opens on http://localhost:3004. `npm run dev` first runs `npm run bind`, which computes the site's demo
figures from the product code (see `scripts/bind-demo.cjs`).

## Routes

| URL | What it is |
| --- | --- |
| `/` | Redirects to `/brands` |
| `/brands`, `/creators` | The site. One page with a Brands / Creators switch in the hero; switching swaps the copy and the story with no reload |
| `/brands/c`, `/creators/c` | The agentic product: the conversation the hero field submits into (`?read=yourstore.com`, `?h=@handle`) |
| `/brands/dashboard`, `/creators/login`, `/creators/dashboard` | The product dashboards |
| `/brands/v1`, `/creators/v1` | The previous landing pages, kept for comparison |
| `/preview/eclipse.html` | The original Eclipse Glass hero prototype |

## The site (`app/(site)`)

- **Hero:** "Eclipse Glass", the four-point AI star as live WebGL glass in front of a total eclipse (a lazy
  raw-WebGL renderer in `_site/sky/eclipse.ts`). On brands, two rings of creator profile pictures sit behind
  the eclipse and an agent card shows the agents working. Switching audience tumbles the star from a glass
  slab into pink liquid glass. The first paint is a poster rendered from the shader itself
  (`scripts/hero-poster.cjs`), so the star is never flat.
- **Below the hero:** a paper sheet lifts over the night with the agents' working window, a scroll stage,
  the number, the seven-agent orbit, and a night close with a dotted wordmark.
- **Stack:** Next 14 app router, React 18, Tailwind 3, `motion` and `lenis`. No GSAP, no three.js.

## How the three apps are kept apart

The brands app, the creators app and the site give the same Tailwind class names different values, so each
lives in its own route group with its own root layout, `globals.css` and Tailwind config (selected with
`@config`): `app/(brands)`, `app/(creators)`, `app/(site)`. Moving between them is a full page load.

## Checks

| Command | What it does |
| --- | --- |
| `npm run check:site` | Against the running dev server: one h1, copy voice rules, and the honesty rules (no real names or handles in the page) |
| `npm run measure` | A production build in its own folder (safe beside the dev server) with the performance budgets: first load ≤ 160 kB, CSS, lazy chunks, the renderer chunk |
| `node scripts/hero-poster.cjs` | Re-renders the hero posters from the WebGL renderer (`--check` compares them with the live render) |
| `npx tsc --noEmit -p .`, `npx next lint` | Types and lint |

## Docs

`docs/redesign/` holds the research brief, the build spec, the hero brief (`HERO-V2.md`), Mostafa's inputs
and decisions (`INPUTS.md`), and each work package's notes. `docs/brands` and `docs/creators` are the
original apps' docs.
