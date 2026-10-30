// Viewport-driven muted autoplay.
//
// Rules (see spec 1·2):
//  - A video plays only while >= PLAY_RATIO of it is inside the viewport.
//  - Leaving the viewport (scrolled up OR not yet reached) pauses it.
//  - Sources are attached lazily the first time a video touches the viewport.
//  - At most MAX_CONCURRENT videos play at once (closest to viewport centre win), re-ranked on scroll/resize.
//  - No autoplay when: prefers-reduced-motion, Save-Data, hidden tab, offline, decode error.

import { isOnline } from './network.js';

const PLAY_RATIO = 0.5;
const MAX_CONCURRENT = 8;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = () => Boolean(navigator.connection && navigator.connection.saveData);

export function createAutoplay() {
  /** @type {Map<HTMLVideoElement, number>} videos currently >= PLAY_RATIO visible */
  const candidates = new Map();
  const seen = new WeakSet();

  const canAutoplay = () => !reduceMotion.matches && !saveData() && !document.hidden && isOnline();

  const attach = (video) => {
    if (video.src || !video.dataset.src) return;
    video.preload = 'auto';
    video.src = video.dataset.src;
  };

  const stop = (video) => {
    if (!video.paused) video.pause();
    video.classList.remove('is-playing');
  };

  const start = (video) => {
    if (!video.paused || video.classList.contains('is-error')) return;
    attach(video);
    video.muted = true; // required for autoplay policies; also keeps the spec "no sound"
    const result = video.play();
    if (result && typeof result.then === 'function') {
      result.then(() => video.classList.add('is-playing')).catch(() => video.classList.add('is-blocked'));
    }
  };

  const centreDistance = (video) => {
    const r = video.getBoundingClientRect();
    // 2D distance so horizontal rails rank by horizontal position too
    return Math.hypot(r.left + r.width / 2 - window.innerWidth / 2, r.top + r.height / 2 - window.innerHeight / 2);
  };

  const evaluate = () => {
    if (!canAutoplay()) {
      candidates.forEach((_, video) => stop(video));
      return;
    }
    const ranked = [...candidates.keys()].sort((a, b) => centreDistance(a) - centreDistance(b));
    ranked.forEach((video, i) => (i < MAX_CONCURRENT ? start(video) : stop(video)));
  };

  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(evaluate);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target: video, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && canAutoplay()) attach(video); // no download when autoplay is blocked
        if (isIntersecting && intersectionRatio >= PLAY_RATIO) candidates.set(video, intersectionRatio);
        else {
          candidates.delete(video);
          stop(video);
        }
      });
      schedule();
    },
    { threshold: [0, 0.25, PLAY_RATIO, 0.75, 1] },
  );

  const watch = (video) => {
    if (seen.has(video)) return;
    seen.add(video);
    video.muted = true;
    video.addEventListener('error', () => {
      video.classList.add('is-error'); // cold case: exclude from playback; poster/default image stays visible
      candidates.delete(video);
    });
    video.addEventListener('waiting', () => video.classList.add('is-buffering'));
    video.addEventListener('playing', () => video.classList.remove('is-buffering'));
    io.observe(video);
  };

  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reduceMotion.addEventListener('change', schedule);
  window.addEventListener('net:change', schedule);

  return {
    /** Register every `video[data-autoplay]` under `root` (call again after appending cards). */
    observe(root = document) {
      root.querySelectorAll('video[data-autoplay]').forEach(watch);
    },
    /** Take a video out of the autoplay pool for good (e.g. the broadcast ended). */
    release(video) {
      candidates.delete(video);
      io.unobserve(video);
      stop(video);
      schedule();
    },
  };
}
