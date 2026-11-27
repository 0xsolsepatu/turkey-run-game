// The world of Tilly's Great Escape: game state, obstacle spawning, physics,
// the farmer's chase, hiding in haystacks, pickups and scoring. Pure logic —
// it never touches the canvas or the clock. Every step is a fixed 1/60 s tick
// driven by a seeded RNG, so the same seed always plays the same run.
import {
  ESCAPE_DISTANCE_M,
  FARMER,
  GROUND_Y,
  PLAYER,
  PX_PER_M,
  SCORES,
  STAGES,
  STEP,
} from './config.js';
import { mulberry32, randInt, randPick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

export const KIND_FENCE = 'fence';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_TRAP = 'trap';
export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_HAY = 'hay';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';
export const KIND_FEATHER = 'feather';

export function stageFor(distanceM) {
  let stage = STAGES[0];
  for (const s of STAGES) if (distanceM >= s.fromM) stage = s;
  return stage;
}

export function createWorld(seed) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    screen: SCREEN_TITLE,
    time: 0,
    distanceM: 0,
    scrollX: 0,
    score: 0,
    lives: SCORES.maxLives,
    best: 0,
    player: {
      y: GROUND_Y - PLAYER.height,
      vy: 0,
      grounded: true,
      sliding: false,
      hidden: false,
      hiddenTimer: 0,
      invulnerableTimer: 0,
      runPhase: 0,
      stumbleTimer: 0,
    },
    farmerGapM: FARMER.startGapM,
    farmerLunge: 0,
    surgeTimer: FARMER.surgeEveryS,
    surgeActive: 0,
    surgeAnnounced: false,
    obstacles: [],
    pickups: [],
    nextSpawnX: 900,
    stageIndex: 0,
    stageBanner: 0,
    stageBannerText: STAGES[0].name,
    caught: false,
    escaped: false,
    flashRed: 0,
    // Juice, visual only: screen shake and particles never touch the rules.
    shake: 0,
    squash: 0,
    dustTimer: 0,
    particles: [],
    message: '',
    messageTimer: 0,
    cornStreak: 0,
  };
}

/** Spawn a few deterministic particles (dust, feathers, sparkles). */
function spawnParticles(world, x, y, kind, count) {
  for (let i = 0; i < count; i += 1) {
    if (world.particles.length > 24) return;
    const angle = world.rng() * Math.PI * 2;
    const speed = 40 + world.rng() * 120;
    world.particles.push({
      kind,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 0.4 + world.rng() * 0.4,
      maxLife: 0.8,
      size: 3 + world.rng() * 4,
    });
  }
}

function spawnObstacle(world, x) {
  const stage = stageFor(world.distanceM);
  const rng = world.rng;
  const roll = rng();
  let kind;
  if (stage.name === 'THE KITCHEN') {
    kind = roll < 0.26 ? KIND_OVEN : roll < 0.52 ? KIND_KNIFE : roll < 0.72 ? KIND_FENCE : roll < 0.88 ? KIND_PUMPKIN : KIND_TRAP;
  } else if (stage.name === 'THE BARN') {
    kind = roll < 0.34 ? KIND_KNIFE : roll < 0.58 ? KIND_FENCE : roll < 0.8 ? KIND_PUMPKIN : KIND_TRAP;
  } else {
    kind = roll < 0.42 ? KIND_FENCE : roll < 0.7 ? KIND_PUMPKIN : roll < 0.88 ? KIND_TRAP : KIND_HAY;
  }
  const ob = { kind, x, passed: false, swing: rng() * Math.PI * 2, swingSpeed: 1.6 + rng() * 1.2 };
  if (kind === KIND_FENCE) { ob.width = 46; ob.height = 74; ob.y = GROUND_Y - 74; }
  if (kind === KIND_PUMPKIN) { ob.width = 58; ob.height = 58; ob.y = GROUND_Y - 58; ob.roll = 0; }
  if (kind === KIND_TRAP) { ob.width = 52; ob.height = 26; ob.y = GROUND_Y - 26; }
  if (kind === KIND_KNIFE) {
    // The blade hangs from a rope off a beam and swings: only the blade hurts.
    // Its lowest tip (y 540) catches a standing turkey (head 524) but clears
    // a sliding one (top 558) — so the answer to a knife is to duck under it.
    ob.width = 26; ob.height = 250; ob.y = 290; ob.pivotY = 290; ob.pivotX = x + 13; ob.bladeLen = 250;
  }
  if (kind === KIND_OVEN) { ob.width = 100; ob.height = 100; ob.y = GROUND_Y - 100; ob.glow = rng() * Math.PI * 2; }
  if (kind === KIND_HAY) { ob.width = 130; ob.height = 96; ob.y = GROUND_Y - 96; }
  world.obstacles.push(ob);
  return ob;
}

function spawnPickup(world, x) {
  const rng = world.rng;
  const roll = rng();
  let kind = KIND_CORN;
  if (roll > 0.93) kind = KIND_FEATHER;
  else if (roll > 0.86) kind = KIND_PIE;
  const y = kind === KIND_CORN && rng() < 0.5 ? GROUND_Y - 190 : GROUND_Y - 90;
  world.pickups.push({ kind, x, y, bob: rng() * Math.PI * 2, taken: false });
}

function spawnAhead(world) {
  const stage = stageFor(world.distanceM);
  const rng = world.rng;
  // nextSpawnX is a SCREEN coordinate: it scrolls left with the world, and a
  // new obstacle appears just off the right edge while it is still on screen.
  // (Tracking it against scrollX instead once pushed every spawn tens of
  // thousands of pixels off-screen, leaving the visible game nearly empty.)
  world.nextSpawnX -= stage.speed * STEP;
  while (world.nextSpawnX < 1400) {
    const x = world.nextSpawnX;
    spawnObstacle(world, x);
    // Corn trails sometimes arc over the obstacle just placed.
    if (rng() < 0.55) {
      for (let i = 0; i < 3; i += 1) spawnPickup(world, x - 40 + i * 44);
    } else if (rng() < 0.3) {
      spawnPickup(world, x + 130);
    }
    world.nextSpawnX = x + randInt(rng, stage.spawnGapMin, stage.spawnGapMax);
  }
}

function playerBox(world) {
  const p = world.player;
  const h = p.sliding ? PLAYER.slideHeight : PLAYER.height;
  return { x: PLAYER.x + 6, y: p.y + (PLAYER.height - h), width: PLAYER.width - 12, height: h };
}

function obstacleBox(ob) {
  return { x: ob.x, y: ob.y, width: ob.width, height: ob.height };
}

/** The blade's current segment, pivot to tip. */
export function bladeSegment(ob) {
  const angle = Math.sin(ob.swing) * 0.55;
  return {
    x1: ob.pivotX,
    y1: ob.pivotY,
    x2: ob.pivotX + Math.sin(angle) * ob.bladeLen,
    y2: ob.pivotY + Math.cos(angle) * ob.bladeLen,
  };
}

/** Does a thin segment touch a box (sampled along the segment, deterministic)? */
export function segmentHitsBox(x1, y1, x2, y2, box, pad) {
  const samples = 14;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= box.x - pad && x <= box.x + box.width + pad && y >= box.y - pad && y <= box.y + box.height + pad) return true;
  }
  return false;
}

/** Does this obstacle touch the player's box? Knives use their blade segment. */
function obstacleHitsPlayer(ob, box) {
  if (ob.kind === KIND_KNIFE) {
    const seg = bladeSegment(ob);
    return segmentHitsBox(seg.x1, seg.y1, seg.x2, seg.y2, box, 6);
  }
  return overlaps(box, obstacleBox(ob));
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function stumble(world, reason) {
  const p = world.player;
  if (p.invulnerableTimer > 0 || p.hidden) return false;
  world.lives -= 1;
  world.farmerGapM = Math.max(0, world.farmerGapM - FARMER.stumbleLossM);
  p.invulnerableTimer = 1.6;
  p.stumbleTimer = 0.45;
  world.flashRed = 0.5;
  world.shake = 0.3;
  spawnParticles(world, PLAYER.x + 32, p.y + 30, 'feather', 8);
  world.message = reason;
  world.messageTimer = 1.4;
  world.cornStreak = 0;
  if (world.lives <= 0) {
    world.farmerGapM = 0;
    world.caught = true;
    world.screen = SCREEN_CAUGHT;
  }
  return true;
}

/** One fixed 1/60 s step of the run. `input` is {jump, slide} for this tick. */
export function stepWorld(world, input) {
  if (world.screen !== SCREEN_PLAY) return;
  const stage = stageFor(world.distanceM);
  const p = world.player;
  world.time += STEP;

  // --- stage changes -------------------------------------------------------
  const idx = STAGES.indexOf(stage);
  if (idx !== world.stageIndex) {
    world.stageIndex = idx;
    world.stageBanner = 2.2;
    world.stageBannerText = stage.name;
  }
  if (world.stageBanner > 0) world.stageBanner -= STEP;
  if (world.messageTimer > 0) world.messageTimer -= STEP;
  if (world.flashRed > 0) world.flashRed -= STEP;

  // --- farmer pressure -----------------------------------------------------
  world.surgeTimer -= STEP;
  if (world.surgeTimer <= 0 && world.surgeActive <= 0) {
    world.surgeActive = FARMER.surgeDurationS;
    world.surgeAnnounced = true;
    world.surgeTimer = FARMER.surgeEveryS;
  }
  if (world.surgeActive > 0) {
    world.surgeActive -= STEP;
    world.farmerGapM = Math.max(0, world.farmerGapM - (FARMER.surgeLossM / FARMER.surgeDurationS) * STEP);
    world.farmerLunge = Math.min(1, world.farmerLunge + STEP * 3);
  } else {
    world.farmerLunge = Math.max(0, world.farmerLunge - STEP * 2);
    if (!p.hidden) world.farmerGapM = Math.min(FARMER.maxGapM, world.farmerGapM + FARMER.recoverMPerS * STEP);
  }
  if (world.farmerGapM <= FARMER.dangerGapM) world.flashRed = Math.max(world.flashRed, 0.12);
  if (world.farmerGapM <= FARMER.catchGapM) {
    world.caught = true;
    world.screen = SCREEN_CAUGHT;
    return;
  }

  // --- player movement -----------------------------------------------------
  const speed = stage.speed * (p.stumbleTimer > 0 ? 0.45 : 1);
  world.scrollX += speed * STEP;
  world.distanceM = world.scrollX / PX_PER_M;
  p.runPhase += STEP / PLAYER.runCycle;

  if (input.jump && p.grounded && !p.sliding) {
    p.vy = PLAYER.jumpVelocity;
    p.grounded = false;
  }
  p.sliding = input.slide && p.grounded;
  if (!p.grounded) {
    p.vy += PLAYER.gravity * STEP;
    p.y += p.vy * STEP;
    if (p.y >= GROUND_Y - PLAYER.height) {
      const fallSpeed = p.vy;
      p.y = GROUND_Y - PLAYER.height;
      p.vy = 0;
      p.grounded = true;
      if (fallSpeed > 300) {
        world.squash = 0.18;
        spawnParticles(world, PLAYER.x + 32, GROUND_Y, 'dust', 5);
      }
    }
  }
  // A little dust kicked up while running.
  if (p.grounded && !p.sliding && !p.hidden) {
    world.dustTimer -= STEP;
    if (world.dustTimer <= 0) {
      world.dustTimer = 0.22 + world.rng() * 0.12;
      spawnParticles(world, PLAYER.x + 10, GROUND_Y, 'dust', 1);
    }
  }
  if (p.invulnerableTimer > 0) p.invulnerableTimer -= STEP;
  if (p.stumbleTimer > 0) p.stumbleTimer -= STEP;
  if (world.shake > 0) world.shake -= STEP;
  if (world.squash > 0) world.squash -= STEP;
  // Particles drift and fade; they are visual only.
  for (const pt of world.particles) {
    pt.x += pt.vx * STEP;
    pt.y += pt.vy * STEP;
    pt.vy += 300 * STEP;
    pt.life -= STEP;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);

  // --- hiding in a haystack -----------------------------------------------
  const box = playerBox(world);
  let inHay = false;
  for (const ob of world.obstacles) {
    if (ob.kind === KIND_HAY && overlaps(box, obstacleBox(ob))) { inHay = true; break; }
  }
  if (inHay && input.slide) {
    if (!p.hidden) {
      p.hidden = true;
      p.hiddenTimer = 2;
      world.message = 'HIDDEN IN THE HAY!';
      world.messageTimer = 1.2;
    }
  }
  if (p.hidden) {
    p.hiddenTimer -= STEP;
    // While hidden the farmer loses the trail and falls back.
    world.farmerGapM = Math.min(FARMER.maxGapM, world.farmerGapM + 9 * STEP);
    if (p.hiddenTimer <= 0 || input.jump) p.hidden = false;
  }

  // --- spawn, move and collide --------------------------------------------
  spawnAhead(world);
  for (const ob of world.obstacles) {
    ob.x -= speed * STEP;
    if (ob.kind === KIND_KNIFE) { ob.swing += ob.swingSpeed * STEP; ob.pivotX -= speed * STEP; }
    if (ob.kind === KIND_PUMPKIN) ob.roll += speed * STEP * 0.02;
    if (ob.kind === KIND_OVEN) ob.glow += STEP * 4;
    if (!ob.passed && ob.x + ob.width < PLAYER.x) {
      ob.passed = true;
      if (ob.kind !== KIND_HAY) world.score += 5;
    }
  }
  for (const pk of world.pickups) {
    pk.x -= speed * STEP;
    pk.bob += STEP * 3;
    if (!pk.taken && !p.hidden && overlaps(box, { x: pk.x - 16, y: pk.y - 16, width: 32, height: 32 })) {
      pk.taken = true;
      spawnParticles(world, pk.x, pk.y, 'spark', pk.kind === KIND_PIE ? 6 : 4);
      if (pk.kind === KIND_CORN) {
        world.score += SCORES.corn;
        world.cornStreak += 1;
        world.farmerGapM = Math.min(FARMER.maxGapM, world.farmerGapM + 0.6);
      } else if (pk.kind === KIND_FEATHER) {
        world.score += SCORES.feather;
      } else if (pk.kind === KIND_PIE) {
        world.lives = Math.min(SCORES.maxLives, world.lives + SCORES.pieLife);
        world.message = '+1 LIFE — PIE POWER!';
        world.messageTimer = 1.4;
      }
    }
  }
  if (!p.hidden) {
    for (const ob of world.obstacles) {
      if (ob.kind === KIND_HAY) continue;
      // The blade swings ~130 px either side of its pivot, so a knife counts
      // as near from further away than a ground obstacle does.
      const margin = ob.kind === KIND_KNIFE ? 180 : 40;
      if (ob.x > PLAYER.x + 200 || ob.x + ob.width < PLAYER.x - margin) continue;
      if (obstacleHitsPlayer(ob, box)) {
        if (ob.kind === KIND_OVEN) {
          // The oven costs extra ground, but only once, when the stumble
          // actually lands — never per tick of the overlap.
          if (stumble(world, 'TOO HOT! THE OVEN GOT YOU')) {
            world.farmerGapM = Math.max(0, world.farmerGapM - FARMER.ovenLossM);
            break;
          }
        } else if (ob.kind === KIND_KNIFE) {
          if (stumble(world, 'SLICED BY THE CARVING KNIFE!')) break;
        } else if (stumble(world, randPick(world.rng, ['TRIPPED!', 'STUMBLED!', 'OUCH!']))) break;
      }
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -200);
  world.pickups = world.pickups.filter((pk) => !pk.taken && pk.x > -60);

  // --- escape! --------------------------------------------------------------
  if (world.distanceM >= ESCAPE_DISTANCE_M) {
    world.escaped = true;
    world.screen = SCREEN_ESCAPED;
    world.score += 500;
  }
}

/** Start a fresh run from the title screen. */
export function startRun(world) {
  const fresh = createWorld(world.seed + Math.floor(world.rng() * 100000));
  fresh.best = world.best;
  fresh.screen = SCREEN_PLAY;
  fresh.stageBanner = 2.2;
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
}

/** Reset to the title screen, keeping the best distance. */
export function toTitle(world) {
  const best = world.best;
  const fresh = createWorld(world.seed);
  fresh.best = best;
  fresh.screen = SCREEN_TITLE;
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
}
