// Blocky voxel people. Geometry is merged + vertex coloured and cached per look, so a customer
// costs 5 meshes (body, 2 arms, 2 legs) and no new materials.
import * as THREE from 'three';
import { PALETTE as P } from '../config.js';
import { Builder, litMat, memo, mulberry32 } from './voxel.js';

const SHOE = 0x3a2e2a;
const EYE = 0x1d1a1a;
const NAVY = P.wall;
const CREAM = 0xf6ecd8;

const bodyCache = new Map();
const armCache = new Map();
const legCache = new Map();

const DEFAULT_LOOK = {
  shirt: 0xf6c453, pants: P.wall, skin: 0xedb98a, hair: 0x4a3222, hairStyle: 'short',
  hat: 'none', hatColor: 0xffffff, role: 'customer', stripe: null, longSleeves: false, shoe: SHOE,
};

function addHair(b, style, c, hasHat) {
  if (style === 'bald') return;
  if (!hasHat) {
    b.box(0.49, 0.09, 0.49, c, 0, 1.4, 0);                 // top
    b.box(0.47, 0.05, 0.06, c, 0, 1.36, 0.225);            // fringe
  }
  b.box(0.49, 0.28, 0.09, c, 0, 1.17, -0.2);               // back
  b.box(0.05, 0.2, 0.4, c, -0.235, 1.25, -0.02);           // sideburns
  b.box(0.05, 0.2, 0.4, c, 0.235, 1.25, -0.02);
  if (style === 'long') {
    b.box(0.49, 0.5, 0.09, c, 0, 0.96, -0.2);
    b.box(0.06, 0.4, 0.2, c, -0.24, 1.05, -0.1);
    b.box(0.06, 0.4, 0.2, c, 0.24, 1.05, -0.1);
  } else if (style === 'bun' && !hasHat) {
    b.box(0.2, 0.2, 0.2, c, 0, 1.49, -0.06);
  } else if (style === 'spiky' && !hasHat) {
    b.box(0.1, 0.13, 0.1, c, -0.15, 1.49, 0.02);
    b.box(0.1, 0.17, 0.1, c, 0.0, 1.49, 0.0);
    b.box(0.1, 0.13, 0.1, c, 0.15, 1.49, 0.02);
  } else if (style === 'curly' && !hasHat) {
    b.box(0.56, 0.16, 0.56, c, 0, 1.4, -0.02);
    b.box(0.08, 0.3, 0.46, c, -0.27, 1.2, -0.02);
    b.box(0.08, 0.3, 0.46, c, 0.27, 1.2, -0.02);
    b.box(0.5, 0.3, 0.1, c, 0, 1.15, -0.24);
  }
}

function addHat(b, hat, c, hatColor) {
  if (hat === 'chef') {
    b.box(0.48, 0.1, 0.48, 0xf2f2f2, 0, 1.43, 0);
    b.box(0.42, 0.2, 0.42, 0xffffff, 0, 1.53, 0);
    b.box(0.52, 0.14, 0.52, 0xffffff, 0, 1.69, 0);
  } else if (hat === 'cap') {
    b.box(0.5, 0.13, 0.5, hatColor, 0, 1.4, 0);
    b.box(0.42, 0.03, 0.24, hatColor, 0, 1.4, 0.32);                // brim
    b.box(0.1, 0.04, 0.04, P.accent, 0, 1.46, 0.255);               // badge
  } else if (hat === 'bandana') {
    b.box(0.48, 0.1, 0.48, P.wallTrim, 0, 1.33, 0);
    b.box(0.14, 0.12, 0.08, P.wallTrim, 0.1, 1.3, -0.27);           // knot
    b.box(0.07, 0.16, 0.04, P.wallTrim, 0.16, 1.16, -0.29);         // tails
    b.box(0.07, 0.2, 0.04, P.wallTrim, 0.05, 1.12, -0.29);
  } else if (hat === 'beanie') {
    b.box(0.5, 0.14, 0.5, hatColor, 0, 1.38, 0);
    b.box(0.5, 0.04, 0.5, CREAM, 0, 1.38, 0);
    b.box(0.12, 0.1, 0.12, CREAM, 0, 1.52, 0);
  }
}

function bodyGeo(l) {
  const key = [l.shirt, l.stripe, l.skin, l.hair, l.hairStyle, l.hat, l.hatColor, l.role, l.apron].join('|');
  return memo(bodyCache, key, () => {
    const b = new Builder();
    b.push(0, -0.5, 0); // upper-body local space: hip pivot at y=0
    // torso
    b.box(0.46, 0.5, 0.28, l.shirt, 0, 0.5, 0);
    if (l.stripe != null) b.box(0.47, 0.07, 0.29, l.stripe, 0, 0.74, 0);
    if (l.role === 'chef') {
      b.box(0.14, 0.05, 0.3, P.wallTrim, 0, 0.93, 0);                           // neckerchief
      b.box(0.04, 0.04, 0.02, 0x9aa5ad, 0, 0.82, 0.145);                        // buttons
      b.box(0.04, 0.04, 0.02, 0x9aa5ad, 0, 0.68, 0.145);
      b.box(0.04, 0.04, 0.02, 0x9aa5ad, 0, 0.54, 0.145);
    }
    if (l.apron != null) {
      b.box(0.4, 0.36, 0.03, l.apron, 0, 0.52, 0.145);
      b.box(0.16, 0.1, 0.035, l.role === 'player' ? P.accent : CREAM, 0, 0.6, 0.15);
      b.box(0.05, 0.16, 0.03, l.apron, -0.12, 0.86, 0.145);
      b.box(0.05, 0.16, 0.03, l.apron, 0.12, 0.86, 0.145);
    }
    // head
    b.box(0.45, 0.45, 0.45, l.skin, 0, 1.0, 0);
    b.box(0.06, 0.09, 0.02, EYE, -0.1, 1.2, 0.225);
    b.box(0.06, 0.09, 0.02, EYE, 0.1, 1.2, 0.225);
    b.box(0.07, 0.035, 0.02, 0xe08a7a, 0, 1.08, 0.225);                         // mouth
    b.box(0.07, 0.035, 0.015, 0xf0a090, -0.17, 1.12, 0.225);                    // cheeks
    b.box(0.07, 0.035, 0.015, 0xf0a090, 0.17, 1.12, 0.225);
    addHair(b, l.hairStyle, l.hair, l.hat !== 'none');
    addHat(b, l.hat, l.hair, l.hatColor);
    b.pop();
    return b.build();
  });
}

function armGeo(l) {
  const key = [l.shirt, l.skin, l.longSleeves].join('|');
  return memo(armCache, key, () => {
    const b = new Builder();
    if (l.longSleeves) {
      b.box(0.15, 0.35, 0.15, l.shirt, 0, -0.35, 0);
      b.box(0.125, 0.09, 0.125, l.skin, 0, -0.44, 0);
    } else {
      b.box(0.15, 0.26, 0.15, l.shirt, 0, -0.26, 0);
      b.box(0.125, 0.17, 0.125, l.skin, 0, -0.43, 0);
    }
    return b.build();
  });
}

function legGeo(l) {
  const key = [l.pants, l.shoe].join('|');
  return memo(legCache, key, () => {
    const b = new Builder();
    b.box(0.19, 0.42, 0.19, l.pants, 0, -0.42, 0);
    b.box(0.2, 0.08, 0.27, l.shoe, 0, -0.5, 0.035);
    return b.build();
  });
}

const mk = (geo) => { const m = new THREE.Mesh(geo, litMat); m.castShadow = true; return m; };

export function createCharacter(look = {}) {
  const l = { ...DEFAULT_LOOK, ...look };
  if (typeof l.shirt !== 'number') l.shirt = DEFAULT_LOOK.shirt;
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  const upper = new THREE.Group();
  upper.position.y = 0.5;
  rig.add(upper);
  upper.add(mk(bodyGeo(l)));

  const armG = armGeo(l);
  const armL = new THREE.Group(); armL.position.set(-0.3, 0.45, 0); armL.add(mk(armG));
  const armR = new THREE.Group(); armR.position.set(0.3, 0.45, 0); armR.add(mk(armG));
  upper.add(armL, armR);

  const legG = legGeo(l);
  const legL = new THREE.Group(); legL.position.set(-0.12, 0.5, 0); legL.add(mk(legG));
  const legR = new THREE.Group(); legR.position.set(0.12, 0.5, 0); legR.add(mk(legG));
  rig.add(legL, legR);

  const carryAnchor = new THREE.Object3D();
  carryAnchor.position.set(0, 0.95, 0.4);
  rig.add(carryAnchor);

  let phase = Math.random() * 6.28, t = Math.random() * 10;
  let amp = 0, carry = 0, carryTarget = 0, sit = 0, sitTarget = 0;

  function update(dt, speed01 = 0) {
    t += dt;
    const s = Number.isFinite(speed01) ? Math.max(0, Math.min(1.3, speed01)) : 0;
    if (!Number.isFinite(amp)) amp = 0;
    amp += (s - amp) * Math.min(1, dt * 10);
    carry += (carryTarget - carry) * Math.min(1, dt * 12);
    sit += (sitTarget - sit) * Math.min(1, dt * 12);
    phase += dt * (7 + 6 * amp);

    const sw = Math.sin(phase) * 0.85 * amp;
    legL.rotation.x = sw * (1 - sit) - 1.45 * sit;
    legR.rotation.x = -sw * (1 - sit) - 1.45 * sit;
    const aw = Math.sin(phase) * 0.75 * amp * (1 - carry);
    armL.rotation.x = -aw * (1 - carry) + (-1.55 * carry);
    armR.rotation.x = aw * (1 - carry) + (-1.55 * carry);
    armL.rotation.z = 0.06 - carry * 0.04;
    armR.rotation.z = -0.06 + carry * 0.04;

    rig.position.y = Math.abs(Math.sin(phase)) * 0.07 * amp;
    const idle = 1 - Math.min(1, amp * 3);
    upper.scale.y = 1 + Math.sin(t * 2.4) * 0.018 * idle;
    upper.rotation.x = 0.09 * amp;
  }
  function setCarrying(on) { carryTarget = on ? 1 : 0; }
  function setSitting(on) { sitTarget = on ? 1 : 0; }

  update(0, 0);
  return { group, carryAnchor, update, setCarrying, setSitting, look: l };
}

// ---------- looks ----------
const SHIRTS = [0xf26b5b, 0xf6c453, 0x2a9d8f, 0x5aa9e6, 0x9b8fd4, 0xf4a582, 0x8fd1b0, 0xf2e8d5, 0xe07a9a, 0xee8c3a];
const PANTS = [0x2f4858, 0x4a6fa5, 0xc2a878, 0x4a4f5a, 0x7a8450, 0x7a4f32];
const SKINS = [0xf6d3b3, 0xedb98a, 0xd99a6c, 0xb97a4f, 0x8d5a3b, 0x6b4228];
const HAIRS = [0x2b2118, 0x4a3222, 0x7a4f32, 0xc9a35a, 0xb5482f, 0x8a8f99, 0x3b4a6b];
const STYLES = ['short', 'short', 'long', 'bun', 'spiky', 'curly', 'bald'];
const HATS = ['none', 'none', 'none', 'none', 'none', 'beanie', 'cap'];

let pool = null;
function buildPool() {
  const rnd = mulberry32(20240607);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const out = [];
  for (let i = 0; i < 56; i++) {
    const shirt = pick(SHIRTS);
    let pants = pick(PANTS);
    const hat = pick(HATS);
    out.push({
      shirt, pants, skin: pick(SKINS), hair: pick(HAIRS), hairStyle: pick(STYLES),
      hat, hatColor: pick(SHIRTS), role: 'customer',
      stripe: rnd() < 0.3 ? pick(SHIRTS) : null,
    });
    if (out[i].stripe === shirt) out[i].stripe = null;
  }
  return out;
}

/** Varied but curated; drawn from a fixed pool so geometry stays shared. */
export function randomCustomerLook() {
  if (!pool) pool = buildPool();
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}
export function playerLook() {
  return {
    role: 'player', shirt: CREAM, pants: NAVY, skin: 0xedb98a, hair: 0x4a3222, hairStyle: 'short',
    hat: 'bandana', apron: P.wall,
  };
}
export function helperLook() {
  return {
    role: 'chef', shirt: 0xffffff, pants: 0x4a4f5a, skin: 0xd99a6c, hair: 0x2b2118, hairStyle: 'short',
    hat: 'chef', longSleeves: true, shoe: 0xe8e8e8,
  };
}
export function cashierLook() {
  return {
    role: 'cashier', shirt: CREAM, pants: 0x2f4858, skin: 0xb97a4f, hair: 0x2b2118, hairStyle: 'long',
    hat: 'cap', hatColor: P.teal, apron: P.teal,
  };
}
