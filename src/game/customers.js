import * as THREE from 'three';
import { createCharacter, randomCustomerLook, createBowl } from '../models/index.js';
import { LAYOUT, ECONOMY } from '../config.js';
import { state, isUnlocked, upgradeValue, restaurantMult, incomeBoostActive } from '../core/state.js';
import { events } from '../core/events.js';
import { ui } from '../ui/index.js';
import { Walker } from './walker.js';
import { BowlStack, verticalSlot } from './stack.js';
import { Tag, rand } from './util.js';

const _v = new THREE.Vector3();

class Customer extends Walker {
  constructor(sys) {
    const ctx = sys.ctx;
    const ch = createCharacter(randomCustomerLook());
    super(ch, 2.4 * rand(0.9, 1.12));
    this.sys = sys; this.ctx = ctx;
    const fromLeft = Math.random() < 0.5;
    const sp = fromLeft ? LAYOUT.street.spawnLeft : LAYOUT.street.spawnRight;
    this.pos.set(sp.x, 0, sp.z + rand(-0.4, 0.4));
    this.yaw = this.targetYaw = fromLeft ? Math.PI / 2 : -Math.PI / 2;
    ctx.root.add(this.group);
    this.hands = new BowlStack(ch.carryAnchor, ctx.root, { scale: 0.8, hopHeight: 0.6 });
    const e = LAYOUT.entrance;
    this.path = [{ x: e.x, z: LAYOUT.street.z - 1.5 }, { x: e.x, z: e.z - 0.8 }];
    this.state = 'walkIn';
    this.slotIdx = -2;
    this.order = 0; this.got = 0; this.price = 0; this.tip = 0;
    this.seat = null; this.eatT = 0; this.eaten = 0; this.serveTimer = 0;
    this.orderTag = null; this.seatTag = null;
  }

  assignOrder() {
    const max = Math.min(5, ECONOMY.orderMax + Math.floor(state.unlocked.length / 4));
    this.order = ECONOMY.orderMin + Math.floor(Math.random() * (max - ECONOMY.orderMin + 1));
    this.orderTag = new Tag({ text: String(this.order), kind: 'order' }, 2.3);
  }

  clearTags() {
    if (this.orderTag) { this.orderTag.remove(); this.orderTag = null; }
    if (this.seatTag) { this.seatTag.remove(); this.seatTag = null; }
  }

  leave() {
    const t = this.seat.table, side = t.x < 0 ? -1 : 1;
    const aisle = side * 1.9, row = t.z + 1.1, e = LAYOUT.entrance, ez = e.z - 0.8;
    this.seat.reserved = false;
    this.sitting = false;
    this.pos.y = 0;
    const out = Math.random() < 0.5 ? -16 : 16;
    this.path = [
      { x: this.seat.x, z: row }, { x: aisle, z: row }, { x: aisle, z: ez },
      { x: e.x, z: ez }, { x: e.x, z: LAYOUT.street.z - 1.5 }, { x: out, z: LAYOUT.street.z },
    ];
    this.idleYaw = null;
    this.state = 'leaving';
  }

  toSeat() {
    const t = this.seat.table, side = t.x < 0 ? -1 : 1, row = t.z + 1.1;
    this.path = [
      { x: side * 1.9, z: LAYOUT.queueStart.z }, { x: side * 1.9, z: row },
      { x: this.seat.x, z: row }, { x: this.seat.x, z: this.seat.z },
    ];
    this.idleYaw = null;
    this.state = 'toSeat';
  }

  sit() {
    const t = this.seat.table;
    this.state = 'eating';
    this.sitting = true;
    this.pos.set(this.seat.x, t.seatHeight, this.seat.z);
    this.yaw = this.targetYaw = this.seat.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    this.group.rotation.y = this.yaw;
    const n = this.hands.items.length;
    for (let i = 0; i < n; i++) this.hands.transferTo(this.seat.stack, i * 0.12);
    this.eatT = 0; this.eaten = 0;
  }

  update(dt) {
    const sys = this.sys;
    let idle = this.step(dt);
    switch (this.state) {
      case 'walkIn':
        if (idle) { this.state = 'toQueue'; sys.queue.push(this); this.slotIdx = -2; }
        break;
      case 'toQueue': case 'queued': case 'served': {
        const idx = sys.queue.indexOf(this);
        if (idx !== this.slotIdx) {
          this.slotIdx = idx;
          sys.slotPos(idx, _v);
          this.path = [{ x: _v.x, z: _v.z }];
          this.idleYaw = Math.PI;
          idle = false;
        }
        if (this.state === 'toQueue' && idle) this.state = 'queued';
        if (idx === 0 && this.state === 'queued' && idle && !this.order) this.assignOrder();
        if (this.orderTag) this.orderTag.place(this.pos.x, 0, this.pos.z);
        if (this.seatTag) this.seatTag.place(this.pos.x, 0, this.pos.z);
        break;
      }
      case 'toSeat':
        if (idle) this.sit();
        break;
      case 'eating': {
        if (this.seat.stack.pending > 0 || this.hands.count > 0) break;
        this.eatT += dt;
        const N = this.order, win = ECONOMY.eatTime / N;
        const p = (this.eatT - this.eaten * win) / win;
        const top = this.seat.stack.items[this.seat.stack.items.length - 1];
        if (p >= 1) {
          this.seat.stack.removeTop();
          this.eaten++;
          if (this.eaten >= N) {
            this.seat.table.pile.add(this.tip, _v.set(this.pos.x, this.pos.y + 1.0, this.pos.z));
            this.leave();
          }
        } else if (top) {
          top.scale.setScalar(this.seat.stack.scale * Math.max(0.05, 1 - p));
        }
        break;
      }
      case 'leaving':
        if (idle) this.state = 'gone';
        break;
    }
  }
}

export function createCustomers(ctx) {
  const list = [];
  const queue = [];
  let spawnT = ECONOMY.spawnInterval - 1.0;
  const q = LAYOUT.queueStart;

  const sys = {
    ctx, list, queue,
    slotPos(i, out) { return out.set(q.x, 0, q.z + Math.max(0, i) * LAYOUT.queueSpacing); },

    orderValue(n) {
      return Math.round(n * ECONOMY.bowlPrice * upgradeValue('price') * restaurantMult()
        * (isUnlocked('tea') ? 1 + ECONOMY.teaBonus : 1) * (incomeBoostActive() ? 2 : 1));
    },

    remove(c) {
      c.clearTags();
      ctx.root.remove(c.group);
      const i = list.indexOf(c); if (i >= 0) list.splice(i, 1);
      const j = queue.indexOf(c); if (j >= 0) queue.splice(j, 1);
    },

    updateServing(dt) {
      const f = queue[0];
      if (!f || !f.order || (f.state !== 'queued' && f.state !== 'served')) return;
      const counter = ctx.counter;
      if (f.state === 'queued') {
        if (!f.path.length) {
          if (!ctx.tables.hasFreeSeat()) {
            if (!f.seatTag) f.seatTag = new Tag({ text: 'No seats!', kind: 'info' }, 2.9);
            return;
          }
          if (f.seatTag) { f.seatTag.remove(); f.seatTag = null; }
          if (counter.staffed && counter.stock.ready > 0) {
            f.seat = ctx.tables.reserveSeat();
            if (f.seat) { f.state = 'served'; f.orderTag.setText(`0/${f.order}`); }
          }
        }
        return;
      }
      // served: move bowls counter -> hands, one per serveInterval
      f.serveTimer -= dt;
      if (f.got < f.order && f.serveTimer <= 0 && counter.staffed && counter.stock.ready > 0) {
        counter.stock.transferTo(f.hands);
        f.got++;
        f.serveTimer = ECONOMY.serveInterval;
        ui.sfx('serve');
        f.orderTag.setText(`${f.got}/${f.order}`);
      }
      if (f.got >= f.order && f.hands.pending === 0) {
        f.price = sys.orderValue(f.order);
        f.tip = Math.round(f.price * ECONOMY.tipFraction);
        ctx.registerPile.add(f.price, _v.set(f.pos.x, 1.0, f.pos.z));
        state.stats.served++;
        events.emit('customer:served', { count: state.stats.served });
        f.clearTags();
        queue.shift();
        f.toSeat();
      }
    },

    update(dt) {
      if (ctx.game.started) {
        spawnT = Math.min(spawnT + dt, ECONOMY.spawnInterval);
        if (spawnT >= ECONOMY.spawnInterval) {
          let walking = 0;
          for (const c of list) if (c.state === 'walkIn') walking++;
          if (walking + queue.length < LAYOUT.queueMax) {
            const c = new Customer(sys);
            list.push(c);
            spawnT = 0;
          }
        }
      }
      for (let i = list.length - 1; i >= 0; i--) {
        const c = list[i];
        c.update(dt);
        if (c.state === 'gone') sys.remove(c);
      }
      sys.updateServing(dt);
    },
    dispose() { for (const c of list.slice()) sys.remove(c); },
  };
  return sys;
}
