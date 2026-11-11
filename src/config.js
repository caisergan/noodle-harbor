// Single source of truth for layout, palette and economy.
// World units ~ metres. +x = screen right, +z = towards the camera (screen bottom), +y = up.
// The kitchen is at the back (negative z), the dining room in the middle, the street at the bottom.

export const PALETTE = {
  floorA: 0xf3e6cf,     // cream wood plank
  floorB: 0xe8d5b5,     // darker plank
  kitchenA: 0xdfe7ea,   // kitchen tile light
  kitchenB: 0xc9d6db,   // kitchen tile dark
  wall: 0x2f4858,       // deep navy-teal walls
  wallTrim: 0xf26b5b,   // coral trim
  accent: 0xf6c453,     // mustard
  teal: 0x2a9d8f,
  outside: 0x7cc6b3,    // sea-glass green ground outside
  water: 0x3a86c8,
  street: 0x5b5f6b,
  sidewalk: 0xcfc8bd,
  wood: 0xb07a4f,
  woodDark: 0x7a4f32,
  cash: 0x5fbf6a,
  cashDark: 0x3c8c46,
  padFill: 0xf6c453,
  padBase: 0x2f4858,
};

export const LAYOUT = {
  // Walkable interior rectangle (player is clamped to this).
  bounds: { minX: -6.6, maxX: 6.6, minZ: -10.6, maxZ: 6.6 },
  // Outer walls sit just outside bounds.
  walls: { minX: -7.2, maxX: 7.2, minZ: -11.2, maxZ: 7.2, height: 2.2, thickness: 0.4 },
  // Gap in the front wall (customers enter here).
  entrance: { x: 0, z: 7.2, width: 3 },
  // Street outside, customers spawn at its ends.
  street: { z: 11, spawnLeft: { x: -16, z: 11 }, spawnRight: { x: 16, z: 11 } },

  // Noodle stoves along the back wall. Index 0 is unlocked from the start.
  stations: [
    { x: -1.4, z: -9.8 },
    { x: 1.4, z: -9.8 },
    { x: -4.2, z: -9.8 },
  ],
  // Where the player/helpers stand to pick up from a station: station.x, station.z + 1.4
  stationPickupOffsetZ: 1.4,

  // Serving counter splits kitchen (z < -5.5) from dining (z > -5.5).
  // Counter spans x from -6.6 to 3.0; the walkway gap between kitchen and dining is x 3.0..6.6.
  counter: { minX: -6.6, maxX: 3.0, z: -5.5, depth: 1.0, height: 1.0 },
  // Bowls waiting on the counter are stacked here (on top of the counter).
  counterStock: { x: -1.2, z: -5.5 },
  // Register on the counter.
  register: { x: 0.6, z: -5.5 },
  // Kitchen-side spot behind the register: standing here drops carried bowls onto the counter
  // AND serves the front customer.
  serveSpot: { x: 0.0, z: -6.7, radius: 1.2 },
  // Spots for staff
  cashierSpot: { x: 0.9, z: -6.6 },
  helperDropSpot: { x: -1.6, z: -6.6 },
  // Customer queue on the dining side, front of queue first, then going +z.
  queueStart: { x: 0.4, z: -4.3 },
  queueSpacing: 0.95,
  queueMax: 7,
  // Cash customers pay at the register lands here (dining side, near the gap).
  registerCashPile: { x: 2.1, z: -4.0 },

  // Tables (each has 2 seats at table.x - 1.0 and table.x + 1.0, facing the table).
  tables: [
    { x: -4.3, z: -2.2 },
    { x: 4.3, z: -1.4 },
    { x: -4.3, z: 1.4 },
    { x: 4.3, z: 2.0 },
    { x: -4.3, z: 4.8 },
    { x: 4.3, z: 5.2 },
  ],
  seatOffsetX: 1.0,

  // Stepping on this opens the upgrades panel.
  upgradePad: { x: -2.6, z: -3.4 },
  // Optional tea machine (unlock #11) – sits on the counter's left end.
  teaMachine: { x: -5.4, z: -5.5 },
  // Kitchen helper idle spots
  helperIdle: [{ x: -5.5, z: -7.5 }, { x: 5.5, z: -8.0 }],

  // Player spawn
  playerStart: { x: 0, z: -2 },
};

// Ordered unlocks for one restaurant. Only the next 2 not-yet-unlocked entries show their pad.
// type: 'table' | 'station' | 'helper' | 'cashier' | 'tea'
// pad: where the pay pad appears (defaults to the thing's own position).
export const UNLOCKS = [
  { id: 'table1', type: 'table', index: 1, price: 30, label: 'New table!' },
  { id: 'station1', type: 'station', index: 1, price: 90, label: 'New noodle pot!' },
  { id: 'table2', type: 'table', index: 2, price: 160, label: 'New table!' },
  { id: 'helper0', type: 'helper', index: 0, price: 280, label: 'Kitchen helper hired!', pad: { x: 4.8, z: -8.4 } },
  { id: 'table3', type: 'table', index: 3, price: 420, label: 'New table!' },
  { id: 'station2', type: 'station', index: 2, price: 650, label: 'New noodle pot!' },
  { id: 'cashier', type: 'cashier', index: 0, price: 900, label: 'Cashier hired!', pad: { x: 2.2, z: -7.4 } },
  { id: 'table4', type: 'table', index: 4, price: 1300, label: 'New table!' },
  { id: 'table5', type: 'table', index: 5, price: 1800, label: 'New table!' },
  { id: 'helper1', type: 'helper', index: 1, price: 2500, label: 'Second helper hired!', pad: { x: 4.8, z: -8.4 } },
  { id: 'tea', type: 'tea', index: 0, price: 3600, label: 'Tea machine! Orders worth more', pad: { x: -5.2, z: -3.6 } },
];
export const VISIBLE_PADS = 2;

export const ECONOMY = {
  startCash: 20,
  bowlPrice: 6,            // per bowl, before multipliers
  teaBonus: 0.5,           // +50% per order once tea machine is unlocked
  tipFraction: 0.35,       // left on the table after eating, fraction of order value
  orderMin: 1,
  orderMax: 3,             // grows +1 per 4 unlocks, capped at 5
  cookTime: 3.0,           // seconds per bowl per station (before upgrades)
  stationMax: 6,           // bowls a station can hold
  counterMax: 14,
  pickupInterval: 0.12,    // seconds between single-bowl transfers
  serveInterval: 0.22,
  eatTime: 4.5,
  spawnInterval: 2.6,      // seconds between customer spawns (when there is room)
  padDrainTime: 1.4,       // seconds to fully pay a pad if you have enough cash
  restaurantMultiplier: 3, // prices and income ×3 per completed restaurant
};

export const PLAYER = {
  speed: 4.6,
  radius: 0.35,
  carryBase: 3,
};

export const UPGRADES = {
  // level 0 is the base. cost(level) = base * growth^level
  speed:    { label: 'Move speed',    base: 60,  growth: 1.9, max: 8, per: 0.08 },  // +8% per level
  capacity: { label: 'Carry capacity', base: 80, growth: 2.0, max: 8, per: 1 },     // +1 bowl per level
  cook:     { label: 'Cooking speed', base: 100, growth: 1.9, max: 8, per: 0.12 },  // -12% cook time (multiplicative)
  price:    { label: 'Noodle price',  base: 150, growth: 2.1, max: 8, per: 0.2 },   // +20% price per level
};

export const BOOSTS = {
  income: { label: '2× Income', duration: 180, cooldown: 300 },
  speed: { label: 'Speed', duration: 90, cooldown: 240 },
};

export const RESTAURANT_NAMES = ['Harbor Noodles', 'Pier 9 Ramen', 'Lighthouse Udon', 'Tidewater Pho'];
