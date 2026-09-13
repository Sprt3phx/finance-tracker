# Monthly Ledger

A single-page finance tracker: monthly income, extra income (side cash,
bonuses, overtime), expenses by category, and trend charts once 2+ months
of data exist. Data is stored in the browser's `localStorage` — no backend.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs static files to `dist/`.

## Deploy (Netlify)

Connect this repo on [netlify.com](https://netlify.com) with:

- Build command: `npm run build`
- Publish directory: `dist`

Then on iPhone: open the site in Safari → Share → **Add to Home Screen**.
