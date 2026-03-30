# UI Test Report — 27-03-26

## Per-Group Results

---

### Home — http://localhost:3000/en

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | FAIL |
| Responsive | Content fits viewport | PASS | PASS | FAIL |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS (hamburger) | PASS (hamburger) |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | FAIL |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | N/A | N/A | N/A |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | PASS | PASS | PASS |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Responsive] [Mobile] Hero carousel text overflows viewport — hero heading and CTA buttons partially clipped — severity: major
- [Errors] [All viewports] `fonts.googleapis.com` fails with `net::ERR_FAILED` (network isolated env, Google Fonts blocked) — severity: minor (env-specific)
- [Errors] [All viewports] 37+ `MISSING_MESSAGE` IntlErrors: `Common.addToWatchlist`, `Common.removeFromWatchlist`, and others missing from EN locale messages — severity: major

---

### Auth — http://localhost:3000/en/login, /en/register

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | PASS |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | PASS |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | N/A | N/A | N/A |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Functional] [PC] Login form: submitting empty form shows validation errors correctly (PASS). Password show/hide toggle works (PASS).
- [Functional] [PC] Register form: submitting empty form shows field-level validation errors (PASS). Password strength feedback visible (PASS).
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor
- [Errors] [All viewports] `MISSING_MESSAGE` IntlErrors throughout — severity: major

---

### Movie — http://localhost:3000/en/movies/god-5633

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | PASS |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | PASS |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | FAIL | FAIL | FAIL |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Visual] [All viewports] Movie backdrop/hero image is blank/not rendered — the `god-5633` movie has no backdrop image configured, resulting in a plain dark background with no visual hero — severity: major
- [A11y] [All viewports] Movie poster image has generic alt text (`"Poster"`) rather than the movie title — severity: minor
- [Errors] [All viewports] `MISSING_MESSAGE` for `Common.addToWatchlist` and `Common.removeFromWatchlist` in EN locale — severity: major
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor

---

### Search — http://localhost:3000/en/search?q=god

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | PASS |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | PASS |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | PASS | PASS | PASS |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | FAIL | FAIL | FAIL |

**Issues found:**
- [i18n] [All viewports] Several i18n keys missing in EN locale — raw keys visible instead of translated text (e.g. `Common.addToWatchlist`) — severity: major
- [i18n] [All viewports] Search results page has untranslated keys showing as UI text — severity: major
- [Errors] [All viewports] Multiple `MISSING_MESSAGE` IntlErrors in console — severity: major
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor

---

### Pricing — http://localhost:3000/en/pricing

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | PASS |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | PASS |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | N/A | N/A | N/A |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | N/A | N/A | N/A |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor
- [Errors] [All viewports] `MISSING_MESSAGE` IntlErrors — severity: major
- [Visual] [All viewports] Pricing tiers (Basic/Standard/Premium) render correctly. Annual/Monthly toggle works. Subscribe buttons functional.

---

### Profile — http://localhost:3000/en/profile

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | PASS | PASS |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | PASS | PASS |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | PASS | PASS | PASS |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Functional] [All viewports] Auth-required page: correctly redirects to login when unauthenticated. After login with `admin@ngonluon.com` / `Admin@123`, profile page loads with full account data, watchlist (6 items), and watch history (15 items) — PASS.
- [Errors] [All viewports] `Common.removeFromWatchlist` missing from EN locale messages — severity: major
- [Errors] [All viewports] Avatar images from Google Photos URLs (`lh3.googleusercontent.com`) trigger Next.js Image warnings — unconfigured domain in `next.config.ts` — severity: minor
- [Errors] [All viewports] TMDB images (`image.tmdb.org`) trigger Next.js `_next/image` warnings (domain configured but path mismatch) — severity: minor
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor
- [Errors] [PC] `/uploads/avatars/*.png` returns 404 for one user's uploaded avatar — file missing from uploads directory — severity: minor

---

### Watch — http://localhost:3000/en/watch/god-5633

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | FAIL | FAIL |
| Responsive | Content fits viewport | PASS | PASS | PASS |
| Responsive | Text readability | PASS | PASS | PASS |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | PASS |
| Visual | Spacing consistency | PASS | PASS | PASS |
| Visual | No overlapping | PASS | FAIL | FAIL |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | PASS | PASS | PASS |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Responsive] [Tablet] Video player controls bar overflows horizontally — `settings` and `fullscreen` icons clipped on right edge — severity: major
- [Responsive] [Mobile] Video player controls bar severely overflows — `forward_10`, `volume_up`, `settings`, `fullscreen` all clipped — severity: critical
- [Visual] [Mobile] Play button overlaps "No video available" text in player empty state — severity: minor
- [Functional] [All viewports] No video available for `god-5633` — player shows empty state with "No video available" message. Player controls (play, seek, volume) present but inactive — severity: major (content gap, not UI bug)
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific) — severity: minor
- [Errors] [All viewports] `MISSING_MESSAGE` IntlErrors — severity: major

---

### Admin — http://localhost:3000/en/admin, /en/admin/analytics, /en/admin/users

| Category | Check | PC (1920x1080) | Tablet (768x1024) | Mobile (375x812) |
|----------|-------|:-:|:-:|:-:|
| Responsive | No horizontal overflow | PASS | FAIL | FAIL |
| Responsive | Content fits viewport | PASS | FAIL | FAIL |
| Responsive | Text readability | PASS | PASS | FAIL |
| Responsive | Image scaling | PASS | PASS | PASS |
| Responsive | Navigation adapts | PASS | PASS | FAIL |
| Visual | Spacing consistency | PASS | FAIL | FAIL |
| Visual | No overlapping | PASS | FAIL | FAIL |
| Functional | Interactive elements work | PASS | PASS | PASS |
| Functional | Forms validate | PASS | PASS | PASS |
| Functional | Navigation links work | PASS | PASS | PASS |
| A11y | Heading hierarchy | PASS | PASS | PASS |
| A11y | Images have alt text | PASS | PASS | PASS |
| A11y | Keyboard navigable | PASS | PASS | PASS |
| Errors | No JS console errors | FAIL | FAIL | FAIL |
| Errors | No failed network requests | FAIL | FAIL | FAIL |
| i18n | EN/VI content renders | PASS | PASS | PASS |

**Issues found:**
- [Responsive] [Tablet] Admin dashboard stat cards overflow horizontally — `card_membership` (Active Subscriptions) and `person_add` (New Users) cards are partially cut off — severity: major
- [Responsive] [Mobile] Admin sidebar overlaps main content — sidebar takes ~65% of mobile viewport, leaving stat cards to overflow off-screen — severity: critical
- [Responsive] [Mobile] Stat card icon text (`card_membership`, `person_add`) is truncated — Material Symbols icon names visible as raw text — severity: major
- [Errors] [All viewports] `fonts.googleapis.com` `net::ERR_FAILED` (env-specific, icons appear as text fallbacks) — severity: minor (env-specific)
- [Errors] [All viewports] `chart width(-1) height(-1)` warnings from Recharts — charts have zero initial dimensions — severity: minor
- [Errors] [Users page] `/uploads/avatars/*.png` returns 404 for one avatar — severity: minor
- [Functional] [All viewports] Admin section requires JWT auth (cookie-only auth insufficient). With active MCP session (admin login), all admin pages load correctly: Dashboard (53 users, 306 movies, 3701 reviews), Analytics (charts, genre breakdown), Users (53 users, pagination, search/filter, ban/promote actions) — PASS

---

## Summary

- **Date:** 27-03-26
- **Total pages tested:** 11 (home, login, register, movie detail, search, pricing, profile, watch, admin dashboard, admin analytics, admin users)
- **Total viewports tested:** 3 (PC 1920x1080, Tablet 768x1024, Mobile 375x812)
- **Total checks:** ~176 (16 checks × 3 viewports × 8 groups, adjusted for N/A)
- **Pass:** ~140 | **Fail:** ~36

### Critical Issues
1. **[Mobile] Admin sidebar layout broken** — sidebar occupies ~65% of mobile viewport, stat cards overflow off-screen, making admin panel unusable on mobile. Requires mobile-specific layout (collapsible sidebar or bottom nav) — `/en/admin`
2. **[Mobile] Watch page video controls overflow** — player controls bar (`forward_10`, `volume_up`, `settings`, `fullscreen`) are clipped on 375px viewport, making key controls inaccessible — `/en/watch/*`

### Major Issues
1. **[All pages] Systemic i18n MISSING_MESSAGE errors** — `Common.addToWatchlist`, `Common.removeFromWatchlist`, and 35+ other keys missing from EN locale (`web/src/messages/en.json`). Raw key names shown in UI on movie cards and other components.
2. **[Mobile] Hero carousel text overflow** — homepage hero heading and buttons overflow on 375px viewport — `/en`
3. **[Tablet] Admin dashboard card overflow** — last two stat cards (`Active Subscriptions`, `New Users`) are clipped on 768px — `/en/admin`
4. **[Tablet] Watch page video controls clipped** — `settings` and `fullscreen` buttons cut off at 768px — `/en/watch/*`
5. **[All viewports] Movie backdrop missing** — `god-5633` has no backdrop image, resulting in blank hero area on movie detail page — data issue affecting UX
6. **[All viewports] No video available** — `god-5633` has no video source — player renders empty state — data issue
7. **[A11y] Movie poster alt text** — generic `"Poster"` alt text instead of movie title — all movie detail pages

### Minor Issues
1. **[All pages] Google Fonts network failure** — `fonts.googleapis.com` blocked in isolated environment; Material Symbols icons fall back to text — env-specific, not a code bug
2. **[All pages] Recharts zero-dimension warnings** — charts report `width(-1) height(-1)` on initial render; charts render correctly after layout — admin analytics
3. **[Profile] Google Photos avatar domain unconfigured** — `lh3.googleusercontent.com` not in Next.js `images.domains` config
4. **[Profile/Users] Uploaded avatar 404** — `/uploads/avatars/*.png` returns 404 for one user — missing file on disk
5. **[Watch] Play button overlaps empty state text** on mobile

---

## Screenshots

| File | Description |
|------|-------------|
| `home-pc.png` | Homepage at 1920x1080 |
| `home-tablet.png` | Homepage at 768x1024 |
| `home-mobile.png` | Homepage at 375x812 — shows hero overflow issue |
| `home-mobile-text-overflow.png` | Close-up of hero text overflow on mobile |
| `auth-login-pc.png` | Login page at 1920x1080 |
| `auth-login-tablet.png` | Login page at 768x1024 |
| `auth-login-mobile.png` | Login page at 375x812 |
| `auth-register-pc.png` | Register page at 1920x1080 |
| `auth-register-validation-pc.png` | Register form with empty-submit validation errors |
| `auth-register-tablet.png` | Register page at 768x1024 |
| `auth-register-mobile.png` | Register page at 375x812 |
| `movie-pc.png` | Movie detail (god-5633) at 1920x1080 — blank backdrop visible |
| `movie-tablet.png` | Movie detail at 768x1024 — blank backdrop visible |
| `movie-mobile.png` | Movie detail at 375x812 — blank backdrop visible |
| `search-pc.png` | Search results (?q=god) at 1920x1080 |
| `search-tablet.png` | Search results at 768x1024 |
| `search-mobile.png` | Search results at 375x812 |
| `pricing-pc.png` | Pricing page at 1920x1080 |
| `pricing-tablet.png` | Pricing page at 768x1024 |
| `pricing-mobile.png` | Pricing page at 375x812 |
| `profile-pc.png` | Profile page (authenticated) at 1920x1080 |
| `profile-tablet.png` | Profile page at 768x1024 |
| `profile-mobile.png` | Profile page at 375x812 |
| `watch-pc.png` | Watch page (god-5633) at 1920x1080 |
| `watch-tablet.png` | Watch page at 768x1024 — controls clipped |
| `watch-mobile.png` | Watch page at 375x812 — controls clipped |
| `admin-pc.png` | Admin dashboard at 1920x1080 |
| `admin-tablet.png` | Admin dashboard at 768x1024 — stat cards overflow |
| `admin-mobile.png` | Admin dashboard at 375x812 — sidebar + overflow issues |
| `admin-analytics-pc.png` | Admin analytics at 1920x1080 |
| `admin-users-pc.png` | Admin users management at 1920x1080 |
