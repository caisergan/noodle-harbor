import * as THREE from 'three';
import { createTable } from '../models/index.js';
import { LAYOUT } from '../config.js';
import { BowlStack, verticalSlot } from './stack.js';
import { CashPile } from './cash.js';
import { popIn } from './tween.js';

class TableEntity {
  constructor(ctx, index, animate) {
    const cfg = LAYOUT.tables[index];
    this.index = index; this.x = cfg.x; this.z = cfg.z;
    this.model = createTable();
    this.model.group.position.set(cfg.x, 0, cfg.z);
    ctx.root.add(this.model.group);
    if (animate) popIn(this.model.group, 1, 0.5);
    this.seatHeight = this.model.seatHeight;
    ctx.obstacles.push({ minX: cfg.x - 0.55, maxX: cfg.x + 0.55, minZ: cfg.z - 0.55, maxZ: cfg.z + 0.55 });
    const topY = this.model.topAnchor.position.y;
    this.seats = [-1, 1].map((side) => {
      const spot = new THREE.Object3D();
      spot.position.set(side * 0.28, topY, -0.25);
      this.model.group.add(spot);
      return {
        table: this, side, x: cfg.x + side * LAYOUT.seatOffsetX, z: cfg.z, reserved: false,
        stack: new BowlStack(spot, ctx.root, { slot: verticalSlot, scale: 0.7, hopHeight: 0.6 }),
      };
    });
    this.pile = new CashPile(ctx, cfg.x, topY, cfg.z + 0.22, {
      scale: 0.6, cap: 12, radius: 1.6, trigger: new THREE.Vector3(cfg.x, 0, cfg.z),
    });
  }
}

export function createTables(ctx) {
  const list = [];
  return {
    list,
    add(index, animate) { if (!list[index]) list[index] = new TableEntity(ctx, index, animate); return list[index]; },
    get active() { return list.filter(Boolean); },
    /** Reserve a random free seat, or return null. */
    reserveSeat() {
      const free = [];
      for (const t of list) if (t) for (const s of t.seats) if (!s.reserved) free.push(s);
      if (!free.length) return null;
      const s = free[Math.floor(Math.random() * free.length)];
      s.reserved = true;
      return s;
    },
    hasFreeSeat() { return list.some((t) => t && t.seats.some((s) => !s.reserved)); },
    update() {},
    dispose() {},
  };
}
