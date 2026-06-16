// ============================================================================
// main.js  –  Orchestriert alle Module
// Keine Spiellogik hier – nur Verdrahtung.
// ============================================================================

import { startLoop }                              from './engine/loop.js';
import { setupInput, getLastClickPos }            from './engine/input.js';
import { updateCamera, resetCamera,
         getCameraState, applyToContext,
         addShake }                               from './engine/camera.js';
import { startMusic, startMenuMusic, stopMusic,
         setMusicTempo, setVolume,
         playHit, playMilestone }  from './engine/audio.js';

import { GAME_STATE, getState, setState,
         getMode,  setMode,
         isArcade, isPractice,
         isPlaying, isGameOver, isModeSelect,
         checkMilestone, resetMilestones }        from './game/gameState.js';

import { player, updatePlayer, doJump,
         resetPlayer, drawPlayer }                from './game/player.js';

import { obstacles, initObstacles,
         updateObstacles, syncScore,
         drawObstacles }                          from './game/obstacles.js';

import {
    slowMotion, paused, ghostEnabled, ghost,
    toggleSlowMo, togglePause, toggleGhost,
    getSpeedMultiplier,
    updateGhost, resetPractice, resetGhost,
    recordFrame, startReplay, stopReplay,
    clearReplay, hasReplayFrames,
    updateReplay, getReplayFrame, getReplayMeta,
    handleReplayClick, toggleReplayPlay, replayStep,
    replayUI, inReplay
} from './game/practiceMode.js';

import { initClouds, createChampionClouds,
         getChampionClouds, drawClouds }          from './ui/clouds.js';

import { drawModeSelect, hitTestMenu }            from './ui/menu.js';

import { drawBackground, drawSpeedLines,
         drawGround, drawHUD, drawTrajectory,
         updateSkyGradient, triggerFlash,
         setProximityLabel }                      from './ui/hud.js';

import { drawGameOver, hitTestGameOver,
         drawReplay }                             from './ui/gameOver.js';

import { saveScore, loadCurrentMonthScores,
         loadHallOfFame }                         from './firebase/firebaseService.js';

import { checkAndCrownMonthlyChampion }           from './firebase/gameRules.js';

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ── Logo ──────────────────────────────────────────────────────────────────────
const logoImg = new Image();
logoImg.src   = 'assets/images/fuchs-logo.png';

function createLogoFallback() {
    const size = 60;
    const fc   = document.createElement('canvas');
    fc.width   = size; fc.height = size;
    const lc   = fc.getContext('2d');
    lc.fillStyle = '#d946ef';
    lc.beginPath();
    lc.moveTo(size*.5,size*.2); lc.lineTo(size*.2,size*.4);
    lc.lineTo(size*.3,size*.6); lc.lineTo(size*.5,size*.8);
    lc.lineTo(size*.5,size*.2); lc.fill();
    lc.fillStyle = '#06b6d4';
    lc.beginPath();
    lc.moveTo(size*.5,size*.2); lc.lineTo(size*.8,size*.4);
    lc.lineTo(size*.7,size*.6); lc.lineTo(size*.5,size*.8);
    lc.lineTo(size*.5,size*.2); lc.fill();
    return fc;
}
const logoFallback = createLogoFallback();
logoImg.onerror = () => { logoImg.src = logoFallback.toDataURL(); };

// ── Game Variables ────────────────────────────────────────────────────────────
let gameSpeed    = 6;
let score        = 0;
const GROUND_H   = 100;

let groundOffsetFront = 0;
let groundOffsetBack  = 0;

let currentTopScores = [];
let hallOfFame       = [];

// Score-Save State
let saveState      = 'idle';
let saveRetryCount = 0;
const MAX_RETRIES  = 3;
const RETRY_DELAY  = 3000;

// ── Spieler-Name ──────────────────────────────────────────────────────────────
function getPlayerName() {
    let name = localStorage.getItem('playerName');
    if (!name) {
        name = prompt('Gib deinen Namen ein (max. 20 Zeichen):') || 'Anonym';
        localStorage.setItem('playerName', name);
    }
    return name;
}

// ── Game Flow ─────────────────────────────────────────────────────────────────
function chooseMode(mode) {
    setMode(mode);
    if (mode === 'practice') {
        window.dispatchEvent(new CustomEvent('practiceMode'));
    } else {
        window.dispatchEvent(new CustomEvent('arcadeMode'));
    }
    // Menü-Musik stoppen, Spiel-Musik starten
    stopMusic();
    startGame();
}

function startGame() {
    setState(GAME_STATE.PLAYING);
    restart();
    startMusic();
}

function restart() {
    setState(GAME_STATE.PLAYING);
    score      = 0;
    gameSpeed  = 6;
    groundOffsetFront = 0;
    groundOffsetBack  = 0;
    saveState      = 'idle';
    saveRetryCount = 0;
    _shakeFrames   = 0;
    window.dispatchEvent(new CustomEvent('gameRestart'));

    resetPlayer(canvas, GROUND_H);
    resetCamera();
    initObstacles(canvas);
    syncScore(0);
    resetMilestones();
    updateSkyGradient(0);

    if (isPractice()) {
        clearReplay();
        resetPractice(canvas, GROUND_H);
    }
}

let _shakeFrames = 0;

function triggerGameOver() {
    if (!isPlaying()) return;
    setState(GAME_STATE.GAME_OVER);
    _shakeFrames = 12;
    addShake(15);
    playHit();
    stopMusic();
    window.dispatchEvent(new CustomEvent('gameOver'));

    if (isArcade() && saveState === 'idle') {
        saveState = 'saving';
        const name       = getPlayerName();
        const savedScore = score;
        attemptSaveScore(name, savedScore);
    }
}

// ── Jump / Input-Actions ──────────────────────────────────────────────────────
let _menuMusicStarted = false;

function onJump() {
    // Modus-Wahl Screen
    if (isModeSelect()) {
        // Beim ersten Klick/Touch: Menü-Musik starten (braucht User-Gesture)
        if (!_menuMusicStarted) {
            _menuMusicStarted = true;
            startMenuMusic();
        }
        const pos  = getLastClickPos();
        const hit  = hitTestMenu(pos.x, pos.y);
        if (hit === 'arcade')   { chooseMode('arcade');   return; }
        if (hit === 'practice') { chooseMode('practice'); return; }
        return;  // kein Sprung ohne Modus-Wahl
    }

    if (isGameOver()) {
        const pos    = getLastClickPos();
        const action = hitTestGameOver(pos.x, pos.y);
        if (action === 'replay' && isPractice() && hasReplayFrames()) {
            startReplay();
            return;
        }
        if (action === 'share') {
            shareScore();
            return;
        }
        restart();
        startMusic();
        return;
    }

    if (isPlaying()) {
        doJump();
    }
}

function onPause() {
    if (isPractice() && isPlaying()) togglePause();
}

function onSlowMo() {
    if (isPractice() && isPlaying()) toggleSlowMo();
}

function onGhost() {
    if (isPractice()) toggleGhost(canvas, GROUND_H);
}

let _muted = false;
function onMute() {
    _muted = !_muted;
    setVolume(_muted ? 0 : 0.6);
}

// ── Input-Setup ───────────────────────────────────────────────────────────────
setupInput(canvas, {
    isReplay:        () => inReplay,
    onJump,
    onPause,
    onSlowMo,
    onGhost,
    onMute,
    onReplayToggle:  toggleReplayPlay,
    onReplayStep:    replayStep,
    onReplayExit:    stopReplay,
    onReplayClick:   handleReplayClick
});

// ── Update ────────────────────────────────────────────────────────────────────
function update() {
    // ── Replay ──────────────────────────────────────────────────────────────
    if (inReplay) {
        updateReplay();
        return;
    }

    updateCamera(); // läuft immer – damit Shake auch im Game-Over abklingt

    if (!isPlaying() || paused) return;

    const sm = getSpeedMultiplier();

    // Ground scrolling
    groundOffsetFront -= gameSpeed * sm;
    groundOffsetBack  -= gameSpeed * 0.4 * sm;
    if (groundOffsetFront <= -40) groundOffsetFront = 0;
    if (groundOffsetBack  <= -80) groundOffsetBack  = 0;

    // Player
    updatePlayer(canvas, GROUND_H, gameSpeed, sm);

    // Obstacles + Scoring
    const { scored, proximity } = updateObstacles({
        canvas,
        groundHeight:   GROUND_H,
        gameSpeed,
        player,
        speedMultiplier: sm,
        onGameOver: triggerGameOver
    });

    if (scored) {
        score++;
        syncScore(score);
        // Speed-Formel: identisch mit Original
        gameSpeed = 6 + Math.pow(score, 0.6);
        // Musik-Tempo anpassen
        setMusicTempo(100 + score * 2);
        // Sky-Gradient updaten
        updateSkyGradient(score);

        // Meilenstein-Check (10/20/30/40/50)
        const milestone = checkMilestone(score);
        if (milestone !== null) {
            const idx = [10,20,30,40,50].indexOf(milestone);
            playMilestone(idx + 1);
            triggerFlash('#ffffff', 0.4);
        }
    }

    if (proximity) {
        setProximityLabel(proximity, player.y);
    }

    // Ghost Bot
    if (isPractice()) {
        updateGhost(obstacles, canvas, GROUND_H, gameSpeed, sm);
        recordFrame(
            player, groundOffsetFront, groundOffsetBack,
            getCameraState().offsetY,
            gameSpeed, score, obstacles
        );
    }
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Replay-Modus ────────────────────────────────────────────────────────
    if (inReplay) {
        drawReplay(
            ctx, canvas,
            getReplayFrame(),
            ghostEnabled,
            getReplayMeta(),
            replayUI,
            logoImg, logoFallback,
            GROUND_H,
            drawClouds
        );
        return;
    }

    // ── Kamera-Shake ────────────────────────────────────────────────────────
    const { shake } = getCameraState();
    ctx.save();
    applyToContext(ctx);

    // ── Hintergrund ──────────────────────────────────────────────────────────
    drawBackground(ctx, canvas);
    drawClouds(ctx, canvas);
    drawSpeedLines(ctx, canvas, gameSpeed);

    const { offsetY } = getCameraState();

    drawGround(ctx, canvas, GROUND_H, groundOffsetFront, groundOffsetBack, offsetY);

    // ── Mode-Select Screen ───────────────────────────────────────────────────
    if (isModeSelect()) {
        drawModeSelect(ctx, canvas, getChampionClouds());
        ctx.restore();
        return;
    }

    // ── Gameplay ─────────────────────────────────────────────────────────────
    if (isPractice() && isPlaying()) {
        drawTrajectory(ctx, canvas, player, GROUND_H, gameSpeed, offsetY);
    }

    // Ghost (vor Player zeichnen)
    if (ghostEnabled && isPractice()) {
        _drawGhost(offsetY);
    }

    drawPlayer(ctx, canvas, GROUND_H, offsetY);
    drawObstacles(ctx, canvas, GROUND_H, offsetY, logoImg, logoFallback);

    // HUD
    drawHUD(ctx, canvas, score, gameSpeed, isPractice(),
        { enabled: ghostEnabled, active: ghost.active },
        slowMotion, paused
    );

    // Shake-Kontext hier schließen
    ctx.restore();

    // Game Over Overlay: erste 12 Frames mitwackeln (Aufprall-Feeling), danach stabil
    if (isGameOver()) {
        if (_shakeFrames > 0) {
            _shakeFrames--;
            ctx.save();
            applyToContext(ctx);
            drawGameOver(ctx, canvas, score, currentTopScores, isPractice() && hasReplayFrames());
            ctx.restore();
        } else {
            drawGameOver(ctx, canvas, score, currentTopScores, isPractice() && hasReplayFrames());
        }
    }
}

// Ghost zeichnen (inline, da Abhängigkeit von canvas/GROUND_H/ghost)
function _drawGhost(cameraOffsetY) {
    const gy = ghost.y + cameraOffsetY;
    ctx.save();
    if (ghost.active) {
        ctx.globalAlpha  = 0.55;
        ctx.shadowBlur   = 12;
        ctx.shadowColor  = '#00eeff';
        ctx.strokeStyle  = '#00eeff';
        ctx.lineWidth    = 2;
        ctx.strokeRect(ghost.x, gy, ghost.width, ghost.height);
        ctx.fillStyle = 'rgba(0,220,255,0.18)';
        ctx.fillRect(ghost.x, gy, ghost.width, ghost.height);
        ctx.fillStyle = 'rgba(0,220,255,0.7)';
        ctx.fillRect(ghost.x + 25, gy + 10, 8, 8);
    } else {
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 2;
        ctx.strokeRect(ghost.x, gy, ghost.width, ghost.height);
        ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ghost.x + 6,  gy + 6);  ctx.lineTo(ghost.x + 34, gy + 34);
        ctx.moveTo(ghost.x + 34, gy + 6);  ctx.lineTo(ghost.x + 6,  gy + 34);
        ctx.stroke();
    }
    ctx.restore();
}

// ── Score-Save (Arcade only) ──────────────────────────────────────────────────
async function attemptSaveScore(name, savedScore) {
    try {
        await saveScore(name, savedScore);
        currentTopScores = await loadCurrentMonthScores();
        saveState      = 'done';
        saveRetryCount = 0;
        console.log('✅ Score gespeichert');
    } catch (err) {
        saveRetryCount++;
        console.error(`❌ Versuch ${saveRetryCount}/${MAX_RETRIES}:`, err);

        const permanent =
            err?.code === 'PERMISSION_DENIED' ||
            err?.code === 'QUOTA_EXCEEDED'    ||
            saveRetryCount >= MAX_RETRIES;

        if (permanent) {
            saveState = 'failed';
            loadCurrentMonthScores().then(s => { currentTopScores = s; }).catch(() => {});
        } else {
            saveState = 'idle';
            setTimeout(() => {
                if (isGameOver() && saveState === 'idle') {
                    saveState = 'saving';
                    attemptSaveScore(name, savedScore);
                }
            }, RETRY_DELAY);
        }
    }
}

// ── Share ─────────────────────────────────────────────────────────────────────
async function shareScore() {
    const name    = localStorage.getItem('playerName') || 'Anonym';
    const gameUrl = window.location.href;
    const text    = `🎮 Ich habe ${score} Punkte im Runner erreicht! 🏆\n\nKannst du mich schlagen?\n\n#RunnerGame #HighScore`;

    try {
        const blob = await _generateShareImage();
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'score.png')] })) {
            await navigator.share({ title: 'Runner – Mein Score', text, files: [new File([blob], 'runner-score.png', { type: 'image/png' })] });
        } else {
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement('a'), { href: url, download: `runner-score-${score}.png` }).click();
            URL.revokeObjectURL(url);
            await navigator.clipboard.writeText(`${text}\n\n${gameUrl}`).catch(() => {});
            alert('📸 Screenshot heruntergeladen!\n📋 Text kopiert!\n\nJetzt posten! 🚀');
        }
    } catch (e) {
        navigator.clipboard?.writeText(`${text}\n\n${gameUrl}`)
            .then(() => alert('📋 Score kopiert!'))
            .catch(() => prompt('Kopiere:', `${text}\n\n${gameUrl}`));
    }
}

async function _generateShareImage() {
    const sc  = document.createElement('canvas');
    sc.width  = 800; sc.height = 1000;
    const s   = sc.getContext('2d');
    const g   = s.createLinearGradient(0, 0, 0, 1000);
    g.addColorStop(0, '#1a1a2e'); g.addColorStop(0.5, '#16213e'); g.addColorStop(1, '#0f3460');
    s.fillStyle = g; s.fillRect(0, 0, 800, 1000);
    if (logoImg.complete && logoImg.naturalWidth > 0) s.drawImage(logoImg, 320, 40, 160, 160);
    s.fillStyle = 'white'; s.font = 'bold 64px sans-serif'; s.textAlign = 'center';
    s.fillText('RUNNER', 400, 250);
    s.fillStyle = '#FFD700'; s.font = 'bold 96px sans-serif';
    s.fillText(score, 400, 380);
    s.fillStyle = 'rgba(255,255,255,0.8)'; s.font = '32px sans-serif';
    s.fillText('Punkte', 400, 430);
    s.fillStyle = 'white'; s.font = '28px sans-serif';
    s.fillText(`von ${localStorage.getItem('playerName') || 'Anonym'}`, 400, 480);
    if (currentTopScores.length) {
        s.fillStyle = '#FFD700'; s.font = 'bold 32px sans-serif';
        s.fillText('🏆 Top 3', 400, 560);
        s.textAlign = 'left'; s.font = '24px sans-serif';
        currentTopScores.slice(0, 3).forEach((e, i) => {
            const y = 620 + i * 60;
            const m = ['🥇','🥈','🥉'][i];
            s.fillStyle = '#FFD700'; s.fillText(m, 100, y);
            s.fillStyle = 'white'; s.fillText(e.name.slice(0, 15), 160, y);
            s.textAlign = 'right'; s.fillStyle = i === 0 ? '#FFD700' : '#aaa';
            s.fillText(e.score, 700, y); s.textAlign = 'left';
        });
    }
    s.textAlign = 'center'; s.fillStyle = 'white'; s.font = 'bold 28px sans-serif';
    s.fillText('Kannst du mich schlagen?', 400, 860);
    s.fillStyle = 'rgba(255,255,255,0.6)'; s.font = '20px sans-serif';
    s.fillText(window.location.href, 400, 900);
    return new Promise(res => sc.toBlob(b => res(b), 'image/png'));
}

// ── Name ändern ───────────────────────────────────────────────────────────────
window.addEventListener('changeName', () => {
    const name = prompt('Neuen Namen eingeben (max. 20 Zeichen):');
    if (name?.trim()) {
        localStorage.setItem('playerName', name.trim().slice(0, 20));
    }
});

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    console.log('🎮 Cube Runner wird initialisiert…');

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    setState(GAME_STATE.MODE_SELECT);
    initClouds(canvas);
    resetPlayer(canvas, GROUND_H);

    startLoop(update, draw);
    console.log('✅ Loop gestartet');

    // Firebase im Hintergrund (non-blocking)
    checkAndCrownMonthlyChampion().catch(e => console.warn('⚠️ Champion-Check:', e));

    loadHallOfFame().then(champs => {
        hallOfFame = champs;
        if (champs.length) {
            createChampionClouds(champs);
            console.log(`👑 ${champs.length} Champions geladen`);
        }
    }).catch(e => console.warn('⚠️ Hall of Fame:', e));

    loadCurrentMonthScores().then(s => {
        currentTopScores = s;
        console.log(`📊 ${s.length} Scores geladen`);
    }).catch(e => console.warn('⚠️ Scores:', e));
}

init();
