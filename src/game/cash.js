// Cash piles: bundles on the floor/table, collected when the player walks close.
import * as THREE from 'three';
import { createCashStack, CASH_H } from '../models/index.js';
import { addCash } from '../core/state.js';
import { ui } from '../ui/index.js';
import { hop, popIn } from './tween.js';
import { fmt } from './util.js';
import { LAYOUT } from '../config.js';

const _p = new THREE.Vector3();

export class CashPile {
  /** (x,y,z) world position of the pile centre on its surface. trigger: Vector3 used for the proximity test. */
  constructor(ctx, x, y, z, { scale = 1, cap = 24, radius = 1.2, trigger } = {}) {
    this.ctx = ctx; this.scale = scale; this.cap = cap; this.radius = radius;
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    ctx.root.add(this.group);
    this.trigger = trigger || new THREE.Vector3(x, 0, z);
    this.amount = 0;
    this.bundles = [];
    ctx.piles.push(this);
  }

  slot(i, out) {
    const layer = Math.floor(i / 6), r = i % 6, col = r % 2, row = Math.floor(r / 2);
    return out.set((col - 0.5) * 0.46 * this.scale, layer * CASH_H * this.scale, (row - 1) * 0.3 * this.scale);
  }
  slotWorld(i, out) { this.slot(i, out); return out.add(this.group.position); }

  /** Add `value` to the pile; if `from` (world pos) is given a bundle hops in from there. */
  add(value, from, delay = 0) {
    if (!from) { this._land(value, null); return; }
    const b = createCashStack();
    b.scale.setScalar(this.scale);
    this.ctx.root.add(b);
    b.position.copy(from);
    hop(b, from, (out) => this.slotWorld(this.bundles.length, out), {
      duration: 0.42, delay, height: 1.0, onComplete: () => this._land(value, b),
    });
  }

  _land(value, b) {
    this.amount += value;
    if (this.bundles.length >= this.cap) { if (b && b.parent) b.parent.remove(b); return; }
    if (!b) { b = createCashStack(); popIn(b, this.scale, 0.3); }
    const i = this.bundles.length;
    this.group.add(b);
    this.slot(i, b.position);
    b.rotation.set(0, (Math.floor(i / 6) % 2) * 0.25, 0);
    b.scale.setScalar(this.scale);
    this.bundles.push(b);
  }

  /** Fly every bundle to `target` (Object3D), then pay out. */
  collect(target) {
    const total = Math.round(this.amount);
    if (total <= 0) return;
    this.amount = 0;
    const list = this.bundles; this.bundles = [];
    const root = this.ctx.root;
    const payout = () => {
      _p.copy(target.position); _p.y += 1.6;
      addCash(total, _p.clone());
      ui.floatText(_p.clone(), '+$' + fmt(total), 'cash');
      ui.sfx('cash');
    };
    if (!list.length) { payout(); return; }
    const to = (out) => { out.copy(target.position); out.y += 1.0; return out; };
    list.forEach((b, i) => {
      const wp = b.position.clone().add(this.group.position);
      root.add(b); b.position.copy(wp);
      const last = i === list.length - 1;
      hop(b, wp, to, {
        duration: 0.38, delay: i * 0.03, height: 0.9, scaleFrom: b.scale.x, scaleTo: 0.3 * this.scale,
        onComplete: () => { if (b.parent) b.parent.remove(b); if (last) payout(); },
      });
    });
  }
}

export function createCashSystem(ctx) {
  ctx.piles = [];
  const r = LAYOUT.registerCashPile;
  ctx.registerPile = new CashPile(ctx, r.x, 0, r.z, { radius: 1.2 });
  const _t = new THREE.Vector3();
  return {
    update() {
      const p = ctx.player.pos;
      for (const pile of ctx.piles) {
        if (pile.amount <= 0) continue;
        _t.copy(pile.trigger);
        if (Math.hypot(p.x - _t.x, p.z - _t.z) < pile.radius) pile.collect(ctx.player.group);
      }
    },
    dispose() { ctx.piles.length = 0; },
  };
}

