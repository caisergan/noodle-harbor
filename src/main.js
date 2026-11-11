import { start } from './core/engine.js';
import { load } from './core/state.js';
import { initUI } from './ui/index.js';
import { initGame } from './game/index.js';

load();
initUI();       // HUD, labels, panels, title screen, audio
initGame();     // world + gameplay systems
start();
