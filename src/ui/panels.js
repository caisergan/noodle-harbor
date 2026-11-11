// Modal panels: missions, shop, upgrades sheet, pause menu, restaurant complete.
import {
  state, save, resetSave, addCash, addGems, buyUpgrade, upgradeCost, restaurantMult, progress,
} from '../core/state.js';
import { events } from '../core/events.js';
import { UPGRADES, BOOSTS, RESTAURANT_NAMES, ECONOMY } from '../config.js';
import { ICON } from './icons.js';
import { fmt, html } from './format.js';
import { sfx, isMuted, setMuted, unlockAudio } from './audio.js';
import { toast } from './toast.js';
import { flags, pauseGame, refreshInput } from './uistate.js';

const modals = [];
function makeModal({ title, icon, cls = '', sticky = false }) {
  const el = html(`
    <div class="backdrop ${cls}" data-ui>
      <div class="panel" data-ui>
        <div class="panel-head">
          <span class="ph-icon">${icon || ''}</span><h2>${title}</h2>
          <button class="x-btn pressable" data-ui aria-label="Close">${ICON.x}</button>
        </div>
        <div class="panel-body"></div>
      </div>
    </div>`);
  const m = {
    el, body: el.querySelector('.panel-body'),
    onOpen: null, onClose: null,
    get isOpen() { return el.classList.contains('open'); },
    open() {
      modals.forEach((o) => { if (o !== m && o.isOpen && !o.keep) o.close(); });
      el.classList.add('open'); m.onOpen && m.onOpen();
    },
    close() { if (!m.isOpen) return; el.classList.remove('open'); m.onClose && m.onClose(); },
  };
  el.querySelector('.x-btn').addEventListener('click', () => m.close());
  if (!sticky) el.addEventListener('click', (e) => { if (e.target === el) m.close(); });
  modals.push(m);
  document.getElementById('ui').appendChild(el);
  return m;
}

export function buildPanels(root, hud) {
  // ================= MISSIONS =================
  const missions = makeModal({ title: 'Daily Missions', icon: ICON.clipboard });
  const MDEFS = [
    { id: 'serve', stat: 'served', icon: ICON.bowl, target: () => 20, text: () => 'Serve 20 customers' },
    { id: 'earn', stat: 'cashEarned', icon: ICON.cash, target: () => 500 * restaurantMult(), text: () => `Earn $${fmt(500 * restaurantMult())}` },
    { id: 'unlock', stat: 'unlocks', icon: ICON.arrowUp, target: () => 2, text: () => 'Unlock 2 things' },
  ];
  const MISSION_GEMS = 10;

  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function ensureDay() {
    const m = state.missions;
    if (m.day !== dayKey() || !m.base) {
      m.day = dayKey(); m.claimed = [];
      m.base = { served: state.stats.served, cashEarned: state.stats.cashEarned, unlocks: state.stats.unlocks };
      save();
    }
    return m;
  }
  const prog = (d) => {
    const m = ensureDay();
    return Math.max(0, Math.min(d.target(), (state.stats[d.stat] || 0) - (m.base[d.stat] || 0)));
  };

  function renderMissions() {
    const m = ensureDay();
    const frag = document.createDocumentFragment();
    let claimable = false;
    for (const d of MDEFS) {
      const p = prog(d), t = d.target();
      const done = p >= t, claimed = m.claimed.includes(d.id);
      if (done && !claimed) claimable = true;
      const row = html(`
        <div class="mrow ${claimed ? 'claimed' : done ? 'done' : ''}">
          <span class="m-ico">${d.icon}</span>
          <div class="m-mid"><div class="m-text">${d.text()}</div>
            <div class="m-bar"><i style="transform:scaleX(${t ? p / t : 0})"></i><span>${fmt(p)}/${fmt(t)}</span></div></div>
          <button class="btn claim pressable" data-ui ${done && !claimed ? '' : 'disabled'}>
            ${claimed ? ICON.check : `${ICON.gem}<b>${MISSION_GEMS}</b>`}</button>
        </div>`);
      row.querySelector('.claim').addEventListener('click', () => {
        const mm = ensureDay();
        if (mm.claimed.includes(d.id) || prog(d) < d.target()) return;
        mm.claimed.push(d.id);
        addGems(MISSION_GEMS); save(); sfx('unlock');
        toast(`+${MISSION_GEMS} gems!`);
        renderMissions(); updateBadge();
      });
      frag.appendChild(row);
    }
    missions.body.replaceChildren(frag, html('<p class="hint">Resets every day. Rewards: gems.</p>'));
    return claimable;
  }
  function updateBadge() {
    const m = ensureDay();
    hud.setBadge(MDEFS.some((d) => !m.claimed.includes(d.id) && prog(d) >= d.target()));
  }
  missions.onOpen = renderMissions;
  let mTimer = 0;
  const kickMissions = () => {
    if (mTimer) return;
    mTimer = setTimeout(() => { mTimer = 0; updateBadge(); if (missions.isOpen) renderMissions(); }, 250);
  };
  ['customer:served', 'cash:changed', 'unlock', 'progress:changed', 'restaurant:changed'].forEach((e) => events.on(e, kickMissions));
  updateBadge();

  // ================= SHOP =================
  const shop = makeModal({ title: 'Shop', icon: ICON.bag });
  function giveBoost(kind) {
    const b = state.boosts, cfg = BOOSTS[kind], now = Date.now();
    const until = Math.max(now, b[kind + 'Until']) + cfg.duration * 1000;
    b[kind + 'Until'] = until;
    b[kind + 'ReadyAt'] = Math.max(b[kind + 'ReadyAt'], until);
    events.emit('boosts:changed', { ...b });
    save();
  }
  const SHOP = () => {
    const mult = restaurantMult();
    return [
      { icon: ICON.cash, name: `$${fmt(200 * mult)}`, sub: 'Pocket cash', cost: 10, give: () => addCash(200 * mult), msg: `+$${fmt(200 * mult)}` },
      { icon: ICON.cash, name: `$${fmt(800 * mult)}`, sub: 'Cash bundle', cost: 30, give: () => addCash(800 * mult), msg: `+$${fmt(800 * mult)}` },
      { icon: ICON.x2, name: '2x Income', sub: `Instant, ${Math.round(BOOSTS.income.duration / 60)} min`, cost: 15, give: () => giveBoost('income'), msg: '2x Income active!' },
      { icon: ICON.bolt, name: 'Speed boost', sub: `Instant, ${BOOSTS.speed.duration}s`, cost: 10, give: () => giveBoost('speed'), msg: 'Speed boost active!' },
    ];
  };
  function renderShop() {
    const frag = document.createDocumentFragment();
    frag.appendChild(html(`<div class="shop-gems">${ICON.gem}<b>${fmt(state.gems)}</b><span>gems</span></div>`));
    for (const it of SHOP()) {
      const can = state.gems >= it.cost;
      const row = html(`
        <div class="srow"><span class="m-ico">${it.icon}</span>
          <div class="m-mid"><div class="m-text">${it.name}</div><div class="m-sub">${it.sub}</div></div>
          <button class="btn buy pressable" data-ui ${can ? '' : 'disabled'}>${ICON.gem}<b>${it.cost}</b></button></div>`);
      row.querySelector('.buy').addEventListener('click', () => {
        if (state.gems < it.cost) { sfx('error'); return; }
        addGems(-it.cost); it.give(); sfx('cash'); toast(it.msg); save();
        renderShop();
      });
      frag.appendChild(row);
    }
    shop.body.replaceChildren(frag);
  }
  shop.onOpen = renderShop;
  events.on('gems:changed', () => { if (shop.isOpen) renderShop(); });

  // ================= UPGRADES SHEET =================
  const sheet = html(`
    <div class="sheet" data-ui>
      <div class="sheet-grab"></div>
      <div class="sheet-head"><span class="ph-icon">${ICON.arrowUp}</span><h2>Upgrades</h2>
        <button class="x-btn pressable" data-ui aria-label="Close">${ICON.x}</button></div>
      <div class="sheet-body"></div>
    </div>`);
  root.appendChild(sheet);
  const sheetBody = sheet.querySelector('.sheet-body');
  const UP_ICON = { speed: ICON.speed, capacity: ICON.capacity, cook: ICON.cook, price: ICON.price };
  const effect = (key, l) => {
    const u = UPGRADES[key];
    if (key === 'speed') return `+${Math.round(l * u.per * 100)}% speed`;
    if (key === 'price') return `+${Math.round(l * u.per * 100)}% price`;
    if (key === 'capacity') return `+${l} bowls`;
    return `-${Math.round((1 - Math.pow(1 - u.per, l)) * 100)}% cook time`;
  };
  const rows = {};
  for (const key of Object.keys(UPGRADES)) {
    const u = UPGRADES[key];
    const row = html(`
      <div class="urow"><span class="m-ico">${UP_ICON[key] || ICON.star}</span>
        <div class="m-mid"><div class="m-text">${u.label}</div>
          <div class="pips">${'<i></i>'.repeat(u.max)}</div>
          <div class="m-sub u-fx"></div></div>
        <button class="btn buy pressable" data-ui></button></div>`);
    row.querySelector('.buy').addEventListener('click', () => {
      if (buyUpgrade(key)) {
        sfx('upgrade');
        row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
      } else sfx('error');
    });
    rows[key] = row;
    sheetBody.appendChild(row);
  }
  function renderSheet() {
    for (const key of Object.keys(UPGRADES)) {
      const u = UPGRADES[key], l = state.upgrades[key], row = rows[key];
      const maxed = l >= u.max, cost = upgradeCost(key);
      row.querySelectorAll('.pips i').forEach((p, i) => p.classList.toggle('on', i < l));
      row.querySelector('.u-fx').textContent = maxed ? `${effect(key, l)} (max)` : `${effect(key, l)}  →  ${effect(key, l + 1)}`;
      const btn = row.querySelector('.buy');
      const html2 = maxed ? '<b>MAX</b>' : `<span class="b-lbl">BUY</span>${ICON.cash}<b>${fmt(cost)}</b>`;
      if (btn.dataset.h !== html2) { btn.dataset.h = html2; btn.innerHTML = html2; }
      btn.disabled = maxed || state.cash < cost;
    }
  }
  const sheetCtl = {
    open() { renderSheet(); sheet.classList.add('open'); },
    close() { sheet.classList.remove('open'); },
    get isOpen() { return sheet.classList.contains('open'); },
  };
  sheet.querySelector('.x-btn').addEventListener('click', () => sheetCtl.close());
  events.on('cash:changed', () => { if (sheetCtl.isOpen) renderSheet(); });
  events.on('upgrades:changed', () => { if (sheetCtl.isOpen) renderSheet(); });
  events.on('restaurant:changed', () => { if (sheetCtl.isOpen) renderSheet(); });
  events.on('upgradepad:enter', () => sheetCtl.open());
  events.on('upgradepad:exit', () => sheetCtl.close());

  // ================= PAUSE =================
  const pause = makeModal({ title: 'Paused', icon: ICON.pause, cls: 'pause' });
  pause.keep = true;
  let confirming = false;
  function renderPause() {
    const frag = document.createDocumentFragment();
    if (!confirming) {
      const resume = html(`<button class="btn big teal pressable" data-ui>${ICON.play}<span>Resume</span></button>`);
      resume.addEventListener('click', () => pause.close());
      const snd = html(`<button class="btn big cream pressable" data-ui>${isMuted() ? ICON.mute : ICON.sound}<span>Sound: ${isMuted() ? 'Off' : 'On'}</span></button>`);
      snd.addEventListener('click', () => { setMuted(!isMuted()); unlockAudio(); sfx('click'); renderPause(); });
      const reset = html(`<button class="btn big coral pressable" data-ui>${ICON.x}<span>Reset progress</span></button>`);
      reset.addEventListener('click', () => { confirming = true; renderPause(); });
      frag.append(resume, snd, reset);
    } else {
      const q = html('<p class="confirm-q">Erase all progress and start over?</p>');
      const yes = html('<button class="btn big coral pressable" data-ui><span>Yes, reset</span></button>');
      yes.addEventListener('click', () => { resetSave(); save(); location.reload(); });
      const no = html('<button class="btn big cream pressable" data-ui><span>Keep playing</span></button>');
      no.addEventListener('click', () => { confirming = false; renderPause(); });
      frag.append(q, yes, no);
    }
    pause.body.replaceChildren(frag);
  }
  pause.onOpen = () => { confirming = false; renderPause(); pauseGame(true); };
  pause.onClose = () => pauseGame(false);

  // ================= RESTAURANT COMPLETE =================
  const done = makeModal({ title: 'Restaurant complete!', icon: ICON.star, cls: 'complete', sticky: true });
  done.keep = true;
  done.el.querySelector('.x-btn').remove();
  let onNextCb = null;
  function showComplete(onNext) {
    onNextCb = onNext;
    const p = progress();
    const nextName = RESTAURANT_NAMES[(p.level + 1) % RESTAURANT_NAMES.length];
    const ratio = ECONOMY.restaurantMultiplier;
    const confetti = Array.from({ length: 26 }, (_, i) => {
      const c = ['#f26b5b', '#f6c453', '#2a9d8f', '#fff6e6'][i % 4];
      return `<s style="left:${Math.random() * 100}%;background:${c};animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.5).toFixed(2)}s"></s>`;
    }).join('');
    const body = html(`
      <div class="celebrate"><div class="confetti">${confetti}</div>
        <div class="big-star">${ICON.star}</div>
        <p class="c-name">${p.name}</p>
        <p class="c-sub">Everything is unlocked. Next up:</p>
        <p class="c-next">${nextName}</p>
        <p class="c-mult">Prices and income x${ratio}</p>
      </div>`);
    const go = html('<button class="btn big teal pressable pulse" data-ui><span>Open next restaurant</span></button>');
    go.addEventListener('click', () => {
      done.close();
      const cb = onNextCb; onNextCb = null;
      sfx('unlock');
      try { cb && cb(); } finally { events.emit('ui:nextRestaurant'); }
    });
    done.body.replaceChildren(body, go);
    done.open();
    sfx('unlock');
  }
  done.onOpen = () => { flags.complete = true; refreshInput(); };
  done.onClose = () => { flags.complete = false; refreshInput(); };
  return {
    openMissions() { sfx('click'); missions.open(); },
    openShop() { sfx('click'); shop.open(); },
    openPause() { pause.open(); },
    openUpgrades: () => sheetCtl.open(),
    closeUpgrades: () => sheetCtl.close(),
    showComplete,
    isPauseOpen: () => pause.isOpen,
    closePause: () => pause.close(),
  };
}
