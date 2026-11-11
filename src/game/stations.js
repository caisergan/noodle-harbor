import * as THREE from 'three';
import { createStation, createBowl, createZoneRing } from '../models/index.js';
import { LAYOUT, ECONOMY } from '../config.js';
import { state, upgradeValue } from '../core/state.js';
import { ui } from '../ui/index.js';
import { BowlStack, verticalSlot } from './stack.js';
import { popIn } from './tween.js';
import { Tag } from './util.js';

class Station {
  constructor(ctx, index, animate) {
    this.ctx = ctx; this.index = index;
    const cfg = LAYOUT.stations[index];
    this.x = cfg.x; this.z = cfg.z;
    this.model = createStation();
    this.model.group.position.set(cfg.x, 0, cfg.z);
    ctx.root.add(this.model.group);
    if (animate) popIn(this.model.group, 1, 0.5);
    this.stack = new BowlStack(this.model.bowlAnchor, ctx.root, { slot: verticalSlot });
    this.zonePos = new THREE.Vector3(cfg.x, 0, cfg.z + LAYOUT.stationPickupOffsetZ);
    this.zone = createZoneRing(1.1);
    this.zone.position.set(this.zonePos.x, this.zone.position.y || 0.02, this.zonePos.z);
    ctx.root.add(this.zone);
    ctx.obstacles.push({ minX: cfg.x - 0.8, maxX: cfg.x + 0.8, minZ: LAYOUT.bounds.minZ, maxZ: cfg.z + 0.5 });
    this.tag = new Tag({ text: '', kind: 'station' }, 2.1);
    this.tag.place(cfg.x, 0, cfg.z);
    this.tag.setVisible(false);
    this.cookT = 0; this.shown = -1;
  }

  update(dt) {
    this.model.update(dt);
    const cookTime = ECONOMY.cookTime * upgradeValue('cook');
    if (this.stack.count < ECONOMY.stationMax) {
      this.cookT += dt;
      if (this.cookT >= cookTime) {
        this.cookT = 0;
        this.stack.spawn(createBowl());
        state.stats.bowlsCooked++;
      }
      this.model.setCooking(Math.min(1, this.cookT / cookTime));
    } else {
      this.model.setCooking(1);
    }
    const n = this.stack.ready;
    if (n !== this.shown) {
      this.shown = n;
      this.tag.setText(n >= ECONOMY.stationMax ? 'MAX' : String(n));
      this.tag.setVisible(n > 0);
    }
  }

  inZone(p, r = 1.1) { return Math.hypot(p.x - this.zonePos.x, p.z - this.zonePos.z) < r; }
}

export function createStations(ctx) {
  const list = [];
  const sys = {
    list,
    add(index, animate) { if (!list[index]) list[index] = new Station(ctx, index, animate); return list[index]; },
    get active() { return list.filter(Boolean); },
    update(dt) {
      const player = ctx.player;
      for (const s of list) {
        if (!s) continue;
        s.update(dt);
        // player pickup
        if (s.inZone(player.pos) && player.pickTimer <= 0 && s.stack.ready > 0 && player.stack.count < player.capacity()) {
          s.stack.transferTo(player.stack);
          player.pickTimer = ECONOMY.pickupInterval;
          ui.sfx('pickup');
        }
      }
    },
    dispose() { for (const s of list) if (s) s.tag.remove(); },
  };
  return sys;
}
