// Keyboard and mouse input for Tilly's Great Escape. One job: turn raw events
// into a small, stable input state the game loop reads. No game logic here.
import { KEYS } from './config.js';

export function createInput() {
  const state = {
    jumpPressed: false,
    jumpHeld: false,
    slideHeld: false,
    restartPressed: false,
    mutePressed: false,
    pausePressed: false,
    clickX: 0,
    clickY: 0,
    clickPressed: false,
    pointerX: 0,
    pointerY: 0,
  };

  function onKeyDown(event) {
    if (KEYS.jump.includes(event.code)) {
      if (!event.repeat) state.jumpPressed = true;
      state.jumpHeld = true;
      event.preventDefault();
    } else if (KEYS.slide.includes(event.code)) {
      state.slideHeld = true;
      event.preventDefault();
    } else if (KEYS.restart.includes(event.code)) {
      state.restartPressed = true;
    } else if (KEYS.mute.includes(event.code)) {
      state.mutePressed = true;
    } else if (KEYS.pause.includes(event.code)) {
      state.pausePressed = true;
    }
  }

  function onKeyUp(event) {
    if (KEYS.jump.includes(event.code)) state.jumpHeld = false;
    if (KEYS.slide.includes(event.code)) state.slideHeld = false;
  }

  function onPointerDown(event) {
    state.clickPressed = true;
    state.clickX = event.offsetX;
    state.clickY = event.offsetY;
  }

  function onPointerMove(event) {
    state.pointerX = event.offsetX;
    state.pointerY = event.offsetY;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  return state;
}

/** Clear the edge-triggered flags after the game loop has read them. */
export function consumeEdges(input) {
  input.jumpPressed = false;
  input.restartPressed = false;
  input.mutePressed = false;
  input.pausePressed = false;
  input.clickPressed = false;
}
