# debojit-d.github.io

Personal academic site of **Debojit Das** — dual-degree researcher in robotics at IIT Gandhinagar, currently a Visiting Foreign Researcher at the Smart Robots Design Lab, Tohoku University.

**Live:** <https://debojit-d.github.io/>

Research interests: dynamical-systems control, bimanual and contact-rich manipulation, redundancy optimization, and tactile sensing.

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | React 19 |
| Build | Vite 7 |
| Styling | Hand-written CSS with custom properties, no framework |
| Hosting | GitHub Pages via GitHub Actions |

There is no CMS and no database. Every piece of content is a plain JavaScript object under [`src/content/`](src/content/), so updating the site means editing one small file and pushing.

## Design

The site is deliberately monochrome and typographic:

- **Black and white only.** The full palette is defined as CSS custom properties in [`src/styles.css`](src/styles.css), with a light and a dark set. Photographs and figures are greyscaled by default and return to full colour on hover.
- **Type.** *Instrument Serif* for headings and titles, *Inter* for body copy, *JetBrains Mono* for metadata — dates, venues, tags, and section numbers.
- **Interactive backdrop.** [`src/GeometricBackground.jsx`](src/GeometricBackground.jsx) draws a canvas lattice of dots plus three slowly rotating geometric outlines. Dots near the cursor brighten, grow, and drift outward; the outlines parallax with pointer position. It is intentionally faint, runs at a capped frame rate, pauses when the tab is hidden, and renders a single static frame when `prefers-reduced-motion` is set.
- **Motion.** Sections reveal on scroll, the header carries a scroll-progress rule, and navigation highlights the section currently in view. All of it is disabled under `prefers-reduced-motion`.

Theme follows the OS by default; toggling it stores the choice in `localStorage` and that choice then wins over the system setting.

## Local development

**Node.js 20.19+ or 22.12+ is required** — Vite 7 will not run on older releases, and the `nodejs` package in older Ubuntu archives is far too old. Use [nvm](https://github.com/nvm-sh/nvm) rather than `apt`:

```bash
nvm install 22
nvm use 22
```

Then:

```bash
npm ci
npm run dev      # dev server at http://127.0.0.1:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Editing content

All content lives in [`src/content/`](src/content/); [`src/content/README.md`](src/content/README.md) documents every field.

| File | Holds |
| --- | --- |
| `site.js` | Page title, meta description, social image, and the section list |
| `profile.js` | Name, role, location, links, research focus, and the About paragraphs |
| `publications.js` | Papers, venues, authors, tags, and artifact links |
| `news.js` | Dated news entries |
| `projects.js` | Project cards |
| `education.js`, `experience.js` | Timeline entries |
| `awards.js`, `services.js`, `talks.js`, `teaching.js` | Optional sections |

Section order, navigation labels, and visibility are all controlled by the `sections` array in `site.js`. Setting `enabled: false` on an entry hides the section and drops it from the navigation; the `metrics` section is commented out there.

Author names listed in `profile.highlightNames` are bolded automatically wherever they appear in an author string.

## Deployment

Every push to `main` triggers [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which builds the site and publishes `dist/` to GitHub Pages. Nothing needs to be built or committed by hand.

The Pages source must be set to **GitHub Actions** under Settings → Pages.

## Credits

Built on the [Athena Personal Academic Page](https://github.com/AaronZ345/Athena-personal-academic-page) template (MIT), substantially restyled. Icons from Font Awesome and Academicons; fonts served by Google Fonts.

Licensed under the [MIT License](LICENSE). Site content — text, publication records, and images — is © Debojit Das.
