# Session record — Tilly's Great Escape (turkey-run-game-01)

Build session for the make.fun competition "Make the best turkey escape
game" (slug `turkey-run-game-01`, $250, top 20 share; opens 2026-11-27T02:00Z,
deadline 2026-11-29T02:00Z / 29 Nov 09:00 WIB; blind rounds ON).
Built 2026-11-27 ~02:40–03:15 WIB by the ichi subagent. No private key used
at any point. No push, no submit — the parent handles repo creation, push,
bundle, check and submit.

## What was built

Original 2D canvas auto-runner, Node 22, no libraries, no network, all art
procedural. Tilly the turkey outruns the farmer through Farmyard → Barn →
Kitchen to the woods at 1000 m.

- Jump (Space/↑/click), slide (↓), hide in haystacks (↓ while overlapping).
- Hazards: fence / pumpkin / mousetrap (jump), swinging carving knife
  (slide under — blade tip y540 clears a sliding turkey, top 558, but
  catches a standing one, top 524), glowing oven 100×100 (jump).
- Farmer chases with a gap meter (starts 42 m, recovers 1.6 m/s, surges
  −9 m every 17 s, catches at 0). Stumble −1 life, −12 m gap, 1.6 s
  invulnerable; oven hit extra −8 m once. Corn +10, pie +1 life, feather +50.
- HUD: score, distance m/1000, lives (feathers), stage name, farmer bar.
  Title / play / caught / escaped screens, R or click to restart, P pause,
  M mute, WebAudio synth sounds, dust/feather/spark particles, squash &
  stretch, screen shake on stumble.

## Reviews

- Gemini spec review (before building): 4 points, all applied — explicit
  haystack state; oven cyan-blue coils + flashing knife blade for thumbnail
  contrast; no Date.now()/performance.now() in sim logic; red danger
  vignette + farmer lunge when gap ≤ 15 m.
- Gemini code review (after building): file split good; flagged hitbox/draw
  origin consistency — verified: both top-left, feet at p.y+76; drawn head
  pokes ~12 px above the hitbox (forgiving direction); sliding box clears
  the blade by 12 px. Also flagged "programmer art" risk → added the
  particles / squash & stretch / shake juice pass (visual-only, seeded RNG).

## Bugs found and fixed during testing

1. Autopilot jumped early and landed on obstacles: its jump-arc check used
   a fixed 340 px/s and a closed-form parabola, while the game uses
   per-tick Euler integration (~15 px lower in descent). Rewrote the check
   to simulate the exact integrator.
2. Carving knife could never hit: blade tip hung at y≈250, turkey top 524.
   Lowered the pivot (tip now reaches y540) and gave the blade true
   segment collision (a line, not a box).
3. Spawn coordinates were mixed frames: nextSpawnX tracked scrollX while
   ob.x is a screen coordinate, so after a minute obstacles spawned tens of
   thousands of px off-screen and the visible game went nearly empty.
   spawnAhead now tracks a screen coordinate.
4. Spawn gaps shorter than the 0.75 s jump air-time made consecutive
   obstacles unjumpable. Minimum gaps now ≥ ~1 s of travel per stage.
5. Oven drained 8 m of farmer gap EVERY tick of overlap → instant catch.
   The extra −8 m now applies once, when the stumble lands.
6. Oven 130 tall was nearly unjumpable (safe jump window ~1 tick: the
   turkey's box-bottom clears its top for only 0.41 s while the oven takes
   0.39 s to pass). Shrunk to 100×100 (window 8–9 ticks).
7. Pause could never be unpaused: frame() returned early while paused
   without consuming input edges. Paused frames now read input (P unpauses,
   M mutes).

## Verification (all in this session)

- Node syntax: all 8 game modules + main.ts + serve.ts pass `node --check`.
- Autopilot (good pilot): escapes 1000 m with 0 stumbles on 8/8 seeds
  (scores 2315–2700). Careless pilot (never jumps) caught at ~34–50 m.
- Shots (seed 1): title; play at 874 m, score 1825, lives 3, gap 39.4,
  oven + knife both on screen; escaped 1000 m score 2315; caught 34 m.
- Live browser play-test (Puppeteer + headless Chromium, real input):
  title → Space/click starts; play advances; blind mashing loses lives;
  P pauses (distance frozen) and unpauses; forced caught → R restarts
  with 3 lives; no page errors, no failed requests (favicon is inline SVG).
- Screenshots: 4 PNGs, 1280×720, each ≤ 256 KiB, visually checked —
  title, kitchen play with HUD + farmer + oven + knife, caught (farmer
  holding Tilly), escaped (woods).
- Determinism: `MAKEFUN_OUTPUT_DIR` run twice → byte-identical output
  (diff -r clean). Dossier written by kit buildDossier (663,574 bytes).
- Kit check (`node cli/makefun.mjs check --repo …`): 4 passed
  (competition_open, snapshot, license_osi, entrypoint), 1 failed
  (transcripts_present — no transcripts given; parent bundles them),
  15 skipped, 5 checked at submission (repo_public, repo_owner,
  repo_created_after_open, commit_in_repo, duplicate_snapshot — all
  pending the parent's GitHub push).

## Files

- Workdir / repo: `~/workspace/makefun-turkey-run/` — main.ts, serve.ts,
  README.md, LICENSE (MIT), shots.json, vendor/makefun-game.ts (kit copy,
  unchanged), game/ (index.html, style.css, src/*.js), screenshots/
  (1-title.png, 2-play.png, 3-caught.png, 4-escaped.png). Git commit
  (see `git log` in the workdir for the final sha).
- Kit (reference only, NOT in the repo): `~/workspace/makefun-turkey-run-kit/`
  (kit.tgz, unpacked kit, SPEC.md).
- Play-test script: `/tmp/pptr/playtest.cjs` (puppeteer-core, throwaway).
- Screenshots were rendered with the Playwright Chromium at
  `~/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`
  (`/opt/meta-chromium/chrome` refuses to start in this VM: Hatch WebGL
  domain policy error).

## Notes for the parent (submit step)

- Repo name planned: `turkey-run-game` under 0xsolsepatu; create it on
  GitHub (after the 27 Nov 02:00Z opening — satisfied), push, set About
  (website https://make.fun, topic makefun).
- Bundle the transcripts of THIS session + parent session and submit with
  `--keypair /home/hatch/.makefun/keypairs/https_make.fun.json` (auto-submit
  window open until 5 Dec 2026 23:59 WIB).
- Shot-mode "best 480 m" is a display placeholder (headless Chrome has no
  localStorage best); in live play it is the real stored best.
- The `window.__tillyWorld` hook in game/src/main.js is a debug hook for
  play-testing; harmless to ship.
