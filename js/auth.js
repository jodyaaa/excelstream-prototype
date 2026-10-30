// Viewer entitlement for 19+ content (spec F-6 / C-13).
//
//   guest     not logged in
//   login     logged in, identity NOT verified (본인인증 미완료)
//   verified  logged in + identity verified  → allowed to preview 19+ media
//   creator   creator login (identity verification is required to broadcast → also allowed to preview)
//
// Header per state: guest = 로그인 · login/verified = MY · creator = 방송 시작하기 + MY. (충전하기 lives in the MY menu, not the bar.)
// The "LIVE를 더 재미있게 즐겨요" promo banner is shown to guests only.
//
// Mock: `?auth=guest|login|verified|creator` (default guest). Production: read from the session API.
// The preview URL of a 19+ item must NEVER reach a viewer who is not `verified` — the server should
// omit `video` / `poster` for them; this client additionally refuses to render them.

import { getParams } from './params.js?v=213723';

const STATES = ['guest', 'login', 'verified', 'creator'];

export const getAuth = () => {
  const q = getParams().get('auth');
  return STATES.includes(q) ? q : 'guest';
};

export const isLoggedIn = (auth = getAuth()) => auth !== 'guest';
export const isCreator = (auth = getAuth()) => auth === 'creator';
export const canPreviewAdult = (auth = getAuth()) => auth === 'verified' || auth === 'creator';

/** Copy + destination for the gate shown instead of the preview. */
export const gateFor = (auth = getAuth()) =>
  auth === 'guest'
    ? { href: '#/login?next=adult', cta: '로그인하기', text: '로그인 및 본인인증 후\n볼 수 있어요' }
    : { href: '#/verify', cta: '본인인증하기', text: '본인인증 후 볼 수 있어요' };
