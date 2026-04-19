# Frontend

The Transcendence web client: a server-rendered React Router 7 application with TypeScript.

## Stack

- **[React 19](https://react.dev/)** + **[React Router 7](https://reactrouter.com/)** in framework mode (SSR enabled — see [react-router.config.ts](react-router.config.ts))
- **[Vite 7](https://vite.dev/)** with [`@vitejs/plugin-basic-ssl`](https://github.com/vitejs/vite-plugin-basic-ssl) so the dev server runs over HTTPS
- **TypeScript** with path aliases via [`vite-tsconfig-paths`](https://github.com/aleclarson/vite-tsconfig-paths)
- **Plain CSS** — stylesheets live under [app/assets/styles](app/assets/styles) and are imported per component. No Tailwind, no CSS-in-JS.
- **[@fontsource/nunito](https://fontsource.org/fonts/nunito)** for the Nunito webfont
- **[iconoir-react](https://iconoir.com/)** for icons
- **[react-select](https://react-select.com/)** for select inputs
- **[@hello-pangea/dnd](https://github.com/hello-pangea/dnd)** for drag-and-drop
- **[react-i18next](https://react.i18next.com/)** + **[remix-i18next](https://github.com/sergiodxa/remix-i18next)** for localization (en, fi, ru — see [app/locales](app/locales))
- **[zod](https://zod.dev/)** for schema validation

## Project layout

```
app/
├── assets/          # images and CSS stylesheets
├── components/      # UI components (auth, buttons, cards, inputs, pagination, rating, recipe, …)
├── composables/     # reusable hooks and helpers (API base URL, media URL, screen size, sort params, …)
├── layouts/         # route layouts
├── locales/         # i18n resources (en, fi, ru)
├── routes/          # React Router route modules (home, recipes, recipe, recipe-create, profile, users, …)
├── entry.client.tsx # client entry
├── entry.server.tsx # server entry
├── i18n.ts          # i18next config
├── i18next.server.ts
├── index.css        # global styles
├── root.tsx         # root route
└── routes.ts        # route manifest
```

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in any values you need:

```bash
cp .env.example .env
```

### Development

Start the dev server (HMR, HTTPS via a self-signed cert, exposed on the LAN thanks to `--host`):

```bash
npm run dev
```

The app is served at `https://localhost:5173`. Your browser will warn about the self-signed certificate on first load — accept it to continue.

### Type checking

```bash
npm run typecheck
```

Runs `react-router typegen` (generates typed route helpers) followed by `tsc`.

### Production build

```bash
npm run build
npm run start
```

`npm run build` outputs to `build/` (client assets under `build/client/`, server bundle under `build/server/`). `npm run start` serves it with `@react-router/serve`.

## Browser Support

The application is developed and tested primarily against **Google Chrome** (latest stable). Other modern browsers should work, but some features render or behave differently.

### Known limitations in Firefox

- **`backdrop-filter`** (e.g. modal blur in [modal.css](app/assets/styles/modal.css)) is not supported — modals fall back to a plain semi-transparent overlay without blur.
- **`:has()` selector** (used in [languageSelector.css](app/assets/styles/languageSelector.css), [recipeCard.css](app/assets/styles/recipeCard.css), [userCard.css](app/assets/styles/userCard.css)) is only supported in Firefox 121+. On older versions, dependent styling (active language indicator, favorite-button hover states) will not apply.
- **`::-webkit-scrollbar`** styling in [cooksRow.css](app/assets/styles/cooksRow.css) is ignored; scrollbars use the native Firefox appearance. `scrollbar-width: none` is used as a fallback to hide them.
- **`-webkit-line-clamp`** truncation on recipe cards ([recipeCard.css](app/assets/styles/recipeCard.css)) may not clamp text; long titles/descriptions can overflow.

### Known limitations in Safari

- **`backdrop-filter`** requires the `-webkit-` prefix; without it the blur effect on modals may not render on older Safari versions.
- **`:has()` selector** requires Safari 15.4+ (macOS 12.3+ / iOS 15.4+). Older versions lose the same styling listed for Firefox.
- **Intelligent Tracking Prevention (ITP)** enforces stricter cookie and storage policies. Auth and i18n cookies set with `SameSite=Lax` (see [entry.client.tsx](app/entry.client.tsx), [i18next.server.ts](app/i18next.server.ts)) may be capped to a 7-day lifetime or dropped in cross-site contexts.
- **`credentials: "include"`** fetches (auth, layout loaders) are subject to stricter CORS preflight handling than Chrome; cross-origin API calls must return the full set of `Access-Control-Allow-*` headers.

If you hit a visual or auth issue that does not reproduce in Chrome, check the list above before filing a bug.
