# ExcelStream · LIVE — v2 web prototype

Static ES-module build of the Figma **Home v2** (sidebar + header + Curation). v1 (`../app`) is untouched.

```bash
cd app-v2 && python3 serve.py        # http://127.0.0.1:5173  (python3 serve.py 5174 → other port)
```

## QA query parameters

| Param | Effect |
|-------|--------|
| `?auth=guest` (default) · `login` · `verified` · `creator` | viewer state — sidebar (login card ↔ profile/cash/grade), header (로그인 / 지갑·알림 / 방송 시작), promo banner (guest only), 19+ gates |
| `?grade=1..7` | member grade card (Lv1 달팽이 … Lv7 호랑이). Names / thresholds are placeholders (`GRADES` in `js/data.js`) |
| `?fail=1` · `?delay=2500` · `?ended=0,2` · `?endAfter=1500` · `?offline=1` | cold cases, same as v1 |

Theme: follows the OS; the header moon/sun button overrides it (saved in `localStorage.theme`). Tokens: `css/tokens.css` (Light = `:root`, Dark = `[data-theme="dark"]`).

## Behaviour

- **추천 라이브 더보기**: loads 12 lives (4 × 3) under the Curation — 12 skeletons → items → row disappears after the 3rd load (5 + 36). Failure shows `불러오지 못했어요. 다시 시도`.
- Responsive: ≥1024 fixed sidebar · <1024 drawer · live grid 4 / 3 / 2 / 1 columns (≥1360 / ≥900 / ≥640 / below).
- Icons come from the Material icon library (`js/icons.js`); grade mascots are `assets/img/grade/lv1..7.png`.

## For developers

**Developer panel** — the `DEV` button (bottom-right) switches viewer state / grade / theme / cold cases (loading · load-more failure · offline · ended) without touching the URL, and *Figma 컴포넌트 이름 표시* overlays the Figma component name on every block (`data-figma` attribute). Hide it with `?dev=0`.
Links to screens that do not exist (`#/…`) show a small notice instead of changing the URL.

### Figma ↔ code

| Figma component | Markup / class | Source |
|-----------------|----------------|--------|
| Sidebar · Profile · Cash · Member grade | `.sidebar` `.profile` `.cash` `.grade` | `index.html`, `js/grade.js` |
| Grade/Mascot (Lv1–Lv7) | `.grade__mascot` · `assets/img/grade/lv{n}.png` | `js/data.js` `GRADES` |
| Header · Search field · Theme toggle | `.header` `.search` `[data-theme-toggle]` | `index.html`, `js/theme.js` |
| Curation/Mosaic · Card/Live Overlay | `.curation__grid` `.overlay-card--large/small` | `js/components.js` `curationCard` |
| More/Row · Live grid 4×3 · Card/Live Skeleton | `.more-row` `.card-grid` `.card--skeleton` | `js/loadmore.js` (12 per click) |
| Banner/Event · Promo/Banner · Promo/First visit | `.event` `.promo` `.first-visit` | `index.html`, `js/main.js` |
| Tabs · Card/Live | `.tabs` `.live-card` | `js/main.js`, `js/components.js` |
| Card/Portrait (image / video) | `.portrait-card` | `js/components.js` |

### Tokens

`css/tokens.css` mirrors the Figma **Token · Color** collection one-to-one (`bg/subtle` → `--color-bg-subtle`, `text/on-media-muted` → `--color-text-on-media-muted`, …), Light in `:root`, Dark in `[data-theme="dark"]` (and `prefers-color-scheme` when the user has not chosen). Components never use raw colors — change a token, not a component.

### Share build

`python3 tools/build-share.py <out_dir>` produces a single-page fragment (inline CSS/JS, Google Fonts instead of the Pretendard CDN) + `assets/` for static hosting / Artifact.
