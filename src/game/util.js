import * as THREE from 'three';
import { ui } from '../ui/index.js';

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/** Frame-rate independent smoothing factor. */
export const damp = (k, dt) => 1 - Math.exp(-k * dt);

export function lerpAngle(a, b, k) {
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * k;
}

/** 950, 1.2K, 34K, 3.4M ... */
export function fmt(n) {
  n = Math.round(n);
  const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) {
    if (n >= v) {
      const x = n / v;
      return (x < 10 ? x.toFixed(1).replace(/\.0$/, '') : String(Math.round(x))) + s;
    }
  }
  return String(n);
}

export function disposeTree(obj) {
  obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}

/** A UI label with its own world position vector, placed above an anchor point by dy. */
export class Tag {
  constructor(opts, dy = 2) {
    this.dy = dy;
    this.pos = new THREE.Vector3();
    this.label = ui.label({ ...opts, worldPos: this.pos });
  }
  place(x, y, z) { this.pos.set(x, y + this.dy, z); this.label.setPos(this.pos); }
  setText(t) { this.label.setText(t); }
  setVisible(v) { this.label.setVisible(v); }
  setProgress(p) { this.label.setProgress(p); }
  remove() { this.label.remove(); }
}
