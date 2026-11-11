import { events } from '../core/events.js';
import { html } from './format.js';
import { ICON } from './icons.js';
import { unlockAudio, sfx } from './audio.js';
import { flags, refreshInput } from './uistate.js';

const BOWL = `
<svg class="title-bowl" viewBox="0 0 120 100" aria-hidden="true">
  <g class="steam" fill="none" stroke="#fff6e6" stroke-width="5" stroke-linecap="round" opacity=".85">
    <path class="s1" d="M40 38c-8-8 8-12 0-22"/><path class="s2" d="M60 36c-8-9 8-14 0-26"/><path class="s3" d="M80 38c-8-8 8-12 0-22"/>
  </g>
  <path d="M96 22 62 54" stroke="#f6c453" stroke-width="4.500" stroke-linecap="round"/><path d="M104 28 70 58" stroke="#f6c453" stroke-width="4.500" stroke-linecap="round"/>
  <path d="M10 52h100a50 44 0 0 1-100 0z" fill="#f26b5b" stroke="#1f3340" stroke-width="5" stroke-linejoin="round"/>
  <path d="M14 52c6-12 18-14 24-6 6-9 18-9 22 0 6-9 18-8 22 0 6-8 18-6 24 6z" fill="#f6c453" stroke="#1f3340" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="46" cy="47" r="6" fill="#fff6e6" stroke="#1f3340" stroke-width="3"/><circle cx="46" cy="47" r="2.500" fill="#f6c453"/>
  <path d="M40 94h40" stroke="#1f3340" stroke-width="5" stroke-linecap="round"/>
</svg>`;

export function buildTitle(root, hud) {
  const el = html(`
    <div class="title" data-ui>
      <div class="title-inner">
        ${BOWL}
        <h1 class="logo"><span class="l1">NOODLE</span><span class="l2">HARBOR</span></h1>
        <p class="tagline">Slurp, serve, and grow your harbor ramen empire!</p>
        <button class="btn play pressable pulse" data-ui>${ICON.play}<span>PLAY</span></button>
        <p class="how">Drag to move &middot; Stand on glowing pads to build</p>
      </div>
    </div>`);
  root.appendChild(el);
  flags.title = true; refreshInput();
  hud.setHidden(true);

  function play() {
    if (!flags.title) return;
    flags.title = false; refreshInput();
    unlockAudio(); sfx('unlock');
    el.classList.add('leaving');
    hud.setHidden(false);
    setTimeout(() => el.remove(), 600);
    events.emit('ui:play');
  }
  el.querySelector('.play').addEventListener('click', play);
  return {
    skip() {
      flags.title = false; refreshInput(); el.remove(); hud.setHidden(false);
    },
  };
}
