# sylwester.czmil.com — personal site

Portfolio of **Sylwester Czmil** — PhD, Senior AI Software Engineer.

Static React SPA (Vite + TypeScript), no backend. The hero background and the
"Lab" section run real machine learning in the browser — including
[SEVQ](https://github.com/sylwekczmil/sevq), the algorithm from my PhD thesis.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Content

All copy lives in [`src/data/profile.ts`](src/data/profile.ts) — edit that one
file to update experience, publications, skills or contact info.

## Deployment

This is a GitHub **user site** (`sylwekczmil.github.io`), which must publish
from the `main` branch — so Vite builds into `docs/` and Pages is configured to
serve **main / docs**. Served at the custom domain **sylwester.czmil.com**
(set via [`public/CNAME`](public/CNAME), copied into `docs/` on every build).

Redeploy after any change with one command:

```bash
npm run deploy   # builds into docs/, commits it, and pushes main
```

DNS: a `CNAME` record `sylwester` → `sylwekczmil.github.io` on the `czmil.com`
zone (managed in Squarespace) points the subdomain at Pages; GitHub provisions
HTTPS automatically once DNS resolves.

### Optional: CI auto-deploy

A GitHub Actions workflow is kept at
[`ci/github-pages-deploy.yml`](ci/github-pages-deploy.yml). It lives outside
`.github/workflows/` because the CLI token used for the initial push lacked the
`workflow` scope. To switch to CI-based deploys, run `gh auth refresh -s
workflow`, move the file into `.github/workflows/`, and set the Pages source to
**GitHub Actions** in repo settings.
