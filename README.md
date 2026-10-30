# Magiapix — website

The Magiapix agency site, built with [Astro](https://astro.build). Pages are plain Astro components, animations are small TypeScript modules and the WebGL effects use three.js. There is no Framer runtime or Framer markup left in the project.

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

Deploy the generated `dist/` folder at the domain root. Set `site` in `astro.config.mjs` to the live URL to get absolute canonical and Open Graph URLs.

## Project structure

```text
src/
  layouts/BaseLayout.astro   # <html>/<head> (title, description, social meta) and the script entry
  pages/
    index.astro              # /
    about/index.astro        # /about/
    cases/index.astro        # /cases/
    cases/[slug].astro       # /cases/<slug>/  (one template for every case study)
    contact/index.astro      # /contact/
  components/                # one .astro file per design component (sections, cards, links, icons…)
  data/cases.ts              # case-study content: title, description, texts, images, prev/next
  scripts/
    main.ts                  # starts everything below
    components/              # interactions: intro, nav, reveals, hovers, FAQ, form, ticker, scramble…
    lib/                     # motion helpers (springs, layout transitions, in-view)
    webgl/                   # canvas effects, loaded only on pages that use them
  styles/
    fonts.css                # @font-face
    site.css                 # component styles
    breakpoints.css          # desktop / tablet / phone visibility helpers
    component-states.css     # hover / open states
    interactions.css         # styles used by the scripts
public/
  images/ videos/ fonts/     # local copies of every asset
  meta/                      # favicon, touch icon, social share image
```

### Components and breakpoints

Most components take a `variant` prop (`"Desktop"`, `"Tablet"`, `"Phone"`, or a state like `"Load and Fill - End"`). Pages render the desktop, tablet and phone version of a section side by side, each wrapped in a `.bp` element that `breakpoints.css` hides outside its screen size, so the layout switches without JavaScript.

### Case studies

To edit a case study, change its entry in `src/data/cases.ts`. To add one, add an entry there (the order is the order used for prev/next links) and put its images in `public/images/`.

### Animations

Everything that moved in the original site still moves the same way:

| Where | Module |
| --- | --- |
| Page intro, scroll reveals, text scramble | `intro.ts`, `reveal.ts`, `scramble.ts` |
| Smooth scrolling | `smooth-scroll.ts` (Lenis) |
| Navigation, nav links, menu | `nav.ts`, `nav-link.ts` |
| Link underlines, hover accents, awards, prev/next | `line-link.ts`, `underline-sweep.ts`, `hover-accent.ts`, `award.ts` |
| Services, stacking price cards, FAQ | `service.ts`, `price-stack.ts`, `faq.ts` |
| Showreel, videos, clients ticker | `showreel.ts`, `video.ts`, `ticker.ts` |
| Hero image transition, pixel-flip case cards, case hero distortion, film grain | `webgl/luma.ts`, `webgl/pixel-flip.ts`, `webgl/distortion.ts`, `webgl/noise.ts` |

Effects are attached to markup through `data-*` attributes (`data-reveal`, `data-gl`, `data-show`, …), so the components stay plain HTML.

## Contact form

The form posts to the URL in `PUBLIC_CONTACT_ENDPOINT` (see `.env.example`), as `FormData` with `Accept: application/json`, and shows "Thank you!" or "Error!" on the button. When the variable isn't set it uses [FormSubmit](https://formsubmit.co) to deliver to `hello@magiapix.com` (temporary; FormSubmit emails that inbox an activation link on the first message, which has to be clicked once). If the variable is set to an empty value, the form opens a `mailto:` link to the address on the contact page instead.

## External services

- The showreel plays from Vimeo (`player.vimeo.com`) once the visitor clicks play.
- Social links point to the agency's profiles.
