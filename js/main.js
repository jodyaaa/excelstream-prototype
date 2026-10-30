import { getParams } from './params.js?v=213723';
import { createAutoplay } from './autoplay.js?v=213723';
import { createLoadMore } from './loadmore.js?v=213723';
import { initShell, injectIcons, initPrototypeLinks } from './shell.js?v=213723';
import { initDevtools } from './devtools.js?v=213723';
import { initTheme } from './theme.js?v=213723';
import { renderGrade } from './grade.js?v=213723';
import { initNetwork } from './network.js?v=213723';
import { endBroadcast } from './ended.js?v=213723';
import { getAuth, isCreator } from './auth.js?v=213723';
import { liveCard, curationCard, skeletonCuration, portraitCard, shortsCard, skeletonCard, skeletonPortrait, formatNumber } from './components.js?v=213723';
import {
  CATEGORIES,
  RAIL_COUNT,
  TAB_GRID_COUNT,
  PAGE_SIZE,
  CURATION_COUNT,
  MEMBER,
  EVENTS,
  RANKING,
  HALL,
  SHORTS,
  fetchInitial,
  fetchLivePage,
  fetchPopularPage,
} from './data.js?v=213723';

const $ = (sel, root = document) => root.querySelector(sel);
const params = getParams();
const status = $('[data-status]');

// ---- default images (spec 01 · C-10): swap a failed <img> once, never loop ---------------------
const DEFAULT_IMAGE = { avatar: 'assets/img/default/avatar.svg', 'portrait-card__image': 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' /* transparent → the card's CSS default (24px person) shows */ };
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return;
    const key = Object.keys(DEFAULT_IMAGE).find((cls) => img.classList.contains(cls));
    if (!key) return;
    img.dataset.fallback = '1';
    img.src = DEFAULT_IMAGE[key];
  },
  true,
);

const autoplay = createAutoplay();

// ---- viewer state (guest | login | verified | creator) → sidebar / header + 19+ gates ------------------
document.body.dataset.auth = getAuth();
injectIcons();
initTheme($('[data-theme-toggle]'));
initShell();
initPrototypeLinks();
initDevtools();
initNetwork({ banner: $('[data-net-banner]'), retry: $('[data-net-retry]'), status });

// logged-in sidebar: profile · cash · member grade
$('[data-member-name]').textContent = MEMBER.nickname;
$('[data-member-role]').textContent = isCreator() ? '크리에이터' : '시청자';
$('[data-member-cash]').textContent = formatNumber(MEMBER.cash);
$('[data-member-avatar]').src = MEMBER.avatar;
renderGrade($('[data-grade]'), MEMBER);

// events
$('[data-events]').innerHTML = EVENTS.map(
  (e) => `<li><a class="event event--${e.style}" data-figma="Banner/Event · ${e.style}" href="${e.href}"><span class="event__dday">${e.dday}</span><span class="event__title">${e.title}</span><span class="event__sub">${e.sub}</span></a></li>`,
).join('');

// ---- first load (spec C-01): skeletons in the final footprint, swapped when data arrives -----
const repeat = (n, make) => Array.from({ length: n }, make).join('');
const curation = $('[data-curation]');
const liveList = $('[data-live-list]');
const tabs = $('[data-tabs]');
const tabList = $('[data-tab-list]');
const tabEmpty = $('[data-tab-empty]');
const rankList = $('[data-rank-list]');
const shortsList = $('[data-shorts-list]');
const hallList = $('[data-hall-list]');
const popularList = $('[data-popular-list]');
const liveMore = $('[data-live-more]');
const popularMore = $('[data-popular-more]');

let ready = false;
let category = '전체';
let allTabItems = [];

document.body.classList.add('is-loading');
$('#main').setAttribute('aria-busy', 'true');
curation.innerHTML = Array.from({ length: CURATION_COUNT }, (_, i) => skeletonCuration(i === 0 ? 'large' : 'small')).join('');
tabList.innerHTML = repeat(TAB_GRID_COUNT, skeletonCard);
popularList.innerHTML = repeat(PAGE_SIZE, skeletonCard);
[rankList, shortsList, hallList].forEach((list) => (list.innerHTML = repeat(RAIL_COUNT, skeletonPortrait)));
[liveMore, popularMore].forEach((btn) => (btn.disabled = true));

// ---- category tabs + grid -------------------------------------------------------------------
tabs.innerHTML = CATEGORIES.map(
  (c, i) =>
    `<button class="tabs__tab" role="tab" id="tab-${i}" aria-selected="${i === 0}" aria-controls="tab-panel" tabindex="${i === 0 ? 0 : -1}">${c}</button>`,
).join('');

function renderTab() {
  if (!ready) return;
  const items = category === '전체' ? allTabItems : allTabItems.filter((i) => i.category === category);
  tabList.innerHTML = items.map((item) => liveCard(item)).join('');
  tabEmpty.hidden = items.length > 0;
  autoplay.observe(tabList);
}
tabs.addEventListener('click', (e) => selectTab(e.target.closest('[role=tab]')));
tabs.addEventListener('keydown', (e) => {
  const buttons = [...tabs.querySelectorAll('[role=tab]')];
  const i = buttons.indexOf(document.activeElement);
  if (i < 0) return;
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  selectTab(buttons[(next + buttons.length) % buttons.length], true);
});
function selectTab(tab, focus = false) {
  if (!tab) return;
  tabs.querySelectorAll('[role=tab]').forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  if (focus) tab.focus();
  category = tab.textContent.trim();
  renderTab();
}

// ---- creator ranking (followers / donation toggle) ------------------------------------------
let rankMode = 'followers';
const rankSub = (r) => (rankMode === 'followers' ? `팔로워 ${formatNumber(r.followers)}명` : `후원금 ${formatNumber(r.donation)}원`);
const renderRank = () => {
  if (!ready) return;
  rankList.innerHTML = RANKING.map((r) =>
    portraitCard({ image: r.image, title: r.name, sub: rankSub(r), rank: r.rank, href: r.href }),
  ).join('');
};
$('[data-rank-toggle]').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (!btn) return;
  rankMode = btn.dataset.mode;
  e.currentTarget.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  renderRank();
});

// ---- horizontal rails: arrow keys scroll by one card ----------------------------------------
document.querySelectorAll('[data-rail]').forEach((rail) => {
  rail.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    rail.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * 233, behavior: 'smooth' });
  });
});

// ---- hydrate ----------------------------------------------------------------------------------
async function hydrate() {
  const data = await fetchInitial();
  ready = true;
  allTabItems = data.tab;

  curation.innerHTML = data.live.map((item, i) => curationCard(item, i === 0 ? 'large' : 'small')).join('');
  createLoadMore({
    button: liveMore,
    list: liveList,
    status,
    initialCount: data.live.length,
    fetchPage: fetchLivePage,
    render: (item) => liveCard(item),
    onAppend: autoplay.observe,
    label: '추천 라이브 더보기',
  });

  renderTab();
  renderRank();
  shortsList.innerHTML = SHORTS.map(shortsCard).join('');
  hallList.innerHTML = HALL.map((h) =>
    portraitCard({ image: h.image, title: `후원금 ${formatNumber(h.donation)}원`, sub: h.donor, rank: h.rank, href: h.href }),
  ).join('');

  popularList.innerHTML = data.popular.map((item) => liveCard(item, 'video')).join('');
  createLoadMore({
    button: popularMore,
    list: popularList,
    status,
    initialCount: popularList.children.length,
    fetchPage: fetchPopularPage,
    render: (item) => liveCard(item, 'video'),
    onAppend: autoplay.observe,
    label: '인기 영상 더보기',
  });

  [liveMore, popularMore].forEach((btn) => (btn.disabled = false));
  document.body.classList.remove('is-loading');
  $('#main').removeAttribute('aria-busy');

  // start autoplay for everything rendered above (hero + visible cards)
  autoplay.observe(document);

  // QA (spec C-08): `?endAfter=3000` ends the first live card 3 s after load, as a status poll would
  const endAfter = Number(params.get('endAfter'));
  if (endAfter > 0) {
    setTimeout(() => endBroadcast(document.querySelector('.card[data-card]:not([data-restricted]):not(.is-ended)'), { autoplay, status }), endAfter);
  }
}
hydrate();
