// One restaurant's dynamic world: everything lives under a root group that is disposed on rebuild.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { poof } from '../models/index.js';
import { LAYOUT, UNLOCKS, PALETTE } from '../config.js';
import { isUnlocked, markUnlocked, nextRestaurant, progress } from '../core/state.js';
import { events } from '../core/events.js';
import { ui } from '../ui/index.js';
import { clearTweens, tween } from './tween.js';
import { disposeTree } from './util.js';
import { createCounterSystem } from './counter.js';
import { createStations } from './stations.js';
import { createTables } from './tables.js';
import { createCashSystem } from './cash.js';
import { createPlayer } from './player.js';
import { createCustomers } from './customers.js';
import { createHelpers } from './helpers.js';
import { createPads, padPosition } from './pads.js';
import { createGuide } from './guide.js';

export function createWorld(game) {
  const ctx = { game, root: new THREE.Group(), obstacles: [], piles: [], tea: false, completeShown: false };
  scene.add(ctx.root);

  ctx.counter = createCounterSystem(ctx);
  ctx.stations = createStations(ctx);
  ctx.tables = createTables(ctx);
  ctx.cash = createCashSystem(ctx);
  ctx.player = createPlayer(ctx);
  ctx.customers = createCustomers(ctx);
  ctx.helpers = createHelpers(ctx);
  ctx.pads = createPads(ctx);
  ctx.guide = createGuide(ctx);
  const systems = [ctx.player, ctx.stations, ctx.counter, ctx.customers, ctx.helpers, ctx.cash, ctx.pads, ctx.guide, ctx.tables];

  /** Create the object an unlock entry stands for. `from` = pad position when it was just bought. */
  function applyUnlock(u, from) {
    const animate = !!from;
    switch (u.type) {
      case 'table': ctx.tables.add(u.index, animate); break;
      case 'station': ctx.stations.add(u.index, animate); break;
      case 'helper': ctx.helpers.addHelper(u.index, from); break;
      case 'cashier': ctx.helpers.addCashier(from); break;
      case 'tea': ctx.counter.showTea(animate); break;
    }
  }

  ctx.completePad = (pad) => {
    const u = pad.u;
    const at = padPosition(u);
    markUnlocked(u.id);
    ctx.pads.refresh(true);          // removes this pad and pops in the next one
    applyUnlock(u, at);
    poof(scene, at.clone().setY(0.5), PALETTE.padFill);
    ui.toast(u.label);
    ui.sfx('unlock');
    events.emit('unlock', { id: u.id, label: u.label });
    checkComplete();
  };

  function checkComplete() {
    if (ctx.completeShown || !UNLOCKS.every((u) => isUnlocked(u.id))) return;
    ctx.completeShown = true;
    tween({
      duration: 0.01, delay: 3.0,
      onComplete: () => {
        events.emit('restaurant:complete', progress());
        ui.showRestaurantComplete(() => nextRestaurant());   // emits restaurant:changed -> index.js rebuilds
      },
    });
  }

  // initial world from the save
  ctx.stations.add(0, false);
  ctx.tables.add(0, false);
  for (const u of UNLOCKS) if (isUnlocked(u.id)) applyUnlock(u, null);
  ctx.pads.refresh(false);
  checkComplete();

  return {
    ctx,
    update(dt, t) {
      for (const s of systems) s.update(dt, t);
    },
    dispose() {
      clearTweens();
      for (const s of systems) s.dispose();
      scene.remove(ctx.root);
      disposeTree(ctx.root);
    },
  };
}
