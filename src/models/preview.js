// Throwaway preview. ?view=row (default) | ?view=game&z=-2  (game camera over the full layout)
import * as THREE from 'three';
import { LAYOUT as L } from '../config.js';
import * as M from './index.js';
import { updateFx } from './fx.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'row';
const canvas = document.getElementById('pv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd8cb);
scene.fog = new THREE.Fog(0x9fd8cb, 38, 70);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a88f, 1.4));
const sun = new THREE.DirectionalLight(0xfff1dd, 2.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 120);

const updaters = [];
const walkers = [];

function addChar(look, x, z, { speed = 0, carry = false, bowls = 0 } = {}) {
  const c = M.createCharacter(look);
  c.group.position.set(x, 0, z);
  c.setCarrying(carry);
  for (let i = 0; i < bowls; i++) { const b = M.createBowl(); b.position.y = i * M.BOWL_H; c.carryAnchor.add(b); }
  scene.add(c.group);
  walkers.push({ c, speed });
  return c;
}

if (view === 'row') {
  const env = M.buildEnvironment(scene); updaters.push(env.update);
  const Y = 0;
  // floor patch under previews is already the street... put everything on a clean stage
  const stage = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshLambertMaterial({ color: 0xf3e6cf }));
  stage.rotation.x = -Math.PI / 2; stage.position.set(0, 0.02, 0); stage.receiveShadow = true; scene.add(stage);
  scene.remove(env.group);
  let x = -9;
  addChar(M.playerLook(), x, 3, { speed: 1 }); x += 1.5;
  addChar(M.playerLook(), x, 3, { speed: 0.5 }); x += 1.5;
  addChar(M.playerLook(), x, 3, { speed: 0, carry: true, bowls: 4 }); x += 1.5;
  addChar(M.helperLook(), x, 3, { speed: 1, carry: true, bowls: 2 }); x += 1.5;
  addChar(M.cashierLook(), x, 3, { speed: 0 }); x += 1.5;
  for (let i = 0; i < 7; i++) { addChar(M.randomCustomerLook(), x, 3, { speed: i % 3 === 0 ? 0 : 0.7 }); x += 1.3; }
  const seated = addChar(M.randomCustomerLook(), -9, 5.2, {}); seated.setSitting(true);
  // bowls + cash
  for (let i = 0; i < 4; i++) { const b = M.createBowl(); b.position.set(-9, i * M.BOWL_H, 0.5); scene.add(b); }
  for (let i = 0; i < 4; i++) { const b = M.createCashStack(); b.position.set(-7.5, i * M.CASH_H, 0.5); scene.add(b); }
  const st = M.createStation(); st.group.position.set(-4.5, 0, 0); scene.add(st.group);
  for (let i = 0; i < 4; i++) { const b = M.createBowl(); b.position.copy(st.bowlAnchor.position).add(st.group.position); b.position.y += i * M.BOWL_H; scene.add(b); }
  let p = 0; updaters.push((dt) => { p = (p + dt * 0.3) % 1.15; st.setCooking(Math.min(p, 1)); st.update(dt); });
  const ct = M.createCounter(4, 1, 1); ct.position.set(0.2, 0, 0); scene.add(ct);
  const rg = M.createRegister(); rg.position.set(0.9, 1, 0); scene.add(rg);
  const tea = M.createTeaMachine(); tea.position.set(-0.8, 1, 0); scene.add(tea);
  const tb = M.createTable(); tb.group.position.set(5, 0, 0); scene.add(tb.group);
  const tbowl = M.createBowl(); tbowl.position.copy(tb.topAnchor.position).add(tb.group.position); scene.add(tbowl);
  const up = M.createUnlockPad(); up.group.position.set(8, 0.02, -0.2); scene.add(up.group);
  let pp = 0; updaters.push((dt) => { pp = (pp + dt * 0.25) % 1.2; up.setProgress(Math.min(pp, 1)); up.update(dt); });
  const up2 = M.createUnlockPad(); up2.group.position.set(8, 0.02, 2.0); up2.setProgress(0.4); scene.add(up2.group); updaters.push(up2.update);
  const ug = M.createUpgradePad(); ug.group.position.set(10.5, 0.02, 0); scene.add(ug.group); updaters.push(ug.update);
  const zr = M.createZoneRing(1.1); zr.position.set(10.5, 0.03, 2.4); scene.add(zr);
  let pt = 0; updaters.push((dt) => { pt += dt; if (pt > 1.5) { pt = 0; M.poof(scene, new THREE.Vector3(9.5, 0.2, 4.5), 0xf6c453); } });
  camera.fov = 45;
  const cx = +(q.get('cx') || 0);
  camera.position.set(cx, 8, 13); camera.lookAt(cx, 0.5, 1);
  sun.position.set(-8, 18, 10);
} else {
  const env = M.buildEnvironment(scene); updaters.push(env.update);
  const zt = +(q.get('z') || -2);
  const xt = +(q.get('x') || 0);
  const stations = L.stations.map((s) => { const st = M.createStation(); st.group.position.set(s.x, 0, s.z); scene.add(st.group); updaters.push(st.update); st.setCooking(0.6); for (let i = 0; i < 4; i++) { const b = M.createBowl(); b.position.set(s.x, 0.95 + i * M.BOWL_H, s.z + 0.725); scene.add(b); } return st; });
  const c = L.counter;
  const ct = M.createCounter(c.maxX - c.minX, c.depth, c.height); ct.position.set((c.minX + c.maxX) / 2, 0, c.z); scene.add(ct);
  const rg = M.createRegister(); rg.position.set(L.register.x, c.height, L.register.z); scene.add(rg);
  const tea = M.createTeaMachine(); tea.position.set(L.teaMachine.x, c.height, L.teaMachine.z); scene.add(tea);
  for (let i = 0; i < 6; i++) { const b = M.createBowl(); b.position.set(L.counterStock.x + (i % 2) * 0.5, c.height + Math.floor(i / 2) * M.BOWL_H, L.counterStock.z); scene.add(b); }
  L.tables.forEach((t, i) => { if (i > 3) return; const tb = M.createTable(); tb.group.position.set(t.x, 0, t.z); scene.add(tb.group); });
  [4, 5].forEach((i) => { const t = L.tables[i]; const pad = M.createUnlockPad(); pad.group.position.set(t.x, 0.02, t.z); pad.setProgress(i === 4 ? 0.5 : 0); scene.add(pad.group); updaters.push(pad.update); });
  const ug = M.createUpgradePad(); ug.group.position.set(L.upgradePad.x, 0.02, L.upgradePad.z); scene.add(ug.group); updaters.push(ug.update);
  const pl = addChar(M.playerLook(), L.playerStart.x, L.playerStart.z, { speed: 1, carry: true, bowls: 3 });
  addChar(M.helperLook(), L.helperIdle[0].x, L.helperIdle[0].z, { speed: 0 });
  addChar(M.cashierLook(), L.cashierSpot.x, L.cashierSpot.z, { speed: 0 });
  for (let i = 0; i < 5; i++) addChar(M.randomCustomerLook(), L.queueStart.x, L.queueStart.z + i * L.queueSpacing, { speed: 0 });
  const zr = M.createZoneRing(1.1); zr.position.set(L.stations[0].x, 0.03, L.stations[0].z + 1.4); scene.add(zr);
  const cs = M.createCashStack(); cs.position.set(L.registerCashPile.x, 0, L.registerCashPile.z); scene.add(cs);
  camera.position.set(xt, 20, zt + 13.5);
  camera.lookAt(xt, 0, zt - 1.2);
  sun.position.set(xt - 8, 18, zt + 10); sun.target.position.set(xt, 0, zt);
  camera.fov = +(q.get('fov') || 40);
}

function resize() {
  const w = view === 'game' ? Math.min(innerWidth, Math.round(innerHeight * 0.5625)) : innerWidth;
  renderer.setSize(w, innerHeight);
  camera.aspect = w / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  for (const u of updaters) u(dt);
  for (const w of walkers) w.c.update(dt, w.speed);
  updateFx(dt);
  renderer.render(scene, camera);
}
frame();
