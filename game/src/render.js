// All drawing for Tilly's Great Escape. One job: turn a world state into a
// canvas frame. Original procedural art — every turkey, farmer, oven and
// fence is drawn from shapes here, no image files, no network.
import { FARMER, GROUND_Y, PLAYER, PX_PER_M, VIEW } from './config.js';
import {
  KIND_CORN,
  KIND_FEATHER,
  KIND_FENCE,
  KIND_HAY,
  KIND_KNIFE,
  KIND_OVEN,
  KIND_PIE,
  KIND_PUMPKIN,
  KIND_TRAP,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  stageFor,
} from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSky(ctx, world) {
  const stage = stageFor(world.distanceM);
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  // Low autumn sun.
  ctx.fillStyle = stage.sun;
  ellipse(ctx, 1080, 110, 46, 46);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(ctx, 1080, 110, 62, 62);
  // Drifting clouds, placed by the seeded world position so they are stable.
  ctx.fillStyle = 'rgba(255,244,220,0.85)';
  for (let i = 0; i < 5; i += 1) {
    const cx = ((i * 317 + 140 - world.scrollX * 0.12) % 1400 + 1400) % 1400 - 60;
    const cy = 70 + i * 38;
    ellipse(ctx, cx, cy, 52, 18);
    ellipse(ctx, cx + 38, cy + 6, 40, 15);
  }
}

function drawBackdrop(ctx, world) {
  const stage = stageFor(world.distanceM);
  const far = -((world.scrollX * 0.25) % 420);
  const near = -((world.scrollX * 0.5) % 300);
  ctx.fillStyle = stage.hillFar;
  for (let x = far; x < VIEW.width + 420; x += 420) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.quadraticCurveTo(x + 210, GROUND_Y - 150, x + 420, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  if (stage.backdrop === 'farm') {
    ctx.fillStyle = '#7c4a21';
    for (let x = near; x < VIEW.width + 300; x += 300) {
      // A simple tree: trunk and three autumn blobs.
      ctx.fillRect(x + 18, GROUND_Y - 120, 16, 120);
      ctx.fillStyle = '#c65a1e';
      ellipse(ctx, x + 26, GROUND_Y - 140, 46, 34);
      ctx.fillStyle = '#e07a3f';
      ellipse(ctx, x + 2, GROUND_Y - 118, 30, 22);
      ctx.fillStyle = '#7c4a21';
    }
  } else if (stage.backdrop === 'barn') {
    ctx.fillStyle = '#3d2412';
    for (let x = near; x < VIEW.width + 340; x += 340) {
      // Barn gable silhouette with a hayloft door.
      ctx.fillRect(x, GROUND_Y - 190, 200, 190);
      ctx.beginPath();
      ctx.moveTo(x - 14, GROUND_Y - 190);
      ctx.lineTo(x + 100, GROUND_Y - 260);
      ctx.lineTo(x + 214, GROUND_Y - 190);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(x + 80, GROUND_Y - 150, 40, 44);
      ctx.fillStyle = '#3d2412';
    }
  } else {
    // Kitchen: a BUSY kitchen, not a blank wall. Cream tile band with a big
    // glowing window, a brick wall, a hanging rail of pots and pans, a shelf
    // of jars, a pendant lamp with a warm light pool, and a window light
    // beam — so the play shot reads as a kitchen at a glance.
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(0, 90, VIEW.width, 190);
    // Big window with a warm sunset glow and a potted herb on the sill.
    const wg = ctx.createLinearGradient(0, 110, 0, 280);
    wg.addColorStop(0, '#ffe9a8');
    wg.addColorStop(1, '#ff9d5c');
    ctx.fillStyle = wg;
    ctx.fillRect(80, 110, 260, 170);
    ctx.strokeStyle = '#c65a35';
    ctx.lineWidth = 7;
    ctx.strokeRect(80, 110, 260, 170);
    ctx.beginPath();
    ctx.moveTo(210, 110);
    ctx.lineTo(210, 280);
    ctx.moveTo(80, 195);
    ctx.lineTo(340, 195);
    ctx.stroke();
    ctx.fillStyle = '#ffb347';
    ellipse(ctx, 150, 240, 34, 26);
    ctx.fillStyle = '#c65a1e';
    ctx.fillRect(292, 252, 26, 22);
    ctx.fillStyle = '#2e7d32';
    ellipse(ctx, 305, 246, 16, 12);
    ellipse(ctx, 298, 238, 9, 8);
    ellipse(ctx, 312, 238, 9, 8);
    // Brick wall below the tile band.
    for (let row = 0; row < 9; row += 1) {
      const y = 280 + row * 27;
      ctx.fillStyle = row % 2 === 0 ? '#a03d28' : '#96351f';
      ctx.fillRect(0, y, VIEW.width, 27);
      ctx.fillStyle = '#7e2a1c';
      ctx.fillRect(0, y, VIEW.width, 2);
      const off = row % 2 === 0 ? 0 : 40;
      for (let bx = off; bx < VIEW.width; bx += 80) ctx.fillRect(bx, y, 2, 27);
    }
    // Counter ledge with a cream tile backsplash under it.
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(0, 520, VIEW.width, 20);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, 520, VIEW.width, 4);
    for (let tx = 0; tx < VIEW.width; tx += 64) {
      ctx.fillStyle = (tx / 64) % 2 === 0 ? '#f3e2c7' : '#e8cfa3';
      ctx.fillRect(tx, 540, 64, 60);
    }
    // Hanging rail of pots and pans, drifting slowly with the world.
    const railOff = -((world.scrollX * 0.1) % 300);
    ctx.fillStyle = '#3d2412';
    ctx.fillRect(0, 318, VIEW.width, 8);
    for (let i = 0; i < 6; i += 1) {
      const px = 430 + railOff + i * 300;
      if (px < -60 || px > VIEW.width + 60) continue;
      if (i % 3 === 0) {
        // Frying pan.
        ctx.fillStyle = '#2b2b33';
        ellipse(ctx, px, 366, 30, 30);
        ctx.fillStyle = '#454550';
        ctx.fillRect(px + 26, 360, 34, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ellipse(ctx, px - 10, 356, 10, 6);
      } else if (i % 3 === 1) {
        // Stock pot with lid.
        ctx.fillStyle = '#9aa5ad';
        roundRect(ctx, px - 28, 340, 56, 44, 8);
        ctx.fill();
        ctx.fillStyle = '#7d8891';
        ellipse(ctx, px, 340, 28, 8);
        ctx.fillStyle = '#2b2b33';
        ellipse(ctx, px, 334, 5, 5);
      } else {
        // Ladle.
        ctx.strokeStyle = '#9aa5ad';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(px, 326);
        ctx.lineTo(px, 372);
        ctx.stroke();
        ctx.fillStyle = '#7d8891';
        ellipse(ctx, px, 380, 14, 10);
      }
    }
    // Shelf with jars, on the left of the wall.
    const shelfOff = -((world.scrollX * 0.15) % 360);
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(60 + shelfOff, 452, 300, 10);
    const jarColors = ['#c0392b', '#2e7d32', '#d9a441'];
    for (let j = 0; j < 3; j += 1) {
      const jx = 84 + shelfOff + j * 92;
      ctx.fillStyle = jarColors[j];
      roundRect(ctx, jx, 404, 52, 48, 8);
      ctx.fill();
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(jx + 8, 396, 36, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(jx + 8, 412, 8, 32);
    }
    // Pendant lamp with a warm light pool on the wall.
    const lampX = 1010 - ((world.scrollX * 0.05) % 200);
    const lg = ctx.createRadialGradient(lampX, 330, 10, lampX, 330, 190);
    lg.addColorStop(0, 'rgba(255,220,130,0.34)');
    lg.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lampX - 190, 140, 380, 380);
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lampX, 0);
    ctx.lineTo(lampX, 118);
    ctx.stroke();
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath();
    ctx.moveTo(lampX - 34, 118);
    ctx.lineTo(lampX + 34, 118);
    ctx.lineTo(lampX + 18, 150);
    ctx.lineTo(lampX - 18, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ellipse(ctx, lampX, 152, 14, 8);
    // Window light beam slanting down to the floor.
    ctx.fillStyle = 'rgba(255,220,130,0.13)';
    ctx.beginPath();
    ctx.moveTo(330, 280);
    ctx.lineTo(520, 280);
    ctx.lineTo(780, 600);
    ctx.lineTo(480, 600);
    ctx.closePath();
    ctx.fill();
  }
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
  // Fence posts scrolling past on the farmyard, checkerboard tiles in the
  // kitchen — the floor is part of the scene, not flat brown.
  if (stage.backdrop === 'kitchen') {
    const tileOff = -((world.scrollX) % 64);
    for (let tx = tileOff; tx < VIEW.width; tx += 64) {
      for (let ty = 0; ty < 2; ty += 1) {
        const dark = ((Math.floor((tx - tileOff) / 64) + ty) % 2) === 0;
        ctx.fillStyle = dark ? '#6b3218' : '#8a4a28';
        ctx.fillRect(tx, GROUND_Y + ty * 60, 64, 60);
      }
    }
    ctx.fillStyle = stage.accent;
    for (let x = -((world.scrollX) % 64); x < VIEW.width; x += 64) {
      ctx.fillRect(x, GROUND_Y + 46, 58, 6);
    }
  } else {
    ctx.fillStyle = stage.accent;
    for (let x = -((world.scrollX) % 90); x < VIEW.width; x += 90) {
      ctx.fillRect(x, GROUND_Y - 34, 8, 34);
    }
    ctx.fillRect(0, GROUND_Y - 30, VIEW.width, 6);
  }
}

function drawTurkey(ctx, world, x, y, scale, running, squashX = 1, squashY = 1) {
  const p = world.player;
  const legSwing = running ? Math.sin(p.runPhase * Math.PI * 2) * 10 : 0;
  const bob = running ? Math.abs(Math.sin(p.runPhase * Math.PI * 2)) * -3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * squashX, scale * squashY);
  // Tail fan: five banded plumes, brown with gold tips and a dark eye-spot,
  // so the fan reads as feathers, not a blob, even at thumbnail size.
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(-24, -40);
    ctx.rotate(i * 0.38);
    ctx.fillStyle = '#7a3d16';
    ctx.beginPath();
    ctx.ellipse(0, -24, 10, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(0, -46, 6, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b1a0e';
    ctx.beginPath();
    ctx.ellipse(0, -34, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs, orange with little feet.
  ctx.strokeStyle = '#e07a3f';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -10);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8 + legSwing - 6, 0);
  ctx.lineTo(-8 + legSwing + 6, 0);
  ctx.moveTo(8 - legSwing - 6, 0);
  ctx.lineTo(8 - legSwing + 6, 0);
  ctx.stroke();
  // Body: warm mid-brown with a lighter belly and a darker back, so the
  // silhouette has depth instead of one flat dark mass.
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, 0, -34, 32, 28);
  ctx.fillStyle = '#b5773a';
  ellipse(ctx, 7, -28, 22, 18);
  ctx.fillStyle = '#6b3f1d';
  ellipse(ctx, -8, -44, 22, 12);
  // Wing with three feather scallops.
  ctx.fillStyle = '#5a3418';
  ctx.beginPath();
  ctx.ellipse(-6, -32, 19, 13, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a9713a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(-14 + i * 8, -26, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  // Neck and head: thicker neck, bigger head, white-ringed eye.
  ctx.fillStyle = '#a86532';
  ctx.fillRect(20, -74, 14, 36);
  ctx.fillStyle = '#c98a4b';
  ctx.fillRect(20, -74, 5, 36);
  ctx.fillStyle = '#d9a05a';
  ellipse(ctx, 27, -78, 14, 13);
  // Head tuft.
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22, -90);
  ctx.lineTo(19, -97);
  ctx.moveTo(27, -91);
  ctx.lineTo(27, -99);
  ctx.moveTo(32, -90);
  ctx.lineTo(35, -97);
  ctx.stroke();
  // Beak: big orange upper beak, darker lower beak.
  ctx.fillStyle = '#e07a3f';
  ctx.beginPath();
  ctx.moveTo(38, -82);
  ctx.lineTo(54, -76);
  ctx.lineTo(38, -70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b85c1e';
  ctx.beginPath();
  ctx.moveTo(38, -71);
  ctx.lineTo(48, -73);
  ctx.lineTo(38, -68);
  ctx.closePath();
  ctx.fill();
  // Snood (red drop over the beak) and double-lobed wattle.
  ctx.fillStyle = '#d43d2a';
  ellipse(ctx, 37, -84, 2.5, 5);
  ellipse(ctx, 33, -66, 4.5, 8);
  ellipse(ctx, 39, -62, 3.5, 6);
  // Eye: white ring, black pupil, glint.
  ctx.fillStyle = '#fff';
  ellipse(ctx, 31, -82, 4.5, 5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 32, -82, 2.5, 2.5);
  ctx.fillStyle = '#fff';
  ellipse(ctx, 33, -83, 1, 1);
  ctx.restore();
}

function drawFarmer(ctx, world, xOverride, scale = 1.15) {
  // Map the gap to the screen so the farmer is always at least peeking in
  // from the left edge, and closes right up behind Tilly as the gap shrinks.
  const x = xOverride ?? (PLAYER.x - 60 - world.farmerGapM * 6 + world.farmerLunge * 26);
  const y = GROUND_Y;
  const swing = Math.sin(world.time * 14) * 12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Legs pumping.
  ctx.strokeStyle = '#2b3a67';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(swing, 0);
  ctx.moveTo(0, -58);
  ctx.lineTo(-swing, 0);
  ctx.stroke();
  // Overalls and shirt, with straps and a red neckerchief.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-18, -106, 36, 50);
  ctx.fillStyle = '#2b3a67';
  ctx.fillRect(-18, -80, 36, 28);
  ctx.fillRect(-14, -106, 6, 26);
  ctx.fillRect(8, -106, 6, 26);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(-12, -106);
  ctx.lineTo(12, -106);
  ctx.lineTo(0, -92);
  ctx.closePath();
  ctx.fill();
  // Arms reaching forward.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(12, -98);
  ctx.lineTo(34, -76 + swing * 0.4);
  ctx.moveTo(12, -90);
  ctx.lineTo(32, -64 - swing * 0.4);
  ctx.stroke();
  // Head, straw hat, moustache, angry brows.
  ctx.fillStyle = '#e8b88a';
  ellipse(ctx, 0, -118, 14, 14);
  ctx.fillStyle = '#d9a441';
  ellipse(ctx, 0, -128, 24, 6);
  ctx.fillRect(-9, -144, 18, 16);
  ctx.fillStyle = '#b57f1e';
  ctx.fillRect(-9, -130, 18, 3);
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(-8, -112, 16, 4);
  ctx.beginPath();
  ctx.moveTo(-10, -128);
  ctx.lineTo(-2, -125);
  ctx.moveTo(10, -128);
  ctx.lineTo(2, -125);
  ctx.stroke();
  // Angry eyes.
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 5, -120, 2, 2);
  ellipse(ctx, 11, -120, 2, 2);
  // Pitchfork in the back hand.
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, -60);
  ctx.lineTo(-26, -130);
  ctx.stroke();
  ctx.restore();
  // Shout bubble when he surges.
  if (world.surgeActive > 0) {
    ctx.fillStyle = '#fff';
    roundRect(ctx, x - 10, y - 210, 150, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('COME BACK!', x + 2, y - 182);
  }
}

function drawObstacle(ctx, ob, world) {
  if (ob.kind === KIND_FENCE) {
    ctx.fillStyle = '#7c4a21';
    ctx.fillRect(ob.x, ob.y, 8, ob.height);
    ctx.fillRect(ob.x + ob.width - 8, ob.y, 8, ob.height);
    ctx.fillRect(ob.x, ob.y + 12, ob.width, 8);
    ctx.fillRect(ob.x, ob.y + 40, ob.width, 8);
    // Pointed post tops and a diagonal brace.
    for (const px of [ob.x, ob.x + ob.width - 8]) {
      ctx.beginPath();
      ctx.moveTo(px - 2, ob.y);
      ctx.lineTo(px + 4, ob.y - 12);
      ctx.lineTo(px + 10, ob.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#7c4a21';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(ob.x + 4, ob.y + 48);
    ctx.lineTo(ob.x + ob.width - 4, ob.y + 12);
    ctx.stroke();
    ctx.fillStyle = '#a86532';
    ctx.fillRect(ob.x, ob.y + 12, ob.width, 3);
  } else if (ob.kind === KIND_PUMPKIN) {
    ctx.save();
    ctx.translate(ob.x + ob.width / 2, ob.y + ob.height / 2);
    ctx.rotate(ob.roll);
    ctx.fillStyle = '#e07a3f';
    ellipse(ctx, 0, 0, 29, 26);
    ctx.strokeStyle = '#b85c1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(-3, -30, 6, 10);
    // Leaf.
    ctx.beginPath();
    ctx.ellipse(10, -28, 10, 5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Grumpy face.
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-16, 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -6);
    ctx.lineTo(6, -2);
    ctx.lineTo(16, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (ob.kind === KIND_TRAP) {
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, 6);
    ctx.fill();
    // Cheese bait, so the trap reads as a trap, not a brown slab.
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(ob.x + 12, ob.y + 20);
    ctx.lineTo(ob.x + 40, ob.y + 20);
    ctx.lineTo(ob.x + 26, ob.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b57f1e';
    ellipse(ctx, ob.x + 24, ob.y + 16, 2, 2);
    ellipse(ctx, ob.x + 32, ob.y + 18, 2, 2);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ob.x + ob.width / 2, ob.y + 6, 16, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#d43d2a';
    ellipse(ctx, ob.x + ob.width / 2, ob.y + 8, 5, 5);
  } else if (ob.kind === KIND_KNIFE) {
    const angle = Math.sin(ob.swing) * 0.55;
    ctx.save();
    ctx.translate(ob.pivotX, ob.pivotY);
    // Faint dashed arc showing the swing path, so the threat reads in a
    // still frame — a still screenshot cannot show motion.
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 200, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ground shadow under the blade's lowest sweep.
    const shadowX = Math.sin(angle) * 250;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(shadowX, GROUND_Y - ob.pivotY + 4, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // The beam the rope hangs from.
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(-52, -9, 104, 14);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-52, -9, 104, 4);
    ctx.rotate(angle);
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 190);
    ctx.stroke();
    // Wide flashing silver blade with a red cutting edge, so it reads at
    // thumbnail size. The blade is drawn wider than its thin collision
    // segment — a visual miss still reads as a dodge, never a false hit.
    const flash = 0.55 + 0.45 * Math.sin(world.time * 6 + ob.swing);
    ctx.fillStyle = `rgba(230,238,245,${0.85 + 0.15 * flash})`;
    ctx.beginPath();
    ctx.moveTo(-13, 190);
    ctx.lineTo(13, 190);
    ctx.lineTo(4, 248);
    ctx.lineTo(-4, 248);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${0.7 * flash})`;
    ctx.fillRect(-9, 194, 4, 46);
    ctx.fillStyle = '#3d2412';
    ctx.fillRect(-14, 180, 28, 14);
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(-14, 180, 28, 4);
    ctx.restore();
  } else if (ob.kind === KIND_OVEN) {
    // Glowing oven: a pulsing orange halo, fire behind the door window and
    // a big HOT! label, so it pops off the red kitchen at thumbnail size.
    // The body stays 100x100 — the jump window is unchanged; only the
    // dressing (halo, steam, knobs) extends past the hitbox.
    const glow = 0.6 + 0.4 * Math.sin(ob.glow);
    const cx = ob.x + ob.width / 2;
    const cy = ob.y + ob.height / 2 + 6;
    const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
    halo.addColorStop(0, `rgba(255,120,40,${0.30 + 0.25 * glow})`);
    halo.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(ob.x - 60, ob.y - 60, ob.width + 120, ob.height + 120);
    ctx.fillStyle = '#2b2b33';
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, 10);
    ctx.fill();
    ctx.fillStyle = '#454550';
    ctx.fillRect(ob.x + 10, ob.y + 10, ob.width - 20, 22);
    // Control knobs.
    ctx.fillStyle = '#c0392b';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(ob.x + 26 + i * 24, ob.y + 21, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('HOT!', ob.x + ob.width / 2 - 18, ob.y + 44);
    // Door window with licking flames.
    ctx.fillStyle = '#14141c';
    roundRect(ctx, ob.x + 14, ob.y + 52, ob.width - 28, 36, 6);
    ctx.fill();
    for (let i = 0; i < 3; i += 1) {
      const fx = ob.x + 28 + i * 22;
      const fh = 16 + 8 * Math.sin(ob.glow * 2 + i * 2);
      ctx.fillStyle = i % 2 === 0 ? '#ff7a1a' : '#ffd166';
      ctx.beginPath();
      ctx.moveTo(fx - 8, ob.y + 86);
      ctx.quadraticCurveTo(fx - 10, ob.y + 86 - fh, fx, ob.y + 86 - fh - 8);
      ctx.quadraticCurveTo(fx + 10, ob.y + 86 - fh, fx + 8, ob.y + 86);
      ctx.closePath();
      ctx.fill();
    }
    // Heat shimmer marks and steam puffs.
    ctx.strokeStyle = `rgba(255,120,60,${0.5 + 0.3 * glow})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const hx = ob.x + 24 + i * 30;
      ctx.beginPath();
      ctx.moveTo(hx, ob.y - 6);
      ctx.quadraticCurveTo(hx + 8, ob.y - 18, hx, ob.y - 30);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * glow})`;
    ellipse(ctx, ob.x + 30, ob.y - 34 - 4 * glow, 7, 5);
    ellipse(ctx, ob.x + 70, ob.y - 40 - 6 * glow, 8, 6);
  } else if (ob.kind === KIND_HAY) {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.moveTo(ob.x, ob.y + ob.height);
    ctx.quadraticCurveTo(ob.x + ob.width / 2, ob.y - 30, ob.x + ob.width, ob.y + ob.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b57f1e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 16 + i * 18, ob.y + ob.height - 12);
      ctx.lineTo(ob.x + 10 + i * 18, ob.y + 26);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('HIDE HERE ↓', ob.x + 18, ob.y + ob.height - 8);
  }
}

function drawPickup(ctx, pk) {
  const bobY = Math.sin(pk.bob) * 4;
  // Soft glow so pickups read at thumbnail size instead of vanishing.
  const glowColor = pk.kind === KIND_CORN ? '255,209,102' : pk.kind === KIND_PIE ? '255,157,92' : '255,226,122';
  const pg = ctx.createRadialGradient(pk.x, pk.y + bobY, 2, pk.x, pk.y + bobY, 32);
  pg.addColorStop(0, `rgba(${glowColor},0.4)`);
  pg.addColorStop(1, `rgba(${glowColor},0)`);
  ctx.fillStyle = pg;
  ctx.fillRect(pk.x - 32, pk.y + bobY - 32, 64, 64);
  if (pk.kind === KIND_CORN) {
    ctx.save();
    ctx.translate(pk.x, pk.y + bobY);
    ctx.fillStyle = '#ffd166';
    ellipse(ctx, 0, 0, 11, 15);
    ctx.fillStyle = '#f4a900';
    for (let r = -1; r <= 1; r += 1) {
      for (let c = -1; c <= 1; c += 1) ellipse(ctx, c * 6, r * 7, 2.5, 2.5);
    }
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(0, -24);
    ctx.lineTo(8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (pk.kind === KIND_PIE) {
    ctx.save();
    ctx.translate(pk.x, pk.y + bobY);
    ctx.fillStyle = '#c65a1e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 16, -0.4, 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d43d2a';
    ellipse(ctx, 6, -2, 4, 4);
    ctx.restore();
  } else if (pk.kind === KIND_FEATHER) {
    ctx.save();
    ctx.translate(pk.x, pk.y + bobY);
    ctx.rotate(-0.4);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b57f1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHud(ctx, world) {
  const stage = stageFor(world.distanceM);
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  roundRect(ctx, 16, 12, 1248, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${world.score}`, 32, 52);
  ctx.fillText(`DISTANCE ${Math.floor(world.distanceM)} / 1000 m`, 330, 52);
  ctx.fillText(stage.name, 760, 52);
  // Lives as feathers.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < world.lives ? '#ffd166' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(1060 + i * 34, 44, 8, 16, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Farmer proximity bar.
  const frac = 1 - world.farmerGapM / FARMER.maxGapM;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1180, 28, 70, 12, 6);
  ctx.fill();
  ctx.fillStyle = frac > 0.65 ? '#ff3b30' : '#ffd166';
  roundRect(ctx, 1180, 28, Math.max(4, 70 * frac), 12, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FARMER', 1172, 62);
  // Stage banner.
  if (world.stageBanner > 0) {
    ctx.globalAlpha = Math.min(1, world.stageBanner);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.stageBannerText, VIEW.width / 2, 190);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Keep running, Tilly!', VIEW.width / 2, 226);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Floating message.
  if (world.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, world.messageTimer);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW.width / 2, 300);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Danger vignette when the farmer is close (Gemini review: make it visceral).
  if (world.farmerGapM <= FARMER.dangerGapM) {
    const pulse = 0.25 + 0.15 * Math.sin(world.time * 8);
    const vg = ctx.createLinearGradient(0, 0, 220, 0);
    vg.addColorStop(0, `rgba(255,30,20,${pulse})`);
    vg.addColorStop(1, 'rgba(255,30,20,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 220, VIEW.height);
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText("HE'S RIGHT BEHIND YOU!", 24, 120);
  }
  if (world.flashRed > 0) {
    ctx.fillStyle = `rgba(255,40,20,${Math.min(0.25, world.flashRed * 0.4)})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '16px sans-serif';
  ctx.fillText('SPACE jump · ↓ slide / hide · M mute · P pause', 32, 700);
}

function drawTitle(ctx, world) {
  drawSky(ctx, world);
  drawBackdrop(ctx, world);
  // The turkey poses centre-stage on a hay bale, with corn at her feet.
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(560, GROUND_Y);
  ctx.quadraticCurveTo(640, GROUND_Y - 90, 720, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b57f1e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(584 + i * 28, GROUND_Y - 8);
    ctx.lineTo(576 + i * 28, GROUND_Y - 34);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, 588, GROUND_Y - 44, 10, 13);
  ellipse(ctx, 692, GROUND_Y - 40, 10, 13);
  drawTurkey(ctx, world, 640, GROUND_Y - 4, 2.0, false);
  // Farmer peeking from the left edge, bigger now, pitchfork in hand.
  ctx.save();
  ctx.translate(120, GROUND_Y);
  ctx.scale(1.3, 1.3);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-16, -104, 32, 48);
  ctx.fillStyle = '#2b3a67';
  ctx.fillRect(-16, -78, 32, 26);
  ctx.fillStyle = '#e8b88a';
  ellipse(ctx, 0, -116, 13, 13);
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(-8, -110, 16, 4);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 4, -118, 2, 2);
  ellipse(ctx, 10, -118, 2, 2);
  ctx.fillStyle = '#d9a441';
  ellipse(ctx, 0, -126, 22, 5);
  ctx.fillRect(-8, -140, 16, 14);
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-20, -60);
  ctx.lineTo(-28, -128);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-32, -140);
  ctx.lineTo(-28, -128);
  ctx.moveTo(-24, -140);
  ctx.lineTo(-28, -128);
  ctx.stroke();
  ctx.restore();
  // Title block.
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  roundRect(ctx, 240, 60, 800, 210, 18);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("TILLY'S GREAT", 640, 140);
  ctx.fillText('ESCAPE', 640, 210);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('One turkey. One farmer. Zero Thanksgiving dinners.', 640, 250);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE or CLICK to start running', 640, 330);
  ctx.font = '20px sans-serif';
  ctx.fillText('Jump the fences and the oven · Duck the swinging carving knife', 640, 366);
  ctx.fillText('Hide in haystacks when the farmer closes in · Grab corn for points', 640, 396);
  if (world.best > 0) {
    // Off to the right, clear of the turkey: v1 put this pill over her head.
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    roundRect(ctx, 880, 414, 360, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Best escape so far: ${Math.floor(world.best)} m`, 1060, 440);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '16px sans-serif';
  ctx.fillText('SPACE jump · ↓ slide / hide in hay · M mute', 32, 700);
}

function drawEnd(ctx, world, escaped) {
  if (escaped) {
    // The woods: layered forest, not one flat green. Dark far silhouettes,
    // mid trees, near bushes with berries, fireflies and moonbeams.
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#1d4d2b');
    g.addColorStop(1, '#3a7d44');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
    ctx.fillStyle = '#ffd97d';
    ellipse(ctx, 1080, 110, 46, 46);
    ctx.fillStyle = 'rgba(255,233,168,0.5)';
    ellipse(ctx, 1080, 110, 62, 62);
    // Moonbeams slanting down-left.
    ctx.fillStyle = 'rgba(255,233,168,0.07)';
    ctx.beginPath();
    ctx.moveTo(1020, 150);
    ctx.lineTo(1080, 150);
    ctx.lineTo(760, 600);
    ctx.lineTo(620, 600);
    ctx.closePath();
    ctx.fill();
    // Far silhouettes.
    ctx.fillStyle = 'rgba(20,60,30,0.55)';
    for (let x = 20; x < VIEW.width; x += 210) {
      ctx.fillRect(x + 14, GROUND_Y - 260, 14, 260);
      ellipse(ctx, x + 21, GROUND_Y - 280, 56, 48);
    }
    // Mid trees.
    ctx.fillStyle = '#2e7d32';
    for (let x = 60; x < VIEW.width; x += 260) {
      ctx.fillRect(x + 18, GROUND_Y - 220, 18, 220);
      ellipse(ctx, x + 27, GROUND_Y - 240, 70, 60);
    }
    // Near bushes with berries and flowers along the ground.
    ctx.fillStyle = '#1d4d2b';
    for (let x = 0; x < VIEW.width; x += 190) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.quadraticCurveTo(x + 95, GROUND_Y - 64, x + 190, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#e74c3c';
    for (let i = 0; i < 12; i += 1) {
      const bx = 40 + ((i * 173) % 1200);
      const by = GROUND_Y - 18 - ((i * 37) % 30);
      ellipse(ctx, bx, by, 4, 4);
    }
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 6; i += 1) {
      const fx = 120 + ((i * 211) % 1050);
      const fy = GROUND_Y - 8 - ((i * 53) % 24);
      ellipse(ctx, fx, fy, 3, 3);
    }
    // Fireflies.
    for (let i = 0; i < 10; i += 1) {
      const fx = 60 + ((i * 197) % 1160);
      const fy = 130 + ((i * 89) % 360);
      ctx.fillStyle = 'rgba(255,226,122,0.25)';
      ellipse(ctx, fx, fy, 10, 10);
      ctx.fillStyle = '#ffe27a';
      ellipse(ctx, fx, fy, 3, 3);
    }
    ctx.fillStyle = '#1d4d2b';
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
    drawTurkey(ctx, world, 1030, GROUND_Y - 4, 1.6, false);
  } else {
    drawSky(ctx, world);
    drawBackdrop(ctx, world);
    // Caught: the farmer holds Tilly up by the legs, both clear of the panel.
    drawFarmer(ctx, { ...world, farmerGapM: 0, farmerLunge: 0, surgeActive: 0, time: world.time }, 860, 1.15);
    ctx.save();
    ctx.translate(985, GROUND_Y - 150);
    ctx.rotate(Math.PI);
    drawTurkey(ctx, world, 0, 0, 1.2, false);
    ctx.restore();
    // The serving cloche waiting on the ground: dinner is served.
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.ellipse(1140, GROUND_Y - 6, 74, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8eef0';
    ctx.beginPath();
    ctx.arc(1140, GROUND_Y - 8, 52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(1122, GROUND_Y - 38, 12, 18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#90a4ae';
    ellipse(ctx, 1140, GROUND_Y - 62, 7, 6);
  }
  // Title on a dark pill so it reads on any backdrop.
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  roundRect(ctx, 340, 84, 600, 130, 18);
  ctx.fill();
  ctx.textAlign = 'center';
  if (escaped) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('ESCAPED!', 640, 150);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Tilly made it to the woods. No Thanksgiving dinner today!', 640, 196);
  } else {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('CAUGHT!', 640, 150);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('The farmer got her... Thanksgiving dinner is served.', 640, 196);
  }
  ctx.textAlign = 'left';
  // Stats panel: centred for the escape, shifted left for the catch so the
  // farmer and Tilly have the right side of the frame to themselves.
  const panelCX = escaped ? 640 : 390;
  ctx.fillStyle = 'rgba(20,12,6,0.65)';
  roundRect(ctx, panelCX - 250, 260, 500, 220, 16);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCORE  ${world.score}`, panelCX, 320);
  ctx.fillText(`DISTANCE  ${Math.floor(world.distanceM)} m`, panelCX, 366);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`BEST  ${Math.floor(world.best)} m`, panelCX, 412);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Press R or CLICK to run again', panelCX, 462);
  ctx.textAlign = 'left';
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = alpha;
    if (pt.kind === 'dust') {
      ctx.fillStyle = '#d9c39a';
      ellipse(ctx, pt.x, pt.y, pt.size, pt.size * 0.7);
    } else if (pt.kind === 'feather') {
      ctx.fillStyle = '#8a4b1f';
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, pt.size * 0.5, pt.size, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffd166';
      ellipse(ctx, pt.x, pt.y, pt.size * 0.6, pt.size * 0.6);
    }
  }
  ctx.globalAlpha = 1;
}

/** Draw one frame for the world's current screen. */
export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return;
  }
  if (world.screen === SCREEN_CAUGHT) {
    drawEnd(ctx, world, false);
    return;
  }
  if (world.screen === SCREEN_ESCAPED) {
    drawEnd(ctx, world, true);
    return;
  }
  // Play. The world shakes on a stumble; the HUD stays steady.
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 22;
    ctx.translate(Math.sin(world.time * 91) * mag, Math.cos(world.time * 113) * mag * 0.6);
  }
  drawSky(ctx, world);
  drawBackdrop(ctx, world);
  for (const ob of world.obstacles) drawObstacle(ctx, ob, world);
  for (const pk of world.pickups) drawPickup(ctx, pk);
  drawParticles(ctx, world);
  drawFarmer(ctx, world);
  const p = world.player;
  if (!p.hidden) {
    const flicker = p.invulnerableTimer > 0 && Math.floor(world.time * 12) % 2 === 0;
    if (!flicker) {
      // Squash on landing, stretch while rising: a little juice, no new art.
      let squashX = 1;
      let squashY = 1;
      if (world.squash > 0) {
        squashX = 1 + world.squash * 0.8;
        squashY = 1 - world.squash * 1.0;
      } else if (!p.grounded && p.vy < -200) {
        squashX = 0.94;
        squashY = 1.08;
      }
      if (p.sliding) {
        ctx.save();
        ctx.translate(PLAYER.x + 32, GROUND_Y);
        ctx.rotate(0.5);
        drawTurkey(ctx, world, 0, 0, 1.0, true);
        ctx.restore();
      } else {
        // Drawn 12% larger than the hitbox: the head pokes above it, which
        // is the forgiving direction, and she reads at contact-sheet size.
        drawTurkey(ctx, world, PLAYER.x + 32, p.y + PLAYER.height, 1.12, true, squashX, squashY);
      }
    }
  } else {
    // Hidden: just a tuft of feathers poking out of the hay.
    ctx.fillStyle = '#8a4b1f';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(PLAYER.x + 22 + i * 12, GROUND_Y - 96, 6, 14, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  drawHud(ctx, world);
}
