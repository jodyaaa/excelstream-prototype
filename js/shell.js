// App shell: inline Material icons, mobile sidebar drawer, header search toggle (≤639px).
import { icons } from './icons.js?v=213723';

export function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]:empty').forEach((el) => {
    const make = icons[el.dataset.icon];
    if (make) el.innerHTML = el.dataset.size ? make(Number(el.dataset.size)) : make();
  });
}

export function initShell() {
  const sidebar = document.querySelector('[data-sidebar]');
  const scrim = document.querySelector('[data-scrim]');
  const burger = document.querySelector('[data-burger]');
  const header = document.querySelector('[data-header]');
  const searchToggle = document.querySelector('[data-search-toggle]');
  const searchInput = document.querySelector('.search input');
  const desktop = window.matchMedia('(min-width: 1024px)');

  function setDrawer(open) {
    const was = burger.getAttribute('aria-expanded') === 'true';
    sidebar.classList.toggle('is-open', open);
    scrim.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open && was) burger.focus();
  }
  burger.addEventListener('click', () => setDrawer(!sidebar.classList.contains('is-open')));
  scrim.addEventListener('click', () => setDrawer(false));
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a') && !desktop.matches) setDrawer(false); });
  desktop.addEventListener('change', () => { if (desktop.matches) setDrawer(false); });

  searchToggle.addEventListener('click', () => {
    const open = header.classList.toggle('is-search-open');
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchInput.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (sidebar.classList.contains('is-open')) setDrawer(false);
    header.classList.remove('is-search-open');
  });
}

/** The prototype has no other screens: `#/…` links show a small notice instead of changing the URL hash. */
export function initPrototypeLinks() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.hidden = true;
  document.body.append(toast);
  let timer = 0;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a) return;
    e.preventDefault();
    toast.textContent = `프로토타입에는 없는 화면이에요 (${a.getAttribute('href').slice(1)})`;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (toast.hidden = true), 2200);
  });
}
