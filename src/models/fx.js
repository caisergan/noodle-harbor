// Pooled cube-burst particles. Self-updating through the engine loop.
import * as THREE from 'three';
import { onUpdate } from '../core/engine.js';

const geo = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map();
const matFor = (c) => {
  let m = mats.get(c);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: c }); mats.set(c, m); }
  return m;
};

const POOL = 72;
const free = [];
const active = [];
for (let i = 0; i < POOL; i++) free.push({ m: new THREE.Mesh(geo, matFor(0xffffff)), vx: 0, vy: 0, vz: 0, age: 0, life: 0.5, s: 0.15, parent: null });
let hooked = false;

export function updateFx(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.age += dt;
    const k = p.age / p.life;
    if (k >= 1) {
      p.parent.remove(p.m);
      active.splice(i, 1);
      free.push(p);
      continue;
    }
    p.vy -= 9 * dt;
    p.m.position.x += p.vx * dt;
    p.m.position.y = Math.max(0.03, p.m.position.y + p.vy * dt);
    p.m.position.z += p.vz * dt;
    p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
    // quick pop up, then shrink
    const sc = p.s * (k < 0.15 ? 0.6 + (k / 0.15) * 0.4 : 1 - (k - 0.15) / 0.85);
    p.m.scale.setScalar(Math.max(0.001, sc));
  }
}

export function poof(scene, position, color = 0xffffff) {
  if (!hooked) { hooked = true; onUpdate(updateFx); }
  const n = 12;
  for (let i = 0; i < n && free.length; i++) {
    const p = free.pop();
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const sp = 1.8 + Math.random() * 2.2;
    p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = 2.5 + Math.random() * 2.5;
    p.age = 0; p.life = 0.45 + Math.random() * 0.15;
    p.s = 0.11 + Math.random() * 0.1;
    p.m.material = matFor(i % 4 === 3 ? 0xffffff : color);
    p.m.position.copy(position);
    p.m.position.y += 0.25;
    p.m.scale.setScalar(p.s * 0.6);
    p.parent = scene;
    scene.add(p.m);
    active.push(p);
  }
}
