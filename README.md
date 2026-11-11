# Noodle Harbor

An idle restaurant game in three.js (portrait / mobile-first). Cook ramen, carry bowls to the counter,
serve the queue, collect cash, unlock tables, pots and staff, buy upgrades, then move on to the next restaurant.

```bash
npm install
npm run dev        # http://localhost:5180 (also on your LAN, so you can open it on a phone)
npm run build      # static build in dist/
```

Controls: drag anywhere for the floating joystick (touch or mouse), or WASD / arrow keys.

Debug: `?autoplay` skips the title; `window.__game` has `teleport(x,z)`, `giveCash(n)`, `player`, `customers`…;
`?uitest` spawns sample UI; `/src/models/preview.html` shows every model.
Layout, prices and balance all live in `src/config.js`. Architecture and module contracts: `CONTRACTS.md`.
