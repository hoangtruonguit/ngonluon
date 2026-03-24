---
description: "Test UI/UX responsive & consistency across devices (PC, tablet, mobile). Args: all | home | auth | movie | search | profile | pricing | watch | admin"
---

// turbo-all

You are a senior UI/UX tester. Use MCP Playwright to test responsive design and visual consistency across 3 viewports.

## Viewports

- **PC**: 1920×1080
- **Tablet**: 768×1024
- **Mobile**: 375×812

## Page Groups

| Group | Pages | Auth Required |
|-------|-------|---------------|
| `home` | `/` (homepage) | No |
| `auth` | `/login`, `/register` | No |
| `movie` | `/movies/the-shawshank-redemption-3258` (or any existing slug) | No |
| `search` | `/search?q=god` | No |
| `pricing` | `/pricing` | No |
| `profile` | `/profile` | Yes |
| `watch` | `/watch/the-shawshank-redemption-3258` (or any existing slug) | Yes |
| `admin` | `/admin`, `/admin/analytics`, `/admin/users` | Yes (admin) |

## Argument Handling

- If argument is `all` or empty: test ALL groups in order above
- If argument is a group name (e.g., `home`, `auth`, `movie`): test only that group
- If argument contains multiple groups separated by space/comma: test each specified group

## Test Procedure (for each page in scope)

### Step 1: Navigate & Resize

For each viewport (PC → Tablet → Mobile):

1. Resize browser: `browser_resize` to the viewport dimensions
2. Navigate to the page: `browser_navigate`
3. Wait for page to load: `browser_wait_for` (network idle or specific element)
4. Take snapshot: `browser_snapshot`

### Step 2: Check Points (at each viewport)

Analyze each snapshot for:

**Layout & Responsive:**
- [ ] No horizontal overflow / horizontal scrollbar
- [ ] Content fits within viewport width
- [ ] Text is readable (not too small on mobile, not too large on PC)
- [ ] Images/posters scale properly
- [ ] Navigation adapts correctly (hamburger menu on mobile, full nav on PC)

**Visual Consistency:**
- [ ] Consistent spacing/padding across breakpoints
- [ ] Colors and theme are consistent
- [ ] No overlapping elements
- [ ] No cut-off text or images
- [ ] Buttons/links are tappable size on mobile (min 44×44px)

**Functionality:**
- [ ] Interactive elements are visible and accessible
- [ ] Forms render correctly (inputs, labels, buttons)
- [ ] Scroll works naturally (no stuck elements)
- [ ] Premium badges/lock overlays render correctly if applicable

### Step 3: Auth Handling

For pages requiring auth (`profile`, `watch`, `admin`):
- First navigate to `/login`
- Fill credentials: email `admin@ngonluon.com`, password `Admin@123`
- Submit login form
- Then navigate to the target page
- Only do login ONCE per test run — cookies persist

## Output Format

After testing, produce a **report table** per page group:

```
### [Group Name] — [Page URL]

| Check | PC (1920×1080) | Tablet (768×1024) | Mobile (375×812) |
|-------|:-:|:-:|:-:|
| No horizontal overflow | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Content fits viewport | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Text readability | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Image scaling | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Navigation adapts | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Spacing consistency | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| No overlapping | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Interactive elements | PASS/FAIL | PASS/FAIL | PASS/FAIL |

Issues found:
- [viewport] [description of issue] — [severity: critical/major/minor]
```

At the end, provide a **summary**:
```
## Summary
- Total pages tested: X
- Total viewports tested: X
- Pass: X | Fail: X
- Critical issues: list
- Major issues: list
- Minor issues: list
```

## Important Notes

- Base URL: `http://localhost:3000/en` (English locale)
- If a page fails to load (404, 500), note it and continue to the next page
- Focus on VISUAL issues — don't test business logic
- Take screenshots (`browser_take_screenshot`) for any FAIL items to show the issue
- If the dev server is not running, inform the user and stop
