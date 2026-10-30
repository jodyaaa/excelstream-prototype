// Developer panel (bottom-right "DEV"): switch viewer state / grade / theme / cold cases without editing the URL,
// and overlay Figma component names (`data-figma`) on the page. Hide it with `?dev=0` (or the ✕ in the panel).
// State is stored by js/params.js (sessionStorage) so it also works where the query string is unavailable (embedded viewers).
import { getParams, saveParams, QA_KEYS } from './params.js?v=213723';

const store = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* blocked */ } };
const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

export function initDevtools() {
  const q = getParams();
  if (q.get('dev') === '0') return;

  const val = (k, d = '') => q.get(k) ?? d;
  const set = (patch) => {
    const next = {};
    QA_KEYS.forEach((k) => (next[k] = q.get(k)));
    saveParams({ ...next, ...patch });
    location.reload();
  };

  const root = document.createElement('div');
  root.className = 'dev';
  root.innerHTML = `
    <button class="dev__fab" type="button" aria-expanded="false" aria-controls="dev-panel">DEV</button>
    <div class="dev__panel" id="dev-panel" role="dialog" aria-label="개발자 패널" hidden>
      <header class="dev__head"><strong>개발자 패널</strong><button class="dev__x" type="button" aria-label="닫기">✕</button></header>
      <label class="dev__row">사용자 상태
        <select data-k="auth">
          <option value="guest">guest · 비로그인</option>
          <option value="login">login · 로그인(본인인증 전)</option>
          <option value="verified">verified · 본인인증 완료</option>
          <option value="creator">creator · 크리에이터</option>
        </select>
      </label>
      <label class="dev__row">회원 등급
        <select data-k="grade">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}">Lv${n}</option>`).join('')}</select>
      </label>
      <div class="dev__row">테마
        <div class="dev__seg" data-theme-seg>
          <button type="button" data-t="system">시스템</button><button type="button" data-t="light">Light</button><button type="button" data-t="dark">Dark</button>
        </div>
      </div>
      <fieldset class="dev__row dev__checks"><legend>상태 시나리오</legend>
        <label><input type="checkbox" data-k="delay" data-on="2500" />첫 로딩 느림 (스켈레톤)</label>
        <label><input type="checkbox" data-k="fail" data-on="1" />더보기 실패 (재시도)</label>
        <label><input type="checkbox" data-k="offline" data-on="1" />오프라인 배너</label>
        <label><input type="checkbox" data-k="ended" data-on="0,2" />종료된 라이브 (큐레이션)</label>
      </fieldset>
      <label class="dev__row dev__inline"><input type="checkbox" data-outline />Figma 컴포넌트 이름 표시</label>
      <footer class="dev__foot"><button type="button" data-reset>초기화</button><span>QA 파라미터는 README 참고</span></footer>
    </div>`;
  document.body.append(root);

  const fab = root.querySelector('.dev__fab');
  const panel = root.querySelector('.dev__panel');
  const toggle = (open) => { panel.hidden = !open; fab.setAttribute('aria-expanded', String(open)); fab.hidden = open; };
  fab.addEventListener('click', () => toggle(true));
  root.querySelector('.dev__x').addEventListener('click', () => toggle(false));

  root.querySelectorAll('select[data-k]').forEach((sel) => {
    sel.value = val(sel.dataset.k, sel.dataset.k === 'auth' ? 'guest' : '1');
    sel.addEventListener('change', () => set({ [sel.dataset.k]: sel.value }));
  });
  root.querySelectorAll('input[type=checkbox][data-k]').forEach((cb) => {
    cb.checked = val(cb.dataset.k) === cb.dataset.on;
    cb.addEventListener('change', () => set({ [cb.dataset.k]: cb.checked ? cb.dataset.on : null }));
  });
  root.querySelector('[data-reset]').addEventListener('click', () => set({ auth: null, grade: null, delay: null, fail: null, offline: null, ended: null }));

  // theme (applies immediately, no reload)
  const seg = root.querySelector('[data-theme-seg]');
  const markTheme = () => {
    const cur = stored('theme') || 'system';
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === cur)));
  };
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    if (b.dataset.t === 'system') { store('theme', null); delete document.documentElement.dataset.theme; }
    else { store('theme', b.dataset.t); document.documentElement.dataset.theme = b.dataset.t; }
    markTheme();
    document.querySelector('[data-theme-toggle]')?.dispatchEvent(new Event('theme:sync'));
  });
  markTheme();

  // component-name overlay
  const layer = document.createElement('div');
  layer.className = 'dev__layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const outline = root.querySelector('[data-outline]');
  let raf = 0;
  const draw = () => {
    raf = 0;
    if (!outline.checked) { layer.replaceChildren(); return; }
    const vh = innerHeight;
    const boxes = [...document.querySelectorAll('[data-figma]')].map((el) => [el, el.getBoundingClientRect()])
      .filter(([, r]) => r.width > 24 && r.height > 12 && r.bottom > 0 && r.top < vh);
    layer.replaceChildren(...boxes.map(([el, r]) => {
      const d = document.createElement('div');
      d.className = 'dev__box';
      d.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      d.innerHTML = `<span>${el.dataset.figma}</span>`;
      return d;
    }));
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
  outline.addEventListener('change', () => { try { sessionStorage.setItem('dev-outline', outline.checked ? '1' : ''); } catch { /* */ } schedule(); });
  try { outline.checked = sessionStorage.getItem('dev-outline') === '1'; } catch { /* */ }
  addEventListener('scroll', schedule, { passive: true, capture: true });
  addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(document.querySelector('.main'), { childList: true, subtree: true });
  setInterval(() => { if (outline.checked) schedule(); }, 800); // video / layout shifts
  schedule();
}
