// ============================================================================
// MODULE: Practice Mode
// PURPOSE: Ghost-Bot, Slow-Mo, Pause, Trajektorie, Replay-Recording
// ============================================================================

import { GRAVITY, JUMP_VEL } from './player.js';

// ── State ────────────────────────────────────────────────────────────────────
export let slowMotion  = false;
export let paused      = false;
export let ghostEnabled = false;

export const ghost = {
    x: 100, y: 0,
    width: 40, height: 40,
    vy: 0, jumping: false, active: false
};

export function toggleSlowMo()  { slowMotion  = !slowMotion; }
export function togglePause()   { paused      = !paused; }
export function toggleGhost(canvas, groundHeight) {
    ghostEnabled = !ghostEnabled;
    if (ghostEnabled) resetGhost(canvas, groundHeight);
}
export function getSpeedMultiplier() { return slowMotion ? 0.5 : 1.0; }

export function resetGhost(canvas, groundHeight) {
    ghost.x       = 100;
    ghost.y       = canvas.height - groundHeight - ghost.height;
    ghost.vy      = 0;
    ghost.jumping = false;
    ghost.active  = ghostEnabled;
}

export function resetPractice(canvas, groundHeight) {
    paused    = false;
    slowMotion = false;
    if (ghostEnabled) resetGhost(canvas, groundHeight);
}

// ── Ghost AI ──────────────────────────────────────────────────────────────────
export function updateGhost(obstacles, canvas, groundHeight, gameSpeed, speedMultiplier) {
    if (!ghostEnabled || !ghost.active) return;

    if (_ghostShouldJump(obstacles, canvas, groundHeight, gameSpeed)) {
        ghost.vy      = JUMP_VEL;
        ghost.jumping = true;
    }

    ghost.vy += GRAVITY * speedMultiplier;
    ghost.y  += ghost.vy  * speedMultiplier;

    const gGround = canvas.height - groundHeight - ghost.height;
    if (ghost.y >= gGround) {
        ghost.y       = gGround;
        ghost.vy      = 0;
        ghost.jumping = false;
    }

    // Ghost-Kollision
    for (const o of obstacles) {
        const oY = canvas.height - groundHeight - o.height;
        if (
            ghost.x < o.x + o.width  - 5 &&
            ghost.x + ghost.width  > o.x + 5 &&
            ghost.y < oY + o.height - 5 &&
            ghost.y + ghost.height > oY + 5
        ) {
            ghost.active = false;
            break;
        }
    }
}

function _ghostShouldJump(obstacles, canvas, groundHeight, gameSpeed) {
    if (!ghost.active || ghost.jumping) return false;

    const ahead = obstacles
        .filter(o => o.x + o.width > ghost.x)
        .sort((a, b) => a.x - b.x);

    if (!ahead.length) return false;

    const next   = ahead[0];
    const gndY   = canvas.height - groundHeight - ghost.height;

    function simArc(sx, sy) {
        let px = sx, py = sy, pvy = JUMP_VEL;
        const pts = [];
        for (let t = 0; t < 120; t++) {
            pvy += GRAVITY; px += gameSpeed; py += pvy;
            if (py >= gndY) { py = gndY; pvy = 0; }
            pts.push({ x: px, y: py });
            if (py >= gndY && t > 10) break;
        }
        return pts;
    }

    const arc     = simArc(ghost.x, ghost.y);
    const obsTop  = canvas.height - groundHeight - next.height;

    const clears = arc.every(p => {
        const inX = p.x + ghost.width > next.x + 4 && p.x < next.x + next.width - 4;
        const inY = p.y + ghost.height > obsTop + 4;
        return !(inX && inY);
    });

    const distToObs    = next.x - (ghost.x + ghost.width);
    const jumpArcWidth = arc[arc.length - 1]?.x - ghost.x || 200;

    return clears && distToObs <= jumpArcWidth * 1.1;
}

// ── Replay Recording ──────────────────────────────────────────────────────────
const replayFrames  = [];
let   replayIndex   = 0;
let   replayPlaying = false;
let   replaySpeed   = 1;
let   replayTickAcc = 0;
export let inReplay = false;

export const replayUI = {};

export function recordFrame(player, groundOffsetFront, groundOffsetBack, cameraOffsetY, gameSpeed, score, obstacles) {
    replayFrames.push({
        px: player.x, py: player.y, pvy: player.vy,
        pjump: player.jumping, pbob: player.currentBob,
        gx: ghost.x, gy: ghost.y, gactive: ghost.active, gjump: ghost.jumping,
        speed: gameSpeed, score,
        gndFront: groundOffsetFront, gndBack: groundOffsetBack,
        camY: cameraOffsetY,
        obs: obstacles.map(o => ({
            x: o.x, width: o.width, height: o.height,
            type: o.type, angle: o.angle, bobPhase: o.bobPhase
        }))
    });
}

export function startReplay() {
    if (!replayFrames.length) return;
    inReplay      = true;
    replayPlaying = false;
    replayIndex   = 0;
    replayTickAcc = 0;
    replaySpeed   = 1;
}

export function stopReplay() {
    inReplay      = false;
    replayPlaying = false;
}

export function clearReplay() {
    replayFrames.length = 0;
    replayIndex   = 0;
    inReplay      = false;
    replayPlaying = false;
}

export function hasReplayFrames() { return replayFrames.length > 0; }

export function updateReplay() {
    if (!inReplay || !replayPlaying) return;
    replayTickAcc += replaySpeed;
    while (replayTickAcc >= 1) {
        replayTickAcc -= 1;
        if (replayIndex < replayFrames.length - 1) replayIndex++;
        else { replayPlaying = false; break; }
    }
}

export function getReplayFrame() { return replayFrames[replayIndex]; }
export function getReplayMeta()  {
    return {
        index: replayIndex,
        total: replayFrames.length,
        playing: replayPlaying,
        speed: replaySpeed
    };
}

export function replayStep(delta) {
    replayIndex = Math.max(0, Math.min(replayFrames.length - 1, replayIndex + delta));
}

export function handleReplayClick(cx, cy) {
    const s = replayUI.scrubber;
    if (s && cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h) {
        replayIndex = Math.round(((cx - s.x) / s.w) * (replayFrames.length - 1));
        return true;
    }
    for (const [id, r] of Object.entries(replayUI)) {
        if (id === 'scrubber') continue;
        if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
            if (id === 'prev')  { replayIndex = 0; replayPlaying = false; }
            if (id === 'next')  { replayIndex = replayFrames.length - 1; replayPlaying = false; }
            if (id === 'stepB') { replayPlaying = false; replayStep(-1); }
            if (id === 'stepF') { replayPlaying = false; replayStep(+1); }
            if (id === 'play')  {
                replayPlaying = !replayPlaying;
                if (replayIndex >= replayFrames.length - 1) replayIndex = 0;
            }
            if (id === 'speed') {
                const speeds = [0.25, 0.5, 1];
                replaySpeed  = speeds[(speeds.indexOf(replaySpeed) + 1) % speeds.length];
            }
            if (id === 'exit')  { stopReplay(); }
            return true;
        }
    }
    return false;
}

export function toggleReplayPlay() {
    replayPlaying = !replayPlaying;
    if (replayIndex >= replayFrames.length - 1) replayIndex = 0;
}
