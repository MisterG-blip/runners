// ============================================================================
// MODULE: Menu UI
// PURPOSE: Startscreen mit Moduswahl (Arcade / Practice) zeichnen
// ============================================================================

// Hit-areas für die beiden Buttons (wird beim Zeichnen gesetzt)
export const menuUI = {
    arcadeBtn:   null,   // { x, y, w, h }
    practiceBtn: null
};

export function drawModeSelect(ctx, canvas, championClouds) {
    // Dimm overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // ── Title ──────────────────────────────────────────────────────────────
    ctx.fillStyle   = '#FFD700';
    ctx.font        = 'bold 64px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('RUNNER', cx, cy - 130);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font      = '18px sans-serif';
    ctx.fillText('Wähle deinen Spielmodus', cx, cy - 85);

    // ── Arcade Button ───────────────────────────────────────────────────────
    const btnW = 260, btnH = 72, gap = 24;
    const arcadeX = cx - btnW / 2;
    const arcadeY = cy - 50;

    const gradA = ctx.createLinearGradient(arcadeX, arcadeY, arcadeX + btnW, arcadeY);
    gradA.addColorStop(0, '#FFD700');
    gradA.addColorStop(1, '#ff9900');
    ctx.fillStyle = gradA;
    ctx.beginPath();
    ctx.roundRect(arcadeX, arcadeY, btnW, btnH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(arcadeX, arcadeY, btnW, btnH, 12);
    ctx.stroke();

    ctx.fillStyle   = '#1a1a2e';
    ctx.font        = 'bold 22px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 ARCADE', cx, arcadeY + btnH / 2 - 10);
    ctx.font     = '13px sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('Scores werden gespeichert', cx, arcadeY + btnH / 2 + 14);

    menuUI.arcadeBtn = { x: arcadeX, y: arcadeY, w: btnW, h: btnH };

    // ── Practice Button ─────────────────────────────────────────────────────
    const practiceX = cx - btnW / 2;
    const practiceY = arcadeY + btnH + gap;

    const gradP = ctx.createLinearGradient(practiceX, practiceY, practiceX + btnW, practiceY);
    gradP.addColorStop(0, '#e63946');
    gradP.addColorStop(1, '#c0392b');
    ctx.fillStyle = gradP;
    ctx.beginPath();
    ctx.roundRect(practiceX, practiceY, btnW, btnH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(practiceX, practiceY, btnW, btnH, 12);
    ctx.stroke();

    ctx.fillStyle   = 'white';
    ctx.font        = 'bold 22px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏋️ PRACTICE', cx, practiceY + btnH / 2 - 10);
    ctx.font     = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Ghost · Slow-Mo · Replay · Kein Speichern', cx, practiceY + btnH / 2 + 14);

    menuUI.practiceBtn = { x: practiceX, y: practiceY, w: btnW, h: btnH };

    // ── Tap hint ────────────────────────────────────────────────────────────
    const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
    ctx.fillStyle   = `rgba(255,255,255,${pulse * 0.5})`;
    ctx.font        = '15px sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Klicke auf einen Modus zum Starten', cx, practiceY + btnH + 40);

    // ── Champions Hinweis ───────────────────────────────────────────────────
    if (championClouds?.length > 0) {
        ctx.fillStyle = 'rgba(255,215,0,0.7)';
        ctx.font      = '14px sans-serif';
        ctx.fillText('👑 Champions schweben als Wolken!', cx, canvas.height - 40);
    }
}

export function hitTestMenu(x, y) {
    if (_hit(menuUI.arcadeBtn,   x, y)) return 'arcade';
    if (_hit(menuUI.practiceBtn, x, y)) return 'practice';
    return null;
}

function _hit(r, x, y) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
