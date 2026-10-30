// Sidebar · Member grade card (Lv1 → Lv7). Mascot images: assets/img/grade/lv{n}.png (left = lowest).
import { icons } from './icons.js?v=213723';
import { GRADES } from './data.js?v=213723';
import { formatNumber } from './components.js?v=213723';

export function renderGrade(el, member) {
  const cur = GRADES[member.level - 1];
  const next = GRADES[member.level] ?? null;
  const pct = next ? Math.max(0, Math.min(100, ((member.donation - cur.min) / (next.min - cur.min)) * 100)) : 100;
  el.dataset.level = String(cur.level);
  el.innerHTML = `
    <a class="grade__head" href="#/grade">
      <img class="grade__mascot" data-figma="Grade/Mascot · Lv${cur.level}" src="${cur.image}" alt="" width="52" height="52" />
      <span class="grade__text">
        <span class="grade__name">${cur.name}${icons.chevron_right(20)}</span>
        <span class="grade__donation">후원 ${formatNumber(member.donation)}원</span>
      </span>
    </a>
    <div class="grade__bar" role="progressbar" aria-label="다음 등급까지" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>
    <div class="grade__labels"><strong>${cur.name}</strong><span>${next ? next.name : '최고 등급'}</span></div>
    <p class="grade__next">${next ? `다음 등급까지 ${formatNumber(next.min - member.donation)}원 후원` : '최고 등급이에요'}</p>
    <a class="grade__btn" href="#/grade">${next ? '다음 등급 미리보기' : '등급 혜택 보기'}</a>`;
}
