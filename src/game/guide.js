import * as THREE from 'three';
import { state } from '../core/state.js';
import { LAYOUT } from '../config.js';
import { damp } from './util.js';
import { camera } from '../core/engine.js';

/** Bobbing 3D arrow that points new players at the next useful thing. Hidden after 3 unlocks. */
export function createGuide(ctx) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xf6c453, depthTest: false });
  const outline = new THREE.MeshBasicMaterial({ color: 0x2f4858, depthTest: false });
  const mk = (w, h, d, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.renderOrder = 10; return b; };
  // Down-pointing chunky arrow, billboarded to the camera, with a navy outline drawn behind it.
  const arrow = new THREE.Group();
  const addPart = (w, h, x, y, rz) => {
    const o = mk(w + 0.14, h + 0.14, 0.05, outline); o.position.set(x, y, -0.03); o.rotation.z = rz; o.renderOrder = 9; arrow.add(o);
    const f = mk(w, h, 0.06, mat); f.position.set(x, y, 0); f.rotation.z = rz; arrow.add(f);
  };
  addPart(0.34, 0.7, 0, 0.75, 0);
  addPart(0.8, 0.3, -0.24, 0.32, -Math.PI / 4);
  addPart(0.8, 0.3, 0.24, 0.32, Math.PI / 4);
  arrow.scale.setScalar(1.25);
  group.add(arrow);
  group.visible = false;
  ctx.root.add(group);

  const target = new THREE.Vector3();
  const cur = new THREE.Vector3();
  let placed = false;

  function pick() {
    const pl = ctx.player;
    if (pl.stack.count > 0) { const s = LAYOUT.serveSpot; return target.set(s.x, 0, s.z); }
    const piles = ctx.piles.filter((p) => p.amount > 0);
    if (piles.length) return target.copy(piles[0].trigger);
    for (const pad of ctx.pads.list) {
      if (pad.remaining > 0 && state.cash >= Math.min(pad.remaining, 1) && state.cash >= pad.remaining * 0.999) return target.copy(pad.pos);
    }
    let best = null;
    for (const s of ctx.stations.active) if (!best || s.stack.ready > best.stack.ready) best = s;
    if (best) return target.copy(best.zonePos);
    return null;
  }

  return {
    update(dt, t) {
      const show = ctx.game.started && state.stats.unlocks < 3;
      if (!show) { group.visible = false; return; }
      const tp = pick();
      if (!tp) { group.visible = false; return; }
      group.visible = true;
      if (!placed) { cur.copy(tp); placed = true; }
      cur.lerp(tp, damp(6, dt));
      group.position.set(cur.x, 2.0 + Math.sin(t * 5) * 0.18, cur.z);
      group.quaternion.copy(camera.quaternion);
    },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); mat.dispose(); outline.dispose(); },
  };
}
