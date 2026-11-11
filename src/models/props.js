// Restaurant props: bowl, cash, station, counter, register, tea machine, table, pads, zone ring.
import * as THREE from 'three';
import { PALETTE as P } from '../config.js';
import { Builder, litMat, memo, mesh, roundedRect } from './voxel.js';

export const BOWL_H = 0.22;
export const CASH_H = 0.09;

const CREAM = 0xf6ecd8;
const STEEL = 0xb9c4cc;
const STEEL_D = 0x8a98a2;
const CORAL = P.wallTrim;
const NAVY = P.wall;
const geoCache = new Map();

// ---------------- bowl ----------------
function bowlGeo() {
  return memo(geoCache, 'bowl', () => {
    const b = new Builder();
    b.cyl(0.14, 0.12, 0.02, 0x2f6fb0, 0, 0, 0, 12);              // foot
    b.cyl(0.25, 0.15, 0.15, 0xf7f4ec, 0, 0.02, 0, 12);           // body
    b.cyl(0.255, 0.25, 0.035, 0x2f6fb0, 0, 0.14, 0, 12);         // blue rim
    b.cyl(0.215, 0.215, 0.01, 0xd9923f, 0, 0.165, 0, 12);        // broth
    b.cyl(0.19, 0.2, 0.035, 0xf3d36b, 0, 0.17, 0, 12);           // noodles
    b.box(0.3, 0.012, 0.02, 0xdcb24a, 0, 0.205, 0.0, 0, 0.3, 0); // noodle strands
    b.box(0.26, 0.012, 0.02, 0xdcb24a, 0.0, 0.205, 0.07, 0, -0.2, 0);
    b.box(0.13, 0.035, 0.1, 0xffffff, -0.08, 0.185, 0.08, 0, 0.3, 0);  // egg half
    b.box(0.06, 0.03, 0.05, 0xf0a830, -0.08, 0.195, 0.08, 0, 0.3, 0);  // yolk
    b.cyl(0.05, 0.05, 0.02, 0xf7b8c0, 0.1, 0.19, 0.1, 8);        // naruto
    b.box(0.13, 0.03, 0.012, 0x24473a, 0.06, 0.18, -0.12, -0.5, 0, 0);   // nori
    for (const [x, z] of [[0.03, -0.02], [-0.1, -0.06], [0.14, -0.02], [0.0, 0.14]]) {
      b.box(0.04, 0.025, 0.04, P.cash, x, 0.195, z, 0, x * 5, 0);          // green onion
    }
    return b.build();
  });
}
export function createBowl() {
  return mesh(bowlGeo());
}

// ---------------- cash ----------------
function cashGeo() {
  return memo(geoCache, 'cash', () => {
    const b = new Builder();
    b.box(0.42, CASH_H, 0.26, P.cash, 0, 0, 0);
    b.box(0.38, 0.012, 0.22, 0x8bdc92, 0, CASH_H, 0);       // top sheet
    b.box(0.43, CASH_H - 0.01, 0.01, P.cashDark, 0, 0.005, 0.13);   // front shadow edge
    b.box(0.1, CASH_H + 0.012, 0.275, 0xe6f4d8, 0, 0, 0);       // paper band
    return b.build();
  });
}
export function createCashStack() {
  return mesh(cashGeo());
}

// ---------------- station (stove + pot) ----------------
const unitBoxL = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0); // origin at left edge
const unitBox = new THREE.BoxGeometry(1, 1, 1);

function stationGeo() {
  return memo(geoCache, 'station', () => {
    const b = new Builder();
    b.box(1.6, 0.85, 1.0, 0x35505f, 0, 0, 0);                              // cabinet
    b.box(1.64, 0.1, 1.04, 0x24394a, 0, 0, 0);                             // kick plate
    b.box(1.62, 0.05, 1.02, CORAL, 0, 0.7, 0);                             // coral band
    b.box(1.6, 0.1, 1.0, STEEL, 0, 0.85, 0);                               // steel top
    b.box(1.6, 0.28, 0.08, STEEL_D, 0, 0.95, -0.46);                       // backsplash
    b.box(1.6, 0.03, 0.09, CORAL, 0, 1.2, -0.46);
    for (const x of [-0.55, -0.3, 0.3, 0.55]) {                            // knobs
      b.cyl(0.05, 0.05, 0.05, x < 0 ? P.accent : CORAL, x, 0.5, 0.5, 8, Math.PI / 2);
    }
    b.box(1.26, 0.16, 0.02, 0x16242e, 0, 0.18, 0.5);                       // progress track
    b.cyl(0.34, 0.34, 0.02, 0x2b2f36, 0, 0.95, -0.05, 12);                 // burner
    b.cyl(0.4, 0.37, 0.5, 0xcdd6dc, 0, 0.96, -0.05, 12);                   // pot body
    b.cyl(0.43, 0.43, 0.06, 0xe6edf0, 0, 1.4, -0.05, 12);                  // rim
    b.cyl(0.36, 0.36, 0.02, 0xf0d9a0, 0, 1.43, -0.05, 12);                 // broth
    b.box(0.16, 0.07, 0.1, STEEL_D, -0.5, 1.3, -0.05);                     // handles
    b.box(0.16, 0.07, 0.1, STEEL_D, 0.5, 1.3, -0.05);
    b.box(0.08, 0.5, 0.05, STEEL_D, 0.3, 1.43, -0.26, 0.4, 0, 0.5);        // ladle
    b.box(1.0, 0.1, 0.45, STEEL, 0, 0.85, 0.725);                          // front ledge
    b.box(1.02, 0.04, 0.04, CORAL, 0, 0.86, 0.96);
    return b.build();
  });
}

const steamGeo = new THREE.BoxGeometry(1, 1, 1);
const fillMatBase = new THREE.MeshBasicMaterial({ color: P.accent });

export function createStation() {
  const group = new THREE.Group();
  group.add(mesh(stationGeo(), litMat, { cast: true, receive: true }));

  const bowlAnchor = new THREE.Object3D();
  bowlAnchor.position.set(0, 0.95, 0.725);
  group.add(bowlAnchor);

  const fill = new THREE.Mesh(unitBoxL, fillMatBase);
  fill.scale.set(1.2, 0.1, 0.03);
  fill.position.set(-0.6, 0.18 - 0.05 + 0.05, 0.51);
  fill.position.y = 0.13;
  fill.visible = false;
  group.add(fill);

  // steam puffs (pooled)
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(steamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    group.add(m);
    puffs.push({ m, age: i / 6, spd: 0.55 + (i % 3) * 0.12, ox: 0, oz: 0, rot: 0 });
  }
  let cook = 0, intensity = 0.3, t = 0;

  function setCooking(p) {
    cook = Math.max(0, Math.min(1, p || 0));
    fill.visible = cook > 0.005;
    fill.scale.x = Math.max(0.001, cook * 1.2);
  }
  function update(dt) {
    t += dt;
    const target = cook > 0 ? 1 : 0.3;
    intensity += (target - intensity) * Math.min(1, dt * 3);
    for (const p of puffs) {
      p.age += dt * p.spd;
      if (p.age >= 1) {
        p.age -= 1;
        p.ox = (Math.random() - 0.5) * 0.45;
        p.oz = -0.05 + (Math.random() - 0.5) * 0.4;
        p.rot = Math.random() * 3;
      }
      const a = p.age;
      const op = Math.sin(a * Math.PI) * 0.6 * intensity;
      p.m.visible = op > 0.02;
      if (!p.m.visible) continue;
      p.m.material.opacity = op;
      const s = 0.1 + a * 0.2;
      p.m.scale.set(s, s, s);
      p.m.position.set(p.ox + Math.sin(a * 4 + p.rot) * 0.05, 1.5 + a * 0.9, p.oz);
      p.m.rotation.set(a * 2, p.rot + a * 2, 0);
    }
  }
  return { group, bowlAnchor, setCooking, update };
}

// ---------------- counter ----------------
export function createCounter(width = 9.6, depth = 1.0, height = 1.0) {
  const geo = memo(geoCache, `counter|${width}|${depth}|${height}`, () => {
    const b = new Builder();
    const WOOD = 0xc08a5a;
    b.box(width, height - 0.08, depth, WOOD, 0, 0, 0);
    b.box(width + 0.02, 0.12, depth + 0.02, P.woodDark, 0, 0, 0);               // kick
    const n = Math.floor(width / 0.8);
    for (let i = 0; i <= n; i++) {                                              // plank grooves
      const x = -width / 2 + (i / n) * width;
      b.box(0.04, height - 0.46, 0.02, P.wood, x, 0.14, depth / 2 + 0.005);
    }
    b.box(width + 0.02, 0.07, depth + 0.03, CORAL, 0, height - 0.3, 0);         // coral trim
    b.box(width + 0.1, 0.08, depth + 0.16, CREAM, 0, height - 0.08, 0.04);      // cream top
    return b.build();
  });
  const g = new THREE.Group();
  g.add(mesh(geo, litMat, { cast: true, receive: true }));
  g.userData.topY = height;
  return g;
}

// ---------------- register ----------------
export function createRegister() {
  const geo = memo(geoCache, 'register', () => {
    const b = new Builder();
    b.box(0.56, 0.2, 0.46, NAVY, 0, 0, 0);                                   // drawer base
    b.box(0.5, 0.012, 0.02, P.accent, 0, 0.1, 0.235);                        // drawer slit
    b.box(0.5, 0.14, 0.4, 0xe9dcc1, 0, 0.2, 0);                              // mid body
    b.push(0, 0.34, 0.06, 0, 1, -0.45);                                      // slanted key deck
    b.box(0.46, 0.05, 0.2, 0x3a3f4a, 0, 0, 0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      b.box(0.08, 0.03, 0.045, (i + j) % 2 ? P.accent : CORAL, -0.14 + i * 0.14, 0.05, -0.06 + j * 0.06);
    }
    b.pop();
    b.box(0.4, 0.2, 0.08, 0x3a3f4a, 0, 0.34, -0.15);                         // display housing
    b.box(0.32, 0.12, 0.02, 0x9fe0c9, 0, 0.38, -0.105);                      // screen
    b.box(0.5, 0.04, 0.12, CORAL, 0, 0.54, -0.15);                           // top cap
    b.box(0.1, 0.07, 0.06, 0xffffff, 0.22, 0.2, 0.22);                       // receipt
    return b.build();
  });
  const g = new THREE.Group();
  g.add(mesh(geo));
  return g;
}

// ---------------- tea machine ----------------
export function createTeaMachine() {
  const geo = memo(geoCache, 'tea', () => {
    const b = new Builder();
    const COPPER = 0xc16f3e;
    b.box(0.5, 0.12, 0.42, NAVY, 0, 0, 0);
    b.cyl(0.26, 0.25, 0.52, COPPER, 0, 0.12, 0, 10);                         // urn
    b.cyl(0.275, 0.275, 0.05, 0xe39a62, 0, 0.3, 0, 10);                      // polished band
    b.cyl(0.275, 0.275, 0.04, P.accent, 0, 0.5, 0, 10);                      // mustard band
    b.cyl(0.22, 0.26, 0.07, COPPER, 0, 0.64, 0, 10);                         // lid
    b.cyl(0.03, 0.2, 0.12, 0xe39a62, 0, 0.71, 0, 10);                        // dome
    b.box(0.06, 0.06, 0.06, NAVY, 0, 0.83, 0);                               // knob
    b.box(0.07, 0.07, 0.14, P.accent, 0, 0.24, 0.3);                         // tap
    b.box(0.04, 0.04, 0.04, CORAL, 0, 0.3, 0.37);
    b.box(0.1, 0.1, 0.1, CREAM, 0.34, 0.12, 0.08);                           // cup
    b.box(0.1, 0.1, 0.1, CREAM, 0.34, 0.22, 0.08);
    return b.build();
  });
  const g = new THREE.Group();
  g.add(mesh(geo));
  return g;
}

// ---------------- table + chairs ----------------
export function createTable() {
  const geo = memo(geoCache, 'table', () => {
    const b = new Builder();
    b.box(1.3, 0.08, 1.3, 0xc99564, 0, 0.72, 0);                              // top
    b.box(1.14, 0.012, 1.14, CORAL, 0, 0.8, 0);                               // cloth border
    b.box(0.94, 0.014, 0.94, CREAM, 0, 0.8, 0);
    b.box(1.18, 0.1, 1.18, P.woodDark, 0, 0.62, 0);                           // apron
    b.cyl(0.11, 0.14, 0.6, P.wood, 0, 0.04, 0, 8);                            // pedestal
    b.box(0.9, 0.05, 0.16, P.woodDark, 0, 0, 0);
    b.box(0.16, 0.05, 0.9, P.woodDark, 0, 0, 0);
    for (const [sx, ry] of [[-1, Math.PI / 2], [1, -Math.PI / 2]]) {          // chairs face the table
      b.push(sx * 1.0, 0, 0, ry);
      b.box(0.46, 0.07, 0.46, CORAL, 0, 0.38, 0);                             // seat
      for (const lx of [-0.19, 0.19]) for (const lz of [-0.19, 0.19]) b.box(0.06, 0.38, 0.06, P.woodDark, lx, 0, lz);
      b.box(0.46, 0.34, 0.06, CORAL, 0, 0.45, -0.2);                          // back
      b.box(0.5, 0.05, 0.08, P.woodDark, 0, 0.79, -0.2);                      // top rail
      b.pop();
    }
    return b.build();
  });
  const group = new THREE.Group();
  group.add(mesh(geo, litMat, { cast: true, receive: true }));
  const topAnchor = new THREE.Object3D();
  topAnchor.position.y = 0.81;
  group.add(topAnchor);
  return { group, topAnchor, seatHeight: 0.45 };
}

// ---------------- pads ----------------
function padGeo(key, size, baseColor, innerColor, build) {
  return memo(geoCache, key, () => {
    const b = new Builder();
    const R = -Math.PI / 2;
    b.shape(roundedRect(size, size, size * 0.14), 0.05, baseColor, 0, 0, 0, R);
    b.shape(roundedRect(size * 0.82, size * 0.82, size * 0.09), 0.012, innerColor, 0, 0.05, 0, R);
    build(b);
    return b.build();
  });
}

export function createUnlockPad() {
  const geo = padGeo('unlockPad', 1.6, P.padBase, 0x3d5d70, (b) => {
    const r = 0.7, dash = 0.14;
    for (let i = -2; i <= 2; i++) {
      const p = i * 0.27;
      b.box(dash, 0.012, 0.05, P.accent, p, 0.05, r);
      b.box(dash, 0.012, 0.05, P.accent, p, 0.05, -r);
      b.box(0.05, 0.012, dash, P.accent, r, 0.05, p);
      b.box(0.05, 0.012, dash, P.accent, -r, 0.05, p);
    }
  });
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  inner.add(mesh(geo, litMat, { cast: false, receive: true }));
  const fillMat = new THREE.MeshLambertMaterial({ color: P.padFill, emissive: 0x6a4d10, flatShading: true });
  const fill = new THREE.Mesh(unitBox, fillMat);
  fill.position.y = 0.06;
  fill.visible = false;
  inner.add(fill);
  const SPAN = 1.1;
  let p = 0, t = Math.random() * 6;
  function setProgress(v) {
    p = Math.max(0, Math.min(1, v || 0));
    fill.visible = p > 0.003;
    fill.scale.set(SPAN, 0.025, SPAN * p);
    fill.position.z = SPAN / 2 - (SPAN * p) / 2;         // grows from the bottom (near-camera) edge upward
  }
  function update(dt) {
    t += dt;
    const s = 1 + Math.sin(t * 2.6) * 0.025;
    inner.scale.set(s, 1, s);
    fillMat.emissiveIntensity = 0.7 + Math.sin(t * 5) * 0.3;
  }
  setProgress(0);
  return { group, setProgress, update };
}

function arrowGeo() {
  return memo(geoCache, 'arrow', () => {
    const b = new Builder();
    b.box(0.22, 0.07, 0.4, CREAM, 0, 0, 0.2);
    b.box(0.66, 0.07, 0.1, CREAM, 0, 0, -0.04);
    b.box(0.44, 0.07, 0.1, CREAM, 0, 0, -0.14);
    b.box(0.22, 0.07, 0.1, CREAM, 0, 0, -0.24);
    return b.build();
  });
}

export function createUpgradePad() {
  const geo = padGeo('upgradePad', 1.4, P.teal, 0x3ec4b3, (b) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.05, 0.05, 0.02, P.accent, sx * 0.58, 0.05, sz * 0.58, 8);
  });
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  inner.add(mesh(geo, litMat, { cast: false, receive: true }));
  const arrow = mesh(arrowGeo());
  arrow.position.y = 0.07;
  inner.add(arrow);
  let t = Math.random() * 6;
  function update(dt) {
    t += dt;
    const s = 1 + Math.sin(t * 2.2) * 0.025;
    inner.scale.set(s, 1, s);
    arrow.position.y = 0.09 + (Math.sin(t * 3.4) * 0.5 + 0.5) * 0.08;
  }
  return { group, update };
}

// ---------------- zone ring ----------------
const ringGeos = new Map();
export function createZoneRing(radius = 0.9) {
  const geo = memo(ringGeos, radius.toFixed(2), () => {
    const outer = roundedRect(radius * 2, radius * 2, radius * 0.38);
    const w = Math.max(0.06, radius * 0.12);
    outer.holes.push(roundedRect(radius * 2 - w * 2, radius * 2 - w * 2, radius * 0.38 - w * 0.6));
    return new THREE.ShapeGeometry(outer, 4);
  });
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  m.renderOrder = 1;
  return m;
}
