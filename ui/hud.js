// ============================================================================
// MODULE: HUD
// PURPOSE: In-Game Anzeigen: Score, Speed-Bar, Modus-Badge,
//          Farbverlauf-Übergänge bei Meilensteinen, Blitz-Overlay,
//          Proximity-Label, Pause-Overlay
// ============================================================================

// ── Milestone-Farbpalette (bei 0, 10, 20, 30, 40, 50) ──────────────────────
const SKY_GRADIENTS = [
    // [ stop0, stop50%, stop100% ]
    ['#1a1a2e', '#16213e', '#0f3460'],   // default – dunkelblau
    ['#1a1a2e', '#2d1b3d', '#4a0e5e'],   // Score 10 – lila
    ['#1f0a2e', '#3d0f3a', '#6b0f4a'],   // Score 20 – violett-magenta
    ['#2e0a0a', '#3d1000', '#6b1500'],   // Score 30 – dunkelrot
    ['#2e1a00', '#3d2500', '#6b3800'],   // Score 40 – tiefes orange
    ['#0a2e1a', '#003d25', '#006b38'],   // Score 50+ – dunkles grün
];

// Meilenstein → Farb-Index
function _gradientIndex(score) {
    if (score >= 50) return 5;
    if (score >= 40) return 4;
    if (score >= 30) return 3;
    if (score >= 20) return 2;
    if (score >= 10) return 1;
    return 0;
}

// Aktueller interpolierter Gradient (weicher Übergang)
let _currentGrad  = [...SKY_GRADIENTS[0]];
let _targetGrad   = [...SKY_GRADIENTS[0]];
const _LERP_SPEED = 0.018;

export function updateSkyGradient(score) {
    const idx = _gradientIndex(score);
    _targetGrad = [...SKY_GRADIENTS[idx]];
}

function _lerpColor(a, b, t) {
    // Einfacher Hex-Interpolator
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
}

function _tickGradient() {
    for (let i = 0; i < 3; i++) {
        // Parse & lerp only if different
        if (_currentGrad[i] !== _targetGrad[i]) {
            _currentGrad[i] = _lerpColor(_currentGrad[i], _targetGrad[i], _LERP_SPEED);
        }
    }
}

// ── Blitz-Overlay ─────────────────────────────────────────────────────────────
let _flashAlpha  = 0;
let _flashColor  = 'white';

export function triggerFlash(color = 'white', intensity = 0.6) {
    _flashAlpha = intensity;
    _flashColor = color;
}

// ── Proximity-Label ───────────────────────────────────────────────────────────
let _proximityLabel = null;  // { text, color, alpha, y }

export function setProximityLabel(type, playerY) {
    if (type === 'close') {
        _proximityLabel = { text: 'Close! ⚡', color: '#ff9900', alpha: 1.4, y: playerY - 20 };
    } else if (type === 'safe') {
        _proximityLabel = { text: 'Safe!', color: '#44ff88', alpha: 1.2, y: playerY - 20 };
    }
}

export function clearProximityLabel() { _proximityLabel = null; }

// ── Hauptzeichnung ─────────────────────────────────────────────────────────────
export function drawBackground(ctx, canvas) {
    _tickGradient();
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0,   _currentGrad[0]);
    grad.addColorStop(0.5, _currentGrad[1]);
    grad.addColorStop(1,   _currentGrad[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawSpeedLines(ctx, canvas, gameSpeed) {
    if (gameSpeed <= 12) return;
    const intensity = Math.min((gameSpeed - 12) / 15, 1);
    ctx.strokeStyle = `rgba(255,255,255,${0.1 * intensity})`;
    ctx.lineWidth   = 2;
    const n = Math.floor(5 * intensity);
    for (let i = 0; i < n; i++) {
        const y   = Math.random() * canvas.height;
        const len = 50 + Math.random() * 100;
        const x   = Math.random() * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len, y);
        ctx.stroke();
    }
}

export function drawGround(ctx, canvas, groundHeight, groundOffsetFront, groundOffsetBack, cameraOffsetY) {
    const topY    = canvas.height - groundHeight;
    const halfH   = groundHeight / 2;

    // Upper layer
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(0, topY + cameraOffsetY, canvas.width, halfH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 2;
    for (let x = groundOffsetBack; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, topY + cameraOffsetY);
        ctx.lineTo(x, topY + halfH + cameraOffsetY);
        ctx.stroke();
    }
    // Lower layer
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, topY + halfH + cameraOffsetY, canvas.width, halfH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let x = groundOffsetFront; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, topY + halfH + cameraOffsetY);
        ctx.lineTo(x, canvas.height + cameraOffsetY);
        ctx.stroke();
    }
}

export function drawHUD(ctx, canvas, score, gameSpeed, isPractice, ghost, slowMotion, paused, weatherLabel, timeLabel) {
    // Score
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 32px sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Score: ${score}`, 20, 50);

    // Speed-Bar
    const pct = Math.min(((gameSpeed - 6) / 20) * 100, 100);
    let   col = '#4ade80';
    if (pct > 66) col = '#ef4444';
    else if (pct > 33) col = '#fbbf24';

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font      = '14px sans-serif';
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}x`, 20, 80);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 88, 120, 8);
    ctx.fillStyle = col;
    ctx.fillRect(20, 88, 120 * (pct / 100), 8);

    // Wetter + Tageszeit (oben Mitte)
    if (weatherLabel || timeLabel) {
        const label = [timeLabel, weatherLabel].filter(Boolean).join('  ·  ');
        ctx.save();
        ctx.globalAlpha  = 0.55;
        ctx.fillStyle    = 'white';
        ctx.font         = '13px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, canvas.width / 2, 22);
        ctx.restore();
    }

    // Practice Badges oben rechts
    if (isPractice) {
        // Wasserzeichen
        ctx.save();
        ctx.globalAlpha    = 0.07;
        ctx.fillStyle      = '#ffffff';
        ctx.font           = 'bold 110px sans-serif';
        ctx.textAlign      = 'center';
        ctx.textBaseline   = 'middle';
        ctx.fillText('PRACTICE', canvas.width / 2, canvas.height / 2);
        ctx.restore();

        ctx.textAlign    = 'right';
        ctx.textBaseline = 'alphabetic';
        let badgeY = 50;

        if (ghost?.enabled) {
            ctx.fillStyle = ghost.active ? '#00eeff' : '#888888';
            ctx.font      = 'bold 15px sans-serif';
            ctx.fillText(ghost.active ? '👻 GHOST  ON' : '👻 GHOST  FAILED', canvas.width - 20, badgeY);
            badgeY += 22;
        }
        if (slowMotion) {
            ctx.fillStyle = '#fbbf24';
            ctx.font      = 'bold 15px sans-serif';
            ctx.fillText('🐢 SLOW-MO', canvas.width - 20, badgeY);
        }

        // Keyboard-Hint Desktop
        if (canvas.width > 768) {
            ctx.save();
            ctx.globalAlpha  = 0.35;
            ctx.fillStyle    = 'white';
            ctx.font         = '13px sans-serif';
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('[P] Pause   [S] Slow-Mo   [G] Ghost   [M] Mute', 20, canvas.height - 20);
            ctx.restore();
        }

        // Pause-Overlay
        if (paused) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.fillStyle    = 'white';
            ctx.font         = 'bold 52px sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⏸  PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.font         = '20px sans-serif';
            ctx.fillStyle    = 'rgba(255,255,255,0.6)';
            ctx.fillText('Drücke P zum Weiterspielen', canvas.width / 2, canvas.height / 2 + 55);
            ctx.restore();
        }
    }

    // Proximity Label
    if (_proximityLabel) {
        _proximityLabel.alpha -= 0.018;
        _proximityLabel.y    -= 0.5;
        if (_proximityLabel.alpha <= 0) {
            _proximityLabel = null;
        } else {
            ctx.save();
            ctx.globalAlpha  = Math.min(_proximityLabel.alpha, 1);
            ctx.fillStyle    = _proximityLabel.color;
            ctx.font         = 'bold 22px sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(_proximityLabel.text, 120, _proximityLabel.y);
            ctx.restore();
        }
    }

    // Flash Overlay (Meilenstein)
    if (_flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = _flashAlpha;
        ctx.fillStyle   = _flashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        _flashAlpha -= 0.025;
        if (_flashAlpha < 0) _flashAlpha = 0;
    }
}

export function drawTrajectory(ctx, canvas, player, groundHeight, gameSpeed, cameraOffsetY) {
    if (player.jumping) return;
    const groundYSim = canvas.height - groundHeight;
    let sx = player.x + player.width / 2;
    let sy = player.y + player.height;
    let svx = gameSpeed, svy = -15;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,60,60,0.75)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(sx, sy + cameraOffsetY);
    for (let t = 0; t < 80; t++) {
        svy += 0.8; sx += svx; sy += svy;
        if (sy >= groundYSim) sy = groundYSim;
        ctx.lineTo(sx, sy + cameraOffsetY);
        if (sy >= groundYSim && t > 5) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}
