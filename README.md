# Mondragon — Astro

Astro 1:1 conversion of the Framer-exported Mondragon site. The goal is visual and behavioural parity with the original export, so the pre-rendered Framer markup and its client runtime are intentionally preserved.

## Requirements

- Node.js **22.23.4+** (Astro 7 requirement)
- npm 9.6.5+

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # preview the production build
```

Deploy the generated `dist/` folder at the domain root. All links and assets are relative to the page depth, matching the original Framer routing.

## Project structure

```text
src/
  layouts/
    BaseLayout.astro       # <html>, <head>, <body> shell
  pages/
    index.astro            # /
    about/index.astro      # /about/
    cases/index.astro      # /cases/
    cases/armada/index.astro
    cases/calderone/index.astro
    cases/montana/index.astro
    cases/oasis/index.astro
    cases/pirate-hub/index.astro
    contact/index.astro    # /contact/
  fragments/pages/         # exact <head> and <body> fragments from the export (.frag)
public/
  assets/                  # images, fonts, Framer runtime modules
  f2c-sw.js                # Framer asset/CMS mapping service worker
scripts/
  extract-pages.mjs        # regenerate fragments and page routes
```

## How the conversion works

Each Astro page imports its `<head>` and `<body>` fragment as raw text and passes it through `BaseLayout.astro`:

```astro
<BaseLayout {head} {body} />
```

`BaseLayout.astro` renders the fragments with `<Fragment set:html={...} />`. Astro handles routing, dev/build tooling and static generation; the Framer hydration bundle continues to drive animations and interactions.

This is deliberate: the original export is compiled Framer output, not editable component source. Keeping the Framer runtime is what preserves the visuals exactly. If the source HTML is updated, regenerate the fragments and routes with:

```bash
npm run extract
```

## Notes

- The template promo widget has already been removed from the HTML and disabled in the Framer bundles.
- `public/f2c-sw.js` is retained because the Framer runtime and CMS data rely on its asset URL mapping.
- External Vimeo embeds, analytics and social links still require internet access at runtime.
