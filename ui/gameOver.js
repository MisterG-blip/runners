// ============================================================================
// MODULE: Game Over UI
// PURPOSE: Game-Over-Screen mit Replay-, Share- und Neustart-Buttons
// ============================================================================

import { getCurrentMonth } from '../utils/date.js';

export const gameOverUI = {
    replayBtn: null,   // { x, y, w, h }
    shareBtn:  null
};

export function drawGameOver(ctx, canvas, score, currentTopScores, hasPracticeReplay) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Title
    ctx.fillStyle    = '#e63946';
    ctx.font         = 'bold 48px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('GAME OVER', cx, 60);

    ctx.fillStyle = 'white';
    ctx.font      = '28px sans-serif';
    ctx.fillText(`Score: ${score}`, cx, 100);

    const btnW = 280, btnH = 50;
    const btnX = cx - btnW / 2;
    let   nextY = 130;

    // ── Replay-Button (nur Practice) ──────────────────────────────────────
    if (hasPracticeReplay) {
        const grad = ctx.createLinearGradient(btnX, nextY, btnX + btnW, nextY);
        grad.addColorStop(0, '#e63946');
        grad.addColorStop(1, '#c0392b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(btnX, nextY, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.roundRect(btnX, nextY, btnW, btnH, 8);
        ctx.stroke();
        ctx.fillStyle    = 'white';
        ctx.font         = 'bold 20px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶  Replay ansehen', cx, nextY + btnH / 2);
        gameOverUI.replayBtn = { x: btnX, y: nextY, w: btnW, h: btnH };
        nextY += btnH + 12;
    } else {
        gameOverUI.replayBtn = null;
    }

    // ── Share-Button ──────────────────────────────────────────────────────
    const grad2 = ctx.createLinearGradient(btnX, nextY, btnX + btnW, nextY);
    grad2.addColorStop(0, '#667eea');
    grad2.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.roundRect(btnX, nextY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, nextY, btnW, btnH, 8);
    ctx.stroke();
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 20px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('📤 Score Teilen', cx, nextY + btnH / 2);
    gameOverUI.shareBtn = { x: btnX, y: nextY, width: btnW, height: btnH };
    nextY += btnH + 12;

    // ── Restart-Hint ──────────────────────────────────────────────────────
    const pulse       = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
    ctx.fillStyle     = `rgba(255,255,255,${pulse})`;
    ctx.font          = '16px sans-serif';
    ctx.textBaseline  = 'alphabetic';
    ctx.fillText('oder SPACE für Neustart', cx, nextY + 10);
    nextY += 36;

    // ── Highscore-Liste ───────────────────────────────────────────────────
    const listStartY = nextY + 10;

    if (currentTopScores?.length > 0) {
        const listW = Math.min(500, canvas.width - 80);
        const listX = cx - listW / 2;

        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.fillRect(listX - 10, listStartY - 5, listW + 20, 40);
        ctx.fillStyle    = '#FFD700';
        ctx.font         = 'bold 20px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`🏆 Top Scores – ${getCurrentMonth()}`, cx, listStartY + 22);

        ctx.textAlign = 'left';
        ctx.font      = '15px sans-serif';
        const lineH       = 24;
        const available   = canvas.height - listStartY - 80;
        const show        = Math.min(currentTopScores.length, Math.floor(available / lineH), 20);

        currentTopScores.slice(0, show).forEach((entry, i) => {
            const y = listStartY + 50 + i * lineH;
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(listX - 10, y - 16, listW + 20, lineH);
            }
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
            ctx.fillStyle    = i < 3 ? '#FFD700' : 'white';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(medal, listX, y);

            ctx.fillStyle = 'white';
            let name = entry.name;
            const maxW = listW - 100;
            if (ctx.measureText(name).width > maxW) {
                while (ctx.measureText(name + '…').width > maxW && name.length > 0) name = name.slice(0, -1);
                name += '…';
            }
            ctx.fillText(name, listX + 45, y);

            ctx.fillStyle = i < 3 ? '#FFD700' : '#aaa';
            ctx.textAlign = 'right';
            ctx.fillText(`${entry.score}`, listX + listW, y);
            ctx.textAlign = 'left';
        });

        if (currentTopScores.length > show) {
            ctx.fillStyle    = 'rgba(255,255,255,0.5)';
            ctx.font         = '13px sans-serif';
            ctx.textAlign    = 'center';
            ctx.fillText(`… und ${currentTopScores.length - show} weitere`, cx, listStartY + 50 + show * lineH + 10);
        }
    } else {
        ctx.fillStyle    = 'rgba(255,255,255,0.6)';
        ctx.font         = '18px sans-serif';
        ctx.textAlign    = 'center';
        ctx.fillText('⏳ Lade Highscores…', cx, listStartY + 30);
    }
}

export function hitTestGameOver(x, y) {
    if (_hit(gameOverUI.replayBtn, x, y)) return 'replay';
    const sb = gameOverUI.shareBtn;
    if (sb && x >= sb.x && x <= sb.x + sb.width && y >= sb.y && y <= sb.y + sb.height) return 'share';
    return 'restart';
}

function _hit(r, x, y) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// ── Replay-Screen ─────────────────────────────────────────────────────────────
export function drawReplay(ctx, canvas, frame, ghostEnabled, replayMeta, replayUI, logoImg, logoFallback, groundHeight, drawCloudsFn) {
    if (!frame) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0,   '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1,   '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCloudsFn(ctx, canvas);

    // Ground
    const topY  = canvas.height - groundHeight;
    const halfH = groundHeight / 2;
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(0, topY + frame.camY, canvas.width, halfH);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 2;
    for (let x = frame.gndBack; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, topY + frame.camY);
        ctx.lineTo(x, topY + halfH + frame.camY);
        ctx.stroke();
    }
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, topY + halfH + frame.camY, canvas.width, halfH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let x = frame.gndFront; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, topY + halfH + frame.camY);
        ctx.lineTo(x, canvas.height + frame.camY);
        ctx.stroke();
    }

    // Ghost
    if (ghostEnabled) {
        const gy = frame.gy + frame.camY;
        ctx.save();
        if (frame.gactive) {
            ctx.globalAlpha  = 0.55;
            ctx.shadowBlur   = 12;
            ctx.shadowColor  = '#00eeff';
            ctx.strokeStyle  = '#00eeff';
            ctx.lineWidth    = 2;
            ctx.strokeRect(frame.gx, gy, 40, 40);
            ctx.fillStyle = 'rgba(0,220,255,0.18)';
            ctx.fillRect(frame.gx, gy, 40, 40);
        } else {
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
            ctx.strokeRect(frame.gx, gy, 40, 40);
            ctx.strokeStyle = '#f44'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(frame.gx + 6, gy + 6); ctx.lineTo(frame.gx + 34, gy + 34);
            ctx.moveTo(frame.gx + 34, gy + 6); ctx.lineTo(frame.gx + 6, gy + 34);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Player
    const py = frame.py + frame.pbob + frame.camY;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(frame.px + 5, canvas.height - groundHeight + frame.camY, 30, 5);
    const isCrash = replayMeta.index === replayMeta.total - 1;
    ctx.fillStyle = isCrash ? '#ff4455' : 'white';
    ctx.fillRect(frame.px, py, 40, 40);
    ctx.fillStyle = '#000';
    ctx.fillRect(frame.px + 25, py + 10, 8, 8);

    // Obstacles
    frame.obs.forEach(o => {
        const baseY = canvas.height - groundHeight - o.height + frame.camY;
        if (o.type === 'rect') {
            const bob = Math.sin(o.bobPhase) * 4;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(o.x + 5, canvas.height - groundHeight + frame.camY, o.width - 10, 5);
            ctx.fillStyle = '#e63946';
            ctx.fillRect(o.x, baseY + bob, o.width, o.height);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(o.x + 5, baseY + bob + 5, o.width - 10, 10);
        } else {
            const r = o.width / 2, cx2 = o.x + r, cy2 = baseY + r;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(cx2, canvas.height - groundHeight + frame.camY, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.save();
            ctx.translate(cx2, cy2);
            ctx.rotate(o.angle);
            const img = (logoImg?.complete && logoImg.naturalWidth > 0) ? logoImg : logoFallback;
            ctx.drawImage(img, -r, -r, o.width, o.height);
            ctx.restore();
        }
    });

    // HUD Mini
    ctx.fillStyle    = 'white';
    ctx.font         = 'bold 32px sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Score: ${frame.score}`, 20, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font      = '14px sans-serif';
    ctx.fillText(`Speed: ${frame.speed.toFixed(1)}x`, 20, 80);

    // REPLAY Wasserzeichen
    ctx.save();
    ctx.globalAlpha  = 0.09;
    ctx.fillStyle    = '#ffffff';
    ctx.font         = 'bold 110px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('REPLAY', canvas.width / 2, canvas.height / 2);
    ctx.restore();
    ctx.fillStyle    = 'rgba(255,80,80,0.9)';
    ctx.font         = 'bold 14px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('● REPLAY', canvas.width / 2, 28);

    // Timeline
    const tlH  = 36, tlY = canvas.height - tlH - 70;
    const tlX  = 20, tlW = canvas.width - 40;
    const prog = replayMeta.total > 1 ? replayMeta.index / (replayMeta.total - 1) : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.roundRect(tlX, tlY + 10, tlW, 8, 4); ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.roundRect(tlX, tlY + 10, tlW * prog, 8, 4); ctx.fill();
    const thumbX = tlX + tlW * prog;
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(thumbX, tlY + 14, 9, 0, Math.PI * 2); ctx.fill();

    const fps = 60;
    const cs  = (replayMeta.index / fps).toFixed(1);
    const ts  = (replayMeta.total  / fps).toFixed(1);
    ctx.fillStyle    = 'rgba(255,255,255,0.7)';
    ctx.font         = '12px sans-serif';
    ctx.textAlign    = 'center';
    ctx.fillText(`${cs}s / ${ts}s`, canvas.width / 2, tlY + 32);

    replayUI.scrubber = { x: tlX, y: tlY + 4, w: tlW, h: 20 };

    // Control Buttons
    const btnY = canvas.height - 55, btnH = 40;
    const buttons = [
        { id: 'prev',  label: '◀◀',                       w: 50 },
        { id: 'stepB', label: '◀',                         w: 44 },
        { id: 'play',  label: replayMeta.playing ? '⏸':'▶', w: 44 },
        { id: 'stepF', label: '▶',                         w: 44 },
        { id: 'next',  label: '▶▶',                       w: 50 },
        { id: 'speed', label: `${replayMeta.speed}x`,      w: 52 },
        { id: 'exit',  label: '✕',                         w: 40 },
    ];

    const totalW = buttons.reduce((s, b) => s + b.w + 8, 0) - 8;
    let   bx     = canvas.width / 2 - totalW / 2;

    buttons.forEach(btn => {
        const active = (btn.id === 'play' && replayMeta.playing) || btn.id === 'speed';
        ctx.fillStyle = btn.id === 'exit'
            ? 'rgba(200,50,50,0.7)'
            : active
            ? 'rgba(80,160,255,0.75)'
            : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.roundRect(bx, btnY, btn.w, btnH, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx, btnY, btn.w, btnH, 8); ctx.stroke();
        ctx.fillStyle    = 'white';
        ctx.font         = btn.id === 'speed' ? 'bold 13px sans-serif' : 'bold 16px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, bx + btn.w / 2, btnY + btnH / 2);
        replayUI[btn.id] = { x: bx, y: btnY, w: btn.w, h: btnH };
        bx += btn.w + 8;
    });
}
