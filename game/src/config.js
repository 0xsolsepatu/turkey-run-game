// Shared constants for Tilly's Great Escape: canvas, physics, stages, palette.
// One job: numbers and names. Nothing here draws or updates.
export const VIEW = { width: 1280, height: 720 };
export const GROUND_Y = 600;
export const STEP = 1 / 60;
export const ESCAPE_DISTANCE_M = 1000;
export const PX_PER_M = 50;

export const PLAYER = {
  x: 320,
  width: 64,
  height: 76,
  slideHeight: 42,
  jumpVelocity: -980,
  gravity: 2600,
  runCycle: 0.11,
};

export const FARMER = {
  startGapM: 42,
  maxGapM: 48,
  catchGapM: 0,
  // Clean running wins back ground slowly; a stumble hands it straight back.
  recoverMPerS: 1.6,
  stumbleLossM: 12,
  ovenLossM: 8,
  dangerGapM: 15,
  surgeEveryS: 17,
  surgeLossM: 9,
  surgeDurationS: 2.2,
};

// Spawn gaps are at least ~1 s of travel at the stage's speed: a jump keeps
// the turkey airborne 0.75 s, so a shorter gap would ask for two jumps the
// turkey cannot make. The gap is what keeps a narrow escape fair.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    fromM: 0,
    skyTop: '#f7b267',
    skyBottom: '#f4845f',
    sun: '#ffd97d',
    hillFar: '#c98a4b',
    hillNear: '#a86532',
    ground: '#8a5a2b',
    groundTop: '#b5773a',
    accent: '#e07a3f',
    backdrop: 'farm',
    speed: 265,
    spawnGapMin: 280,
    spawnGapMax: 520,
  },
  {
    name: 'THE BARN',
    fromM: 350,
    skyTop: '#7d4a2d',
    skyBottom: '#b4713e',
    sun: '#ffe3a3',
    hillFar: '#5f3a22',
    hillNear: '#4a2c1a',
    ground: '#6b4423',
    groundTop: '#8a5a30',
    accent: '#d9a441',
    backdrop: 'barn',
    speed: 340,
    spawnGapMin: 350,
    spawnGapMax: 560,
  },
  {
    name: 'THE KITCHEN',
    fromM: 700,
    skyTop: '#8e2f26',
    skyBottom: '#c65a35',
    sun: '#ffd166',
    hillFar: '#5e1f1a',
    hillNear: '#471512',
    ground: '#7a3b22',
    groundTop: '#9c5230',
    accent: '#4dd7ff',
    backdrop: 'kitchen',
    speed: 415,
    spawnGapMin: 430,
    spawnGapMax: 620,
  },
];

export const SCORES = { corn: 10, feather: 50, pieLife: 1, maxLives: 3 };

export const KEYS = {
  jump: ['Space', 'ArrowUp', 'KeyW'],
  slide: ['ArrowDown', 'KeyS'],
  restart: ['KeyR', 'Enter'],
  mute: ['KeyM'],
  pause: ['KeyP', 'Escape'],
};
