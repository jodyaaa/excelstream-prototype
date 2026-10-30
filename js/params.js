// QA parameters. Sources, later wins: URL query (`?auth=creator`) < saved dev-panel state (sessionStorage `qa`).
// The query string does not survive inside a hosted/embedded viewer, so the dev panel (js/devtools.js) stores state here.
const KEY = 'qa';
let memory = {};

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return memory; }
};

export const saveParams = (obj) => {
  memory = obj;
  try { sessionStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* storage blocked → memory only */ }
};

export const getParams = () => {
  const merged = new URLSearchParams(location.search);
  Object.entries(read()).forEach(([k, v]) => (v === null || v === '' ? merged.delete(k) : merged.set(k, v)));
  return merged;
};
