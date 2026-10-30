// Light / Dark theme. Default follows the OS; the header toggle overrides and is remembered.
// Tokens live in css/tokens.css (:root = Light, [data-theme="dark"] / prefers-color-scheme = Dark).
import { icons } from './icons.js?v=213723';

const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const read = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
const write = (v) => { try { localStorage.setItem('theme', v); } catch { /* private mode */ } };

export const currentTheme = () => {
  const explicit = root.dataset.theme;
  return explicit === 'dark' || explicit === 'light' ? explicit : media.matches ? 'dark' : 'light';
};

export function initTheme(button) {
  const saved = read();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;

  const render = () => {
    const dark = currentTheme() === 'dark';
    // the icon shows where a click goes: moon in Light, sun in Dark
    button.innerHTML = dark ? icons.light_mode(20) : icons.dark_mode(20);
    button.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
    button.setAttribute('aria-pressed', String(dark));
  };
  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    write(next);
    render();
  });
  button.addEventListener('theme:sync', render);
  media.addEventListener('change', render); // OS change while no explicit choice
  render();
}
