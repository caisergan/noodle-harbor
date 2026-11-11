# Noodle Harbor: design + module contracts

An original idle restaurant game (three.js + Vite, portrait mobile). You run a harbor-side ramen bar.
Core loop: walk with a floating joystick → pick up noodle bowls from pots in the kitchen → drop them on the
counter → customers queue, get served, pay at the register, sit at a table, eat, leave a tip on the table →
walk over cash to collect it → stand on yellow pay-pads to unlock tables, pots and staff → buy upgrades.

Art direction (our own, NOT a copy of any existing game): chunky voxel / low-poly blocky style, soft
shadows, warm cream wood plank floor in the dining room, pale blue-grey tiles in the kitchen, deep navy-teal walls
with a coral trim, mustard accents, sea-glass green ground outside with a harbor: water, a little wooden pier,
bollards, a lamp post or two, a street with a sidewalk at the bottom. Palette lives in `src/config.js` `PALETTE`.
Typography/UI: rounded, chunky, playful (font: "Fredoka" via Google Fonts or a system fallback), navy + cream + coral.

Run: `npm run dev` → http://localhost:5180

## Ownership: do NOT edit files you don't own
| Area | Files | Owner |
|---|---|---|
| Core (engine, input, state, events, config) | `src/core/*`, `src/config.js`, `src/main.js`, `index.html` | lead (ask; don't edit) |
| 3D models + environment | `src/models/*` | models agent |
| HUD, panels, labels, audio | `src/ui/*` (incl. `ui.css`) | UI agent |
| Gameplay systems | `src/game/*` | gameplay agent |

If you need a change in someone else's file, put a note in your final report instead of editing it.

## Core API (already written; read the files)
- `core/engine.js`: `scene`, `camera`, `renderer`, `root` (#game-root), `onUpdate(fn(dt, t))`, `follow(obj3d)`,
  `worldToScreen(vec3) -> {x,y,visible}` (CSS px relative to #game-root), `setPaused(bool)`, `paused`, `start()`.
- `core/input.js`: `input.vector -> {x, z, mag}` (world-space direction, mag 0..1), `input.setEnabled(bool)`.
  Creates `.joy-base > .joy-knob` DOM elements (UI agent styles them; `.joy-base.active` while touching).
  Any element with a `data-ui` attribute (or inside one) does not start the joystick, so put `data-ui` on all buttons/panels.
- `core/events.js`: `events.on(name, fn) -> off`, `events.emit(name, payload)`.
- `core/state.js`: `state`, `load/save/resetSave`, `addCash(n, worldPos?)`, `trySpend(n)`, `addGems(n)`,
  `isUnlocked(id)`, `markUnlocked(id)`, `unlockPrice(u)`, `progress()`, `upgradeValue(key)`, `upgradeCost(key)`,
  `buyUpgrade(key)`, `activateBoost('income'|'speed')`, `incomeBoostActive()`, `speedBoostActive()`,
  `restaurantMult()`, `restaurantName()`, `nextRestaurant()`.
- `config.js`: `PALETTE`, `LAYOUT`, `UNLOCKS`, `VISIBLE_PADS`, `ECONOMY`, `PLAYER`, `UPGRADES`, `BOOSTS`, `RESTAURANT_NAMES`.

### Events
Emitted by core/state: `cash:changed {cash, delta, worldPos?}`, `gems:changed {gems, delta}`,
`progress:changed {done,total,name,level}`, `upgrades:changed`, `boosts:changed`, `restaurant:changed`.
Emitted by gameplay: `toast {text}`, `customer:served {count}`, `unlock {id, label}`, `upgradepad:enter`,
`upgradepad:exit`, `restaurant:complete`, `game:started`.
Emitted by UI: `ui:ready`, `ui:play` (PLAY pressed on title screen; gameplay starts spawning customers then),
`ui:nextRestaurant` (player confirmed moving on).

## Models API: `src/models/index.js` (models agent)
All factories return fresh objects. Origins at floor level (y=0), objects face +z (towards camera) by default.
Everything should `castShadow`/`receiveShadow` sensibly. Merge geometry / share materials where cheap; target
60 fps on a phone with ~40 characters on screen.
- `BOWL_H` (number): vertical spacing for stacking bowls. `CASH_H`: vertical spacing for stacking cash bundles.
- `createCharacter(look) -> { group, carryAnchor, update(dt, speed01), setCarrying(bool) }`
  Blocky voxel person ~1.5 tall. `update` animates walk (legs/arms swing scaled by speed01, slight bob; idle
  breathing when 0). `setCarrying(true)` puts both arms forward (holding a stack). `carryAnchor` is an Object3D in
  front of the chest at hand height; gameplay parents the bowl stack to it.
- `randomCustomerLook()`, `playerLook()`, `helperLook()` (chef hat + white jacket), `cashierLook()` (teal apron, cap)
  return `look` objects for `createCharacter`.
- `createBowl()`: ramen bowl with noodles, egg half and green onion, ~0.5 wide.
- `createCashStack()`: green banknote bundle with a band, ~0.42×CASH_H×0.26.
- `createStation() -> { group, bowlAnchor, setCooking(progress01), update(dt) }`: a stove with a big
  noodle pot, ~1.6 wide × 1.0 deep. Steam puffs animate in `update`; `setCooking` drives a small progress ring/bar
  on the front. `bowlAnchor` is where finished bowls stack (front ledge or a side shelf, in local space).
- `createCounter(width, depth, height) -> Group`: serving counter (wood front panels, light top).
- `createRegister() -> Group`: cash register that sits ON the counter (origin at its bottom).
- `createTable() -> { group, topAnchor, seatHeight }`: square table with 2 chairs at local x = ±1.0 facing the
  table. `topAnchor` = table-top centre (gameplay places bowls / cash there).
- `createUnlockPad() -> { group, setProgress(0..1), update(dt) }`: 1.6×1.6 flat pad on the floor: navy base,
  dashed/rounded mustard border, fill that grows with progress, gentle pulse in `update`. (The price text is an
  HTML label made by UI.)
- `createUpgradePad() -> { group, update(dt) }`: distinct pad (teal, arrow-up icon made of boxes) ~1.4×1.4.
- `createZoneRing(radius) -> Mesh`: flat translucent rounded ring on the floor marking interaction zones.
- `createTeaMachine() -> Group`: small tea urn/machine sitting on the counter.
- `buildEnvironment(scene) -> { update(dt) }`: floors (dining planks inside the walls, kitchen tiles for
  z < counter.z), the 4 outer walls (with the entrance gap in the front wall and a small entrance arch with a sign
  reading "NOODLE HARBOR" made of a canvas texture), wall decorations (windows, lanterns, menu board on the back
  wall), outside ground, street + sidewalk along `LAYOUT.street.z`, harbor water + pier + boats bobbing off to the
  sides, a few plants/benches. Must NOT block the walkable interior or the queue/aisle. Use `LAYOUT` for all
  positions.
- `poof(scene, position, color)`: quick particle burst (cubes that pop out and shrink) for unlocks/coins.

## UI API: `src/ui/index.js` (UI agent)
`initUI()` builds everything inside `#ui` (absolutely positioned over the canvas, `pointer-events: none` except
interactive elements, which also carry `data-ui`). Export a `ui` object:
- `ui.label({ text, kind, worldPos }) -> { setText(str), setPos(vec3), setVisible(bool), setProgress(0..1), remove() }`
  World-anchored HTML label, repositioned every frame via `worldToScreen`. kinds:
  `'price'` (pay-pad price "$1.3K" with an icon/progress), `'order'` (speech bubble over a customer: "2" with a
  bowl icon, or "1/3" while being served), `'max'` ("MAX" over the player when full), `'info'` (small grey text,
  e.g. "No seats!"), `'station'` (small count over a pot).
- `ui.toast(text)`: big centred banner that pops in and fades ("New table!").
- `ui.floatText(worldPos, text, kind)`: rising number like "+$24" (`kind`: 'cash' | 'gem' | 'neg').
- `ui.sfx(name)`: WebAudio-synthesised sounds (no audio files): `pickup`, `drop`, `cash`, `coin`, `unlock`,
  `pay` (short ticking while paying a pad), `click`, `serve`, `upgrade`, `error`. Respect a mute toggle; unlock audio
  context on first pointerdown.
- `ui.openUpgrades()` / `ui.closeUpgrades()`: upgrades sheet (4 rows from `UPGRADES`, level, cost, buy button
  using `buyUpgrade`). Opened automatically on `upgradepad:enter`, closed on `upgradepad:exit` too.
- `ui.showRestaurantComplete(onNext)`: celebration modal; button calls `onNext` and emits `ui:nextRestaurant`.
HUD: top-left pause button + cash pill (abbreviated: 950, 1.2K, 3.4M), top-right gems pill, top-centre card with
restaurant name + progress bar "done/total". Right column: "2× Income" and "Speed" boost buttons with
countdown/cooldown (call `activateBoost`, show remaining time). Left column: "Missions" (simple daily missions
panel: serve 20 customers, collect $500, unlock 2 things → gem rewards; track via events + `state.stats`) and
"Shop" (spend gems: +cash packs scaled by `restaurantMult()`, instant boosts). Pause menu (resume, mute toggle,
reset save). Title screen with game logo "NOODLE HARBOR" (CSS styled), big PLAY button, a gentle animated
background over the live 3D scene; PLAY emits `ui:play`. Style `.joy-base` / `.joy-knob`.

## Gameplay: `src/game/*` (gameplay agent)
`initGame()` in `src/game/index.js`: build environment, place stations/counter/register/tables/pads per LAYOUT
and unlock state, create player (`follow(player.group)`), register systems via `onUpdate`. Customers only start
spawning after `ui:play` (or immediately if `state.tutorialDone`). Systems:
1. **Player**: moves with `input.vector`, speed `PLAYER.speed * upgradeValue('speed') * (speedBoost ? 1.5 : 1)`,
   turns smoothly to face movement, collides (circle vs AABB push-out) with counter, stations, tables, tea
   machine, walls (bounds) and can't walk through the counter except via the gap. Carry stack of bowls on
   `carryAnchor` (capacity `PLAYER.carryBase + upgradeValue('capacity')`), shows 'max' label when full.
2. **Stations**: each unlocked station cooks a bowl every `ECONOMY.cookTime * upgradeValue('cook')` seconds up to
   `ECONOMY.stationMax`, stacked on `bowlAnchor`. Player (or helper) in the pickup zone (`station.z +
   stationPickupOffsetZ`, radius ~1.1, zone ring visible) takes one bowl every `pickupInterval` until full. Bowls
   fly in an arc between stacks (short tweens), never teleport.
3. **Counter**: standing in `serveSpot` drops carried bowls one by one onto the counter stock (max `counterMax`,
   stacked in a 2-wide grid at `counterStock`).
4. **Customers**: spawn on the street (left/right), walk to the entrance then join the queue (`queueStart`,
   spacing, max `queueMax`). The front customer wants N bowls (orderMin..orderMax, max grows +1 per 4 unlocks,
   cap 5) shown via an 'order' label. Serving happens when someone is at the register (player within serveSpot
   radius, or a hired cashier) AND the counter has bowls AND a free seat exists (reserve it): one bowl per
   `serveInterval` moves counter → customer's hands; when the order is complete the customer pays
   `N * bowlPrice * upgradeValue('price') * restaurantMult() * (tea ? 1+teaBonus : 1) * (incomeBoost ? 2 : 1)`
   into the register cash pile, then walks to the reserved seat, sits (lower y to seatHeight, face table), puts
   bowls on the table, eats (`eatTime`, bowls shrink away), leaves a tip cash pile on the table
   (`tipFraction` of the order) and walks out to the street and despawns. If no seat is free, show 'No seats!'
   over the queue front. The queue shuffles forward smoothly. Customers walk via simple waypoints (entrance → aisle
   → queue; seat → aisle → entrance) so they don't cut through tables.
5. **Cash piles**: visual stacks of `createCashStack()` (grid, e.g. 2×3 per layer, grows upward; cap visuals but
   track the full amount). Walking within ~1.1 of a pile collects it all: bundles fly to the player and vanish,
   `addCash(amount, pos)`, `ui.floatText`, `ui.sfx('cash')`.
6. **Pay-pads**: show pads for the next `VISIBLE_PADS` locked entries in `UNLOCKS` with a 'price' label. While the
   player stands on a pad with cash > 0, drain cash into it over ~`padDrainTime` (needs `trySpend` in small
   chunks; partial payment persists in memory), `ui.sfx('pay')` ticking. When fully paid: `markUnlocked`, spawn the
   object with a pop-in scale animation + `poof`, `ui.toast(label)`, `ui.sfx('unlock')`, emit `unlock`. After the
   last unlock emit `restaurant:complete` and call `ui.showRestaurantComplete(() => nextRestaurant() + rebuild)`.
7. **Helpers**: kitchen helpers (chef look) loop: pick the station with most bowls → walk to its pickup zone →
   take up to 4 → walk to `helperDropSpot` → drop onto the counter → repeat; idle at `helperIdle` if nothing to do.
   Cashier stands at `cashierSpot` and counts as "someone at the register".
8. **Upgrade pad** at `LAYOUT.upgradePad`: emit `upgradepad:enter` / `upgradepad:exit` when the player steps
   on/off.
Keep each system in its own file (`player.js`, `stations.js`, `counter.js`, `customers.js`, `cash.js`, `pads.js`,
`helpers.js`, `world.js`, `collision.js`, `tween.js`), wire them in `index.js`.
