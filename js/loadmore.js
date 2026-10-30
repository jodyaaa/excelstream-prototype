// "더보기" — appends PAGE_SIZE (12) items per click.
// States: idle -> loading (12 skeletons, aria-busy) -> idle | exhausted (row removed) | error (retry label).

import { skeletonCard } from './components.js';
import { PAGE_SIZE } from './data.js';
import { reportFailure, reportSuccess } from './network.js';

export function createLoadMore({ button, list, status, initialCount, fetchPage, render, onAppend, label }) {
  let offset = initialCount;
  let loading = false;
  const row = button.closest('[data-more-row]') || button;
  const labelEl = button.querySelector('[data-label]');

  const setLabel = (text) => {
    if (labelEl) labelEl.textContent = text;
  };

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  async function load() {
    if (loading) return;
    loading = true;
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    row.classList.remove('is-error');

    const skeletons = Array.from({ length: PAGE_SIZE }, skeletonCard).join('');
    list.insertAdjacentHTML('beforeend', skeletons);
    const placeholders = [...list.querySelectorAll('.card--skeleton')].map((el) => el.closest('li'));

    try {
      const { items, hasMore } = await fetchPage(offset, PAGE_SIZE);
      reportSuccess();
      const firstNew = placeholders[0];
      placeholders.forEach((el) => el.remove());
      const before = list.children.length;
      list.insertAdjacentHTML('beforeend', items.map(render).join(''));
      offset += items.length;
      const added = [...list.children].slice(before);
      if (onAppend) onAppend(list);
      // keyboard users land on the first new card instead of losing their place
      const target = added[0] && added[0].querySelector('a');
      if (target && firstNew) target.focus({ preventScroll: false });
      announce(`${items.length}개를 더 불러왔어요`);
      if (!hasMore) {
        row.hidden = true;
        announce(`${items.length}개를 더 불러왔어요. 마지막입니다`);
      }
    } catch (err) {
      placeholders.forEach((el) => el.remove());
      reportFailure();
      row.classList.add('is-error');
      setLabel('불러오지 못했어요. 다시 시도');
      announce('목록을 불러오지 못했어요');
    } finally {
      loading = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      if (!row.classList.contains('is-error')) setLabel(label);
    }
  }

  button.addEventListener('click', load);
  return { load };
}
