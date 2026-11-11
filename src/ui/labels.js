// Pooled world-anchored HTML labels + floating texts. All positions are updated in ONE onUpdate callback.
import * as THREE from 'three';
import { onUpdate, worldToScreen } from '../core/engine.js';
import { ICON } from './icons.js';
import { fmt, html } from './format.js';

let layer = null, floatLayer = null;
const active = new Set();
const pools = {};   // kind -> [label]
const _p = new THREE.Vector3();

function ensureLayers() {
  if (layer) return;
  const ui = document.getElementById('ui');
  layer = html('<div class="layer labels"></div>');
  floatLayer = html('<div class="layer floats"></div>');
  ui.append(layer, floatLayer);
  onUpdate(update);
}

const ANCHOR = {
  price: 'translate(-50%,-50%)',
  order: 'translate(-50%,-100%)',
  max: 'translate(-50%,-100%)',
  info: 'translate(-50%,-100%)',
  station: 'translate(-50%,-100%)',
};

function build(kind) {
  switch (kind) {
    case 'price':
      return html(`<div class="wl wl-price"><div class="pill">${ICON.cash}<b></b></div><div class="bar"><i></i></div></div>`);
    case 'order':
      return html(`<div class="wl wl-order"><div class="bubble">${ICON.bowl}<b></b></div></div>`);
    case 'max':
      return html('<div class="wl wl-max"><b>MAX</b></div>');
    case 'station':
      return html(`<div class="wl wl-station"><div class="pill">${ICON.bowl}<b></b></div></div>`);
    default:
      return html('<div class="wl wl-info"><b></b></div>');
  }
}

function makeLabel(kind) {
  const el = build(kind);
  const txt = el.querySelector('b');
  const bar = el.querySelector('.bar i');
  const L = {
    kind, el, txt, bar, anchor: ANCHOR[kind] || ANCHOR.info,
    pos: new THREE.Vector3(), has: false, wantVisible: true, shown: false,
    lx: NaN, ly: NaN, text: null, prog: -1,
    setText(s) {
      if (typeof s === 'number') s = kind === 'price' ? '$' + fmt(s) : String(s);
      s = String(s ?? '');
      if (s === L.text) return L;
      L.text = s;
      if (kind === 'max') return L;
      txt.textContent = s;
      return L;
    },
    setPos(v) { if (v) { L.pos.set(v.x, v.y, v.z); L.has = true; } return L; },
    setVisible(b) { L.wantVisible = !!b; if (!b) L.hide(); return L; },
    setProgress(p) {
      if (!bar) return L;
      p = Math.max(0, Math.min(1, p || 0));
      if (Math.abs(p - L.prog) < 0.002) return L;
      L.prog = p;
      bar.style.transform = `scaleX(${p})`;
      return L;
    },
    hide() { if (L.shown) { L.shown = false; el.classList.remove('on'); } },
    remove() {
      if (!active.delete(L)) return;
      L.hide();
      L.lx = L.ly = NaN; L.has = false; L.text = null; L.prog = -1;
      if (bar) bar.style.transform = 'scaleX(0)';
      pools[kind].push(L);
    },
  };
  layer.appendChild(el);
  return L;
}

export function label(opts = {}) {
  ensureLayers();
  const kind = opts.kind || 'info';
  const pool = (pools[kind] ||= []);
  const L = pool.pop() || makeLabel(kind);
  L.wantVisible = true;
  L.setText(opts.text ?? '');
  if (opts.worldPos) L.setPos(opts.worldPos);
  L.setProgress(0);
  active.add(L);
  return L;
}

function update() {
  for (const L of active) {
    if (!L.wantVisible || !L.has) continue;
    const s = worldToScreen(L.pos);
    if (!s.visible) { L.hide(); continue; }
    const x = Math.round(s.x * 10) / 10, y = Math.round(s.y * 10) / 10;
    if (x !== L.lx || y !== L.ly) {
      L.lx = x; L.ly = y;
      L.el.style.transform = `translate3d(${x}px,${y}px,0) ${L.anchor}`;
    }
    if (!L.shown) { L.shown = true; L.el.classList.add('on'); }
  }
}

// ---- floating texts ----
const floatPool = [];
export function floatText(worldPos, text, kind = 'cash') {
  ensureLayers();
  if (!worldPos) return;
  const s = worldToScreen(_p.set(worldPos.x, worldPos.y, worldPos.z));
  if (!s.visible) return;
  let el = floatPool.pop();
  if (!el) {
    el = html('<div class="ft"><span></span></div>');
    el.addEventListener('animationend', () => { el.classList.remove('go'); el.remove(); floatPool.push(el); });
  }
  const span = el.firstChild;
  span.className = 'ft-' + kind;
  span.textContent = text;
  el.style.transform = `translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,0) translate(-50%,-50%)`;
  floatLayer.appendChild(el);
  el.classList.remove('go');
  void el.offsetWidth;   // restart animation (rare, once per spawn)
  el.classList.add('go');
}
