// Dev-only: ?uitest spawns sample labels, toasts and floating text once the PLAY button is pressed.
import * as THREE from 'three';
import { events } from '../core/events.js';
import { addCash, addGems, state } from '../core/state.js';
import { onUpdate } from '../core/engine.js';

export function run(ui) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  window.__ui = { ui, events, state, addCash, addGems };
  events.on('ui:play', () => {
    const price = ui.label({ kind: 'price', text: '$1.3K', worldPos: V(-1.5, 0.3, 1) });
    const price2 = ui.label({ kind: 'price', text: 950, worldPos: V(1.8, 0.3, 1.5) });
    ui.label({ kind: 'order', text: '2', worldPos: V(0, 2.2, -1) });
    const o2 = ui.label({ kind: 'order', text: '1/3', worldPos: V(2, 2.2, -0.5) });
    ui.label({ kind: 'max', text: 'MAX', worldPos: V(-2.2, 2.4, -1.5) });
    ui.label({ kind: 'info', text: 'No seats!', worldPos: V(0, 2.4, 2.5) });
    ui.label({ kind: 'station', text: '4', worldPos: V(-2.5, 1.6, 3) });
    const hidden = ui.label({ kind: 'info', text: 'hidden', worldPos: V(3, 2, 0) });
    hidden.setVisible(false);
    let p = 0;
    onUpdate((dt) => { p = (p + dt * 0.25) % 1; price.setProgress(p); price2.setProgress(1 - p); });
    ui.toast('New table!');
    ui.toast('New noodle pot!');
    ui.toast('Kitchen helper hired!');
    setInterval(() => {
      ui.floatText(V(-0.5, 1, 0), '+$24', 'cash');
      ui.floatText(V(0.8, 1, 0.4), '+3', 'gem');
      ui.floatText(V(0, 1, 1.4), '-$30', 'neg');
      ui.sfx(['pickup', 'drop', 'cash', 'coin', 'pay', 'serve', 'error'][Math.floor(Math.random() * 7)]);
    }, 1800);
    setTimeout(() => o2.setText('2/3'), 2500);
  });
}
