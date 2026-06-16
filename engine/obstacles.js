// ============================================================================
// MODULE: Obstacles
// PURPOSE: Hindernisse erzeugen, bewegen, Kollision + Proximity prüfen
// ============================================================================

import { playClose } from '../engine/audio.js';

export const obstacles = [];
let nextObstacleIn = 0;

export function initObstacles(canvas) {
    obstacles.length = 0;
    nextObstacleIn   = _randomRange(canvas, 300, 500);
}

function _randomRange(_, min, max) {
    return Math.random() * (max - min) + min;
}

export function createObstacle(canvas) {
    const type = Math.random() < 0.5 ? 'rect' : 'logo';
    obstacles.push({
        x:        canvas.width + 50,
        width:    type === 'rect' ? 40 : 60,
        height:   type === 'rect' ? 60 : 60,
        type:     type,
        angle:    0,
        bobPhase: Math.random() * Math.PI * 2
    });

    // Basis-Abstand 300–500px, bei höherem Score leicht reduziert (min 60%)
    const difficultyFactor = Math.max(0.6, 1 - _score / 120);
    nextObstacleIn = (300 + Math.random() * 200) * difficultyFactor;

    // 20% Chance auf extra Lücke von 200–300px (Verschnaufpause)
    if (Math.random() < 0.2) nextObstacleIn += 200 + Math.random() * 100;
}

// Internes Score-Handle damit obstacles.js das Timing berechnen kann
let _score = 0;
export function syncScore(s) { _score = s; }

// Returns: { scored: bool, proximity: 'close'|'safe'|null, gameOver: bool }
export function updateObstacles({
    canvas,
    groundHeight,
    gameSpeed,
    player,
    speedMultiplier = 1,
    onGameOver
}) {
    let scored    = false;
    let proximity = null;

    nextObstacleIn -= gameSpeed * speedMultiplier;
    if (nextObstacleIn <= 0) createObstacle(canvas);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x       -= gameSpeed * speedMultiplier;
        if (o.type === 'logo') o.angle -= 0.1 * speedMultiplier;
        o.bobPhase += 0.05 * speedMultiplier;

        const obstacleY = canvas.height - groundHeight - o.height;

        // Collision
        if (
            player.x < o.x + o.width  - 5 &&
            player.x + player.width  > o.x + 5 &&
            player.y < obstacleY + o.height - 5 &&
            player.y + player.height > obstacleY + 5
        ) {
            onGameOver?.();
        }

        // Off-screen → score
        if (o.x + o.width < 0) {
            obstacles.splice(i, 1);
            scored = true;

            // Proximity Check
            const playerBottom   = player.y + player.height;
            const obstacleTop    = canvas.height - groundHeight - o.height;
            const gap            = playerBottom - obstacleTop;

            if (gap > -5 && gap < 25) {
                proximity = 'close';
                playClose();
            } else if (gap >= 25 && gap < 55) {
                proximity = 'safe';
            }
        }
    }
    return { scored, proximity };
}

// ── Draw ──────────────────────────────────────────────────────────────────────
export function drawObstacles(ctx, canvas, groundHeight, cameraOffsetY, logoImg, logoFallback) {
    obstacles.forEach(o => {
        const baseY = canvas.height - groundHeight - o.height + cameraOffsetY;

        if (o.type === 'rect') {
            const bob = Math.sin(o.bobPhase) * 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(o.x + 5, canvas.height - groundHeight + cameraOffsetY, o.width - 10, 5);
            ctx.fillStyle = '#e63946';
            ctx.fillRect(o.x, baseY + bob, o.width, o.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(o.x + 5, baseY + bob + 5, o.width - 10, 10);
        } else {
            const r  = o.width / 2;
            const cx = o.x + r;
            const cy = baseY + r;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(cx, canvas.height - groundHeight + cameraOffsetY, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(o.angle);
            const img = (logoImg?.complete && logoImg.naturalWidth > 0) ? logoImg : logoFallback;
            ctx.drawImage(img, -r, -r, o.width, o.height);
            ctx.restore();
        }
    });
}
