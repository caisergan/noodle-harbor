import * as THREE from 'three';
import { createCharacter, playerLook } from '../models/index.js';
import { follow } from '../core/engine.js';
import { input } from '../core/input.js';
import { LAYOUT, PLAYER } from '../config.js';
import { upgradeValue, speedBoostActive } from '../core/state.js';
import { BowlStack, verticalSlot } from './stack.js';
import { resolveCircle } from './collision.js';
import { Tag, damp, lerpAngle } from './util.js';

export function createPlayer(ctx) {
  const ch = createCharacter(playerLook());
  const group = ch.group;
  group.position.set(LAYOUT.playerStart.x, 0, LAYOUT.playerStart.z);
  ctx.root.add(group);
  follow(group);

  const stack = new BowlStack(ch.carryAnchor, ctx.root, { slot: verticalSlot, scale: 1, hopHeight: 0.8 });
  const maxTag = new Tag({ text: 'MAX', kind: 'max' }, 2.4);
  maxTag.setVisible(false);

  const vel = new THREE.Vector3();       // intended velocity (smoothed input)
  const real = new THREE.Vector3();      // actual velocity after collisions
  const prev = new THREE.Vector3();
  const sway = { x: 0, z: 0, vx: 0, vz: 0 };
  let yaw = 0, carrying = false, maxShown = false;

  const player = {
    group, pos: group.position, stack, ch,
    pickTimer: 0, dropTimer: 0,
    capacity: () => Math.round(PLAYER.carryBase + upgradeValue('capacity')),
    teleport(x, z) { group.position.set(x, 0, z); vel.set(0, 0, 0); },
    update(dt) {
      if (!(dt > 0)) return;
      const inp = input.vector;
      const max = PLAYER.speed * upgradeValue('speed') * (speedBoostActive() ? 1.5 : 1);
      const tx = inp.x * inp.mag * max, tz = inp.z * inp.mag * max;
      const accelerating = Math.hypot(tx, tz) > Math.hypot(vel.x, vel.z);
      const k = damp(accelerating ? 14 : 18, dt);
      vel.x += (tx - vel.x) * k; vel.z += (tz - vel.z) * k;

      prev.copy(group.position);
      group.position.x += vel.x * dt; group.position.z += vel.z * dt;
      resolveCircle(group.position, PLAYER.radius, ctx.obstacles, LAYOUT.bounds);
      real.set((group.position.x - prev.x) / dt, 0, (group.position.z - prev.z) / dt);

      if (inp.mag > 0) yaw = lerpAngle(yaw, Math.atan2(inp.x, inp.z), damp(16, dt));
      group.rotation.y = yaw;

      const speed01 = Math.min(1.2, real.length() / PLAYER.speed);
      ch.update(dt, speed01);
      const c = stack.count > 0;
      if (c !== carrying) { carrying = c; ch.setCarrying(c); }

      // spring-based sway of the carried stack, lagging behind movement (in the carry anchor's local frame)
      const cos = Math.cos(yaw), sin = Math.sin(yaw);
      const lx = real.x * cos - real.z * sin, lz = real.x * sin + real.z * cos;
      const tgx = -lx * 0.0055, tgz = -lz * 0.0055;
      sway.vx += ((tgx - sway.x) * 140 - sway.vx * 13) * dt;
      sway.vz += ((tgz - sway.z) * 140 - sway.vz * 13) * dt;
      sway.x += sway.vx * dt; sway.z += sway.vz * dt;
      if (stack.items.length > 1) stack.applySway(sway.x, sway.z);

      this.pickTimer -= dt; this.dropTimer -= dt;
      const full = stack.count >= player.capacity();
      if (full !== maxShown) { maxShown = full; maxTag.setVisible(full); }
      if (full) maxTag.place(group.position.x, group.position.y, group.position.z);
    },
    dispose() { maxTag.remove(); },
  };
  return player;
}
