// HUD: pause + cash pill, gems pill, restaurant card, boost buttons, mission/shop buttons.
import { state, activateBoost, progress, restaurantName } from '../core/state.js';
import { events } from '../core/events.js';
import { BOOSTS } from '../config.js';
import { ICON } from './icons.js';
import { fmt, mmss, html } from './format.js';
import { sfx } from './audio.js';
import { toast } from './toast.js';

function bump(el) {
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'ease-out' });
}

export function buildHud(root, api) {
  const hud = html(`
  <div class="hud">
    <div class="hud-top">
      <button class="icon-btn pressable" data-ui data-act="pause" aria-label="Pause">${ICON.pause}</button>
      <div class="pill-stat cash-pill" data-ui>${ICON.cash}<b>0</b></div>
      <span class="spacer"></span>
      <button class="pill-stat gem-pill pressable" data-ui data-act="gems" aria-label="Shop">${ICON.gem}<b>0</b><em>+</em></button>
    </div>
    <div class="card" data-ui>
      <div class="card-row"><span class="card-name"></span><span class="card-count"></span></div>
      <div class="card-bar"><i></i></div>
    </div>
    <div class="col col-left">
      <button class="side-btn pressable" data-ui data-act="missions">${ICON.clipboard}<span>Missions</span><u class="badge"></u></button>
      <button class="side-btn pressable" data-ui data-act="shop">${ICON.bag}<span>Shop</span></button>
    </div>
    <div class="col col-right">
      <button class="side-btn boost pressable" data-ui data-boost="income">${ICON.x2}<span>2x Income</span><em></em></button>
      <button class="side-btn boost pressable" data-ui data-boost="speed">${ICON.bolt}<span>Speed</span><em></em></button>
    </div>
  </div>`);
  root.appendChild(hud);

  const $ = (s) => hud.querySelector(s);
  const cashB = $('.cash-pill b'), cashPill = $('.cash-pill');
  const gemB = $('.gem-pill b'), gemPill = $('.gem-pill');
  const cardName = $('.card-name'), cardCount = $('.card-count'), cardBar = $('.card-bar i');

  const setCash = (c) => { cashB.textContent = fmt(c); };
  const setGems = (g) => { gemB.textContent = fmt(g); };
  setCash(state.cash); setGems(state.gems);

  events.on('cash:changed', (e) => { setCash(e.cash); if (e.delta) bump(cashPill); });
  events.on('gems:changed', (e) => { setGems(e.gems); if (e.delta) bump(gemPill); });

  function setProgress(p) {
    cardName.textContent = p.name || restaurantName();
    cardCount.textContent = `${p.done}/${p.total}`;
    cardBar.style.transform = `scaleX(${p.total ? Math.min(1, p.done / p.total) : 0})`;
  }
  setProgress(progress());
  events.on('progress:changed', setProgress);
  events.on('restaurant:changed', setProgress);

  // ---- boosts ----
  const boostEls = {};
  hud.querySelectorAll('[data-boost]').forEach((b) => { boostEls[b.dataset.boost] = b; });
  function refreshBoosts() {
    const now = Date.now();
    for (const kind of ['income', 'speed']) {
      const el = boostEls[kind], em = el.querySelector('em');
      const until = state.boosts[kind + 'Until'], ready = state.boosts[kind + 'ReadyAt'];
      let st = 'ready', txt = '';
      if (now < until) { st = 'active'; txt = mmss((until - now) / 1000); }
      else if (now < ready) { st = 'cooldown'; txt = mmss((ready - now) / 1000); }
      if (el.dataset.state !== st) el.dataset.state = st;
      if (em.textContent !== txt) em.textContent = txt;
    }
  }
  refreshBoosts();
  setInterval(refreshBoosts, 500);
  events.on('boosts:changed', refreshBoosts);

  hud.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.boost) {
      const kind = t.dataset.boost;
      if (activateBoost(kind)) {
        sfx('upgrade');
        toast(kind === 'income' ? `2x Income for ${mmss(BOOSTS.income.duration)}!` : `Speed boost for ${mmss(BOOSTS.speed.duration)}!`);
      } else sfx('error');
      refreshBoosts();
      return;
    }
    const act = t.dataset.act;
    if (act === 'pause') api.openPause();
    else if (act === 'missions') api.openMissions();
    else if (act === 'shop' || act === 'gems') api.openShop();
  });

  return {
    el: hud,
    setBadge(on) { hud.querySelector('.badge').classList.toggle('on', !!on); },
    setHidden(h) { hud.classList.toggle('away', h); },
  };
}
