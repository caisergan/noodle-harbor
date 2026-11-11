import * as THREE from 'three';
import { createUnlockPad, createUpgradePad } from '../models/index.js';
import { LAYOUT, UNLOCKS, VISIBLE_PADS, ECONOMY } from '../config.js';
import { state, isUnlocked, unlockPrice, trySpend } from '../core/state.js';
import { events } from '../core/events.js';
import { ui } from '../ui/index.js';
import { popIn, popOut } from './tween.js';
import { Tag, fmt } from './util.js';

const HALF = 0.9;
const GRACE = 0.4;
// Partial payments persist for the session (cleared when moving to the next restaurant).
const partial = new Map();
export function resetPartialPayments() { partial.clear(); }

/** World position of the pay pad for an unlock entry. */
export function padPosition(u) {
  if (u.pad) return new THREE.Vector3(u.pad.x, 0, u.pad.z);
  if (u.type === 'table') { const t = LAYOUT.tables[u.index]; return new THREE.Vector3(t.x, 0, t.z); }
  if (u.type === 'station') { const s = LAYOUT.stations[u.index]; return new THREE.Vector3(s.x, 0, s.z + 1.2); }
  return new THREE.Vector3();
}

class Pad {
  constructor(ctx, u, animate) {
    this.ctx = ctx; this.u = u;
    this.pos = padPosition(u);
    this.model = createUnlockPad();
    this.model.group.position.copy(this.pos);
    ctx.root.add(this.model.group);
    if (animate) popIn(this.model.group, 1, 0.45);
    this.tag = new Tag({ text: '', kind: 'price' }, 1.3);
    this.tag.place(this.pos.x, 0, this.pos.z);
    this.grace = GRACE; this.acc = 0; this.tickT = 0; this.shown = null;
  }
  get price() { return unlockPrice(this.u); }
  get paid() { return partial.get(this.u.id) || 0; }
  get remaining() { return Math.max(0, this.price - this.paid); }
  remove() {
    this.tag.remove();
    popOut(this.model.group, 0.25, () => this.ctx.root.remove(this.model.group));
  }
}

export function createPads(ctx) {
  const list = [];

  const up = createUpgradePad();
  up.group.position.set(LAYOUT.upgradePad.x, 0, LAYOUT.upgradePad.z);
  ctx.root.add(up.group);
  let onUpgrade = false;

  return {
    list,
    refresh(animate) {
      const want = UNLOCKS.filter((u) => !isUnlocked(u.id)).slice(0, VISIBLE_PADS);
      for (let i = list.length - 1; i >= 0; i--) {
        if (!want.includes(list[i].u)) { list[i].remove(); list.splice(i, 1); }
      }
      for (const u of want) if (!list.some((p) => p.u === u)) list.push(new Pad(ctx, u, animate));
    },
    update(dt) {
      const p = ctx.player.pos;
      up.update(dt);
      const onU = Math.abs(p.x - LAYOUT.upgradePad.x) < 0.7 && Math.abs(p.z - LAYOUT.upgradePad.z) < 0.7;
      if (onU !== onUpgrade) { onUpgrade = onU; events.emit(onU ? 'upgradepad:enter' : 'upgradepad:exit'); }

      for (const pad of list.slice()) {
        pad.model.update(dt);
        const txt = '$' + fmt(pad.remaining);
        if (txt !== pad.shown) { pad.shown = txt; pad.tag.setText(txt); pad.model.setProgress(pad.paid / pad.price); }

        const inside = Math.abs(p.x - pad.pos.x) < HALF && Math.abs(p.z - pad.pos.z) < HALF;
        if (!inside) { pad.grace = GRACE; pad.acc = 0; continue; }
        if (pad.grace > 0) { pad.grace -= dt; continue; }
        if (state.cash < 1) { pad.acc = 0; continue; }

        const rate = Math.max(pad.price / ECONOMY.padDrainTime, 5);
        pad.acc += rate * dt;
        const amt = Math.floor(Math.min(pad.acc, pad.remaining, state.cash));
        if (amt >= 1 && trySpend(amt)) {
          pad.acc -= amt;
          partial.set(pad.u.id, pad.paid + amt);
          pad.tickT -= dt;
          if (pad.tickT <= 0) { ui.sfx('pay'); pad.tickT = 0.07; }
          if (pad.remaining <= 0) { pad.model.setProgress(1); ctx.completePad(pad); }
        }
      }
    },
    dispose() { for (const pad of list) pad.tag.remove(); if (onUpgrade) events.emit('upgradepad:exit'); },
  };
}
