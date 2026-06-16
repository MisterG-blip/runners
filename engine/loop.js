// ============================================================================
// MODULE: Game Loop
// PURPOSE: requestAnimationFrame-Loop starten und stoppen
// RESPONSIBILITIES:
//   - update + draw pro Frame aufrufen
//   - Replay-Modus umschalten
// NON-GOALS:
//   - Keine Spiellogik
//   - Kein Rendering selbst
// ============================================================================

let _updateFn  = null;
let _drawFn    = null;
let _rafHandle = null;
let _running   = false;

export function startLoop(updateFn, drawFn) {
    _updateFn = updateFn;
    _drawFn   = drawFn;
    _running  = true;
    _tick();
}

export function stopLoop() {
    _running = false;
    if (_rafHandle) cancelAnimationFrame(_rafHandle);
}

function _tick() {
    if (!_running) return;
    _updateFn();
    _drawFn();
    _rafHandle = requestAnimationFrame(_tick);
}
