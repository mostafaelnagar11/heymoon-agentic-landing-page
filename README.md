# HeyMoon agentic landing page

The brands landing and the creators landing in one project, with a
Brands | Creators switch at the top of each hero. They are still two
pages. Each tab is the whole of its original page: its own copy, its own
field, and its own app behind the field.

```bash
npm run dev
```

Opens on http://localhost:3004 (`heymoon-agentic-landing-page` in
`.claude/launch.json`).

## Routes

| URL | What it is | From |
| --- | --- | --- |
| `/` | Redirects to `/brands` | `next.config.mjs` |
| `/brands` | Brands landing: store-link field, Arabic toggle | `moontech-agentic-brands` `/` |
| `/brands/c` | The brand conversation (`?read=ounass.com`) | `moontech-agentic-brands` `/c` |
| `/brands/dashboard` | Brand dashboard | `moontech-agentic-brands` `/dashboard` |
| `/creators` | Creators landing: handle field, log-in sheet | `moontech-agentic-creators` `/` |
| `/creators/c` | The creator conversation (`?h=@handle`) | `moontech-agentic-creators` `/c` |
| `/creators/dashboard` | Creator dashboard (needs a profile) | `moontech-agentic-creators` `/dashboard` |

Anything else under `/brands/…` or `/creators/…` goes to that side's
`/c`, as each original app's catch-all did.

## How the two are kept apart

The two apps share a stack but not a design system: their Tailwind
configs give the same class names different values (`text-brand` is a
colour on brands and an 11px size on creators; `bg-paper` and
`text-title` differ too). So each side is isolated rather than merged:

```
app/
  (brands)/              root layout + globals.css for the brands side
    brands/              the whole brands app, moved in unchanged
  (creators)/            root layout + globals.css for the creators side
    creators/            the whole creators app, moved in unchanged
  _shared/
    AudienceSwitch.tsx   the hero switch, the only code both sides use
tailwind.brands.config.ts     brands tokens, scans app/(brands) + _shared
tailwind.creators.config.ts   creators tokens, scans app/(creators) + _shared
```

- **Two root layouts.** Each route group has its own `<html>`, fonts,
  and metadata, as in the original apps. A page only ever loads its own
  side's stylesheet.
- **Two Tailwind configs.** Each `globals.css` names its config with
  `@config`. Each side compiles to the same CSS as its original project,
  rule for rule (checked when the project was set up).
- **The switch is a full page load.** Next always does a full load when
  you move between root layouts. The thumb slides first (240 ms) and the
  page follows. With reduced motion it goes straight away.
- **Storage was already separate.** Brands keys start `mtab_`, creators
  `mtac_`, so one origin holds both sides' state without collisions.

## What changed from the originals

Only what the move required:

- Every absolute route now has its side's prefix: `/c` → `/brands/c`,
  `/dashboard` → `/creators/dashboard`, and `/` → `/brands` or
  `/creators` (24 call sites).
- The brands layout imports `DirSync` from its new path.
- `AudienceSwitch` sits above the headline on both landings. On brands
  it carries Arabic labels (`landing.for.*` in `lib/i18n.ts`) and
  mirrors with the page. Creators has no Arabic, so its labels are
  English only.
- `public/` is the union of both apps' assets. The 72 files they share
  are byte-identical.

The original projects' docs are in `docs/brands/` and `docs/creators/`.
Their file paths and URLs predate the move.
