# WCAG 2.1 AA Audit — Frontend

Audit date: 2026-04-24. Branch: `wcag-fix`. Target conformance level: **WCAG 2.1 AA**.

Every entry below is a checkbox so it can be tracked as remediation progresses. Each issue cites the file and line where it was observed — verify against current code before fixing, since the code may have moved since the audit.

---

## Tier 1 — Critical (blocks AA conformance)

### Skip-to-main-content link is missing (SC 2.4.1 Bypass Blocks)
- [ ] Add a visually-hidden-until-focused skip link as the first child of `<body>` (or `.app-shell`) in [app/root.tsx](frontend/app/root.tsx) / [app/layouts/layout.tsx](frontend/app/layouts/layout.tsx).
- [ ] Add `id="main-content"` and `tabIndex={-1}` to the `<main>` element in [app/layouts/layout.tsx:129](frontend/app/layouts/layout.tsx#L129) so it can receive programmatic focus.
- [ ] Style `.skip-link:focus` with sufficient contrast against `--bg-main` and verify with a contrast checker.

### Focus indicators removed without a visible replacement (SC 2.4.7 Focus Visible, SC 1.4.11 Non-text Contrast)
- [ ] Remove or replace `outline: none` at [app/assets/styles/inputField.css:30-32](frontend/app/assets/styles/inputField.css#L30-L32).
- [ ] Remove or replace `outline: none` at [app/assets/styles/textArea.css:23-25](frontend/app/assets/styles/textArea.css#L23-L25).
- [ ] Remove or replace `outline: none` at [app/assets/styles/searchField.css:26](frontend/app/assets/styles/searchField.css#L26).
- [ ] Add a project-wide `:focus-visible` rule in [app/index.css](frontend/app/index.css) (2px solid `--borders-action`, 2px offset) scoped to `button, a, input, textarea, select, [tabindex]`.
- [ ] Add explicit `:focus-visible` styles to [app/assets/styles/iconButton.css](frontend/app/assets/styles/iconButton.css).
- [ ] Add explicit `:focus-visible` styles to [app/assets/styles/mainButton.css](frontend/app/assets/styles/mainButton.css).
- [ ] Add explicit `:focus-visible` styles to [app/assets/styles/pagination.css](frontend/app/assets/styles/pagination.css).
- [ ] Verify `:focus-visible` ring contrast ≥ 3:1 against every background it appears on (header, card, backdrop).

### Custom dropdown menus lack ARIA roles and keyboard support (SC 2.1.1 Keyboard, SC 4.1.2 Name/Role/Value)
- [ ] [app/components/SortMenu.tsx:69-89](frontend/app/components/SortMenu.tsx#L69-L89): add `role="listbox"` to the `<ul>` panel, `role="option"` to each option button, `aria-controls` + `aria-haspopup="listbox"` + `aria-expanded` on the trigger.
- [ ] [app/components/SortMenu.tsx](frontend/app/components/SortMenu.tsx): implement ↑/↓/Home/End keyboard navigation, Enter/Space to select, Esc to close, Tab to close and exit.
- [ ] [app/components/LanguageSelector.tsx:52-63](frontend/app/components/LanguageSelector.tsx#L52-L63): add `aria-controls` tying the trigger to the `<ul>` panel id.
- [ ] [app/components/LanguageSelector.tsx:65](frontend/app/components/LanguageSelector.tsx#L65): add `role="menu"` to the `<ul>` panel; keep child `<li role="none">`; give each `LanguageButton` `role="menuitem"`.
- [ ] [app/components/LanguageSelector.tsx](frontend/app/components/LanguageSelector.tsx): implement ↑/↓/Home/End/Esc keyboard navigation.
- [ ] [app/components/SearchFilterMenu.tsx](frontend/app/components/SearchFilterMenu.tsx): add `aria-controls` on the trigger, `aria-expanded`, and confirm the panel has an `id`.
- [ ] Extract a shared `useRovingTabindex` / `useListboxKeyboard` composable in `app/composables/` so SortMenu, LanguageSelector, and SearchFilterMenu share one keyboard implementation.

### Form error messages are not announced (SC 3.3.1, SC 4.1.3)
- [ ] [app/components/inputs/InputField.tsx:187-190](frontend/app/components/inputs/InputField.tsx#L187-L190): add `role="alert"` to the error `<p id={`${id}-error`}>` (match the pattern already used by [app/components/inputs/TextArea.tsx](frontend/app/components/inputs/TextArea.tsx)).
- [ ] Audit every input-like component for consistent error semantics: [app/components/inputs/](frontend/app/components/inputs/).

### Color-contrast risks in design tokens (SC 1.4.3 Contrast Minimum, SC 1.4.11 Non-text Contrast)
- [ ] Verify `--text-secondary #4e633b` on `--bg-main #f2ece3` meets 4.5:1 for body copy ([app/index.css:48](frontend/app/index.css#L48)). If not, darken the token or restrict usage to large text only.
- [ ] Verify `--text-secondary #4e633b` on `--surface-primary #e1d9cd` meets 4.5:1 (input placeholders and hints) ([app/assets/styles/inputField.css:27](frontend/app/assets/styles/inputField.css#L27)).
- [ ] Verify `--borders-input #e2d8e0` on `--surface-primary #e1d9cd` meets 3:1 (input/iconButton border) ([app/index.css:57](frontend/app/index.css#L57)).
- [ ] Verify `--surface-warning #f2ca2c` + paired text meets 4.5:1 for body and 3:1 as a graphic ([app/index.css:46](frontend/app/index.css#L46)).
- [ ] Verify `--icons-default #f2ece3` on `--surface-header #637548` meets 3:1 for meaningful icons ([app/index.css:37, :51](frontend/app/index.css)).
- [ ] Replace `opacity: 0.3` on disabled pagination links with an explicit color meeting 3:1 ([app/assets/styles/pagination.css](frontend/app/assets/styles/pagination.css)); pair with `aria-disabled="true"`.
- [ ] Document the final contrast-pair decisions in a short design-tokens note so future color changes get reviewed.

---

## Tier 2 — Serious

### `<html lang>` fallback can be undefined
- [ ] [app/root.tsx:40](frontend/app/root.tsx#L40): default to a concrete value, e.g. `lang={i18n.resolvedLanguage ?? locale ?? "en"}`.

### `Notice` uses `<output>` for a non-form status (SC 4.1.3)
- [ ] [app/components/Notice.tsx:33-37](frontend/app/components/Notice.tsx#L33-L37): replace `<output>` with `<div role="status" aria-live="polite" aria-atomic="true">`.

### Dynamic routes have no unique `<title>` (SC 2.4.2 Page Titled)
- [ ] Add `export const meta` to [app/routes/recipe.tsx](frontend/app/routes/recipe.tsx), deriving the title from loader data.
- [ ] Add `export const meta` to [app/routes/user.tsx](frontend/app/routes/user.tsx), deriving the title from loader data.
- [ ] Add `export const meta` to [app/routes/recipes.tsx](frontend/app/routes/recipes.tsx).
- [ ] Add `export const meta` to [app/routes/search.tsx](frontend/app/routes/search.tsx) (include the query).
- [ ] Add `export const meta` to [app/routes/profile.tsx](frontend/app/routes/profile.tsx).
- [ ] Add `export const meta` to [app/routes/recipe-create.tsx](frontend/app/routes/recipe-create.tsx).
- [ ] Add `export const meta` to [app/routes/users.tsx](frontend/app/routes/users.tsx).
- [ ] Add `export const meta` to [app/routes/policy.tsx](frontend/app/routes/policy.tsx).
- [ ] Add `export const meta` to [app/routes/terms.tsx](frontend/app/routes/terms.tsx).
- [ ] Add `export const meta` to [app/routes/home.tsx](frontend/app/routes/home.tsx).

### Mobile header menu — focus management and DOM order (SC 2.4.3 Focus Order, SC 2.4.7 Focus Visible)
- [ ] [app/layouts/Header.tsx:135-143](frontend/app/layouts/Header.tsx#L135-L143): add `aria-controls="header-menu-overlay"` on the toggle and give the overlay a matching `id`.
- [ ] [app/layouts/Header.tsx:164-180](frontend/app/layouts/Header.tsx#L164-L180): on open, move focus to the first interactive element inside the overlay; on close, return focus to the toggle.
- [ ] Decide whether the overlay should be `role="dialog" aria-modal="true"` (if it occludes the page) or whether the rest of the top-row controls should be marked `inert` while it's open — apply accordingly.

### Modal semantics not enforced for every dialog (SC 4.1.2)
- [ ] [app/components/Modal.tsx:110-114](frontend/app/components/Modal.tsx#L110-L114): apply `role="dialog"` and `aria-modal="true"` inside `Modal` (or document and enforce that every caller supplies them on the inner container).
- [ ] Require every modal to supply an accessible name via `aria-labelledby` or `aria-label`; audit [AuthModal](frontend/app/components/auth), [ConfirmationModal](frontend/app/components/ConfirmationModal.tsx), [ratingModal](frontend/app/components/rating/ratingModal.tsx), and any other consumers.

### Icon-only buttons — verify every one has an accessible name
- [ ] Audit all usages of [app/components/buttons/IconButton.tsx](frontend/app/components/buttons/IconButton.tsx) for `aria-label` presence.
- [ ] Specifically verify: menu toggle at [app/layouts/Header.tsx:136-143](frontend/app/layouts/Header.tsx#L136-L143), profile link at [app/layouts/Header.tsx:148-154](frontend/app/layouts/Header.tsx#L148-L154), password-visibility toggle at [app/components/inputs/InputField.tsx:170-184](frontend/app/components/inputs/InputField.tsx#L170-L184), [FavoriteButton](frontend/app/components/buttons/FavoriteButton.tsx), [ModerationButton](frontend/app/components/buttons/ModerationButton.tsx), pagination arrows in [app/components/pagination/Pagination.tsx](frontend/app/components/pagination/Pagination.tsx).
- [ ] Add `eslint-plugin-jsx-a11y`'s `control-has-associated-label` rule and wire into `npm run fix:frontend`.

### Status regions missing `role="status"` (SC 4.1.3)
- [ ] [app/components/auth/AuthForm.tsx](frontend/app/components/auth/AuthForm.tsx): add `role="status"` (or `role="alert"` for error text) to the live-region `<div>`.
- [ ] [app/components/rating/ratingForm.tsx](frontend/app/components/rating/ratingForm.tsx): add `role="status"` to the live-region `<div>`.

---

## Tier 3 — Moderate

### Filter and button groups missing grouping semantics (SC 1.3.1)
- [ ] [app/components/FilterList.tsx](frontend/app/components/FilterList.tsx): wrap the list in `role="group"` (or `role="tablist"` if filters act as tabs) with a descriptive `aria-label`.
- [ ] [app/components/SearchFilterMenu.tsx](frontend/app/components/SearchFilterMenu.tsx): for multi-select groups, prefer `<fieldset><legend>` over generic `<div>` + label.

### Star rating keyboard and labeling (SC 2.1.1, SC 4.1.2)
- [ ] [app/components/rating/ratingForm.tsx](frontend/app/components/rating/ratingForm.tsx): verify each star input has a descriptive `aria-label` (e.g. "3 stars", not just "3").
- [ ] Verify that `:focus-visible` styling on the visible label (not the hidden input) remains once the Tier-1 focus ring rule lands — see [app/assets/styles/rating.css:89](frontend/app/assets/styles/rating.css#L89).

### Image alt-text quality (SC 1.1.1)
- [ ] [app/components/cards/CookCard.tsx](frontend/app/components/cards/CookCard.tsx): if the avatar is paired with a visible name, set `alt=""` (decorative) to avoid duplicate announcement.
- [ ] [app/components/cards/UserCard.tsx](frontend/app/components/cards/UserCard.tsx): same — decide decorative vs informative and apply.
- [ ] [app/components/cards/RecipeCard.tsx](frontend/app/components/cards/RecipeCard.tsx): recipe hero images — alt should describe the dish or fall back to the recipe title.
- [ ] [app/routes/profile.tsx](frontend/app/routes/profile.tsx) and [app/routes/recipe.tsx](frontend/app/routes/recipe.tsx): audit avatar/hero images for meaningful alt.
- [ ] Add `aria-hidden="true"` to every decorative iconoir icon that sits inside a button whose parent already has `aria-label` (avoids duplicate announcement).

### `px` typography tokens do not scale with text-only zoom (SC 1.4.4 Resize Text)
- [ ] [app/index.css:72-145](frontend/app/index.css#L72-L145): convert `--fs-*` and `--lh-*` tokens from `px` to `rem`.
- [ ] Re-test layouts at 200% browser text-size override after the change.

### Headings hierarchy (SC 1.3.1, SC 2.4.6)
- [ ] Grep for `className="h1"|"h2"|"h3"` on non-heading tags and replace with real `<h1>`/`<h2>`/`<h3>` (class may remain for styling).
- [ ] Confirm each route renders exactly one `<h1>` and does not skip heading levels.

### `autoComplete` tokens missing on forms (SC 1.3.5)
- [ ] [app/components/auth/AuthForm.tsx](frontend/app/components/auth/AuthForm.tsx): already uses `email`, `current-password`, `new-password` — re-verify.
- [ ] [app/routes/profile.tsx](frontend/app/routes/profile.tsx) and profile form components: add `username`, `given-name`, `family-name`, `tel`, `nickname` as applicable.
- [ ] [app/routes/recipe-create.tsx](frontend/app/routes/recipe-create.tsx) and recipe form components: add `off` for search-like fields and meaningful tokens where applicable.

### Active nav link does not expose `aria-current` (SC 4.1.2)
- [ ] [app/layouts/Header.tsx:28-69](frontend/app/layouts/Header.tsx#L28-L69): thread `aria-current="page"` through `TextIconButton` when `selected` is true, so the rendered `<a>` carries it.
- [ ] [app/components/buttons/TextIconButton.tsx](frontend/app/components/buttons/TextIconButton.tsx): accept and forward the attribute.

### Reduced motion not respected
- [ ] Add `@media (prefers-reduced-motion: reduce)` overrides in [app/index.css](frontend/app/index.css) (or per-component CSS) to disable non-essential transitions/animations.

### Reflow at 320 px viewport (SC 1.4.10)
- [ ] Manually test each route at 320 × 800 using Chrome DevTools device toolbar; confirm no horizontal scroll and no clipped content.

### Hover/focus popovers dismissability (SC 1.4.13)
- [ ] Audit any tooltips/popovers (if present) for Esc-to-dismiss, hoverable-without-disappearing, and persistence until user dismisses.

---

## Tier 4 — Minor / Polish

- [ ] Inline content in a different language (recipe titles in original language, localized terms) gets a `lang` attribute on its wrapper.
- [ ] Confirm no `accessKey` attributes exist anywhere (SC 2.1.4 Character Key Shortcuts).
- [ ] Confirm every touch target is ≥ 24 × 24 CSS px (prep for WCAG 2.2, not required for 2.1 AA but cheap to do).
- [ ] Verify no auto-updating content refreshes faster than every 5 s without a pause control (SC 2.2.2). `Notice` auto-dismiss at 4 s is acceptable; re-check anything else.
- [ ] Verify no content flashes more than 3 times per second (SC 2.3.1).
- [ ] Verify `aria-current="page"` on active pagination link is rendered — confirmed in [app/components/pagination/PaginationItem.tsx](frontend/app/components/pagination/PaginationItem.tsx); keep under regression tests.

---

## Tooling & Prevention

- [ ] Add `eslint-plugin-jsx-a11y` to the frontend ESLint config.
- [ ] Wire the a11y lint rules into `npm run fix:frontend` so CI blocks regressions.
- [ ] Add `@axe-core/playwright` (or `jest-axe`) to the test suite and cover the top user flows: home, recipes list, recipe detail, profile, auth modal, search.
- [ ] Add `@axe-core/cli` or `pa11y-ci` to CI against `http://localhost:<port>` for a smoke scan.

---

## Manual WCAG 2.1 AA Checklist

Use per page as an acceptance gate. AA level unless noted.

### Perceivable
- [ ] **1.1.1** Every `<img>` has `alt`; decorative images use `alt=""`; icon-only buttons have `aria-label`; SVG icons inside labeled buttons have `aria-hidden="true"`.
- [ ] **1.2.1–1.2.5** No prerecorded audio/video without captions + transcripts (N/A if no media).
- [ ] **1.3.1** Semantic landmarks present: `<header>`, `<nav>`, `<main>`, `<footer>`. Forms use `<label htmlFor>`. Lists use `<ul>/<ol>`. Tables use `<th scope>`.
- [ ] **1.3.2** Tab order matches visual reading order.
- [ ] **1.3.3** No instructions rely on color/shape/position alone.
- [ ] **1.3.4** Content works in both orientations (no CSS lock).
- [ ] **1.3.5** Inputs use correct `autocomplete` tokens where applicable.
- [ ] **1.4.1** Error/required states use more than color (text + icon + border).
- [ ] **1.4.2** No auto-playing audio > 3 s.
- [ ] **1.4.3** Text contrast ≥ 4.5:1 (≥ 3:1 for large text ≥ 24 px or ≥ 18.66 px bold).
- [ ] **1.4.4** Resize text to 200 % without loss of content/function (both page zoom and text-only zoom).
- [ ] **1.4.5** No images of text (logos excepted).
- [ ] **1.4.10** No horizontal scroll at 320 CSS px width; content readable at 1280 × 1024 zoomed to 400 %.
- [ ] **1.4.11** Non-text contrast: UI component states, focus rings, meaningful graphics ≥ 3:1.
- [ ] **1.4.12** Text-spacing overrides don't break layout (line-height 1.5, paragraph spacing 2 × font-size, letter-spacing 0.12 em, word-spacing 0.16 em).
- [ ] **1.4.13** Hover/focus popovers are dismissable (Esc), hoverable, and persistent.

### Operable
- [ ] **2.1.1** Every interactive element reachable and operable via keyboard alone.
- [ ] **2.1.2** No keyboard traps (modals have focus trap + Esc).
- [ ] **2.1.4** Single-character shortcuts: none present, or user can disable/remap.
- [ ] **2.2.1** User can turn off / extend / adjust time limits (N/A unless we add timed flows).
- [ ] **2.2.2** No auto-updating content > 5 s without pause.
- [ ] **2.3.1** No content flashing > 3 times / sec.
- [ ] **2.4.1** Skip-to-main-content link present and visible on focus.
- [ ] **2.4.2** Every page has a unique, descriptive `<title>`.
- [ ] **2.4.3** Focus order is logical.
- [ ] **2.4.4** Link text / accessible name describes the destination; no "click here".
- [ ] **2.4.5** At least two ways to reach any page (nav + search).
- [ ] **2.4.6** Headings and labels are descriptive.
- [ ] **2.4.7** Visible focus indicator on every focusable element with ≥ 3:1 contrast.
- [ ] **2.5.1** No multi-point or path-based gesture as the only way.
- [ ] **2.5.2** Actions fire on pointer up, not down; cancellable by dragging off.
- [ ] **2.5.3** Visible label text contained in the accessible name.
- [ ] **2.5.4** No motion-actuated features required.

### Understandable
- [ ] **3.1.1** `<html lang>` set to the active language.
- [ ] **3.1.2** Inline content in a different language marked with `lang`.
- [ ] **3.2.1** No context change on focus alone.
- [ ] **3.2.2** No context change on input without warning.
- [ ] **3.2.3** Navigation in same relative order on every page.
- [ ] **3.2.4** Components with the same function have the same accessible name.
- [ ] **3.3.1** Form errors identify the field in text and programmatically.
- [ ] **3.3.2** Every input has an associated `<label>` or equivalent.
- [ ] **3.3.3** Error messages suggest how to fix the problem.
- [ ] **3.3.4** Legal/financial/data-modifying submissions can be reviewed, reversed, or confirmed.

### Robust
- [ ] **4.1.1** Valid HTML; no duplicate `id`s.
- [ ] **4.1.2** Custom controls expose name + role + value via ARIA.
- [ ] **4.1.3** Status messages use `role="status"` / `role="alert"` / `aria-live`.

### Manual-testing recipe per page
- [ ] Tab-through with no mouse: every control receives visible focus in logical order.
- [ ] Every menu/modal opens with keyboard only, closes with Esc, and returns focus to the trigger.
- [ ] No horizontal scroll / no clipping at 320 CSS px width.
- [ ] No overflow/overlap at 200 % browser zoom.
- [ ] Layout survives the WCAG text-spacing bookmarklet (SC 1.4.12).
- [ ] NVDA (Windows) and/or VoiceOver (macOS Cmd-F5) walks the page by headings, landmarks, and forms without gaps.
- [ ] With CSS disabled (Web Developer extension), reading order still makes sense.
- [ ] With Windows High Contrast / macOS Increase Contrast enabled, UI still intelligible.

---

## Free Tools (work against `http://localhost:<port>`)

- [ ] **axe DevTools** (Chrome / Firefox / Edge extension) — one-click scan mapped to WCAG SCs.
- [ ] **Lighthouse** (Chrome DevTools → Lighthouse) — Accessibility audit (axe subset).
- [ ] **WAVE** (WebAIM) extension — visual overlay of issues + landmark structure.
- [ ] **Accessibility Insights for Web** (Microsoft) — FastPass + guided Assessment covering ~50 checks.
- [ ] **IBM Equal Access Accessibility Checker** — cross-validates axe findings.
- [ ] **Pa11y** CLI: `npx pa11y http://localhost:5173`.
- [ ] **@axe-core/cli**: `npx @axe-core/cli http://localhost:5173`.
- [ ] **tota11y** bookmarklet — headings, landmarks, contrast, alt text.
- [ ] **Landmarks** browser extension — visualize and tab between ARIA landmarks.
- [ ] **HeadingsMap** extension — heading hierarchy tree.
- [ ] **WebAIM Contrast Checker** — paste two hex codes, get ratio.
- [ ] **Color Contrast Analyzer** (TPGi, desktop) — eyedropper contrast.
- [ ] **Stark** (Figma plugin + Chrome extension) — contrast + color-blindness simulation.
- [ ] **NVDA** (Windows, free screen reader).
- [ ] **VoiceOver** (macOS, Cmd-F5).
- [ ] **Orca** (Linux).
- [ ] Chrome DevTools device emulator at 320 × 800 for reflow testing.
- [ ] WCAG **Text Spacing Bookmarklet** — applies 1.4.12 spacing overrides in one click.
- [ ] **@axe-core/playwright** / **jest-axe** — automated regression in the test suite.
- [ ] **pa11y-ci** — URL-list scan in CI.
