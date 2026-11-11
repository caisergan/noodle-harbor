// The whole world around the gameplay objects: floors, walls, decor, street, harbor, scenery.
import * as THREE from 'three';
import { PALETTE as P, LAYOUT as L } from '../config.js';
import { Builder, litMat, glowMat, mesh, polygon, mulberry32 } from './voxel.js';

const CREAM = 0xf6ecd8;
const NAVY = P.wall;
const CORAL = P.wallTrim;
const LEAF = [0x3f9d6a, 0x56b97a, 0x2f7f5a, 0x6ac48b];
const STONE = 0xb7ad9e;

const css = (hex) => '#' + hex.toString(16).padStart(6, '0');

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// ---------- textures ----------
function plankTexture(repeat) {
  return canvasTex(512, 256, (g, w, h) => {
    const rnd = mulberry32(7);
    const strip = h / 4;
    for (let i = 0; i < 4; i++) {
      const y = i * strip;
      g.fillStyle = css(i % 2 ? P.floorB : P.floorA);
      g.fillRect(0, y, w, strip);
      for (let k = 0; k < 16; k++) {            // grain
        g.fillStyle = rnd() > 0.5 ? 'rgba(120,85,50,0.07)' : 'rgba(255,255,255,0.12)';
        g.fillRect(rnd() * w, y + 4 + rnd() * (strip - 8), 30 + rnd() * 140, 1.5);
      }
      const j = (i * 181 + 40) % 256;           // staggered end joints
      g.fillStyle = 'rgba(120,85,50,0.35)';
      g.fillRect(j, y, 2, strip);
      g.fillRect(j + 256, y, 2, strip);
      if (i % 2 === 0) {                         // knot
        g.fillStyle = 'rgba(130,90,55,0.25)';
        g.beginPath(); g.ellipse(80 + rnd() * 300, y + strip / 2, 7, 4, 0, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y, w, 1.5);
      g.fillStyle = 'rgba(120,85,50,0.4)'; g.fillRect(0, y + strip - 2.5, w, 2.5);
    }
  }, { repeat });
}

function tileTexture(repeat) {
  return canvasTex(128, 128, (g, w, h) => {
    const s = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = css((i + j) % 2 ? P.kitchenB : P.kitchenA);
      g.fillRect(i * s, j * s, s, s);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(i * s, j * s, s, 3);
      g.fillRect(i * s, j * s, 3, s);
      g.fillStyle = 'rgba(70,100,115,0.25)';
      g.fillRect(i * s, j * s + s - 2, s, 2);
      g.fillRect(i * s + s - 2, j * s, 2, s);
    }
  }, { repeat });
}

const FONT = '"Fredoka", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';

function signTexture() {
  const draw = (g, w, h) => {
    g.fillStyle = css(NAVY); g.fillRect(0, 0, w, h);
    g.strokeStyle = css(P.accent); g.lineWidth = 8; g.setLineDash([26, 16]);
    g.strokeRect(18, 18, w - 36, h - 36);
    g.setLineDash([]);
    g.font = `700 94px ${FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = css(CORAL); g.fillText('NOODLE HARBOR', w / 2 + 5, h / 2 + 9);
    g.fillStyle = css(CREAM); g.fillText('NOODLE HARBOR', w / 2, h / 2 + 2);
  };
  const t = canvasTex(1024, 256, draw);
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`700 94px "Fredoka"`).catch(() => {}).finally(() => {
      const c = t.image; draw(c.getContext('2d'), c.width, c.height); t.needsUpdate = true;
    });
  }
  return t;
}

function menuTexture() {
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#25404f'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = css(P.accent); g.font = `700 64px ${FONT}`; g.fillText('MENU', w / 2, 52);
    g.fillStyle = 'rgba(246,236,216,0.6)'; g.fillRect(40, 92, w - 80, 4);
    const rows = [['Shoyu', '$6'], ['Miso', '$7'], ['Tonkotsu', '$9'], ['Tea', '$2']];
    g.font = `600 46px ${FONT}`;
    rows.forEach(([n, p], i) => {
      const y = 140 + i * 56;
      g.textAlign = 'left'; g.fillStyle = css(CREAM); g.fillText(n, 50, y);
      g.textAlign = 'right'; g.fillStyle = css(CORAL); g.fillText(p, w - 50, y);
    });
  });
}

// ---------- scenery pieces ----------
function tree(B, x, z, s = 1, blossom = false) {
  B.push(x, 0, z, 0, s);
  B.box(0.3, 1.1, 0.3, P.woodDark, 0, 0, 0);
  B.box(1.4, 0.9, 1.4, LEAF[2], 0, 0.9, 0);
  B.box(1.1, 0.8, 1.1, LEAF[0], 0.08, 1.7, 0.04);
  B.box(0.7, 0.55, 0.7, LEAF[1], -0.05, 2.45, 0);
  if (blossom) for (const [bx, by, bz] of [[0.6, 1.5, 0.5], [-0.5, 1.1, 0.7], [0.2, 2.1, 0.58], [-0.62, 1.9, -0.3]]) B.box(0.22, 0.22, 0.22, CORAL, bx, by, bz);
  B.pop();
}
function bush(B, x, z, s = 1) {
  B.push(x, 0, z, 0, s);
  B.box(0.9, 0.5, 0.8, LEAF[0], 0, 0, 0);
  B.box(0.6, 0.45, 0.6, LEAF[1], 0.15, 0.3, 0.05);
  B.box(0.5, 0.4, 0.5, LEAF[3], -0.25, 0.15, 0.2);
  B.pop();
}
function planter(B, x, z) {
  B.push(x, 0, z);
  B.box(0.8, 0.45, 0.8, 0xc9694a, 0, 0, 0);
  B.box(0.86, 0.08, 0.86, 0xe08a62, 0, 0.45, 0);
  B.box(0.65, 0.4, 0.65, LEAF[0], 0, 0.5, 0);
  B.box(0.4, 0.3, 0.4, LEAF[1], 0.05, 0.85, 0);
  B.box(0.14, 0.14, 0.14, P.accent, 0.2, 1.1, 0.1);
  B.box(0.14, 0.14, 0.14, CORAL, -0.15, 0.95, 0.2);
  B.pop();
}
function bench(B, x, z, ry = 0) {
  B.push(x, 0, z, ry);
  for (const sx of [-0.7, 0.7]) B.box(0.1, 0.4, 0.5, NAVY, sx, 0, 0);
  B.box(1.7, 0.08, 0.5, P.wood, 0, 0.4, 0);
  B.box(1.7, 0.4, 0.07, P.wood, 0, 0.48, -0.23);
  B.box(1.74, 0.05, 0.1, CORAL, 0, 0.88, -0.23);
  B.pop();
}
function lamp(B, G, x, z, ry = 0) {
  B.push(x, 0, z, ry);
  B.cyl(0.1, 0.13, 0.2, NAVY, 0, 0, 0, 8);
  B.cyl(0.05, 0.07, 2.6, NAVY, 0, 0.2, 0, 8);
  B.box(0.5, 0.05, 0.05, NAVY, 0.2, 2.7, 0);
  B.box(0.34, 0.05, 0.34, NAVY, 0.45, 2.55, 0);
  B.pop();
  G.push(x, 0, z, ry);
  G.box(0.22, 0.2, 0.22, 0xffe6a0, 0.45, 2.38, 0);
  G.pop();
}
function bollard(B, x, y, z, c = NAVY) {
  B.cyl(0.14, 0.16, 0.42, c, x, y, z, 8);
  B.cyl(0.19, 0.19, 0.07, CREAM, x, y + 0.42, z, 8);
}
function crate(B, x, z, ry = 0, s = 1) {
  B.push(x, 0, z, ry, s);
  B.box(0.8, 0.7, 0.8, 0xc99564, 0, 0, 0);
  B.box(0.84, 0.08, 0.84, P.woodDark, 0, 0.0, 0);
  B.box(0.84, 0.08, 0.84, P.woodDark, 0, 0.62, 0);
  B.box(0.1, 0.6, 0.84, P.woodDark, 0.3, 0.05, 0);
  B.box(0.1, 0.6, 0.84, P.woodDark, -0.3, 0.05, 0);
  B.pop();
}
function barrel(B, x, z, c = 0x4f7fb5) {
  B.cyl(0.3, 0.3, 0.75, c, x, 0, z, 10);
  B.cyl(0.32, 0.32, 0.06, CREAM, x, 0.15, z, 10);
  B.cyl(0.32, 0.32, 0.06, CREAM, x, 0.52, z, 10);
}

function lantern(B, G, x, y, z) {
  B.box(0.05, 0.05, 0.55, P.woodDark, x, y + 0.5, z - 0.22);          // wall bracket
  B.box(0.02, 0.28, 0.02, NAVY, x, y + 0.24, z);                       // cord
  B.cyl(0.1, 0.1, 0.04, NAVY, x, y + 0.2, z, 8);
  G.cyl(0.17, 0.17, 0.3, 0xf0554a, x, y - 0.1, z, 8);
  G.cyl(0.18, 0.18, 0.03, P.accent, x, y - 0.1 + 0.07, z, 8);
  G.cyl(0.18, 0.18, 0.03, P.accent, x, y - 0.1 + 0.22, z, 8);
  B.cyl(0.1, 0.1, 0.05, NAVY, x, y - 0.15, z, 8);
  B.box(0.03, 0.2, 0.03, P.accent, x, y - 0.35, z);                    // tassel
}

function windowAt(B, G, x, y, z, w, h, axis) {
  // axis 'z': flat on a wall facing +z; axis 'x+'/'x-': on a wall facing -x / +x
  B.push(x, y, z, axis === 'z' ? 0 : axis === 'x-' ? Math.PI / 2 : -Math.PI / 2);
  B.box(w + 0.24, h + 0.24, 0.1, CREAM, 0, -0.12, 0);
  B.box(w + 0.4, 0.08, 0.2, CORAL, 0, -0.2, 0.05);                      // sill
  G.push(x, y, z, axis === 'z' ? 0 : axis === 'x-' ? Math.PI / 2 : -Math.PI / 2);
  G.box(w, h, 0.12, 0x9ad7e6, 0, 0, 0.02);
  G.box(w, h * 0.3, 0.125, 0xc4eaf2, 0, h * 0.7, 0.02);
  G.pop();
  B.box(0.07, h, 0.14, CREAM, 0, 0, 0.04);
  B.box(w, 0.07, 0.14, CREAM, 0, h / 2 - 0.03, 0.04);
  B.pop();
}

// ---------- vehicles ----------
function buildCar(body, accent) {
  const B = new Builder();
  B.box(1.1, 0.5, 2.3, body, 0, 0.25, 0);
  B.box(1.0, 0.45, 1.2, body, 0, 0.75, -0.2);
  B.box(1.02, 0.08, 2.32, accent, 0, 0.5, 0);
  B.box(1.04, 0.3, 1.0, 0xbfe4ee, 0, 0.82, -0.2);
  B.box(0.9, 0.2, 0.06, 0xbfe4ee, 0, 0.55, 1.15);
  B.box(1.12, 0.08, 0.1, 0x3a3f4a, 0, 0.2, 1.17);
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.7, 0.75]) B.box(0.16, 0.42, 0.42, 0x23272e, sx, 0.0, sz);
  B.box(0.18, 0.1, 0.04, 0xffe6a0, -0.35, 0.3, 1.17);
  B.box(0.18, 0.1, 0.04, 0xffe6a0, 0.35, 0.3, 1.17);
  return mesh(B.build());
}

function buildBoat({ hull, trim, cabin = true, sail = false, len = 1 }) {
  const B = new Builder();
  const R = -Math.PI / 2;
  const outline = (s) => polygon([[-0.55 * s, -1.4], [0.55 * s, -1.4], [0.62 * s, 0.5], [0.3 * s, 1.2], [0, 1.65], [-0.3 * s, 1.2], [-0.62 * s, 0.5]]);
  B.shape(outline(0.85), 0.2, 0x2b3f4e, 0, -0.35, 0, R);
  B.shape(outline(1), 0.4, hull, 0, -0.15, 0, R);
  B.shape(outline(1.04), 0.07, trim, 0, 0.18, 0, R);
  B.shape(outline(0.8), 0.03, 0xc99564, 0, 0.2, 0.02, R);
  if (cabin) {
    B.box(0.8, 0.5, 0.9, CREAM, 0, 0.23, -0.35);
    B.box(0.84, 0.08, 0.95, trim, 0, 0.73, -0.35);
    B.box(0.84, 0.16, 0.02, 0x23405a, 0, 0.45, 0.115);
    B.box(0.02, 0.16, 0.6, 0x23405a, 0.41, 0.45, -0.35);
    B.box(0.02, 0.16, 0.6, 0x23405a, -0.41, 0.45, -0.35);
  }
  if (sail) {
    B.cyl(0.04, 0.05, 2.6, P.woodDark, 0, 0.2, 0.3, 6);
    B.shape(polygon([[0, 0], [0, 2.2], [1.1, 0.2]]), 0.04, CREAM, 0, 0.45, 0.3, 0, Math.PI / 2, 0);
    B.shape(polygon([[0, 0], [0, 1.6], [-0.7, 0.1]]), 0.04, CORAL, 0, 0.55, 0.3, 0, Math.PI / 2, 0);
  } else {
    B.cyl(0.03, 0.03, 0.8, NAVY, 0, 0.73, -0.35, 6);
    B.box(0.28, 0.16, 0.03, P.accent, 0.14, 1.35, -0.35);
  }
  const m = mesh(B.build());
  const g = new THREE.Group();
  g.add(m);
  g.scale.setScalar(len);
  return g;
}

// ---------- main ----------
export function buildEnvironment(scene) {
  const W = L.walls;
  const H = W.height, T = W.thickness;
  const env = new THREE.Group();
  env.name = 'environment';
  scene.add(env);

  // ----- floors -----
  const diningW = W.maxX - W.minX, diningD = W.maxZ - L.counter.z;
  const diningMat = new THREE.MeshLambertMaterial({ map: plankTexture([diningW / 4.8, diningD / 2.4]) });
  const dining = new THREE.Mesh(new THREE.PlaneGeometry(diningW, diningD), diningMat);
  dining.rotation.x = -Math.PI / 2;
  dining.position.set(0, 0, (W.maxZ + L.counter.z) / 2);
  dining.receiveShadow = true;
  env.add(dining);

  const kitchenD = L.counter.z - W.minZ;
  const tileTex = tileTexture([diningW / 1.6, kitchenD / 1.6]);
  const kitchen = new THREE.Mesh(new THREE.PlaneGeometry(diningW, kitchenD), new THREE.MeshLambertMaterial({ map: tileTex }));
  kitchen.rotation.x = -Math.PI / 2;
  kitchen.position.set(0, 0, (W.minZ + L.counter.z) / 2);
  kitchen.receiveShadow = true;
  env.add(kitchen);

  // back-wall tile splash (reuses the tile image)
  const splashTex = tileTex.clone();
  splashTex.repeat.set(diningW / 1.6, 1.15 / 1.6);
  splashTex.needsUpdate = true;
  const splash = new THREE.Mesh(new THREE.PlaneGeometry(diningW - 0.4, 1.15), new THREE.MeshLambertMaterial({ map: splashTex }));
  splash.position.set(0, 0.575, W.minZ + T / 2 + 0.02);
  env.add(splash);

  // ----- static lit / glow builders -----
  const B = new Builder();
  const G = new Builder();

  // walls
  const innerBackZ = W.minZ + T / 2, innerSideX = W.maxX - T / 2;
  const lenX = W.maxX - W.minX + T, lenZ = W.maxZ - W.minZ + T;
  B.box(lenX, H, T, NAVY, 0, 0, W.minZ);
  B.box(lenX + 0.08, 0.12, T + 0.1, CORAL, 0, H, W.minZ);
  B.box(lenX - 0.4, 0.07, 0.05, CORAL, 0, 1.15, innerBackZ + 0.04);          // line above the tile splash
  for (const sx of [-1, 1]) {
    const x = sx * W.maxX;
    B.box(T, H, lenZ, NAVY, x, 0, (W.minZ + W.maxZ) / 2);
    B.box(T + 0.1, 0.12, lenZ + 0.08, CORAL, x, H, (W.minZ + W.maxZ) / 2);
    B.box(0.05, 0.07, lenZ - 0.4, CORAL, sx * (innerSideX - 0.02), 0.75, (W.minZ + W.maxZ) / 2);
    B.box(0.06, 0.18, lenZ - 0.4, 0x24394a, sx * (innerSideX - 0.02), 0, (W.minZ + W.maxZ) / 2);
  }
  // low front wall with the entrance gap
  const ew = L.entrance.width / 2;
  const FH = 0.6;
  for (const sx of [-1, 1]) {
    const x0 = sx * ew, x1 = sx * (W.maxX + T / 2);
    const cx = (x0 + x1) / 2, len = Math.abs(x1 - x0);
    B.box(len, FH, T, NAVY, cx, 0, W.maxZ);
    B.box(len + 0.04, 0.1, T + 0.1, CORAL, cx, FH, W.maxZ);
    B.box(len, 0.06, 0.05, CORAL, cx, 0.3, W.maxZ + T / 2 + 0.01);
  }
  // entrance posts + lanterns
  for (const sx of [-1, 1]) {
    B.box(0.36, 1.95, 0.5, NAVY, sx * (ew + 0.08), 0, W.maxZ);
    B.box(0.44, 0.1, 0.58, CORAL, sx * (ew + 0.08), 1.95, W.maxZ);
    G.box(0.2, 0.3, 0.2, 0xf0554a, sx * (ew + 0.08), 1.25, W.maxZ + 0.42);
    B.box(0.06, 0.06, 0.2, NAVY, sx * (ew + 0.08), 1.6, W.maxZ + 0.3);
  }
  // door mat + threshold
  B.box(2.2, 0.012, 0.9, NAVY, 0, 0, W.maxZ - 0.4);
  B.box(2.0, 0.014, 0.1, P.accent, 0, 0, W.maxZ - 0.15);
  B.box(2.0, 0.014, 0.1, P.accent, 0, 0, W.maxZ - 0.65);
  // kitchen / dining threshold strip at the counter gap
  B.box(L.bounds.maxX - L.counter.maxX + 0.6, 0.012, 0.12, P.accent, (L.counter.maxX + W.maxX) / 2 + 0.3, 0, L.counter.z);

  // back wall decoration
  windowAt(B, G, -3.2, 1.35, innerBackZ + 0.06, 1.3, 0.7, 'z');
  windowAt(B, G, 0.3, 1.35, innerBackZ + 0.06, 1.3, 0.7, 'z');
  for (const x of [-6.1, -1.5, 2.2, 6.3]) lantern(B, G, x, 1.7, W.minZ + T / 2 + 0.58);
  // shelf with jars + bowls on the right of the back wall
  B.box(1.5, 0.07, 0.3, P.wood, 6.0, 1.5, innerBackZ + 0.16);
  for (let i = 0; i < 3; i++) B.box(0.22, 0.28, 0.22, i % 2 ? 0x9ad7e6 : P.accent, 5.5 + i * 0.5, 1.57, innerBackZ + 0.16);
  // side wall windows (dining room)
  for (const z of [-1.2, 3.4]) {
    windowAt(B, G, innerSideX - 0.02, 1.15, z, 1.2, 0.8, 'x-');
    windowAt(B, G, -innerSideX + 0.02, 1.15, z, 1.2, 0.8, 'x+');
  }
  for (const z of [1.2, -3.6, 5.6]) {
    lantern(B, G, innerSideX - 0.55, 1.9, z);
    lantern(B, G, -innerSideX + 0.55, 1.9, z);
  }

  // ----- outside: land -----
  const LAND = { minZ: -14.5, maxZ: 17.2, half: 60 };
  const landD = LAND.maxZ - LAND.minZ, landCz = (LAND.minZ + LAND.maxZ) / 2;
  B.box(LAND.half * 2, 0.5, landD, STONE, 0, -0.52, landCz);
  B.box(LAND.half * 2 - 0.4, 0.02, landD - 0.5, P.outside, 0, -0.035, landCz);

  // grass patches for texture
  const rnd = mulberry32(11);
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * 56, z = LAND.minZ + 0.5 + rnd() * (landD - 1.5);
    const inBuilding = Math.abs(x) < 7.8 && z > W.minZ - 0.8 && z < W.maxZ + 0.6;
    const onWalk = z > 9.6 && z < 16.9;
    const onPath = Math.abs(x) < 1.6 && z > 7;
    if (inBuilding || onWalk || onPath) continue;
    const s = 0.5 + rnd() * 1.1;
    B.box(s, 0.004, s * (0.6 + rnd() * 0.7), rnd() > 0.5 ? 0x6fbaa6 : 0x88d1bd, x, -0.014, z, 0, rnd() * 3, 0);
  }

  // sidewalk (customers walk z ~ 11), street, kerbs
  const SW = { z0: 9.9, z1: 12.1 }, ST = { z0: 12.1, z1: 16.6 };
  B.box(60, 0.012, SW.z1 - SW.z0, P.sidewalk, 0, -0.008, (SW.z0 + SW.z1) / 2);
  for (let x = -29; x <= 29; x += 1.5) B.box(0.03, 0.004, SW.z1 - SW.z0, 0xb9b1a4, x, 0.003, (SW.z0 + SW.z1) / 2);
  B.box(60, 0.012, ST.z1 - ST.z0, P.street, 0, -0.012, (ST.z0 + ST.z1) / 2);
  B.box(60, 0.1, 0.2, 0xe4ddd1, 0, 0, ST.z0 - 0.1);
  B.box(60, 0.1, 0.3, 0xe4ddd1, 0, 0, ST.z1 + 0.1);
  for (let x = -29; x <= 29; x += 2.8) B.box(1.4, 0.004, 0.14, 0xf6e7b0, x, 0.0, 14.35);
  for (let z = ST.z0 + 0.4; z < ST.z1 - 0.2; z += 0.7) B.box(2.4, 0.004, 0.34, CREAM, -5.5, 0.0, z);   // crosswalk
  // front path to the entrance
  B.box(2.6, 0.012, W.maxZ + 0.4 > 0 ? SW.z0 - (W.maxZ + T / 2) : 2, 0xe3dccf, 0, -0.006, (SW.z0 + W.maxZ + T / 2) / 2);
  for (let z = W.maxZ + 0.6; z < SW.z0; z += 0.8) B.box(2.6, 0.004, 0.03, 0xc9c1b3, 0, 0.0, z);
  for (const sx of [-1, 1]) B.box(0.14, 0.03, SW.z0 - (W.maxZ + T / 2), 0xd0c8ba, sx * 1.37, -0.004, (SW.z0 + W.maxZ + T / 2) / 2);

  // scenery: front garden
  for (const sx of [-1, 1]) {
    planter(B, sx * 2.5, 8.5);
    bush(B, sx * 3.7, 7.95, 0.9); bush(B, sx * 4.35, 7.95, 0.9); bush(B, sx * 6.2, 7.95, 1.0);
    bench(B, sx * 5.2, 8.9, 0);
    lamp(B, G, sx * 3.7, 9.55, sx > 0 ? Math.PI : 0);
    tree(B, sx * 9.0, 8.4, 1.0, sx > 0);
    tree(B, sx * 14, 8.6, 1.1);
    tree(B, sx * 20, 8.5, 1.0, true);
    tree(B, sx * 26, 8.5, 1.1);
    bush(B, sx * 11.6, 8.3); bush(B, sx * 17, 8.4); bush(B, sx * 23, 8.3);
    // beside the building
    tree(B, sx * 9.2, 2.5, 1.1, sx < 0);
    tree(B, sx * 9.6, -4.5, 1.2);
    tree(B, sx * 9.4, -9.5, 1.0, sx > 0);
    bush(B, sx * 8.0, -0.5); bush(B, sx * 8.1, 5.5, 0.9); bush(B, sx * 8.1, -7.5);
    bench(B, sx * 8.6, 0.4, sx > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  // street furniture
  for (const x of [-26, -18, -10, 10, 18, 26]) lamp(B, G, x, 11.85, Math.PI);
  for (const x of [-22, -14, 14, 22]) planter(B, x, 10.35);
  for (const x of [-9, -2.5, 3.5, 8, 15, 22]) B.box(1.0, 0.1, 0.18, 0xe4ddd1, x, 0.0, 16.8);
  for (let x = -27; x <= 27; x += 6) bollard(B, x, 0, 16.95, x % 12 === 0 ? CORAL : NAVY);

  // ----- north quay (behind the kitchen) -----
  for (let x = -27; x <= 27; x += 4.5) bollard(B, x, 0, LAND.minZ + 0.6, x % 9 === 0 ? CORAL : NAVY);
  for (const [x, z, r] of [[-9.5, -13.2, 0.3], [-8.6, -13.3, -0.2], [-9.1, -13.2, 0.1]]) crate(B, x, z, r);
  crate(B, -9.05, -13.2, 0.4, 0.8);
  barrel(B, 8.6, -13.2); barrel(B, 9.3, -13.4, 0xc9694a); barrel(B, 8.9, -12.6);
  crate(B, 11.5, -13.3, 0.5);
  lamp(B, G, -6.5, -13.4, 0); lamp(B, G, 7.0, -13.4, Math.PI);
  tree(B, -14, -12.5, 1.1); tree(B, 15, -12.8, 1.1, true); tree(B, -21, -12.5); tree(B, 22, -12.5);
  bush(B, -11.5, -12.5); bush(B, 12.5, -12.5);

  // ----- piers -----
  function pier(x, z0, z1, width, axis = 'z') {
    const len = Math.abs(z1 - z0), dir = Math.sign(z1 - z0), cz = (z0 + z1) / 2;
    for (let i = 0; i < len / 0.5; i++) {
      const zz = z0 + dir * (0.25 + i * 0.5);
      B.box(width, 0.1, 0.46, i % 2 ? 0xb88555 : 0xc99564, x, -0.1, zz);
    }
    for (const sx of [-1, 1]) {
      B.box(0.12, 0.1, len, P.woodDark, x + sx * (width / 2 - 0.06), -0.2, cz);
      for (let i = 0; i <= len / 1.6; i++) {
        const zz = z0 + dir * (i * 1.6);
        B.cyl(0.11, 0.11, 1.2, P.woodDark, x + sx * (width / 2), -0.9, zz, 6);
        if (i % 2 === 0 && i > 0) bollard(B, x + sx * (width / 2 + 0.1), 0, zz, sx > 0 ? CORAL : NAVY);
      }
    }
    B.cyl(0.13, 0.13, 1.5, P.woodDark, x, -1.0, z1, 6);
  }
  pier(3.0, LAND.minZ + 0.2, -21.5, 1.8);
  pier(-7.0, LAND.minZ + 0.2, -18.0, 1.5);
  pier(-5.5, LAND.maxZ - 0.2, 23.5, 1.7);

  // flush the static scenery into two meshes
  const props = mesh(B.build(), litMat, { cast: true, receive: true });
  props.name = 'env-static';
  env.add(props);
  const glow = mesh(G.build(), glowMat, { cast: false });
  env.add(glow);

  // ----- entrance sign -----
  const signTex = signTexture();
  const sign = new THREE.Group();
  sign.position.set(0, 1.98, W.maxZ + 0.36);
  sign.rotation.x = -0.38;
  const frameGeo = new THREE.BoxGeometry(3.9, 0.85, 0.12);
  const frame = new THREE.Mesh(frameGeo, new THREE.MeshLambertMaterial({ color: CORAL }));
  frame.position.y = 0.42; frame.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.68), new THREE.MeshBasicMaterial({ map: signTex }));
  face.position.set(0, 0.42, 0.065);
  sign.add(frame, face);
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshLambertMaterial({ color: NAVY }));
    arm.position.set(sx * 1.6, -0.05, -0.05); sign.add(arm);
  }
  env.add(sign);

  // menu board
  const menu = new THREE.Group();
  menu.position.set(4.7, 1.2, innerBackZ + 0.06);
  const mframe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.08), new THREE.MeshLambertMaterial({ color: P.wood }));
  mframe.position.y = 0.55; mframe.castShadow = true;
  const mface = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: menuTexture() }));
  mface.position.set(0, 0.55, 0.045);
  menu.add(mframe, mface);
  env.add(menu);

  // ----- water -----
  const waterMat = new THREE.MeshLambertMaterial({ color: P.water });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.4;
  water.receiveShadow = true;
  env.add(water);
  // pale foam line along both quays
  const foamB = new Builder();
  foamB.box(120, 0.01, 0.35, 0xcdeaf5, 0, -0.395, LAND.minZ - 0.15);
  foamB.box(120, 0.01, 0.35, 0xcdeaf5, 0, -0.395, LAND.maxZ + 0.15);
  env.add(mesh(foamB.build(), glowMat, { cast: false }));

  // ripples
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false });
  const rippleGeo = new THREE.PlaneGeometry(1, 0.1).rotateX(-Math.PI / 2);
  const ripples = [];
  const rr = mulberry32(5);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(rippleGeo, rippleMat);
    const north = i < 16;
    m.position.set((rr() - 0.5) * 50, -0.39, north ? -16 - rr() * 22 : 18 + rr() * 8);
    m.userData = { sp: 0.15 + rr() * 0.25, ph: rr() * 6, base: 1.2 + rr() * 1.4 };
    ripples.push(m);
    env.add(m);
  }

  // boats
  const boats = [];
  function addBoat(g, x, z, ry) {
    g.position.set(x, -0.28, z); g.rotation.y = ry;
    g.userData = { x, z, y0: -0.28, ph: Math.random() * 6, ry };
    boats.push(g); env.add(g);
  }
  addBoat(buildBoat({ hull: CORAL, trim: CREAM, len: 1.25 }), 0.7, -18.5, 0.05);
  addBoat(buildBoat({ hull: P.teal, trim: P.accent, sail: true, cabin: false, len: 1.2 }), 6.6, -17.6, -0.35);
  addBoat(buildBoat({ hull: 0xf2ece0, trim: NAVY, len: 1.0 }), -9.6, -16.6, 0.5);
  addBoat(buildBoat({ hull: P.accent, trim: NAVY, sail: true, cabin: false, len: 1.0 }), -3.3, 21.0, Math.PI - 0.2);

  // cars
  const cars = [];
  const car1 = buildCar(0xf26b5b, CREAM); car1.rotation.y = Math.PI / 2; car1.position.set(-20, 0, 15.5);
  const car2 = buildCar(0x2a9d8f, P.accent); car2.rotation.y = -Math.PI / 2; car2.position.set(12, 0, 13.2);
  cars.push({ m: car1, v: 3.2 }, { m: car2, v: -2.4 });
  env.add(car1, car2);

  let t = 0;
  function update(dt) {
    t += dt;
    for (const b of boats) {
      const u = b.userData;
      b.position.y = u.y0 + Math.sin(t * 1.3 + u.ph) * 0.05;
      b.rotation.z = Math.sin(t * 1.0 + u.ph) * 0.045;
      b.rotation.x = Math.sin(t * 0.8 + u.ph * 1.7) * 0.03;
      b.rotation.y = u.ry + Math.sin(t * 0.3 + u.ph) * 0.05;
    }
    for (const r of ripples) {
      const u = r.userData;
      r.position.x += u.sp * dt;
      if (r.position.x > 26) r.position.x = -26;
      r.scale.x = u.base * (0.8 + 0.3 * Math.sin(t * 0.9 + u.ph));
    }
    for (const c of cars) {
      c.m.position.x += c.v * dt;
      if (c.m.position.x > 34) c.m.position.x = -34;
      if (c.m.position.x < -34) c.m.position.x = 34;
    }
  }
  return { update, group: env };
}
