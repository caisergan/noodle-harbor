// Inline SVG icons (24x24 viewBox). No external images.
const S = (body, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const N = '#2f4858';

export const ICON = {
  cash: S(`<rect x="2" y="6" width="20" height="12" rx="3" fill="#5fbf6a" stroke="${N}" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="#c9f2cd" stroke="${N}" stroke-width="1.5"/><circle cx="5.8" cy="12" r="1" fill="${N}"/><circle cx="18.2" cy="12" r="1" fill="${N}"/>`),
  gem: S(`<path d="M6 3h12l4 6-10 12L2 9z" fill="#5fd6c6" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6" fill="none" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 9l2-6h6l2 6z" fill="#b9f5ec" opacity=".8"/>`),
  bowl: S(`<path d="M7 5c-1 1.2 1 2 0 3.2M12 4c-1 1.2 1 2 0 3.2M17 5c-1 1.2 1 2 0 3.2" fill="none" stroke="#9aa9b2" stroke-width="1.4" stroke-linecap="round"/><path d="M2.5 11h19a9.5 9 0 0 1-19 0z" fill="#f26b5b" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 11c1-2 3-2.4 4-1.2 1-1.4 3-1.4 4 0 1-1.4 3-1.2 4 0 1-1 3-.6 4 1.2z" fill="#f6c453" stroke="${N}" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 20.5h6" stroke="${N}" stroke-width="1.8" stroke-linecap="round"/>`),
  pause: S(`<rect x="5.5" y="4.5" width="4.6" height="15" rx="2" fill="${N}"/><rect x="13.9" y="4.5" width="4.6" height="15" rx="2" fill="${N}"/>`),
  play: S(`<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor"/>`),
  gear: S(`<circle cx="12" cy="12" r="7.4" fill="none" stroke="${N}" stroke-width="3.6" stroke-dasharray="3.4 2.9"/><circle cx="12" cy="12" r="6.2" fill="${N}"/><circle cx="12" cy="12" r="2.5" fill="#fff6e6"/>`),
  bolt: S(`<path d="M13.5 2 5 13.5h5.5L9.5 22 19 9.8h-5.7z" fill="#f6c453" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/>`),
  x2: S(`<rect x="2" y="3" width="20" height="18" rx="5" fill="#f26b5b" stroke="${N}" stroke-width="1.8"/><text x="12" y="16.6" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-weight="700" font-size="12.5" fill="#fff6e6">x2</text>`),
  clipboard: S(`<rect x="4.5" y="4.5" width="15" height="17" rx="3" fill="#fff6e6" stroke="${N}" stroke-width="1.8"/><rect x="8.5" y="2.5" width="7" height="4.2" rx="1.6" fill="#f6c453" stroke="${N}" stroke-width="1.6"/><path d="M8 11.5h8M8 15h8M8 18.2h5" stroke="${N}" stroke-width="1.6" stroke-linecap="round"/>`),
  bag: S(`<path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" fill="none" stroke="${N}" stroke-width="1.9" stroke-linecap="round"/><path d="M4.5 8h15l1 12a1.5 1.5 0 0 1-1.5 1.6H5A1.5 1.5 0 0 1 3.500 20z" fill="#2a9d8f" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="12" r="1.1" fill="#fff6e6"/><circle cx="15" cy="12" r="1.1" fill="#fff6e6"/>`),
  x: S(`<path d="M6 6l12 12M18 6 6 18" stroke="${N}" stroke-width="3.4" stroke-linecap="round"/>`),
  check: S(`<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff6e6" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`),
  arrowUp: S(`<path d="M12 20V6M6 11.5 12 5.500l6 6" fill="none" stroke="#fff6e6" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`),
  sound: S(`<path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="${N}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><path d="M15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11" fill="none" stroke="${N}" stroke-width="1.8" stroke-linecap="round"/>`),
  mute: S(`<path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="${N}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 9.500l5 5M21 9.500l-5 5" fill="none" stroke="#f26b5b" stroke-width="2" stroke-linecap="round"/>`),
  star: S(`<path d="M12 2.500l2.900 6 6.500.8-4.800 4.500 1.300 6.500L12 17l-5.900 3.300 1.300-6.500L2.600 9.300l6.500-.8z" fill="#f6c453" stroke="${N}" stroke-width="1.6" stroke-linejoin="round"/>`),
  // upgrade icons
  speed: S(`<path d="M3 16l4-4 3 2 5-6 6 4" fill="none" stroke="${N}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 20h18" stroke="${N}" stroke-width="2.4" stroke-linecap="round"/>`),
  capacity: S(`<ellipse cx="12" cy="17" rx="8" ry="3.2" fill="#f26b5b" stroke="${N}" stroke-width="1.7"/><ellipse cx="12" cy="11.500" rx="8" ry="3.2" fill="#f6c453" stroke="${N}" stroke-width="1.7"/><ellipse cx="12" cy="6.500" rx="8" ry="3.2" fill="#fff6e6" stroke="${N}" stroke-width="1.7"/>`),
  cook: S(`<path d="M12 2.500c3 3.500 5.500 6 5.500 10a5.500 5.500 0 0 1-11 0c0-2 1-3.500 2-4.500 0 1.500.7 2.500 1.700 2.500C10 8.500 11 6 12 2.500z" fill="#f26b5b" stroke="${N}" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 21a3 3 0 0 1-3-3c0-1.600 1.500-2.600 3-4.500 1.500 1.900 3 2.900 3 4.500a3 3 0 0 1-3 3z" fill="#f6c453"/>`),
  price: S(`<circle cx="12" cy="12" r="9.200" fill="#f6c453" stroke="${N}" stroke-width="1.8"/><text x="12" y="16.800" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-weight="700" font-size="13" fill="${N}">$</text>`),
};
