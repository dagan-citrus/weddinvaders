import {
  GAME_WIDTH, GAME_HEIGHT, PLAY_HEIGHT, HUD_HEIGHT,
  PANEL_WIDTH, CANVAS_WIDTH,
  TOTAL_ROWS, ROW_HEIGHT,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  BULLET_WIDTH, BULLET_HEIGHT,
  ITEM_WIDTH, ITEM_HEIGHT,
  AMMO_META, AMMO_ORDER,
  WEDDING_ITEMS,
} from './constants';
import { LEVELS } from './levels';

// ── helpers ─────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ── background ──────────────────────────────────────────────────────────────

const BG_TOP = '#1a3a70';
const BG_MID = '#22478a';
const BG_BOT = '#1a3a70';

function drawBackground(ctx, players) {
  const grad = ctx.createLinearGradient(0, 0, 0, PLAY_HEIGHT);
  grad.addColorStop(0,   BG_TOP);
  grad.addColorStop(0.5, BG_MID);
  grad.addColorStop(1,   BG_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, PLAY_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 80; i++) {
    const sx = (i * 137 + 11) % GAME_WIDTH;
    const sy = (i * 97  + 23) % PLAY_HEIGHT;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  ctx.setLineDash([4, 12]);
  ctx.lineWidth   = 1;
  for (let r = 0; r <= TOTAL_ROWS; r++) {
    const y = r * ROW_HEIGHT;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
  }
  ctx.setLineDash([]);

  const gRow = players.groom.row;
  const bRow = players.bride.row;
  if (bRow - gRow > 1) {
    const y1 = (gRow + 1) * ROW_HEIGHT;
    const y2 = bRow * ROW_HEIGHT;
    ctx.fillStyle = 'rgba(180,220,255,0.05)';
    ctx.fillRect(0, y1, GAME_WIDTH, y2 - y1);
  }
}

// ── player sprites ───────────────────────────────────────────────────────────

function drawPlayer(ctx, player, img, isGroom) {
  if (!player.alive) return;
  const { x, y } = player;
  const w = PLAYER_WIDTH, h = PLAYER_HEIGHT;

  ctx.save();
  if (img) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Fallback coloured box + emoji
    ctx.fillStyle = isGroom ? '#4169e1' : '#ff69b4';
    ctx.fillRect(x, y, w, h);
    ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isGroom ? '🤵' : '👰', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  // Ammo label: below sprite for groom (at top), above sprite for bride (at bottom)
  const ammoMeta = AMMO_META[player.selectedAmmo];
  ctx.font      = '13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = ammoMeta.color;
  ctx.fillText(ammoMeta.label, x + w / 2, isGroom ? y + h + 14 : y - 4);
}

// ── bullets ──────────────────────────────────────────────────────────────────

function drawBullet(ctx, b) {
  const meta  = AMMO_META[b.ammoType];
  const color = meta?.color ?? '#fff';
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.ellipse(
    b.x + BULLET_WIDTH / 2, b.y + BULLET_HEIGHT / 2,
    BULLET_WIDTH / 2, BULLET_HEIGHT / 2,
    0, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

// ── item cards ───────────────────────────────────────────────────────────────
//
//  Card layout (ITEM_WIDTH=68 × ITEM_HEIGHT=56):
//    y+0  … y+4   top padding
//    y+4  … y+28  large emoji icon (26px, center at y+16)
//    y+28 … y+36  short text label (bold 7px)
//    y+36 … y+43  price text / +income text
//    y+43 … y+53  HP bar (purchasable items)
//

function drawItem(ctx, item) {
  const { x, y, templateId, label, emoji, price, maxPrice, essential, flashTimer,
          incomeType, incomeAmount } = item;

  const flashing = flashTimer > 0 && Math.floor(flashTimer / 2) % 2 === 0;
  ctx.globalAlpha = flashing ? 0.35 : 1;

  // Card background + border
  const bg     = essential ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.08)';
  const border = essential ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.10)';
  roundRect(ctx, x, y, ITEM_WIDTH, ITEM_HEIGHT, 8);
  ctx.fillStyle   = bg;     ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = essential ? 2 : 1; ctx.stroke();

  // Large emoji icon — centred in upper portion of card
  ctx.font         = '26px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#fff';
  ctx.fillText(emoji ?? '❓', x + ITEM_WIDTH / 2, y + 16);
  ctx.textBaseline = 'alphabetic';

  // Short item name label
  ctx.font      = 'bold 7px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.textAlign = 'center';
  ctx.fillText(label ?? templateId, x + ITEM_WIDTH / 2, y + 33);

  // Bottom info — price bar, income amount, or special text
  const barX = x + 4, barY = y + ITEM_HEIGHT - 12;
  const barW = ITEM_WIDTH - 8, barH = 7;

  if (maxPrice > 0) {
    // HP bar
    const pct = price / maxPrice;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.2 ? '#ff9800' : '#f44336';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(`$${Math.ceil(price)}`, x + ITEM_WIDTH / 2, barY - 2);

  } else if (incomeType === 'income') {
    ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#4caf50'; ctx.textAlign = 'center';
    ctx.fillText(`+$${incomeAmount}`, x + ITEM_WIDTH / 2, y + ITEM_HEIGHT - 3);
    // Ammo-hint badge (top-right corner)
    const ammoHint = (templateId === 'parent_bride' || templateId === 'parent_groom') ? '💕' : '💌';
    ctx.font = '10px Arial';
    ctx.fillText(ammoHint, x + ITEM_WIDTH - 9, y + 11);

  } else if (incomeType === 'mine') {
    ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#f44336'; ctx.textAlign = 'center';
    ctx.fillText('⚡ DANGER', x + ITEM_WIDTH / 2, y + ITEM_HEIGHT - 3);

  } else if (incomeType === 'discount') {
    ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#ff9800'; ctx.textAlign = 'center';
    ctx.fillText('−30% OFF', x + ITEM_WIDTH / 2, y + ITEM_HEIGHT - 3);

  } else if (incomeType === 'time') {
    ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#64b5f6'; ctx.textAlign = 'center';
    ctx.fillText('⏳ SLOW TIME', x + ITEM_WIDTH / 2, y + ITEM_HEIGHT - 3);
  }

  // Required-item star (top-left)
  if (essential) {
    ctx.font = '10px Arial'; ctx.textAlign = 'left';
    ctx.fillText('⭐', x + 2, y + 11);
  }

  ctx.globalAlpha = 1;
}

// ── side panel ───────────────────────────────────────────────────────────────

function drawPanel(ctx, state) {
  const { acquiredItems, currentLevel, score = 0 } = state;
  const level  = LEVELS[currentLevel] ?? LEVELS[0];
  const panelX = GAME_WIDTH;
  const midX   = panelX + PANEL_WIDTH / 2;

  // ── Background + left border ──────────────────────────────────────────
  ctx.fillStyle = 'rgba(8, 16, 42, 0.98)';
  ctx.fillRect(panelX, 0, PANEL_WIDTH, GAME_HEIGHT);
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(panelX, 0); ctx.lineTo(panelX, GAME_HEIGHT); ctx.stroke();

  // ── Header: level number + name ───────────────────────────────────────
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = 'bold 11px monospace';
  ctx.fillStyle    = '#ffd700';
  ctx.fillText(`LEVEL ${level.id}`, midX, 13);

  ctx.font      = '9px Arial';
  ctx.fillStyle = '#aaa';
  const name = level.name.length > 14 ? level.name.slice(0, 13) + '…' : level.name;
  ctx.fillText(name, midX, 26);

  // Helper — thin horizontal separator
  const drawSep = (y) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 8, y); ctx.lineTo(panelX + PANEL_WIDTH - 8, y);
    ctx.stroke();
  };
  drawSep(34);

  // ── Score display ─────────────────────────────────────────────────────
  ctx.font      = '8px monospace';
  ctx.fillStyle = '#777';
  ctx.textAlign = 'center';
  ctx.fillText('SCORE', midX, 44);

  ctx.font      = 'bold 14px monospace';
  ctx.fillStyle = score > 0 ? '#ffd700' : '#444';
  ctx.fillText(score.toLocaleString(), midX, 58);

  drawSep(66);

  // ── Required items ────────────────────────────────────────────────────
  // Count how many times each id appears in required (supports multi-instance future levels)
  const reqCounts = {};
  level.required.forEach(id => { reqCounts[id] = (reqCounts[id] || 0) + 1; });

  const gotCounts = {};
  acquiredItems.forEach(id => { gotCounts[id] = (gotCounts[id] || 0) + 1; });

  // Unique items in first-appearance order
  const seen = new Set();
  const requiredItems = level.required
    .filter(id => { if (seen.has(id)) return false; seen.add(id); return true; })
    .map(id => WEDDING_ITEMS.find(w => w.id === id))
    .filter(Boolean);

  const REQ_START_Y  = 72;
  const REQ_CARD_H   = 40;
  const REQ_SPACING  = 46;

  requiredItems.forEach((item, i) => {
    const needed  = reqCounts[item.id];
    const got     = Math.min(gotCounts[item.id] || 0, needed);
    const done    = got >= needed;

    const cardX = panelX + 7, cardY = REQ_START_Y + i * REQ_SPACING;
    const cardW = PANEL_WIDTH - 14, cardH = REQ_CARD_H;

    roundRect(ctx, cardX, cardY, cardW, cardH, 6);
    ctx.fillStyle   = done ? 'rgba(76,175,80,0.28)' : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = done ? '#4caf50' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = done ? 1.5 : 1;
    ctx.stroke();

    ctx.font        = '20px Arial';
    ctx.textAlign   = 'center';
    ctx.globalAlpha = done ? 1 : 0.45;
    ctx.fillStyle   = '#fff';
    ctx.fillText(item.emoji, midX, cardY + 17);

    ctx.font      = '8px monospace';
    ctx.fillStyle = done ? '#4caf50' : '#999';
    ctx.fillText(item.label, midX, cardY + 32);

    if (done) {
      ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#4caf50'; ctx.textAlign = 'right';
      ctx.fillText('✓', cardX + cardW - 3, cardY + 13);
    }

    // Show n/N progress badge when multiple of the same item are required
    if (needed > 1) {
      ctx.font      = 'bold 9px monospace';
      ctx.fillStyle = done ? '#4caf50' : '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(`${got}/${needed}`, cardX + cardW - 4, cardY + cardH - 3);
    }

    ctx.globalAlpha = 1;
  });

  // ── Optional (extras) section ─────────────────────────────────────────
  // Only show purchasable optional items (incomeType === null / undefined)
  const optionalDefs = (level.optional ?? [])
    .map(id => WEDDING_ITEMS.find(w => w.id === id))
    .filter(w => w && !w.incomeType);

  if (optionalDefs.length > 0) {
    const extrasY = REQ_START_Y + requiredItems.length * REQ_SPACING + 8;

    drawSep(extrasY);
    ctx.font      = '8px monospace';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRAS', midX, extrasY + 10);

    const OPT_CARD_H  = 28;
    const OPT_SPACING = 32;

    optionalDefs.forEach((item, i) => {
      const acquired = acquiredItems.includes(item.id);
      const cardX    = panelX + 7;
      const cardY    = extrasY + 16 + i * OPT_SPACING;
      const cardW    = PANEL_WIDTH - 14;

      roundRect(ctx, cardX, cardY, cardW, OPT_CARD_H, 5);
      ctx.fillStyle   = acquired ? 'rgba(100,180,255,0.22)' : 'rgba(255,255,255,0.03)';
      ctx.fill();
      ctx.strokeStyle = acquired ? '#64b4ff' : 'rgba(255,255,255,0.10)';
      ctx.lineWidth   = acquired ? 1.5 : 1;
      ctx.stroke();

      ctx.font        = '16px Arial';
      ctx.textAlign   = 'center';
      ctx.globalAlpha = acquired ? 1 : 0.30;
      ctx.fillStyle   = '#fff';
      ctx.fillText(item.emoji, midX, cardY + 13);

      ctx.font      = '7px monospace';
      ctx.fillStyle = acquired ? '#64b4ff' : '#555';
      ctx.fillText(item.label, midX, cardY + 24);

      if (acquired) {
        ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#64b4ff'; ctx.textAlign = 'right';
        ctx.fillText('✓', cardX + cardW - 3, cardY + 11);
      }

      ctx.globalAlpha = 1;
    });
  }

  ctx.textBaseline = 'alphabetic';
}

// ── HUD ──────────────────────────────────────────────────────────────────────

function drawHUD(ctx, state) {
  const { time, money, ammo, lives, players, discount } = state;
  const hudY = PLAY_HEIGHT;

  ctx.fillStyle = 'rgba(10,20,50,0.94)';
  ctx.fillRect(0, hudY, GAME_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(0, hudY); ctx.lineTo(GAME_WIDTH, hudY); ctx.stroke();

  ctx.font = '18px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('❤️'.repeat(lives), 10, hudY + 20);

  const mins = Math.floor(time / 60), secs = time % 60;
  ctx.font      = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = time < 20 ? '#f44336' : time < 30 ? '#ff9800' : '#fff';
  ctx.fillText(`${mins}:${String(secs).padStart(2,'0')}`, GAME_WIDTH / 2, hudY + 20);

  ctx.font      = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = money < 200 ? '#f44336' : '#4caf50';
  ctx.fillText(`💰 $${Math.floor(money)}`, GAME_WIDTH - 10, hudY + 20);

  ctx.font = '13px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#aaa';
  ctx.fillText(`💌×${ammo.invite}  💕×${ammo.heart}`, 10, hudY + 44);

  const bMeta = AMMO_META[players.bride.selectedAmmo];
  ctx.font = 'bold 13px monospace'; ctx.fillStyle = bMeta.color; ctx.textAlign = 'left';
  ctx.fillText(`👰 ${bMeta.label}`, 130, hudY + 44);

  const gMeta = AMMO_META[players.groom.selectedAmmo];
  ctx.font = 'bold 13px monospace'; ctx.fillStyle = gMeta.color; ctx.textAlign = 'right';
  ctx.fillText(`${gMeta.label} 🤵`, GAME_WIDTH - 10, hudY + 44);

  if (discount < 1) {
    ctx.font = 'bold 13px monospace'; ctx.fillStyle = '#ff9800'; ctx.textAlign = 'center';
    ctx.fillText(`🎀 −${Math.round((1 - discount) * 100)}% off`, GAME_WIDTH / 2, hudY + 44);
  }
  ctx.textBaseline = 'alphabetic';
}

// ── floating messages ────────────────────────────────────────────────────────

function drawMessages(ctx, messages) {
  for (const m of messages) {
    const alpha = Math.min(1, m.timer / 25);
    const rise  = (90 - m.timer) * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font        = 'bold 16px monospace';
    ctx.textAlign   = 'center';
    ctx.fillStyle   = m.color ?? '#fff';
    ctx.shadowColor = m.color ?? '#fff';
    ctx.shadowBlur  = 6;
    ctx.fillText(m.text, m.x + ITEM_WIDTH / 2, m.y - rise);
    ctx.restore();
  }
}

// ── advance animation ────────────────────────────────────────────────────────

function drawAdvanceAnim(ctx, anim) {
  if (anim <= 0) return;
  const alpha = anim / 60;
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle   = 'rgba(255,215,0,0.08)';
  ctx.fillRect(0, 0, GAME_WIDTH, PLAY_HEIGHT);
  ctx.globalAlpha = alpha;
  ctx.font        = 'bold 26px monospace';
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur  = 20;
  ctx.fillText('💒  ADVANCING…  💒', GAME_WIDTH / 2, PLAY_HEIGHT / 2);
  ctx.restore();
}

// ── meeting scene (players physically meet) ──────────────────────────────────

function drawMeeting(ctx, state, assets) {
  const { meetingTimer, currentLevel, players } = state;
  const isLastLevel = currentLevel >= LEVELS.length - 1;

  // Blue gradient background (play area)
  const grad = ctx.createLinearGradient(0, 0, 0, PLAY_HEIGHT);
  grad.addColorStop(0,   BG_TOP);
  grad.addColorStop(0.5, BG_MID);
  grad.addColorStop(1,   BG_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, PLAY_HEIGHT);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 80; i++) {
    ctx.fillRect((i * 137 + 11) % GAME_WIDTH, (i * 97 + 23) % PLAY_HEIGHT, 1.5, 1.5);
  }

  // Animated sparkles — only after blink phase
  if (meetingTimer >= 60) {
    const sparkSeed = Math.floor(meetingTimer / 3);
    for (let i = 0; i < 14; i++) {
      const sx = (sparkSeed * 41 + i * 193) % GAME_WIDTH;
      const sy = (sparkSeed * 67 + i * 127) % PLAY_HEIGHT;
      const sr = 1 + (i % 3) * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle   = ['#ffd700','#fff','#ffb3ef','#b3e5ff'][i % 4];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ── Blink phase (frames 0–59): sprites side-by-side in the middle row ────
  if (meetingTimer < 60) {
    const midRow   = Math.floor(TOTAL_ROWS / 2);          // row 4
    const meetY    = midRow * ROW_HEIGHT + (ROW_HEIGHT - PLAYER_HEIGHT) / 2;
    const gap      = 8;
    const blinkOn  = Math.floor(meetingTimer / 12) % 2 === 0; // on/off every 12 frames

    if (blinkOn) {
      const groomImg = assets?.groom?.complete ? assets.groom : null;
      const brideImg = assets?.bride?.complete ? assets.bride : null;
      const meetBride = { ...players.bride, x: GAME_WIDTH / 2 - PLAYER_WIDTH - gap, y: meetY, alive: true };
      const meetGroom = { ...players.groom, x: GAME_WIDTH / 2 + gap,              y: meetY, alive: true };
      drawPlayer(ctx, meetBride, brideImg, false);
      drawPlayer(ctx, meetGroom, groomImg, true);
    }
  }

  // ── Couple image — fades in starting at frame 60 ──────────────────────
  if (meetingTimer >= 60) {
    const img = assets?.couple;
    if (img?.complete) {
      const fadeAlpha = Math.min(1, (meetingTimer - 60) / 30);
      const cw = 320;
      const ch = Math.round(cw * img.naturalHeight / img.naturalWidth);
      ctx.globalAlpha = fadeAlpha;
      ctx.drawImage(img,
        GAME_WIDTH / 2 - cw / 2,
        PLAY_HEIGHT * 0.40 - ch / 2,
        cw, ch
      );
      ctx.globalAlpha = 1;
    }
  }

  // HUD strip
  ctx.fillStyle = 'rgba(10,20,50,0.94)';
  ctx.fillRect(0, PLAY_HEIGHT, GAME_WIDTH, HUD_HEIGHT);

  // Level complete text — appears after 80 frames (couple image mostly visible)
  if (meetingTimer >= 80) {
    const tAlpha = Math.min(1, (meetingTimer - 80) / 20);
    ctx.globalAlpha = tAlpha;
    ctx.textAlign   = 'center';

    if (isLastLevel) {
      ctx.font        = 'bold 40px monospace';
      ctx.fillStyle   = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 22;
      ctx.fillText("🎉  MARRIED!  🎉", GAME_WIDTH / 2, PLAY_HEIGHT - 55);
    } else {
      ctx.font        = 'bold 34px monospace';
      ctx.fillStyle   = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 22;
      ctx.fillText('💒  Level Complete!  💒', GAME_WIDTH / 2, PLAY_HEIGHT - 65);
      ctx.shadowBlur = 0;

      const nextLevel = LEVELS[currentLevel + 1];
      if (nextLevel) {
        ctx.font      = '17px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText(`Next: Level ${nextLevel.id} — ${nextLevel.name}`, GAME_WIDTH / 2, PLAY_HEIGHT - 34);
      }
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }

  // "Press any key" prompt — appears after 110 frames
  if (meetingTimer >= 110) {
    const pAlpha = Math.min(1, (meetingTimer - 110) / 20);
    ctx.globalAlpha = pAlpha;
    ctx.font        = 'bold 15px Arial';
    ctx.fillStyle   = '#ffd700';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 8;
    ctx.fillText('— Press any key to continue —', GAME_WIDTH / 2, PLAY_HEIGHT + 36);
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }
}

// ── title screen ─────────────────────────────────────────────────────────────

function drawTitle(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0,   BG_TOP);
  grad.addColorStop(0.5, BG_MID);
  grad.addColorStop(1,   BG_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 90; i++) {
    ctx.fillRect((i * 137 + 11) % CANVAS_WIDTH, (i * 97 + 23) % GAME_HEIGHT, 1, 1);
  }

  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 58px monospace';
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 24;
  ctx.fillText("WEDDIN'VADERS", GAME_WIDTH / 2, 140);
  ctx.shadowBlur = 0;

  ctx.font = '20px Arial'; ctx.fillStyle = '#ffd700';
  ctx.fillText('Buy the wedding of your dreams!', GAME_WIDTH / 2, 188);

  const lines = [
    '👰 Bride  —  A/D move   ·   S ammo   ·   W shoot',
    '🤵 Groom  —  ←/→ move   ·   ↑/↓ ammo   ·   Space shoot',
    '',
    '💵 Cash shoots at items to buy them',
    '💌 Send invites to guests — they attend & bring gift money!',
    '💕 Send hearts to family — they donate BIG bucks!',
    '',
    'Collect items on the right panel. N = fast-forward once done!',
    '',
    '— Press any key to begin —',
  ];
  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1;
    ctx.font      = isLast ? 'bold 18px Arial' : '15px Arial';
    ctx.fillStyle = isLast ? '#ffd700' : (line === '' ? '#fff' : '#ccc');
    if (isLast) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10; }
    ctx.fillText(line, GAME_WIDTH / 2, 240 + i * 26);
    ctx.shadowBlur = 0;
  });

  drawPanel(ctx, { acquiredItems: [], currentLevel: 0 });
}

// ── overlays ─────────────────────────────────────────────────────────────────

function drawOverlay(ctx, state, assets) {
  const { phase, currentLevel, acquiredItems, lives } = state;
  const level = LEVELS[currentLevel] ?? LEVELS[0];

  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (phase === 'levelComplete') {
    const nextLevel = LEVELS[currentLevel + 1];
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 42px monospace';
    ctx.fillStyle   = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 24;
    ctx.fillText('🎊 Level Complete! 🎊', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
    ctx.shadowBlur = 0;

    if (nextLevel) {
      ctx.font = '22px Arial'; ctx.fillStyle = '#fff';
      ctx.fillText(`Next: Lvl ${nextLevel.id} — ${nextLevel.name}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
    ctx.font = '18px Arial'; ctx.fillStyle = '#ccc';
    ctx.fillText('Press any key to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 44);

  } else if (phase === 'gameComplete') {
    const img = assets?.couple;
    if (img?.complete) {
      const cw = 280, ch = Math.round(cw * img.naturalHeight / img.naturalWidth);
      ctx.drawImage(img, GAME_WIDTH / 2 - cw / 2, GAME_HEIGHT / 2 - ch / 2 - 60, cw, ch);
    }
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 44px monospace';
    ctx.fillStyle   = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 24;
    ctx.fillText("🎉 YOU'RE MARRIED! 🎉", GAME_WIDTH / 2, GAME_HEIGHT - 110);
    ctx.shadowBlur = 0;
    ctx.font = '18px Arial'; ctx.fillStyle = '#ccc';
    ctx.fillText('Press any key to return to title', GAME_WIDTH / 2, GAME_HEIGHT - 70);

  } else if (phase === 'lost') {
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 48px monospace';
    ctx.fillStyle   = '#f44336';
    ctx.shadowColor = '#f44336';
    ctx.shadowBlur  = 24;
    ctx.fillText('💔 Wedding Failed!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 65);
    ctx.shadowBlur = 0;

    // Explain why — much clearer for the player
    let reason = '';
    if (lives <= 0) {
      reason = '❤️ Ran out of lives';
    } else {
      const uniqueMissing = [...new Set(
        level.required.filter(id => !acquiredItems.includes(id))
      )];
      if (uniqueMissing.length > 0) {
        const labels = uniqueMissing
          .map(id => {
            const w = WEDDING_ITEMS.find(w => w.id === id);
            return w ? `${w.emoji} ${w.label}` : id;
          })
          .join('  ·  ');
        reason = `Still needed: ${labels}`;
      } else {
        reason = '💸 Ran out of money';
      }
    }

    if (reason) {
      ctx.font = '17px Arial'; ctx.fillStyle = '#ffaaaa';
      ctx.fillText(reason, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    }

    ctx.font = '18px Arial'; ctx.fillStyle = '#ccc';
    ctx.fillText('Press R to try again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  }
}

// ── main render entry point ───────────────────────────────────────────────────

export function render(ctx, state, assets) {
  const { phase, players, bullets, items, messages, advanceAnim } = state;

  if (phase === 'title') { drawTitle(ctx); return; }

  // ── Meeting scene: players physically meet ─────────────────────────────────
  if (phase === 'meeting') {
    drawMeeting(ctx, state, assets);
    drawPanel(ctx, state);
    return;
  }

  drawBackground(ctx, players);
  for (const it of items) drawItem(ctx, it);
  for (const b of bullets) drawBullet(ctx, b);

  const groomImg = assets?.groom?.complete ? assets.groom : null;
  const brideImg = assets?.bride?.complete ? assets.bride : null;
  drawPlayer(ctx, players.groom, groomImg, true);   // isGroom = true
  drawPlayer(ctx, players.bride, brideImg, false);  // isGroom = false

  drawMessages(ctx, messages);
  drawAdvanceAnim(ctx, advanceAnim);
  drawHUD(ctx, state);
  drawPanel(ctx, state);

  if (phase === 'levelComplete' || phase === 'gameComplete' || phase === 'lost') {
    drawOverlay(ctx, state, assets);
    drawPanel(ctx, state);  // keep checklist visible on top of overlay
  }
}
