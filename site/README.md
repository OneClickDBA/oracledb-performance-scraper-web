# Documentation Site

The Harry - Performance Scraper for Oracle Database documentation is built with
Docusaurus.
Source documentation lives in `docs/`; generated output is written to `build/`
and is not committed.

## Requirements

- Node.js 22
- npm

## Local Development

Install the locked dependencies:

```bash
npm ci
```

Start the development server with live reload:

```bash
npm start
```

## Production Preview

Build the same static site used by GitHub Pages:

```bash
npm run build
npm run serve
```

The GitHub Pages workflow builds and deploys `site/build` after documentation
changes are pushed to `main`.
