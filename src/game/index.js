// Gameplay entry: environment (static) + one rebuildable world per restaurant.
import { scene, onUpdate } from '../core/engine.js';
import { buildEnvironment } from '../models/index.js';
import { events } from '../core/events.js';
import { state, addCash } from '../core/state.js';
import { createWorld } from './world.js';
import { updateTweens } from './tween.js';
import { resetPartialPayments } from './pads.js';

export function initGame() {
  const env = buildEnvironment(scene);
  const game = { started: false };
  let world = createWorld(game);

  function start() {
    if (game.started) return;
    game.started = true;
    state.tutorialDone = true;
    events.emit('game:started');
  }
  events.on('ui:play', start);
  const params = new URLSearchParams(location.search);
  if (params.has('autoplay') || state.tutorialDone) start();

  events.on('restaurant:changed', () => {
    world.dispose();
    resetPartialPayments();
    world = createWorld(game);
  });

  onUpdate((dt, t) => {
    updateTweens(dt);
    env.update(dt);
    world.update(dt, t);
  });

  // debugging helpers
  window.__game = {
    get world() { return world.ctx; },
    get player() { return world.ctx.player; },
    get customers() { return world.ctx.customers.list; },
    get helpers() { return world.ctx.helpers; },
    get pads() { return world.ctx.pads.list; },
    state,
    start,
    teleport(x, z) { world.ctx.player.teleport(x, z); },
    giveCash(n) { addCash(n); },
  };
}
