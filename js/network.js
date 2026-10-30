// Offline state (spec C-09).
// Offline = browser reports it (`offline` event / navigator.onLine) OR 2 consecutive list requests failed.
// While offline: banner + videos stop (posters stay). `online` event or [다시 시도] clears it and re-evaluates autoplay.
// QA: `?offline=1` forces the state (the browser `online` event is ignored then).

import { getParams } from './params.js';

const forced = () => getParams().get('offline') === '1';
const FAILURES_TO_OFFLINE = 2;

let offline = false;
let failures = 0;

const emit = () => window.dispatchEvent(new CustomEvent('net:change'));

export const isOnline = () => !offline;

export function setOffline(next) {
  if (offline === next) return;
  offline = next;
  if (!next) failures = 0;
  emit();
}

export const reportFailure = () => {
  failures += 1;
  if (failures >= FAILURES_TO_OFFLINE) setOffline(true);
};
export const reportSuccess = () => {
  failures = 0;
};

export function initNetwork({ banner, retry, status }) {
  let announced = false;
  const render = () => {
    banner.hidden = !offline;
    document.body.classList.toggle('is-offline', offline);
    if (offline || announced) status.textContent = offline ? '네트워크 연결을 확인해주세요' : '다시 연결됐어요';
    announced = true;
  };
  window.addEventListener('net:change', render);
  window.addEventListener('offline', () => setOffline(true));
  window.addEventListener('online', () => {
    if (!forced()) setOffline(false);
  });
  retry.addEventListener('click', () => {
    if (navigator.onLine && !forced()) setOffline(false);
    else status.textContent = '아직 연결되지 않았어요';
  });
  if (!navigator.onLine || forced()) setOffline(true);
  render();
}
