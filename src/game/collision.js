// Circle-vs-AABB push-out against a list of boxes {minX,maxX,minZ,maxZ}, plus clamping to the bounds rectangle.
import { clamp } from './util.js';

export function resolveCircle(pos, r, boxes, bounds) {
  for (let pass = 0; pass < 2; pass++) {
    pos.x = clamp(pos.x, bounds.minX + r, bounds.maxX - r);
    pos.z = clamp(pos.z, bounds.minZ + r, bounds.maxZ - r);
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const cx = clamp(pos.x, b.minX, b.maxX), cz = clamp(pos.z, b.minZ, b.maxZ);
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2), k = (r - d) / d;
        pos.x += dx * k; pos.z += dz * k;
      } else {
        // centre is inside the box: leave through the nearest face
        const l = pos.x - b.minX, rr = b.maxX - pos.x, t = pos.z - b.minZ, bt = b.maxZ - pos.z;
        const m = Math.min(l, rr, t, bt);
        if (m === l) pos.x = b.minX - r; else if (m === rr) pos.x = b.maxX + r;
        else if (m === t) pos.z = b.minZ - r; else pos.z = b.maxZ + r;
      }
    }
  }
}
