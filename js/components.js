// Markup factories. Every card is ONE <a> so click / keyboard / hover share a single target.
// Class names follow BEM and map 1:1 to Figma layer names (see docs/layer-naming).

import { getAuth, canPreviewAdult, gateFor } from './auth.js';
import { icons } from './icons.js';

const fmt = new Intl.NumberFormat('ko-KR');
export const formatNumber = (n) => fmt.format(n);
// Viewer count badge: full number up to 99,999, then "10만+" (keeps badge width stable) — spec 02·D
export const formatViewers = (n) => (n >= 100000 ? `${Math.floor(n / 10000)}만+명` : `${formatNumber(n)}명`);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const badge19 = '<span class="badge badge--19" aria-label="19세 이상">19</span>';
// `adult` prepends the 19 marker; it always comes first in the group.
const badgeLive = (viewers, adult) =>
  `<span class="badge-group">${adult ? badge19 : ''}<span class="badge badge--live">LIVE</span><span class="badge badge--count">${formatViewers(viewers)}</span></span>`;
const badgeViews = (views, adult) =>
  `<span class="badge-group">${adult ? badge19 : ''}<span class="badge badge--count badge--views">${icons.triangle()}${formatNumber(views)}명</span></span>`;
export const endedBadge = '<span class="badge-group"><span class="badge badge--ended">방송 종료</span></span>';
const lock = icons.lock();

const overlay = (cta = '보러가기') =>
  `<span class="card__overlay" aria-hidden="true"><span class="pill-glass">${cta}${icons.play()}</span></span>`;

/** 19+ without entitlement: no video, no poster, no real avatar — only this gate. */
const gate = (text) => `<span class="gate">${lock}<span class="gate__text">${text}</span></span>`;
const restricted = (item) => Boolean(item.adult) && !canPreviewAdult();

/** Card/Live — 16:9 autoplay thumbnail + info row. `kind` = 'live' | 'video'. 19+ → gate unless verified. */
export function liveCard(item, kind = 'live') {
  const badge = kind === 'video' ? badgeViews(item.views, item.adult) : badgeLive(item.viewers, item.adult);
  if (restricted(item)) {
    const g = gateFor(getAuth());
    return `<li class="card-grid__item">
  <a class="live-card card is-restricted" data-figma="Card/Live · 19+" href="${esc(g.href)}" data-card data-restricted aria-label="19세 이상 — ${esc(item.title)}, ${esc(g.text)}">
    <span class="live-card__thumb">
      ${gate(g.text)}
      ${badge}
      ${overlay(g.cta)}
    </span>
    <span class="live-card__info">
      <img class="avatar" src="assets/img/default/avatar.svg" alt="" width="36" height="36" />
      <span class="live-card__text">
        <span class="live-card__title">${esc(item.title)}</span>
        <span class="live-card__channel">${esc(item.channel)}</span>
      </span>
    </span>
  </a>
</li>`;
  }
  if (item.ended && kind === 'live') {
    return `<li class="card-grid__item">
  <a class="live-card card is-ended" data-figma="Card/Live · Ended" href="#/channel/${esc(item.id)}" data-card aria-label="${esc(item.title)} — ${esc(item.channel)}, 방송 종료, 채널 보러가기">
    <span class="live-card__thumb">
      <video class="media" muted playsinline preload="none" disablepictureinpicture poster="${esc(item.poster)}"></video>
      ${endedBadge}
      ${overlay()}
    </span>
    <span class="live-card__info">
      <img class="avatar" src="${esc(item.avatar)}" alt="" width="36" height="36" loading="lazy" />
      <span class="live-card__text">
        <span class="live-card__title">${esc(item.title)}</span>
        <span class="live-card__channel">${esc(item.channel)}</span>
      </span>
    </span>
  </a>
</li>`;
  }
  return `<li class="card-grid__item">
  <a class="live-card card" data-figma="Card/Live" href="${esc(item.href)}" data-card data-channel-href="#/channel/${esc(item.id)}" aria-label="${esc(item.title)} — ${esc(item.channel)}, 보러가기">
    <span class="live-card__thumb">
      <video class="media" muted playsinline loop preload="none" disablepictureinpicture poster="${esc(item.poster)}" data-autoplay data-src="${esc(item.video)}"></video>
      ${badge}
      ${overlay()}
    </span>
    <span class="live-card__info">
      <img class="avatar" src="${esc(item.avatar)}" alt="" width="36" height="36" loading="lazy" />
      <span class="live-card__text">
        <span class="live-card__title">${esc(item.title)}</span>
        <span class="live-card__channel">${esc(item.channel)}</span>
      </span>
    </span>
  </a>
</li>`;
}

/** Loading state: same footprint as Card/Live so the grid never jumps. */
export function skeletonCard() {
  return `<li class="card-grid__item" aria-hidden="true">
  <div class="live-card card card--skeleton" data-figma="Card/Live Skeleton">
    <span class="live-card__thumb skeleton"></span>
    <span class="live-card__info"><span class="avatar skeleton"></span>
      <span class="live-card__text"><span class="skeleton skeleton--line"></span><span class="skeleton skeleton--line skeleton--short"></span></span>
    </span>
  </div>
</li>`;
}

/** Loading state for rail cards (same 218x325 box). */
export function skeletonPortrait() {
  return `<li class="rail__item" aria-hidden="true"><div class="portrait-card card--skeleton skeleton"></div></li>`;
}

/** Card/Portrait · video — 218x325 autoplay shorts: title, channel, ▶ views (matches design). 19+ → gate. */
export function shortsCard(item) {
  const info = `<span class="portrait-card__info">
      <span class="portrait-card__title">${esc(item.title)}</span>
      <span class="portrait-card__sub">${esc(item.channel)}</span>
      <span class="portrait-card__sub portrait-card__views">${icons.triangle()}${formatNumber(item.views)}명</span>
    </span>`;
  if (restricted(item)) {
    const g = gateFor(getAuth());
    return `<li class="rail__item">
  <a class="portrait-card card is-restricted" data-figma="Card/Portrait · 19+" href="${esc(g.href)}" data-card data-restricted aria-label="19세 이상 — ${esc(item.title)}, ${esc(g.text)}">
    ${gate(g.text)}
    <span class="badge-group">${badge19}</span>
    ${info}
    ${overlay(g.cta)}
  </a>
</li>`;
  }
  return `<li class="rail__item">
  <a class="portrait-card card" data-figma="Card/Portrait · video" href="${esc(item.href)}" data-card aria-label="${esc(item.title)} — ${esc(item.channel)}, 보러가기">
    <video class="portrait-card__image media" muted playsinline loop preload="none" disablepictureinpicture poster="${esc(item.poster)}" data-autoplay data-src="${esc(item.video)}"></video>
    ${item.adult ? `<span class="badge-group">${badge19}</span>` : ''}
    ${info}
    ${overlay()}
  </a>
</li>`;
}

/** Card/Portrait · image — 218x325 portrait (ranking / hall of fame). */
export function portraitCard({ image, title, sub, rank, href }) {
  return `<li class="rail__item">
  <a class="portrait-card card" data-figma="Card/Portrait · image" href="${esc(href)}" data-card>
    <img class="portrait-card__image" src="${esc(image)}" alt="" loading="lazy" />
    ${rank ? `<span class="badge-group"><span class="badge badge--count">${rank}위</span></span>` : ''}
    <span class="portrait-card__info">
      <span class="portrait-card__title">${esc(title)}</span>
      <span class="portrait-card__sub">${esc(sub)}</span>
    </span>
  </a>
</li>`;
}

/** Card/Live Overlay — Curation/Mosaic tile: video fills the card, info sits on the bottom scrim. size = 'large' | 'small'. */
export function curationCard(item, size = 'small') {
  const ended = item.ended;
  const badge = ended ? endedBadge : badgeLive(item.viewers, item.adult);
  const info = `<span class="overlay-card__info">
      <img class="avatar" src="${esc(item.avatar)}" alt="" width="36" height="36" />
      <span class="overlay-card__text">
        <span class="overlay-card__title">${esc(item.title)}</span>
        <span class="overlay-card__channel">${esc(item.channel)}</span>
      </span>
    </span>`;
  if (restricted(item)) {
    const g = gateFor(getAuth());
    return `<li class="curation__item curation__item--${size}">
  <a class="overlay-card overlay-card--${size} card is-restricted" data-figma="Card/Live Overlay · 19+ · ${size}" href="${esc(g.href)}" data-card data-restricted aria-label="19세 이상 — ${esc(item.title)}, ${esc(g.text)}">
    ${gate(g.text)}${badge}${overlay(g.cta)}
  </a>
</li>`;
  }
  return `<li class="curation__item curation__item--${size}">
  <a class="overlay-card overlay-card--${size} card${ended ? ' is-ended' : ''}" data-figma="Card/Live Overlay · ${size}" href="${ended ? `#/channel/${esc(item.id)}` : esc(item.href)}" data-card${ended ? '' : ` data-channel-href="#/channel/${esc(item.id)}"`} aria-label="${esc(item.title)} — ${esc(item.channel)}, ${ended ? '방송 종료, 채널 보러가기' : '보러가기'}">
    <video class="media" muted playsinline ${ended ? '' : 'loop '}preload="none" disablepictureinpicture poster="${esc(item.poster)}"${ended ? '' : ` data-autoplay data-src="${esc(item.video)}"`}></video>
    ${badge}
    ${info}
    ${overlay()}
  </a>
</li>`;
}

/** Loading state for a Curation tile. */
export const skeletonCuration = (size = 'small') =>
  `<li class="curation__item curation__item--${size}" aria-hidden="true"><div class="overlay-card overlay-card--${size} card--skeleton skeleton" data-figma="Curation/Mosaic · Loading"></div></li>`;
