// Shared flags that decide whether the joystick is enabled.
import { input } from '../core/input.js';
import { setPaused } from '../core/engine.js';

export const flags = { title: false, pause: false, complete: false };

export function refreshInput() {
  input.setEnabled(!(flags.title || flags.pause || flags.complete));
}
export function pauseGame(p) {
  flags.pause = p;
  setPaused(p);
  refreshInput();
}
