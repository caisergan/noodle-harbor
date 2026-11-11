import { createCharacter, helperLook, cashierLook } from '../models/index.js';
import { LAYOUT, ECONOMY } from '../config.js';
import { Walker } from './walker.js';
import { BowlStack } from './stack.js';
import { popIn } from './tween.js';

const LANE_Z = -7.4;   // kitchen lane between the stoves and the counter
const HELPER_CAP = 4;

class Helper extends Walker {
  constructor(ctx, index, from) {
    super(createCharacter(helperLook()), 3.0);
    this.ctx = ctx; this.index = index;
    const home = LAYOUT.helperIdle[index % LAYOUT.helperIdle.length];
    this.home = home;
    this.pos.set(from ? from.x : home.x, 0, from ? from.z : home.z);
    ctx.root.add(this.group);
    if (from) popIn(this.group, 1, 0.4);
    this.stack = new BowlStack(this.ch.carryAnchor, ctx.root, { hopHeight: 0.6 });
    this.state = 'idle'; this.timer = 0; this.wait = 0; this.target = null; this.carrying = false;
    this.goTo(home.x, home.z);
  }

  /** Walk via the kitchen lane. */
  goTo(x, z) {
    const p = this.pos, path = [];
    if (Math.abs(p.z - LANE_Z) > 0.3) path.push({ x: p.x, z: LANE_Z });
    path.push({ x, z: LANE_Z }, { x, z });
    this.path = path;
  }

  update(dt) {
    const arrived = this.step(dt);
    const c = this.stack.count > 0;
    if (c !== this.carrying) { this.carrying = c; this.ch.setCarrying(c); }
    this.timer -= dt;
    const counter = this.ctx.counter;
    switch (this.state) {
      case 'idle': {
        if (this.timer > 0) break;
        this.timer = 0.3;
        let best = null;
        for (const s of this.ctx.stations.active) {
          const n = s.stack.ready - (s.claimedBy && s.claimedBy !== this ? 3 : 0);
          if (n >= 2 && (!best || n > best.n)) best = { s, n };
        }
        if (best) {
          this.target = best.s; best.s.claimedBy = this;
          this.goTo(best.s.zonePos.x, best.s.zonePos.z);
          this.state = 'toStation'; this.wait = 0;
        }
        break;
      }
      case 'toStation':
        if (arrived) { this.state = 'pick'; this.timer = 0; }
        break;
      case 'pick': {
        const st = this.target;
        if (this.timer > 0) break;
        if (st.stack.ready > 0 && this.stack.count < HELPER_CAP) {
          st.stack.transferTo(this.stack);
          this.timer = ECONOMY.pickupInterval; this.wait = 0;
        } else {
          this.wait += dt;
          const full = this.stack.count >= HELPER_CAP;
          if (full || (this.stack.count > 0 && this.wait > 0.7) || (this.stack.count === 0 && this.wait > 1.2)) {
            if (st.claimedBy === this) st.claimedBy = null;
            if (this.stack.count > 0) {
              const d = LAYOUT.helperDropSpot;
              this.goTo(d.x, d.z); this.state = 'toDrop';
            } else { this.goTo(this.home.x, this.home.z); this.state = 'idle'; }
          }
        }
        break;
      }
      case 'toDrop':
        if (arrived) { this.state = 'drop'; this.timer = 0; }
        break;
      case 'drop':
        if (this.timer > 0) break;
        if (this.stack.ready > 0) {
          if (counter.stock.count < ECONOMY.counterMax) { this.stack.transferTo(counter.stock); this.timer = ECONOMY.pickupInterval; }
        } else if (this.stack.count === 0) {
          this.goTo(this.home.x, this.home.z); this.state = 'idle'; this.timer = 0.2;
        }
        break;
    }
  }
}

class Cashier extends Walker {
  constructor(ctx, from) {
    super(createCharacter(cashierLook()), 2.6);
    const spot = LAYOUT.cashierSpot;
    this.pos.set(from ? from.x : spot.x, 0, from ? from.z : spot.z);
    ctx.root.add(this.group);
    if (from) popIn(this.group, 1, 0.4);
    this.path = [{ x: spot.x, z: spot.z }];
    this.idleYaw = 0;   // face +z towards the counter
    this.yaw = this.targetYaw = from ? Math.PI : 0;
  }
  update(dt) { this.step(dt); }
}

export function createHelpers(ctx) {
  const helpers = [];
  let cashier = null;
  return {
    helpers,
    get cashier() { return cashier; },
    get cashierReady() { return !!cashier && cashier.arrived; },
    addHelper(index, from) { helpers.push(new Helper(ctx, index, from)); },
    addCashier(from) { if (!cashier) cashier = new Cashier(ctx, from); },
    update(dt) { for (const h of helpers) h.update(dt); if (cashier) cashier.update(dt); },
    dispose() {},
  };
}
