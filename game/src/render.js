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
    // Kitchen: big window, hanging pans and a tiled wall band.
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(0, 90, VIEW.width, 190);
    ctx.strokeStyle = '#c65a35';
    ctx.lineWidth = 6;
    ctx.strokeRect(90, 120, 220, 140);
    ctx.beginPath();
    ctx.moveTo(200, 120);
    ctx.lineTo(200, 260);
    ctx.moveTo(90, 190);
    ctx.lineTo(310, 190);
    ctx.stroke();
    ctx.fillStyle = '#ffd97d';
    ellipse(ctx, 200, 190, 60, 46);
    ctx.strokeStyle = '#5e1f1a';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      const px = 480 + i * 130 - ((world.scrollX * 0.1) % 130);
      ctx.beginPath();
      ctx.arc(px, 150, 34, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, 116);
      ctx.lineTo(px, 96);
      ctx.stroke();
    }
  }
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
  // Fence posts scrolling past on the farmyard, tiles in the kitchen.
  ctx.fillStyle = stage.accent;
  if (stage.backdrop === 'kitchen') {
    for (let x = -((world.scrollX) % 64); x < VIEW.width; x += 64) {
      ctx.fillRect(x, GROUND_Y + 46, 58, 6);
    }
  } else {
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
  // Tail fan.
  ctx.fillStyle = '#8a4b1f';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(-26, -46);
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(0, -44, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a4b1f';
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e07a3f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = '#6b3f1d';
  ellipse(ctx, 0, -34, 30, 26);
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, 4, -30, 22, 18);
  // Wing.
  ctx.fillStyle = '#5a3418';
  ctx.beginPath();
  ctx.ellipse(-4, -34, 18, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head and neck.
  ctx.fillStyle = '#a86532';
  ctx.fillRect(20, -72, 12, 34);
  ctx.fillStyle = '#c98a4b';
  ellipse(ctx, 26, -76, 13, 12);
  // Beak, wattle, eye.
  ctx.fillStyle = '#e07a3f';
  ctx.beginPath();
  ctx.moveTo(36, -78);
  ctx.lineTo(48, -74);
  ctx.lineTo(36, -70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d43d2a';
  ellipse(ctx, 32, -64, 4, 7);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 30, -79, 2.5, 2.5);
  ctx.restore();
}

function drawFarmer(ctx, world, xOverride) {
  // Map the gap to the screen so the farmer is always at least peeking in
  // from the left edge, and closes right up behind Tilly as the gap shrinks.
  const x = xOverride ?? (PLAYER.x - 60 - world.farmerGapM * 6 + world.farmerLunge * 26);
  const y = GROUND_Y;
  const swing = Math.sin(world.time * 14) * 12;
  ctx.save();
  ctx.translate(x, y);
  // Legs pumping.
  ctx.strokeStyle = '#2b3a67';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(swing, 0);
  ctx.moveTo(0, -58);
  ctx.lineTo(-swing, 0);
  ctx.stroke();
  // Overalls and shirt.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-16, -104, 32, 48);
  ctx.fillStyle = '#2b3a67';
  ctx.fillRect(-16, -78, 32, 26);
  // Arms reaching forward.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(10, -96);
  ctx.lineTo(30, -76 + swing * 0.4);
  ctx.moveTo(10, -88);
  ctx.lineTo(28, -64 - swing * 0.4);
  ctx.stroke();
  // Head, straw hat, moustache.
  ctx.fillStyle = '#e8b88a';
  ellipse(ctx, 0, -116, 13, 13);
  ctx.fillStyle = '#d9a441';
  ellipse(ctx, 0, -126, 22, 5);
  ctx.fillRect(-8, -140, 16, 14);
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(-8, -110, 16, 4);
  // Angry eyes.
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 5, -118, 2, 2);
  ellipse(ctx, 11, -118, 2, 2);
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
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(-3, -30, 6, 10);
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
    // The beam the rope hangs from.
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(-46, -8, 92, 12);
    ctx.rotate(angle);
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 190);
    ctx.stroke();
    // Flashing silver blade so it reads at thumbnail size.
    const flash = 0.55 + 0.45 * Math.sin(world.time * 6 + ob.swing);
    ctx.fillStyle = `rgba(230,238,245,${0.85 + 0.15 * flash})`;
    ctx.beginPath();
    ctx.moveTo(-8, 190);
    ctx.lineTo(8, 190);
    ctx.lineTo(2, 244);
    ctx.lineTo(-2, 244);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.7 * flash})`;
    ctx.fillRect(-6, 194, 3, 42);
    ctx.fillStyle = '#3d2412';
    ctx.fillRect(-9, 182, 18, 12);
    ctx.restore();
  } else if (ob.kind === KIND_OVEN) {
    // Glowing oven: dark body, bright cyan-blue coils so it pops off the red kitchen.
    // 100 px tall on purpose: taller, and a jump could not stay above it for
    // the whole pass — the oven would be nearly unjumpable.
    ctx.fillStyle = '#2b2b33';
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, 10);
    ctx.fill();
    ctx.fillStyle = '#454550';
    ctx.fillRect(ob.x + 10, ob.y + 10, ob.width - 20, 22);
    const glow = 0.6 + 0.4 * Math.sin(ob.glow);
    ctx.fillStyle = `rgba(77,215,255,${0.35 + 0.4 * glow})`;
    ellipse(ctx, ob.x + ob.width / 2, ob.y + ob.height / 2 + 6, 38, 28);
    ctx.strokeStyle = `rgba(140,235,255,${0.7 + 0.3 * glow})`;
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 18, ob.y + 46 + i * 14);
      ctx.lineTo(ob.x + ob.width - 18, ob.y + 46 + i * 14);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('HOT!', ob.x + ob.width / 2 - 16, ob.y + 26);
    // Heat shimmer marks.
    ctx.strokeStyle = `rgba(255,120,60,${0.5 + 0.3 * glow})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const hx = ob.x + 24 + i * 30;
      ctx.beginPath();
      ctx.moveTo(hx, ob.y - 6);
      ctx.quadraticCurveTo(hx + 8, ob.y - 18, hx, ob.y - 30);
      ctx.stroke();
    }
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
  // The turkey poses centre-stage on a hay bale.
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(560, GROUND_Y);
  ctx.quadraticCurveTo(640, GROUND_Y - 90, 720, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  drawTurkey(ctx, world, 640, GROUND_Y - 4, 1.9, false);
  // Farmer peeking from the left edge.
  ctx.save();
  ctx.translate(120, GROUND_Y);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-16, -104, 32, 48);
  ctx.fillStyle = '#e8b88a';
  ellipse(ctx, 0, -116, 13, 13);
  ctx.fillStyle = '#d9a441';
  ellipse(ctx, 0, -126, 22, 5);
  ctx.fillRect(-8, -140, 16, 14);
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
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    roundRect(ctx, 500, 414, 280, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Best escape so far: ${Math.floor(world.best)} m`, 640, 440);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '16px sans-serif';
  ctx.fillText('SPACE jump · ↓ slide / hide in hay · M mute', 32, 700);
}

function drawEnd(ctx, world, escaped) {
  if (escaped) {
    // The woods: green forest sky, Tilly free under the trees, corn in hand.
    // A fresh backdrop, not the kitchen's — the title must read on dark green.
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#1d4d2b');
    g.addColorStop(1, '#3a7d44');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
    ctx.fillStyle = '#ffd97d';
    ellipse(ctx, 1080, 110, 46, 46);
    ctx.fillStyle = '#2e7d32';
    for (let x = 60; x < VIEW.width; x += 260) {
      ctx.fillRect(x + 18, GROUND_Y - 220, 18, 220);
      ellipse(ctx, x + 27, GROUND_Y - 240, 70, 60);
    }
    ctx.fillStyle = '#1d4d2b';
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
    drawTurkey(ctx, world, 1030, GROUND_Y - 4, 1.5, false);
  } else {
    drawSky(ctx, world);
    drawBackdrop(ctx, world);
    // Caught: the farmer holds Tilly up by the legs, both clear of the panel.
    drawFarmer(ctx, { ...world, farmerGapM: 0, farmerLunge: 0, surgeActive: 0, time: world.time }, 860);
    ctx.save();
    ctx.translate(985, GROUND_Y - 150);
    ctx.rotate(Math.PI);
    drawTurkey(ctx, world, 0, 0, 1.1, false);
    ctx.restore();
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
        drawTurkey(ctx, world, 0, 0, 0.9, true);
        ctx.restore();
      } else {
        drawTurkey(ctx, world, PLAYER.x + 32, p.y + PLAYER.height, 1, true, squashX, squashY);
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
