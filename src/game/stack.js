// A vertical/grid stack of bowls parented to an anchor. Bowls fly between stacks in arcs.
import * as THREE from 'three';
import { BOWL_H } from '../models/index.js';
import { hop, popIn } from './tween.js';
import { clamp } from './util.js';

const _l = new THREE.Vector3();
const _w = new THREE.Vector3();
const _s = new THREE.Vector3();

export const verticalSlot = (i, out) => out.set(0, i * BOWL_H, 0);

export class BowlStack {
  /** anchor: Object3D the bowls become children of. root: world root group used while flying. */
  constructor(anchor, root, { slot = verticalSlot, scale = 1, hopHeight = 0.7 } = {}) {
    this.anchor = anchor; this.root = root; this.slot = slot; this.scale = scale; this.hopHeight = hopHeight;
    this.items = [];     // bowls that have arrived (index = slot)
    this.pending = 0;    // bowls still in flight towards this stack
  }
  get count() { return this.items.length + this.pending; }
  get ready() { return this.items.length; }

  slotWorld(i, out) {
    this.slot(i, _l);
    this.anchor.updateWorldMatrix(true, false);
    return out.copy(_l).applyMatrix4(this.anchor.matrixWorld);
  }

  /** Fly `bowl` (any Object3D) from world position `from` into the next slot. */
  add(bowl, from, { delay = 0, height = this.hopHeight } = {}) {
    const idx = this.count;
    this.pending++;
    this.root.add(bowl);
    bowl.position.copy(from);
    hop(bowl, from, (out) => this.slotWorld(idx, out), {
      duration: 0.32, delay, height, scaleFrom: bowl.scale.x, scaleTo: this.scale,
      onComplete: () => {
        this.pending--;
        bowl.rotation.set(0, 0, 0);
        this.anchor.add(bowl);
        this.slot(this.items.length, bowl.position);
        bowl.scale.setScalar(this.scale);
        this.items.push(bowl);
      },
    });
  }

  /** Put a fresh bowl on top with a pop-in animation (cooking). */
  spawn(bowl) {
    this.anchor.add(bowl);
    this.slot(this.items.length, bowl.position);
    this.items.push(bowl);
    popIn(bowl, this.scale, 0.4);
  }

  /** Detach the top bowl into the world root (keeping its world transform). */
  takeTop() {
    const b = this.items.pop();
    if (!b) return null;
    b.updateWorldMatrix(true, false);
    b.getWorldPosition(_w); b.getWorldScale(_s);
    this.root.add(b);
    b.position.copy(_w);
    b.scale.setScalar(_s.x);
    return b;
  }

  transferTo(other, delay = 0) {
    const b = this.takeTop();
    if (!b) return false;
    other.add(b, b.position, { delay });
    return true;
  }

  /** Remove (discard) the top bowl. */
  removeTop() {
    const b = this.items.pop();
    if (b && b.parent) b.parent.remove(b);
  }

  /** Lagging sway: offsets grow with height. (ox, oz) are local metres per level^1.3. */
  applySway(ox, oz) {
    for (let i = 1; i < this.items.length; i++) {
      const it = this.items[i];
      this.slot(i, _l);
      const f = Math.pow(i, 1.3);
      it.position.x = _l.x + clamp(ox * f, -0.4, 0.4);
      it.position.z = _l.z + clamp(oz * f, -0.4, 0.4);
    }
  }
}
