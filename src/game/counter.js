import * as THREE from 'three';
import { createCounter, createRegister, createTeaMachine, createZoneRing } from '../models/index.js';
import { LAYOUT, ECONOMY } from '../config.js';
import { ui } from '../ui/index.js';
import { BowlStack } from './stack.js';
import { popIn } from './tween.js';

export function createCounterSystem(ctx) {
  const c = LAYOUT.counter;
  const width = c.maxX - c.minX;
  const model = createCounter(width, c.depth, c.height);
  model.position.set((c.minX + c.maxX) / 2, 0, c.z);
  ctx.root.add(model);
  ctx.obstacles.push({ minX: c.minX, maxX: c.maxX, minZ: c.z - c.depth / 2, maxZ: c.z + c.depth / 2 });

  const register = createRegister();
  register.position.set(LAYOUT.register.x, c.height, LAYOUT.register.z);
  ctx.root.add(register);

  let tea = null;
  const anchor = new THREE.Object3D();
  anchor.position.set(LAYOUT.counterStock.x, c.height, LAYOUT.counterStock.z);
  ctx.root.add(anchor);
  // 2 x 2 grid per layer, growing upward
  const slot = (i, out) => {
    const layer = Math.floor(i / 4), r = i % 4;
    return out.set((r % 2 - 0.5) * 0.56, layer * 0.2, (Math.floor(r / 2) - 0.5) * 0.46);
  };
  const stock = new BowlStack(anchor, ctx.root, { slot, scale: 0.85, hopHeight: 0.9 });

  const s = LAYOUT.serveSpot;
  const ring = createZoneRing(s.radius);
  ring.position.set(s.x, ring.position.y || 0.02, s.z);
  ctx.root.add(ring);

  const sys = {
    stock, atRegister: false,
    get staffed() { return sys.atRegister || !!(ctx.helpers && ctx.helpers.cashierReady); },
    showTea(animate) {
      if (tea) return;
      tea = createTeaMachine();
      tea.position.set(LAYOUT.teaMachine.x, c.height, LAYOUT.teaMachine.z);
      ctx.root.add(tea);
      if (animate) popIn(tea, 1, 0.5);
      ctx.tea = true;
    },
    update(dt) {
      const p = ctx.player.pos, pl = ctx.player;
      sys.atRegister = Math.hypot(p.x - s.x, p.z - s.z) < s.radius;
      if (sys.atRegister && pl.dropTimer <= 0 && pl.stack.ready > 0 && stock.count < ECONOMY.counterMax) {
        pl.stack.transferTo(stock);
        pl.dropTimer = ECONOMY.pickupInterval;
        ui.sfx('drop');
      }
    },
    dispose() {},
  };
  return sys;
}
