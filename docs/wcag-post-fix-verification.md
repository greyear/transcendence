# WCAG 2.1 AA — Post-Fix Manual Verification Checklist

Run this after the remediation work in [docs/wcag-audit.md](docs/wcag-audit.md) is complete. The goal is to **confirm fixes hold in the real browser**, not just in code review. Every item is either a keyboard/SR/visual action a tester performs, or an automated scan they run against `http://localhost:<port>`.

If any item fails, log it against the relevant section in [docs/wcag-audit.md](docs/wcag-audit.md) and block sign-off.

---

## 0. Prep

- [ ] Dev server is running locally (`npm run dev` in `frontend/`) and reachable at `http://localhost:<port>`.
- [ ] Two user states available: logged-out and logged-in (so gated flows can be exercised).
- [ ] Browser tools installed: axe DevTools, WAVE, Accessibility Insights for Web, HeadingsMap, Landmarks.
- [ ] Screen reader installed and practiced: **NVDA** on Windows or **VoiceOver** on macOS (`Cmd-F5`).
- [ ] Test all three locales configured: `en`, `fi`, `ru`.
- [ ] Chrome DevTools device toolbar ready for 320 × 800 reflow checks.
- [ ] WCAG Text Spacing bookmarklet saved in the bookmarks bar.

---

## 1. App-wide smoke test (run once per locale)

### View-source spot-checks
- [ ] `<html lang="...">` reflects the active locale (`en` / `fi` / `ru`) — not `undefined`.
- [ ] `<main id="main-content" tabindex="-1">` is present.
- [ ] Skip-to-main-content link is the first interactive element in `<body>`.
- [ ] No duplicate `id` attributes in the rendered DOM (check DevTools → Issues panel or axe).

### Global keyboard pass
- [ ] Press `Tab` from the URL bar — **first** visible focus is the skip link.
- [ ] Activate skip link with `Enter` — focus moves to `<main>`; next `Tab` lands inside main content.
- [ ] Every focusable element has a **visibly clear** focus ring (not relying on default browser outline alone).
- [ ] Focus ring has ≥ 3:1 contrast against every background it appears on (header, card, backdrop, footer).
- [ ] No focus-ring "flicker" or disappearance mid-traversal.
- [ ] Tab order matches visual reading order in both desktop and mobile layouts.
- [ ] No keyboard trap anywhere (can always Tab out of every widget).

### Global screen-reader pass
- [ ] SR announces the page title on load.
- [ ] SR landmark navigation (`D` in NVDA, Rotor → Landmarks in VoiceOver) lists `banner`, `navigation`, `main`, `contentinfo` exactly once each.
- [ ] SR heading navigation (`H` in NVDA, Rotor → Headings) reaches exactly one `h1`, then `h2` → `h3` without skipping.

---

## 2. Per-route walkthrough

Repeat for every route: `/`, `/recipes`, `/recipes/:id`, `/users`, `/users/:id`, `/profile`, `/recipes/new` (recipe-create), `/search?q=...`, `/policy`, `/terms`.

- [ ] **Unique page title** in the browser tab, mentioning what the page is about (recipe name, username, search query where applicable).
- [ ] Exactly one `<h1>` and no skipped heading levels (verify with HeadingsMap).
- [ ] All images have meaningful `alt`, or `alt=""` when decorative; avatars paired with visible names are `alt=""`.
- [ ] Icons inside labeled buttons have `aria-hidden="true"`.
- [ ] Every interactive control reachable with keyboard alone.
- [ ] Visible focus on every control.
- [ ] No horizontal scrollbar at 320 × 800 (DevTools device toolbar).
- [ ] Layout survives 200 % browser zoom — no clipping, no overlap.
- [ ] Layout survives 400 % zoom at 1280 × 1024 viewport.
- [ ] WCAG Text Spacing bookmarklet leaves layout intact.
- [ ] SR reads the page coherently start to finish.

---

## 3. Component-specific checks

### 3.1 Modals — `AuthModal`, `ConfirmationModal`, `ratingModal`
- [ ] Opening the modal moves focus **into** it (first actionable element or `data-initial-focus`).
- [ ] `Esc` closes the modal and returns focus to the trigger.
- [ ] Shift-Tab from the first element wraps to the last; Tab from the last wraps to the first (focus trap).
- [ ] Clicking the backdrop behaves as documented (close or ignore) and doesn't leave stale focus on background elements.
- [ ] Inner container has `role="dialog"` and `aria-modal="true"` (inspect in DevTools Elements panel).
- [ ] Modal has an accessible name via `aria-labelledby` (points to the modal title) or `aria-label`.
- [ ] SR announces "dialog" + the modal title on open.
- [ ] Background page is inert / not reachable by Tab while modal is open.
- [ ] Body scroll is locked while open and restored on close.

### 3.2 Dropdown menus — `SortMenu`, `LanguageSelector`, `SearchFilterMenu`
- [ ] Trigger button exposes `aria-haspopup`, `aria-expanded` (flips true/false), and `aria-controls` pointing to the panel `id`.
- [ ] Panel has the correct role: `role="listbox"` (with `role="option"` children) or `role="menu"` (with `role="menuitem"` / `role="none"`).
- [ ] `Enter` or `Space` on the trigger opens the panel and moves focus into it.
- [ ] `↓` / `↑` move between options; `Home` / `End` jump to first / last.
- [ ] `Enter` / `Space` on an option selects it and closes the panel; focus returns to the trigger.
- [ ] `Esc` closes the panel; focus returns to the trigger.
- [ ] `Tab` from inside the panel closes it and moves focus to the next page element.
- [ ] Clicking outside closes the panel.
- [ ] Selected option is visually indicated **and** announced by SR (aria-selected or `aria-current`).
- [ ] SR announces role + expanded state + selected option when opened.

### 3.3 Form inputs — `InputField`, `TextArea`, `SearchField`
- [ ] Clicking the visible label focuses the input (confirms `htmlFor`/`id` wiring).
- [ ] Floating labels on placeholder-only fields are read as the input's accessible name.
- [ ] Each input has a visible focus indicator meeting 3:1 contrast.
- [ ] On invalid blur, error message appears **and** SR announces it (role="alert"), without the user refocusing.
- [ ] `aria-invalid="true"` is set while error is showing; cleared on valid input.
- [ ] `aria-describedby` points to the error id when present, otherwise the hint id when present.
- [ ] Hint is readable at default zoom and meets 4.5:1 contrast.
- [ ] Password-visibility toggle has a clear `aria-label` that updates between "Show password" and "Hide password".
- [ ] Password toggle is keyboard-operable; focus stays on the input after toggling so typing position is preserved.
- [ ] `autoComplete` token is appropriate: `email`, `current-password`, `new-password`, `username`, `given-name`, `family-name`, `tel` where applicable.
- [ ] Required fields are indicated by more than color (asterisk text, "required" in label, or `aria-required`).

### 3.4 `Notice` toast
- [ ] Rendered element is `<div role="status" aria-live="polite" aria-atomic="true">` (verify in DevTools).
- [ ] New message is announced by SR without moving focus.
- [ ] Auto-dismiss at 4 s doesn't cut off the announcement mid-read.
- [ ] Successive messages replace the previous one cleanly (no stacked announcements).
- [ ] Notice content has ≥ 4.5:1 contrast against its background.

### 3.5 Header + mobile menu
- [ ] On desktop, all top-row controls are reachable by Tab in logical order.
- [ ] On mobile, clicking the menu toggle flips `aria-expanded` true/false.
- [ ] Toggle's `aria-controls` points to the overlay `id`.
- [ ] Opening the overlay moves focus into it (first actionable element).
- [ ] Closing the overlay returns focus to the toggle.
- [ ] While the overlay is open, the rest of the page is inert or has `aria-hidden="true"` (no tabbing past the overlay into hidden top-row controls).
- [ ] Active nav link exposes `aria-current="page"` (inspect rendered `<a>`).
- [ ] Logo link has an accessible name that includes "home" or equivalent.
- [ ] Language selector in the header is fully keyboard-operable (see 3.2).

### 3.6 Footer
- [ ] `<footer>` or `role="contentinfo"` wraps the region.
- [ ] All footer links have descriptive text (no "click here" / bare URLs).

### 3.7 Pagination
- [ ] Pagination is wrapped in `<nav aria-label="...">`.
- [ ] The current page link has `aria-current="page"`.
- [ ] Disabled first/prev/next/last arrows are announced as disabled (either `aria-disabled="true"` or truly disabled), and their styling meets 3:1.
- [ ] Every icon-only arrow has a descriptive `aria-label` ("Previous page", "Go to page 3", etc.).
- [ ] Keyboard: Tab through all page buttons, Enter navigates.

### 3.8 Rating stars
- [ ] Radiogroup has a visible label connected via `aria-labelledby`.
- [ ] Each star has a descriptive `aria-label` ("3 stars", not just "3").
- [ ] Arrow keys move between stars; Space selects.
- [ ] Focus ring is visible on the **visible label**, not hidden under the input.
- [ ] SR announces the group, current value, and number of options.

### 3.9 Filter list / filter menu
- [ ] Wrapped in `role="group"` (or `role="tablist"` if tabs) with descriptive `aria-label`.
- [ ] Multi-select groups use `<fieldset><legend>` or equivalent ARIA grouping.
- [ ] Selected state announced (aria-pressed, aria-checked, or role=tab + aria-selected as appropriate).

### 3.10 Cards — `RecipeCard`, `UserCard`, `CookCard`
- [ ] Each card's primary action has a descriptive accessible name.
- [ ] Avatar alt is `""` when paired with a visible name; otherwise descriptive.
- [ ] Recipe hero images have meaningful alt (the dish name is acceptable).
- [ ] If the whole card is clickable, only one tab stop per card (don't nest interactive elements).

---

## 4. Cross-cutting checks

### 4.1 Color contrast — re-verify every token pair
- [ ] `--text-primary` on `--bg-main` ≥ 4.5:1 (body text).
- [ ] `--text-secondary` on `--bg-main` ≥ 4.5:1 (or restricted to large text).
- [ ] `--text-secondary` on `--surface-primary` ≥ 4.5:1 (input placeholder/hint).
- [ ] `--borders-input` on `--surface-primary` ≥ 3:1.
- [ ] `--icons-default` on `--surface-header` ≥ 3:1.
- [ ] `--surface-warning` + its text meets 4.5:1 for text, 3:1 for graphic.
- [ ] Disabled pagination color ≥ 3:1 against `--bg-main`.
- [ ] Focus ring color ≥ 3:1 against every surface it appears over.
- [ ] Button hover/active states remain ≥ 3:1 for non-text UI and ≥ 4.5:1 for button text.

### 4.2 Color independence
- [ ] Apply a grayscale filter (DevTools → Rendering → Emulate vision deficiencies: Achromatopsia) and re-walk the app — nothing becomes ambiguous.
- [ ] Simulate Protanopia, Deuteranopia, Tritanopia — required / selected / error states still distinguishable.

### 4.3 Zoom and reflow
- [ ] 200 % browser page zoom: no clipping or horizontal scroll on any route.
- [ ] 400 % zoom at 1280 × 1024 viewport: content reflows to one column cleanly.
- [ ] If the browser supports text-only zoom (Firefox), 200 % text-only zoom does not break any layout.
- [ ] 320 × 800 viewport: no horizontal scrollbar on any route.

### 4.4 Text spacing (SC 1.4.12)
- [ ] Apply WCAG Text Spacing bookmarklet — no content is cut off, no overlap, all controls still usable.

### 4.5 Reduced motion
- [ ] Enable OS "Reduce motion" (macOS System Settings → Accessibility → Display, or Windows Settings → Ease of Access → Display).
- [ ] Non-essential transitions / animations are suppressed (no bounce, no fade-in, no chevron spin).
- [ ] Motion-critical UI (focus movement, menu open/close) still functions.

### 4.6 No keyboard shortcuts hijack single letters
- [ ] Type a regular character in a non-input element — no single-key shortcut fires unexpectedly (SC 2.1.4).

### 4.7 No unexpected context changes (SC 3.2.1, 3.2.2)
- [ ] Focusing any control never navigates or submits.
- [ ] Changing the value of any input never auto-submits; explicit action (button / Enter) required.

### 4.8 CSS off
- [ ] Disable CSS (Web Developer extension → CSS → Disable All Styles) on the top 3 pages — reading order still makes sense, all content visible.

### 4.9 OS high-contrast mode
- [ ] Enable Windows High Contrast or macOS Increase Contrast — UI still intelligible, icons/borders not lost.

---

## 5. End-to-end keyboard + screen reader flows

Run each flow **mouse-free** with a screen reader active. Use NVDA on Windows and/or VoiceOver on macOS.

- [ ] **Sign up** → auth modal opens, form fields labeled and announced, errors announced on blur, success announced.
- [ ] **Log in** → same as above.
- [ ] **Search** for a recipe → type query, submit, land on results, announce results count, navigate to a recipe.
- [ ] **Filter + sort** the recipes list → open SortMenu, change value; open SearchFilterMenu, toggle filters; confirm results update and the list is announced.
- [ ] **Paginate** through recipes — announce current page + total.
- [ ] **View a recipe detail** → heading structure announced, ingredients/steps readable in order, rating form reachable.
- [ ] **Favorite** a recipe → announce state change.
- [ ] **Rate** a recipe → radiogroup announced, selection confirmed.
- [ ] **Leave a review** → textarea labeled, character count (if any) announced, submit confirmation announced.
- [ ] **Create a new recipe** → every field labeled, image-upload has accessible name, errors announced.
- [ ] **Edit profile** → every field labeled, success announced.
- [ ] **Change language** via header language selector → language change persists and `<html lang>` updates without a full reload.
- [ ] **Open mobile menu** on a narrow viewport → focus moves in, Esc closes, focus returns.

---

## 6. Automated sanity checks (should be green after fixes)

Run against every major route: `/`, `/recipes`, `/recipes/:id`, `/users`, `/users/:id`, `/profile`, `/recipes/new`, `/search`, `/policy`, `/terms`.

- [ ] **axe DevTools** — 0 critical, 0 serious on each route.
- [ ] **Lighthouse** — Accessibility score ≥ 95 on each route (ideally 100).
- [ ] **WAVE** — 0 errors, review alerts individually.
- [ ] **Accessibility Insights FastPass** — 0 failures.
- [ ] **`npx pa11y http://localhost:<port>/...`** — 0 errors.
- [ ] **`npx @axe-core/cli http://localhost:<port>/...`** — 0 violations.
- [ ] `eslint-plugin-jsx-a11y` passes as part of `npm run fix:frontend`.
- [ ] `jest-axe` / `@axe-core/playwright` tests pass in CI.

---

## 7. Regression checks

- [ ] All three locales (`en`, `fi`, `ru`) render correctly — no overflow, no cut-off translation strings.
- [ ] Mobile breakpoints tested: 360, 375, 414.
- [ ] Tablet breakpoint tested: 768.
- [ ] Desktop breakpoints tested: 1440, 1920.
- [ ] Dark/light OS preference (if supported) still renders correctly.
- [ ] No console errors or React warnings on any route.
- [ ] No unexpected network errors (failed image loads, 404 avatars).

---

## 8. Sign-off

- [ ] Findings from this run logged and cross-referenced in [docs/wcag-audit.md](docs/wcag-audit.md).
- [ ] Every Tier 1 and Tier 2 item from the audit is checked off or has a tracked follow-up.
- [ ] Tier 3 items either resolved or explicitly deferred with a ticket link.
- [ ] Accessibility reviewer approval (name + date): _______________________ / ________
- [ ] PR merged to `main` and smoke-tested on staging.
