// ============================================================================
// MODULE: Player
// PURPOSE: Spieler-Zustand, Physik, Sprung, Bobing, Staubwolken
// ============================================================================

import { playJump, playLand } from '../engine/audio.js';
import { triggerJumpOffset } from '../engine/camera.js';

export const GRAVITY  = 0.8;
export const JUMP_VEL = -15;

export const player = {
    x:          100,
    y:          0,
    width:      40,
    height:     40,
    vy:         0,
    jumping:    false,
    currentBob: 0,
    wasJumping: false   // für Land-Sound
};

// ── Dust Particles ────────────────────────────────────────────────────────────
const dustParticles = [];

function spawnDust(canvas, groundHeight, gameSpeed) {
    const count = Math.floor(1 + gameSpeed / 8);  // mehr Staub = schneller
    for (let i = 0; i < count; i++) {
        dustParticles.push({
            x:      player.x + Math.random() * player.width,
            y:      canvas.height - groundHeight + Math.random() * 6,
            vx:     -(Math.random() * 2 + 0.5) * (gameSpeed / 6),
            vy:     -(Math.random() * 1.5),
            life:   1.0,
            decay:  0.04 + Math.random() * 0.04,
            size:   2 + Math.random() * 4 * (gameSpeed / 8)
        });
    }
}

export function updateDust() {
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) dustParticles.splice(i, 1);
    }
}

export function drawDust(ctx, cameraOffsetY) {
    for (const p of dustParticles) {
        ctx.save();
        ctx.globalAlpha = p.life * 0.55;
        ctx.fillStyle = '#b0a090';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + cameraOffsetY, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ── Update ────────────────────────────────────────────────────────────────────
export function updatePlayer(canvas, groundHeight, gameSpeed, speedMultiplier = 1) {
    player.vy += GRAVITY * speedMultiplier;
    player.y  += player.vy * speedMultiplier;

    const groundY = canvas.height - groundHeight - player.height;

    if (player.y >= groundY) {
        player.y  = groundY;
        player.vy = 0;
        if (player.jumping) {
            // Gerade gelandet
            playLand();
        }
        player.jumping = false;
    }

    if (!player.jumping) {
        player.currentBob = Math.sin(Date.now() * 0.01) * 3;
        // Staub nur am Boden
        if (Math.random() < 0.35) spawnDust(canvas, groundHeight, gameSpeed);
    } else {
        player.currentBob = 0;
        // Kein Staub in der Luft
    }

    updateDust();
}

export function doJump() {
    if (!player.jumping) {
        player.vy      = JUMP_VEL;
        player.jumping = true;
        playJump();
        triggerJumpOffset(10);
        return true;
    }
    return false;
}

export function resetPlayer(canvas, groundHeight) {
    player.y          = canvas.height - groundHeight - player.height;
    player.vy         = 0;
    player.jumping    = false;
    player.currentBob = 0;
    player.wasJumping = false;
    dustParticles.length = 0;
}

// ── Draw ──────────────────────────────────────────────────────────────────────
export function drawPlayer(ctx, canvas, groundHeight, cameraOffsetY, tint = null) {
    const playerY = player.y + player.currentBob + cameraOffsetY;

    drawDust(ctx, cameraOffsetY);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(player.x + 5, canvas.height - groundHeight + cameraOffsetY, player.width - 10, 5);

    // Body
    ctx.fillStyle = tint || 'white';
    ctx.fillRect(player.x, playerY, player.width, player.height);

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 25, playerY + 10, 8, 8);
}
