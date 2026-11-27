// Entry point for Tilly's Great Escape. One job: own the frame loop, the
// screen transitions and the wiring between input, world, render and sound.
// The simulation itself lives in world.js and advances in fixed 1/60 s steps;
// this file only feeds it inputs and draws the result.
//
// ?shot=start|play|caught|escaped&seed=N renders one deterministic frame
// synchronously (used for the entry's screenshots) and never starts the loop.
import { STEP, VIEW } from './config.js';
import {
  playCaughtSound,
  playClick,
  playEscape,
  playJump,
  playPie,
  playPickup,
  playShout,
  playStumble,
  toggleMute,
  unlockAudio,
} from './audio.js';
import { consumeEdges, createInput } from './input.js';
import { render } from './render.js';
import { shotFor } from './shots.js';
import {
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
  startRun,
  stepWorld,
  toTitle,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotSeed = Number(params.get('seed') ?? '1') || 1;

function loadBest() {
  try {
    return Number(window.localStorage.getItem('tilly-best-m') ?? '0') || 0;
  } catch {
    return 0;
  }
}

function saveBest(m) {
  try {
    window.localStorage.setItem('tilly-best-m', String(Math.floor(m)));
  } catch {
    // Best distance is a nicety; the game plays fine without storage.
  }
}

// --- deterministic screenshot mode ------------------------------------------
if (shotName) {
  const world = shotFor(shotName, shotSeed);
  world.best = Math.max(loadBest(), 480);
  render(ctx, world);
} else {
  // --- live game ------------------------------------------------------------
  const input = createInput();
  const world = createWorld(20261127);
  world.best = loadBest();
  // Debug hook for play-testing: lets a test read the live state.
  window.__tillyWorld = world;

  let accumulator = 0;
  let lastNow = 0;
  let paused = false;
  let prevLives = world.lives;
  let prevScore = world.score;
  let prevSurge = 0;

  function finishRun() {
    if (world.distanceM > world.best) {
      world.best = world.distanceM;
      saveBest(world.best);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!lastNow) lastNow = now;
    let delta = (now - lastNow) / 1000;
    lastNow = now;
    if (delta > 0.25) delta = 0.25;
    if (paused) {
      // Still read input while paused, or P could never unpause: edges left
      // unconsumed would sit there forever.
      if (input.pausePressed && world.screen === SCREEN_PLAY) paused = false;
      if (input.mutePressed) toggleMute();
      consumeEdges(input);
      render(ctx, world);
      return;
    }
    accumulator += delta;
    while (accumulator >= STEP && !paused) {
      accumulator -= STEP;
      tick();
    }
    render(ctx, world);
    consumeEdges(input);
  }

  function tick() {
    if (input.mutePressed) toggleMute();
    if (input.pausePressed && world.screen === SCREEN_PLAY) {
      paused = !paused;
      if (paused) return;
    }

    if (world.screen === SCREEN_TITLE) {
      if (input.jumpPressed || input.clickPressed) {
        unlockAudio();
        playClick();
        startRun(world);
        prevLives = world.lives;
        prevScore = world.score;
        prevSurge = 0;
      }
      return;
    }

    if (world.screen === SCREEN_CAUGHT || world.screen === SCREEN_ESCAPED) {
      if (input.restartPressed || input.clickPressed) {
        unlockAudio();
        playClick();
        toTitle(world);
        startRun(world);
        prevLives = world.lives;
        prevScore = world.score;
        prevSurge = 0;
      }
      return;
    }

    // Playing.
    if (input.jumpPressed) unlockAudio();
    const wasHidden = world.player.hidden;
    stepWorld(world, { jump: input.jumpPressed || input.jumpHeld, slide: input.slideHeld });
    if (input.jumpPressed && world.player.vy < 0) playJump();
    if (world.lives < prevLives) playStumble();
    if (world.score > prevScore) {
      if (world.message === '+1 LIFE — PIE POWER!') playPie();
      else playPickup();
    }
    if (world.surgeActive > 0 && prevSurge === 0) playShout();
    if (world.screen === SCREEN_CAUGHT) {
      playCaughtSound();
      finishRun();
    }
    if (world.screen === SCREEN_ESCAPED) {
      playEscape();
      finishRun();
    }
    prevLives = world.lives;
    prevScore = world.score;
    prevSurge = world.surgeActive;
  }

  requestAnimationFrame(frame);
}
