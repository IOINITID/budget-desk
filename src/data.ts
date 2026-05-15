// @ts-nocheck — ported from prototype JS as-is. TODO: tighten types.
/* ============ data.jsx — demo data, budget periods, storage ============ */

export const STORAGE_KEY = 'budget_desk_v1';
export const EXPORT_KEY = 'budget_desk_last_export';

// ---------- Categories ----------
export const CATEGORIES = [
  // expenses
  { id: 'c-mortgage',  name: 'Ипотека',         type: 'expense', color: 'var(--c-clay)',      emoji: '🏠' },
  { id: 'c-food',      name: 'Еда + кафе',      type: 'expense', color: 'var(--c-sage)',      emoji: '🍽️' },
  { id: 'c-utils',     name: 'ЖКХ',             type: 'expense', color: 'var(--c-dustyblue)', emoji: '💡' },
  { id: 'c-services',  name: 'Услуги',          type: 'expense', color: 'var(--c-slate)',     emoji: '🛠️' },
  { id: 'c-common',    name: 'Общие расходы',   type: 'expense', color: 'var(--c-orange)',    emoji: '🛒' },
  { id: 'c-personal',  name: 'Личные расходы',  type: 'expense', color: 'var(--c-lavender)',  emoji: '👤' },
  { id: 'c-health',    name: 'Здоровье',        type: 'expense', color: 'var(--c-pink)',      emoji: '💊' },
  { id: 'c-travel',    name: 'Путешествия',     type: 'expense', color: 'var(--c-yellow)',    emoji: '✈️' },
  { id: 'c-home',      name: 'Дом',             type: 'expense', color: 'var(--c-moss)',      emoji: '🪴' },
  // incomes
  { id: 'c-salary',    name: 'Зарплата',        type: 'income',  color: 'var(--c-sage)',      emoji: '💼' },
  { id: 'c-advance',   name: 'Аванс',           type: 'income',  color: 'var(--c-moss)',      emoji: '💵' },
  { id: 'c-side',      name: 'Подработка',      type: 'income',  color: 'var(--c-dustyblue)', emoji: '🧰' },
  { id: 'c-refund',    name: 'Возврат',         type: 'income',  color: 'var(--c-lavender)',  emoji: '↩️' },
];

// ---------- Accounts ----------
export const ACCOUNTS = [
  { id: 'a-card',    name: 'Карта',       type: 'card',    balance: 184500, color: 'var(--c-dustyblue)', emoji: '💳' },
  { id: 'a-cash',    name: 'Наличные',    type: 'cash',    balance: 12400,  color: 'var(--c-yellow)',    emoji: '💵' },
  { id: 'a-savings', name: 'Накопления',  type: 'savings', balance: 290000, color: 'var(--c-sage)',      emoji: '🏦' },
  { id: 'a-credit',  name: 'Кредитка',    type: 'credit',  balance: -18200, color: 'var(--c-pink)',      emoji: '💰' },
];

// ---------- Members ----------
export const MEMBERS = [
  { id: 'm-i', name: 'И.' },
  { id: 'm-v', name: 'В.' },
];

// ---------- Goals ----------
export const GOALS = [
  { id: 'g-savings', name: 'Сбережения',   target: 500000, current: 290000, color: 'var(--c-sage)',      emoji: '🪙', note: 'Подушка безопасности' },
  { id: 'g-home',    name: 'Дом',          target: 300000, current: 75000,  color: 'var(--c-clay)',      emoji: '🏡', note: 'Ремонт кухни' },
  { id: 'g-travel',  name: 'Путешествия',  target: 200000, current: 75000,  color: 'var(--c-yellow)',    emoji: '✈️', note: 'Лето 2026' },
  { id: 'g-pi',      name: 'Личные И.',    target: 80000,  current: 20000,  color: 'var(--c-lavender)',  emoji: '🎁', note: '' },
  { id: 'g-pv',      name: 'Личные В.',    target: 80000,  current: 20000,  color: 'var(--c-pink)',      emoji: '🎁', note: '' },
];

// ---------- Budget plan (for current period) ----------
export const PLAN = {
  // expense plans by category id
  expenses: {
    'c-mortgage': 46000,
    'c-food':     65000,
    'c-utils':    11000,
    'c-services': 11000,
    'c-common':   20000,
    'c-personal': 40000,
    'c-health':   63000,
    'c-travel':   15000,
    'c-home':     12000,
  },
  incomes: {
    'c-salary':  348000,
    'c-advance':  60000,
  },
  savings: 50000,
};

// ---------- Period config (default) ----------
export const DEFAULT_DASHBOARD_LAYOUT = [
  { id: 'stat-exp',    enabled: true,  span: 1 },
  { id: 'stat-inc',    enabled: true,  span: 1 },
  { id: 'stat-bal',    enabled: true,  span: 1 },
  { id: 'stat-days',   enabled: true,  span: 1 },
  { id: 'dynamics',    enabled: true,  span: 3 },
  { id: 'side-panel',  enabled: true,  span: 1 },
  { id: 'top-cats',    enabled: true,  span: 2 },
  { id: 'over-budget', enabled: true,  span: 2 },
  { id: 'heatmap',     enabled: true,  span: 4 },
  { id: 'recent-ops',  enabled: true,  span: 4 },
];

export const DEFAULT_SETTINGS = {
  periodStartDay: 20,
  periodEndMode: 'beforeNext',
  currency: '₽',
  theme: 'light',
  accent: 'clay',
  remindExport: true,
  recurringIncomes: [
    { id: 'r-sal-i', day: 20, amount: 174000, label: 'Зарплата' },
    { id: 'r-sal-v', day: 5,  amount: 174000, label: 'Зарплата' },
  ],
  dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
  useEmoji: false,
};

export const ACCENT_PALETTES = [
  { id: 'clay',     label: 'терракот',  swatch: '#c46a3a' },
  { id: 'sage',     label: 'шалфей',    swatch: '#6e8a58' },
  { id: 'lavender', label: 'лаванда',   swatch: '#8a76b8' },
  { id: 'dusty',    label: 'пыльно-синий', swatch: '#5d83a0' },
  { id: 'rose',     label: 'роза',      swatch: '#b06b6e' },
  { id: 'amber',    label: 'янтарь',    swatch: '#a8823a' },
];

// ---------- Operations (demo) ----------
// Generate a realistic stream of operations inside 20 апр 2026 — 19 мая 2026 period.
export function buildDemoOps() {
  const ops = [];
  const Y = 2026;
  const push = (d, m, sum, type, cat, acct, desc, memberId) => {
    ops.push({
      id: 'op-' + Math.random().toString(36).slice(2, 9),
      date: new Date(Y, m - 1, d).toISOString().slice(0, 10),
      amount: sum,
      type,
      categoryId: cat,
      accountId: acct,
      description: desc,
      memberId: memberId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  // Incomes
  push(20, 4, 174000, 'income', 'c-salary',  'a-card', 'Зарплата И. (20 апр)',   'm-i');
  push(5,  5, 174000, 'income', 'c-salary',  'a-card', 'Зарплата И. (5 мая)',    'm-i');
  push(22, 4, 30000,  'income', 'c-advance', 'a-card', 'Аванс В.',               'm-v');
  push(28, 4, 8500,   'income', 'c-side',    'a-card', 'Консультация',            'm-i');

  // Mortgage
  push(25, 4, 45846, 'expense', 'c-mortgage', 'a-card', 'Ипотека апрель');

  // Utilities
  push(23, 4, 3200, 'expense', 'c-utils', 'a-card', 'эко-сити (вода+мусор)');
  push(24, 4, 2100, 'expense', 'c-utils', 'a-card', 'интернет');
  push(26, 4, 1850, 'expense', 'c-utils', 'a-card', 'газ');
  push(28, 4, 1980, 'expense', 'c-utils', 'a-card', 'электричество');

  // Services
  push(21, 4, 650,  'expense', 'c-services', 'a-card', 'МТС');
  push(21, 4, 1500, 'expense', 'c-services', 'a-card', 'GPT');
  push(2,  5, 1300, 'expense', 'c-services', 'a-card', 'хостинг');

  // Food + cafe
  const foods = [
    [20, 1240, 'продукты', 'a-cash'],
    [21, 880,  'кофейня', 'a-card'],
    [22, 2480, 'продукты', 'a-card'],
    [23, 1620, 'кафе', 'a-card'],
    [24, 760,  'продукты', 'a-cash'],
    [26, 3820, 'продукты', 'a-card'],
    [28, 1450, 'ужин', 'a-card'],
    [30, 2210, 'продукты', 'a-card'],
    [2,  920,  'кофейня', 'a-card'],
    [4,  3340, 'продукты', 'a-card'],
    [6,  1180, 'кафе', 'a-card'],
    [8,  2780, 'продукты', 'a-card'],
    [10, 1640, 'обед', 'a-card'],
    [11, 980,  'кофейня', 'a-cash'],
    [13, 2890, 'продукты', 'a-card'],
    [14, 1430, 'кафе', 'a-card'],
  ];
  foods.forEach(([d, s, t, ac]) => push(d, d > 19 ? 4 : 5, s, 'expense', 'c-food', ac, t));

  // Common
  push(22, 4, 12500, 'expense', 'c-common', 'a-card', 'светильники');
  push(27, 4, 8900,  'expense', 'c-common', 'a-card', 'мелочи для дома');
  push(3,  5, 6800,  'expense', 'c-common', 'a-card', 'бытовая химия');
  push(9,  5, 16641, 'expense', 'c-common', 'a-card', 'непредвиденное');

  // Personal
  push(23, 4, 2800,  'expense', 'c-personal', 'a-card', 'маникюр',     'm-v');
  push(25, 4, 4500,  'expense', 'c-personal', 'a-cash', 'стрижка',     'm-i');
  push(29, 4, 6900,  'expense', 'c-personal', 'a-card', 'одежда',      'm-v');
  push(5,  5, 3200,  'expense', 'c-personal', 'a-card', 'книги',       'm-i');
  push(11, 5, 5400,  'expense', 'c-personal', 'a-card', 'косметика',   'm-v');

  // Health
  push(24, 4, 18500, 'expense', 'c-health', 'a-card', 'ортодонт',    'm-v');
  push(2,  5, 4200,  'expense', 'c-health', 'a-card', 'лекарства');
  push(7,  5, 12800, 'expense', 'c-health', 'a-card', 'анализы',     'm-i');

  // Travel
  push(30, 4, 4500, 'expense', 'c-travel', 'a-card', 'такси');
  push(6,  5, 2300, 'expense', 'c-travel', 'a-card', 'такси');

  // Home
  push(1,  5, 1800, 'expense', 'c-home', 'a-card', 'цветы');
  push(12, 5, 3600, 'expense', 'c-home', 'a-card', 'мелкий ремонт');

  // Transfer (savings)
  ops.push({
    id: 'op-tr1',
    date: '2026-04-21',
    amount: 30000,
    type: 'transfer',
    categoryId: null,
    accountId: 'a-card',
    toAccountId: 'a-savings',
    description: 'Откладываем',
    memberId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return ops;
}

// ---------- Budget period utilities ----------
export function pad(n) { return String(n).padStart(2, '0'); }
export function fmtISO(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
export function parseISO(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); }

export const RU_MONTH = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
export const RU_MONTH_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

// Given an "anchor" reference date and settings, return the period it falls in.
export function periodFor(refDate, settings) {
  const startDay = settings.periodStartDay;
  const r = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  let start;
  if (r.getDate() >= startDay) {
    start = new Date(r.getFullYear(), r.getMonth(), startDay);
  } else {
    start = new Date(r.getFullYear(), r.getMonth() - 1, startDay);
  }
  const end = endOfPeriod(start, settings);
  return { start, end, startISO: fmtISO(start), endISO: fmtISO(end) };
}
export function endOfPeriod(start, settings) {
  if (settings.periodEndMode === 'sameDayNext') {
    return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
  }
  // beforeNext: до предыдущего дня следующего месяца
  return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1);
}
export function shiftPeriod(period, dir, settings) {
  const start = new Date(period.start.getFullYear(), period.start.getMonth() + dir, settings.periodStartDay);
  const end = endOfPeriod(start, settings);
  return { start, end, startISO: fmtISO(start), endISO: fmtISO(end) };
}
export function periodLabel(period) {
  const s = period.start; const e = period.end;
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.getDate() + '–' + e.getDate() + ' ' + RU_MONTH[s.getMonth()] + ' ' + s.getFullYear();
  }
  return s.getDate() + ' ' + RU_MONTH_SHORT[s.getMonth()] + ' – ' + e.getDate() + ' ' + RU_MONTH_SHORT[e.getMonth()] + ' ' + e.getFullYear();
}
export function periodLengthDays(period) {
  return Math.round((period.end - period.start) / 86400000) + 1;
}
export function dayIndexInPeriod(dateISO, period) {
  const d = parseISO(dateISO);
  return Math.round((d - period.start) / 86400000);
}
export function inPeriod(dateISO, period) {
  return dateISO >= period.startISO && dateISO <= period.endISO;
}

// ---------- Formatting ----------
export function fmtMoney(n, currency = '₽') {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(Math.round(n));
  return sign + abs.toLocaleString('ru-RU') + ' ' + currency;
}
export function fmtMoneyCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M';
  if (abs >= 1000)    return Math.round(n/1000) + 'k';
  return String(Math.round(n));
}
export function fmtDate(iso) {
  const d = parseISO(iso);
  return d.getDate() + ' ' + RU_MONTH_SHORT[d.getMonth()];
}

// ---------- Bootstrap state ----------
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      // migrate: fill missing settings keys
      s.settings = { ...DEFAULT_SETTINGS, ...s.settings };
      // migrate: add missing emoji to demo items
      const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c.emoji]));
      const accMap = Object.fromEntries(ACCOUNTS.map(a => [a.id, a.emoji]));
      const goalMap = Object.fromEntries(GOALS.map(g => [g.id, g.emoji]));
      s.categories = (s.categories || []).map(c => c.emoji ? c : ({ ...c, emoji: catMap[c.id] }));
      s.accounts   = (s.accounts   || []).map(a => a.emoji ? a : ({ ...a, emoji: accMap[a.id] }));
      s.goals      = (s.goals      || []).map(g => g.emoji ? g : ({ ...g, emoji: goalMap[g.id] }));
      return s;
    }
  } catch (e) { console.warn('load failed', e); }
  return {
    categories: CATEGORIES,
    accounts: ACCOUNTS,
    members: MEMBERS,
    goals: GOALS,
    plan: PLAN,
    operations: buildDemoOps(),
    settings: DEFAULT_SETTINGS,
    anchorISO: '2026-05-10', // "today" for the prototype
  };
}
export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('save failed', e); }
}
export function getLastExport() {
  return localStorage.getItem(EXPORT_KEY);
}
export function setLastExport(iso) {
  localStorage.setItem(EXPORT_KEY, iso);
}
