import { getParams } from './params.js?v=213723';
// Mock data layer. Replace `fetchLivePage` / `fetchPopularPage` with real API calls.
// Media files are looping clips; in production `video` is an HLS/LL-HLS stream URL.

export const CATEGORIES = ['전체', '엑셀', '음악/댄스', '토크', 'ASMR', '먹방', '요리', '반려 동물', '기타'];

export const PAGE_SIZE = 12; // 더보기 1회당 추가 개수

const MEDIA_COUNT = 10;
const AVATAR_COUNT = 10;
const pad = (n) => String(n).padStart(2, '0');

const TITLES = [
  'Streaming titles are displayed here. Max one lines',
  '오늘은 신상 하울! 같이 구경해요 (질문 환영)',
  '새벽 감성 토크방 - 사연 받습니다 길어지면 말줄임표로 처리되는지 확인하는 아주 긴 방송 제목',
  '엑셀 단축키 100개 마스터하기 라이브',
  '주말 맛집 투어 먹방 같이 가요',
  '조용한 ASMR 라이브 (헤드폰 추천)',
  '30분 완성 집밥 레시피 클래스',
  '우리집 강아지 산책 같이해요',
  '랜덤박스 개봉 이벤트 진행 중!',
  '댄스 챌린지 연습방 - 신청곡 받아요',
];
const CHANNELS = ['Channel name', '하루', '미소공방', '밤토크', '서연', '지아', '엑셀왕', '민트초코', '도담', '나래'];
const LIVE_CATEGORIES = CATEGORIES.slice(1, -1); // last tab ('기타') intentionally has no live → empty state (spec C-05)

// QA: `?ended=0,2` renders those recommended-live cards as already ended (spec C-08).
const ENDED = new Set((getParams().get('ended') || '').split(',').filter(Boolean).map(Number));

const live = (i) => {
  const m = (i % MEDIA_COUNT) + 1;
  return {
    ended: ENDED.has(i),
    id: `live-${i}`,
    title: TITLES[i % TITLES.length],
    channel: CHANNELS[i % CHANNELS.length],
    viewers: [190, 1280, 56, 3420, 902, 210, 7, 15830][i % 8],
    category: LIVE_CATEGORIES[i % LIVE_CATEGORIES.length],
    adult: i % 6 === 5, // 19+ (mock): live(5), live(11) … — never among the first 4 cards
    video: `assets/video/live-${pad(m)}.mp4`,
    poster: `assets/img/poster/live-${pad(m)}.jpg`,
    avatar: `assets/img/avatar/avatar-${pad((i % AVATAR_COUNT) + 1)}.jpg`,
    href: `#/live/${i}`,
  };
};

const popular = (i) => ({
  ...live(i + 3),
  id: `popular-${i}`,
  views: [35190, 190, 2210, 190, 48120, 190, 902, 190, 12040, 190, 77, 190][i % 12],
  href: `#/video/${i}`,
});

export const CURATION_COUNT = 5;  // Curation/Mosaic: 1 large + 2x2 small
export const LIVE_TOTAL = 41;     // recommended live pool size (curation 5 + 12 x 3) — 더보기 row disappears after the 3rd load
export const POPULAR_TOTAL = 36;  // popular video pool size (initial 12 + 12 x 2)
export const TAB_GRID_COUNT = 20; // design: 5 rows x 4 cols

export const initialLive = () => Array.from({ length: CURATION_COUNT }, (_, i) => live(i));
export const initialPopular = () => Array.from({ length: PAGE_SIZE }, (_, i) => popular(i));
export const tabGridItems = () => Array.from({ length: TAB_GRID_COUNT }, (_, i) => live(i + CURATION_COUNT));

// First load (spec C-01): skeletons stay until this resolves. QA: `?delay=2000` slows it, `?delay=0` skips the wait.
const queryDelay = () => { const v = getParams().get('delay'); return v !== null && Number.isFinite(Number(v)) ? Number(v) : 450; };
export async function fetchInitial() {
  await new Promise((r) => setTimeout(r, queryDelay()));
  return { live: initialLive(), tab: tabGridItems(), popular: initialPopular() };
}

// `?fail=1` forces a network error so the retry state can be QA'd.
const forcedFail = () => getParams().get('fail') === '1';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(factory, total, offset, size) {
  await delay(450);
  if (forcedFail()) throw new Error('network');
  const end = Math.min(offset + size, total);
  return {
    items: Array.from({ length: Math.max(0, end - offset) }, (_, k) => factory(offset + k)),
    hasMore: end < total,
  };
}

export const fetchLivePage = (offset, size = PAGE_SIZE) => page(live, LIVE_TOTAL, offset, size);
export const fetchPopularPage = (offset, size = PAGE_SIZE) => page(popular, POPULAR_TOTAL, offset, size);

// Horizontal rails (ranking / shorts / hall of fame) render this many cards by default.
export const RAIL_COUNT = 20;

const fall = (first, ratio, i) => Math.round(first * ratio ** i); // descending mock series

export const RANKING = Array.from({ length: RAIL_COUNT }, (_, i) => ({
  rank: i + 1,
  name: CHANNELS[i % CHANNELS.length],
  followers: fall(33534, 0.9, i),
  donation: i < 6 ? [1353342330, 853342330, 34530000, 33342330, 13342330, 342330][i] : fall(342330, 0.8, i - 5),
  image: `assets/img/portrait/portrait-${pad((i % 10) + 1)}.jpg`,
  href: `#/channel/${i}`,
}));

// Hall of fame — own image set (assets/img/hall, 8 designed images cycled), ranked by lifetime donation.
const DONORS = ['별빛후원', '라떼한잔', '밤하늘', '고양이집사', '새벽감성', '단골손님', '구름한점', '초록잎', '달콤커피', '여름밤',
  '작은별', '푸른하늘', '소소한행복', '오후세시', '바람소리', '노을빛', '따뜻한차', '봄날의곰', '조용한밤', '한여름'];
export const HALL = Array.from({ length: RAIL_COUNT }, (_, i) => ({
  rank: i + 1,
  donor: DONORS[i % DONORS.length],
  donation: i < 6 ? [1353342330, 853342330, 34530000, 33342330, 13342330, 342330][i] : fall(342330, 0.8, i - 5),
  image: `assets/img/hall/hall-${pad((i % 8) + 1)}.jpg`,
  href: `#/donor/${i}`,
}));

// Popular shorts — portrait VIDEO cards (autoplay like live cards). Clips are offset so the first
// visible shorts do not repeat the first-view live clips.
export const SHORTS = Array.from({ length: RAIL_COUNT }, (_, i) => {
  const m = pad(((i + 4) % MEDIA_COUNT) + 1);
  return {
    id: `shorts-${i}`,
    title: TITLES[(i + 1) % TITLES.length],
    channel: CHANNELS[(i + 2) % CHANNELS.length],
    views: fall(33534, 0.86, i),
    adult: i % 7 === 3, // 19+ (mock)
    video: `assets/video/live-${m}.mp4`,
    poster: `assets/img/poster/live-${m}.jpg`,
    href: `#/shorts/${i}`,
  };
});

// ── Member grade (Lv1 → Lv7, left = lowest) ────────────────────────────────────────────────
// Names and thresholds are PLACEHOLDERS until the product team confirms them. `min` = lifetime donation (won).
export const GRADES = [
  { level: 1, name: '달팽이', min: 0 },
  { level: 2, name: '코뿔소', min: 5_000_000 },
  { level: 3, name: '늑대', min: 20_000_000 },
  { level: 4, name: '코끼리', min: 50_000_000 },
  { level: 5, name: '악어', min: 100_000_000 },
  { level: 6, name: '사자', min: 300_000_000 },
  { level: 7, name: '호랑이', min: 1_000_000_000 },
].map((g) => ({ ...g, image: `assets/img/grade/lv${g.level}.png` }));

// Mock viewer. `?grade=1..7` picks the level; donation sits 40% of the way to the next level (Lv1 = 0 won, like the design).
export const MEMBER = (() => {
  const q = Number(getParams().get('grade'));
  const level = Number.isInteger(q) && q >= 1 && q <= GRADES.length ? q : 1;
  const cur = GRADES[level - 1];
  const next = GRADES[level] ?? null;
  const donation = level === 1 ? 0 : next ? Math.round(cur.min + (next.min - cur.min) * 0.4) : cur.min;
  return { nickname: 'NICKNAME', cash: 34234, level, donation, avatar: 'assets/img/avatar/avatar-03.jpg' };
})();

export const EVENTS = [
  { id: 'e1', style: 'dark', dday: 'D-7', title: '신규 가입 혜택', sub: '첫 후원 시 보너스 캐시 증정', href: '#/events/1' },
  { id: 'e2', style: 'brand', dday: 'D-14', title: '시즌 랭킹 이벤트', sub: 'TOP 3 크리에이터에게 특별 배지', href: '#/events/2' },
  { id: 'e3', style: 'neutral', dday: 'D-21', title: '등급 업 챌린지', sub: '이번 달 후원으로 다음 등급에 도전', href: '#/events/3' },
];
