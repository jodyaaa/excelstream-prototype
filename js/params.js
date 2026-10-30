// QA parameters. Sources, later wins: saved dev-panel state (sessionStorage `qa`) < URL query (`?auth=creator`).
// The query string does not survive inside a hosted/embedded viewer, so the dev panel (js/devtools.js) stores state here.
const KEY = 'qa';
let memory = {};

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return memory; }
};

export const QA_KEYS = ['auth', 'grade', 'delay', 'fail', 'offline', 'ended'];

/** Saves the full QA state (empty values dropped) and removes QA keys from the URL, so the saved state is the only source. */
export const saveParams = (obj) => {
  obj = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== ''));
  memory = obj;
  try {
    const u = new URL(location.href);
    QA_KEYS.forEach((k) => u.searchParams.delete(k));
    history.replaceState(null, '', u);
  } catch { /* sandboxed viewer: URL untouched */ }
  try { sessionStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* storage blocked → memory only */ }
};

export const getParams = () => {
  const merged = new URLSearchParams();
  Object.entries(read()).forEach(([k, v]) => { if (v !== null && v !== '') merged.set(k, v); });
  new URLSearchParams(location.search).forEach((v, k) => merged.set(k, v));
  return merged;
};
