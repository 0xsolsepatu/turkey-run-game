// Deterministic screenshot scenes for Tilly's Great Escape. Each scene plays
// the real rules forward from a fresh seeded world for a fixed number of
// 1/60 s steps, steered by a small autopilot, so the same seed always gives
// the same frame. Used only behind ?shot=…; the live game never calls this.
import { STEP } from './config.js';
import {
  KIND_HAY,
  KIND_KNIFE,
  KIND_OVEN,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PLAY,
  createWorld,
  segmentHitsBox,
  stageFor,
  startRun,
  stepWorld,
} from './world.js';

const SAMPLE = STEP;
const LOOKAHEAD_S = 0.6;
/** A jump keeps the turkey airborne for about 0.75 s; check the whole arc. */
const JUMP_ARC_S = 0.85;

/** The obstacle's shape t seconds from now: a box, or a blade segment for a knife. */
function obstacleShapeAt(world, ob, t) {
  const speed = stageFor(world.distanceM).speed;
  if (ob.kind === KIND_KNIFE) {
    const angle = Math.sin(ob.swing + ob.swingSpeed * t) * 0.55;
    const pivotX = ob.pivotX - speed * t;
    return {
      segment: true,
      x1: pivotX,
      y1: ob.pivotY,
      x2: pivotX + Math.sin(angle) * ob.bladeLen,
      y2: ob.pivotY + Math.cos(angle) * ob.bladeLen,
    };
  }
  const ox = ob.x - speed * t;
  return { segment: false, x: ox, y: ob.y, width: ob.width, height: ob.height };
}

/**
 * Seconds until the turkey, moving this way, hits an obstacle; Infinity if safe.
 * mode 'stay' runs on the ground, 'jump' jumps now, 'slide' ducks low (the
 * answer to a swinging knife, whose blade clears a sliding turkey). The
 * player's height is simulated with the exact per-tick integrator world.js
 * uses (vy += g*dt, then y += vy*dt): the closed-form parabola sits ~15 px
 * higher during the descent, which once made this check call a landing safe
 * that the real game collided with.
 */
function timeToHit(world, mode, horizon) {
  const p = world.player;
  let vy = mode === 'jump' ? -980 : p.vy;
  let y = p.y;
  let grounded = p.grounded;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    if (mode === 'jump' || !grounded) {
      vy += 2600 * SAMPLE;
      y += vy * SAMPLE;
      if (y >= 600 - 76) { y = 600 - 76; vy = 0; grounded = true; }
    }
    // A sliding turkey is low (top at y+34) and short; anything else is full height.
    const box = mode === 'slide'
      ? { x: 320 + 6 - 4, y: y + 34, width: 52 + 8, height: 42 }
      : { x: 320 + 6 - 4, y, width: 52 + 8, height: 76 };
    for (const ob of world.obstacles) {
      if (ob.kind === KIND_HAY) continue;
      const shape = obstacleShapeAt(world, ob, t);
      const hit = shape.segment
        ? segmentHitsBox(shape.x1, shape.y1, shape.x2, shape.y2, box, 6)
        : shape.x < box.x + box.width && shape.x + shape.width > box.x && shape.y < box.y + box.height && shape.y + shape.height > box.y;
      if (hit) return t;
    }
  }
  return Infinity;
}

/**
 * Simple pilot: when staying put would hit something, duck if ducking clears
 * it (a swinging knife), else jump if the whole jump arc is clear. Waiting a
 * few ticks for the arc to clear is the right move — jumping the moment danger
 * appears lands the turkey on the obstacle.
 * Exported so a test harness can drive the same pilot the shots use. */
export function autopilot(world, skill) {
  const horizon = skill === 'good' ? LOOKAHEAD_S : 0.22;
  const p = world.player;
  const staySafe = timeToHit(world, 'stay', horizon);
  if (!p.grounded || staySafe === Infinity) {
    // Hide when the farmer is close and a haystack is underfoot.
    let inHay = false;
    for (const ob of world.obstacles) {
      if (ob.kind === KIND_HAY && ob.x < 380 && ob.x + ob.width > 300) { inHay = true; break; }
    }
    return { jump: false, slide: inHay && world.farmerGapM < 22 };
  }
  const slideSafe = timeToHit(world, 'slide', horizon);
  if (slideSafe === Infinity) return { jump: false, slide: true };
  const jumpSafe = timeToHit(world, 'jump', JUMP_ARC_S);
  if (jumpSafe === Infinity) return { jump: true, slide: false };
  // Last instant: the obstacle is ~0.15 s away and the full arc is blocked
  // only by something further on. Jumping now still clears this one — a
  // stumble on the next obstacle beats a certain hit on this one.
  if (staySafe < 0.15) return { jump: true, slide: false };
  // Nothing clears it: duck anyway — it at least clears a knife, and a low
  // turkey is no worse off against anything else.
  return { jump: false, slide: true };
}

function runSteps(world, seconds, skill) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen !== SCREEN_PLAY) break;
    stepWorld(world, autopilot(world, skill));
  }
}

/** Title screen, no simulation: the turkey poses on a hay bale. */
export function shotStart(seed) {
  const world = createWorld(seed);
  return world;
}

/** Mid-run frame: a good pilot plays until an oven and a swinging knife are
 * both on screen with the farmer close behind — the richest action frame.
 * Retries with nearby seeds (deterministically) if a pilot is caught or
 * escapes first; the search runs up to 200 s so it reaches well into the
 * Kitchen, where the oven and the knife both appear. */
export function shotPlay(seed) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const world = createWorld(seed + attempt);
    startRun(world);
    const maxSteps = Math.round(200 / STEP);
    for (let i = 0; i < maxSteps; i += 1) {
      if (world.screen !== SCREEN_PLAY) break;
      stepWorld(world, autopilot(world, 'good'));
      const hasOven = world.obstacles.some((o) => o.kind === KIND_OVEN && o.x > 200 && o.x < 1200);
      const hasKnife = world.obstacles.some((o) => o.kind === KIND_KNIFE && o.x > 200 && o.x < 1200);
      if (hasOven && hasKnife && world.farmerGapM < 40 && world.distanceM > 700) return world;
    }
    if (world.screen === SCREEN_PLAY) return world;
  }
  // Last resort: a plain mid-run frame, still a real play of the game.
  const world = createWorld(seed);
  startRun(world);
  for (let i = 0; i < Math.round(45 / STEP); i += 1) {
    if (world.screen !== SCREEN_PLAY) break;
    stepWorld(world, autopilot(world, 'good'));
  }
  return world;
}

/** Caught end screen: a careless pilot never jumps, so the farmer catches her. */
export function shotCaught(seed) {
  const world = createWorld(seed);
  startRun(world);
  const maxSteps = Math.round(120 / STEP);
  for (let i = 0; i < maxSteps; i += 1) {
    if (world.screen !== SCREEN_PLAY) break;
    stepWorld(world, { jump: false, slide: false });
  }
  if (world.screen === SCREEN_PLAY) {
    world.screen = SCREEN_CAUGHT;
    world.caught = true;
  }
  return world;
}

/** Escaped end screen: a good pilot runs the whole 1000 m. Retries with
 * nearby seeds (deterministically) if a pilot is caught first. */
export function shotEscaped(seed) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const world = createWorld(seed + attempt);
    startRun(world);
    const maxSteps = Math.round(400 / STEP);
    for (let i = 0; i < maxSteps; i += 1) {
      if (world.screen !== SCREEN_PLAY) break;
      stepWorld(world, autopilot(world, 'good'));
    }
    if (world.screen === SCREEN_ESCAPED) return world;
  }
  const world = createWorld(seed);
  startRun(world);
  world.screen = SCREEN_ESCAPED;
  world.escaped = true;
  world.distanceM = 1000;
  return world;
}

export function shotFor(name, seed) {
  if (name === 'start') return shotStart(seed);
  if (name === 'play') return shotPlay(seed);
  if (name === 'caught') return shotCaught(seed);
  if (name === 'escaped') return shotEscaped(seed);
  return shotStart(seed);
}
