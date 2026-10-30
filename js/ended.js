// Broadcast ended while the card is on screen (spec C-08).
// Same card, switched in place: badge → "방송 종료", thumbnail dimmed, video out of the autoplay pool,
// link goes to the channel page ("보러가기" stays). The next refresh / 더보기 simply no longer returns it.

import { endedBadge } from './components.js?v=213723';

export function endBroadcast(card, { autoplay, status } = {}) {
  if (!card || card.classList.contains('is-ended') || card.dataset.restricted !== undefined) return false;
  const video = card.querySelector('video');
  if (video) {
    video.removeAttribute('data-autoplay');
    if (autoplay) autoplay.release(video);
  }
  const group = card.querySelector('.badge-group');
  if (group) group.outerHTML = endedBadge;
  card.classList.add('is-ended');
  if (card.dataset.channelHref) card.setAttribute('href', card.dataset.channelHref);
  const title = card.querySelector('.live-card__title, .overlay-card__title')?.textContent ?? '';
  const channel = card.querySelector('.live-card__channel, .overlay-card__channel')?.textContent ?? '';
  card.setAttribute('aria-label', `${title} — ${channel}, 방송 종료, 채널 보러가기`);
  if (status) status.textContent = `${channel}의 방송이 종료됐어요`;
  return true;
}
