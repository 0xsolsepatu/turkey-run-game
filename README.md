# Tilly's Great Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/0xsolsepatu/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/0xsolsepatu/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)


A complete, original turkey escape game for make.fun's `turkey-run-game-01`
bounty. Tilly the turkey is running from Thanksgiving dinner: outrun the
farmer through the farmyard, the barn and the kitchen, jump the fences and
the glowing oven, duck under the swinging carving knife, hide in haystacks
when the farmer closes in, and reach the woods at 1000 m.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit
http://localhost:8080). No network, no build step.

- **SPACE / ↑ / click** — jump
- **↓** — slide, and hide in a haystack while overlapping one
- **M** — mute, **P** — pause, **R** — restart after an end screen

HUD: score, distance (m / 1000), lives (feathers), stage name, farmer
proximity bar. Three lives; a stumble costs a life and ground to the farmer.
If the farmer catches Tilly she is Thanksgiving dinner; reach 1000 m and she
is free in the woods.

Sound is synthesised with WebAudio (gobbles, chirps, shouts, jingles) — no
audio files.

## Layout

- `main.ts` — hand-in program (Node 22): copies `game/` and `screenshots/`
  to `/output` and writes `dossier.json` via `vendor/makefun-game.ts`
- `game/index.html`, `game/style.css` — page shell
- `game/src/config.js` — constants, stages, palette
- `game/src/random.js` — seeded RNG (mulberry32)
- `game/src/audio.js` — synthesised sound effects
- `game/src/input.js` — keyboard and mouse input
- `game/src/world.js` — state, spawning, physics, farmer AI, hiding, scoring
- `game/src/render.js` — all canvas art (procedural, no image files)
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=…&seed=…`)
- `game/src/main.js` — frame loop, screen transitions, wiring
- `vendor/makefun-game.ts` — kit library, unchanged
- `screenshots/` — 4 real renders of the game's own code (1280×720)

## Determinism

The simulation advances in fixed 1/60 s steps from a seeded RNG; no wall
clock is read inside it. `?shot=start|play|caught|escaped&seed=N` renders
one fixed frame synchronously, so the same seed always gives the same frame.
`main.ts` is deterministic: same files in, same bytes out.

## Checks

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in
node cli/makefun.mjs check                              # kit check (from the kit dir)
```

MIT licensed.
