// Persistent game state + helpers. All mutations go through these functions so the UI gets events.
import { events } from './events.js';
import { ECONOMY, UNLOCKS, UPGRADES, RESTAURANT_NAMES } from '../config.js';

const SAVE_KEY = 'noodle-harbor-save-v1';

function fresh() {
  return {
    cash: ECONOMY.startCash,
    gems: 25,
    restaurantLevel: 0,          // 0-based index of the current restaurant
    unlocked: [],                // ids from UNLOCKS
    upgrades: { speed: 0, capacity: 0, cook: 0, price: 0 },
    boosts: { incomeUntil: 0, speedUntil: 0, incomeReadyAt: 0, speedReadyAt: 0 }, // ms timestamps
    stats: { served: 0, bowlsCooked: 0, cashEarned: 0, unlocks: 0 },
    missions: { day: '', claimed: [] },
    tutorialDone: false,
  };
}

export const state = fresh();

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) Object.assign(state, fresh(), JSON.parse(raw));
  } catch { /* ignore corrupt save */ }
}
export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  Object.assign(state, fresh());
}

// ---- multipliers ----
export const restaurantMult = () => Math.pow(ECONOMY.restaurantMultiplier, state.restaurantLevel);
export const incomeBoostActive = () => Date.now() < state.boosts.incomeUntil;
export const speedBoostActive = () => Date.now() < state.boosts.speedUntil;
export const restaurantName = () => RESTAURANT_NAMES[state.restaurantLevel % RESTAURANT_NAMES.length];

export function upgradeValue(key) {
  const u = UPGRADES[key], l = state.upgrades[key];
  if (key === 'cook') return Math.pow(1 - u.per, l);   // multiplier on cook time
  if (key === 'capacity') return l * u.per;            // extra bowls
  return 1 + l * u.per;                                 // speed / price multiplier
}
export function upgradeCost(key) {
  const u = UPGRADES[key];
  return Math.round(u.base * Math.pow(u.growth, state.upgrades[key]) * restaurantMult());
}

// ---- cash / gems ----
export function addCash(amount, worldPos) {
  amount = Math.round(amount);
  if (!amount) return;
  state.cash += amount;
  if (amount > 0) state.stats.cashEarned += amount;
  events.emit('cash:changed', { cash: state.cash, delta: amount, worldPos });
}
export function trySpend(amount) {
  amount = Math.round(amount);
  if (state.cash < amount) return false;
  state.cash -= amount;
  events.emit('cash:changed', { cash: state.cash, delta: -amount });
  return true;
}
export function addGems(n) {
  state.gems += n;
  events.emit('gems:changed', { gems: state.gems, delta: n });
}

// ---- unlock progress ----
export const isUnlocked = (id) => state.unlocked.includes(id);
export const unlockPrice = (u) => Math.round(u.price * restaurantMult());
export function markUnlocked(id) {
  if (isUnlocked(id)) return;
  state.unlocked.push(id);
  state.stats.unlocks++;
  events.emit('progress:changed', progress());
  save();
}
export function progress() {
  return { done: state.unlocked.length, total: UNLOCKS.length, name: restaurantName(), level: state.restaurantLevel };
}

export function buyUpgrade(key) {
  if (state.upgrades[key] >= UPGRADES[key].max) return false;
  if (!trySpend(upgradeCost(key))) return false;
  state.upgrades[key]++;
  events.emit('upgrades:changed', { ...state.upgrades });
  save();
  return true;
}

export function activateBoost(kind) {
  const b = state.boosts, now = Date.now();
  const key = kind === 'income' ? 'income' : 'speed';
  if (now < b[key + 'ReadyAt']) return false;
  const dur = key === 'income' ? 180 : 90, cd = key === 'income' ? 300 : 240;
  b[key + 'Until'] = now + dur * 1000;
  b[key + 'ReadyAt'] = now + (dur + cd) * 1000;
  events.emit('boosts:changed', { ...b });
  save();
  return true;
}

// Move to the next restaurant: keeps gems + stats, resets unlocks/upgrades.
export function nextRestaurant() {
  state.restaurantLevel++;
  state.unlocked = [];
  state.upgrades = { speed: 0, capacity: 0, cook: 0, price: 0 };
  state.cash = Math.round(ECONOMY.startCash * restaurantMult());
  save();
  events.emit('restaurant:changed', progress());
}

// autosave
setInterval(save, 5000);
window.addEventListener('beforeunload', save);
