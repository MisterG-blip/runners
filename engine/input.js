// ============================================================================
// MODULE: Input Engine
// PURPOSE: Alle Tastatur-, Touch- und Click-Events zentral verwalten
// RESPONSIBILITIES:
//   - Keyboard-Handler (Space, P, S, G, Arrows, Escape)
//   - Touch / Click auf Canvas
//   - Mobil-Buttons (jump, ghost, slow)
//   - Letzten Click-Koordinaten für Button-Hitdetection bereitstellen
// NON-GOALS:
//   - Keine Spiellogik
//   - Kein Rendering
// ============================================================================

let _canvas = null;
let _handlers = {};  // { onJump, onPause, onSlowMo, onGhost, onReplayKey, onReplayClick }
let lastClickPos = { x: 0, y: 0 };

export function getLastClickPos() {
    return lastClickPos;
}

export function setupInput(canvas, handlers) {
    _canvas = canvas;
    _handlers = handlers;

    // ── Keyboard ─────────────────────────────────────────────────────────────
    window.addEventListener('keydown', e => {
        const h = _handlers;

        // Replay-Modus hat eigene Keys
        if (h.isReplay?.()) {
            if (e.code === 'Space' || e.code === 'KeyP') {
                e.preventDefault();
                h.onReplayToggle?.();
            }
            if (e.code === 'ArrowLeft')  { e.preventDefault(); h.onReplayStep?.(-1); }
            if (e.code === 'ArrowRight') { e.preventDefault(); h.onReplayStep?.(+1); }
            if (e.code === 'Escape')     { h.onReplayExit?.(); }
            return;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            h.onJump?.();
        }
        if (e.code === 'KeyP') h.onPause?.();
        if (e.code === 'KeyS') h.onSlowMo?.();
        if (e.code === 'KeyG') h.onGhost?.();
        if (e.code === 'KeyM') h.onMute?.();
    });

    // ── Touch ─────────────────────────────────────────────────────────────────
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (e.touches?.[0]) {
            const rect = canvas.getBoundingClientRect();
            lastClickPos = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        if (_handlers.isReplay?.()) {
            _handlers.onReplayClick?.(lastClickPos.x, lastClickPos.y);
            return;
        }
        _handlers.onJump?.();
    }, { passive: false });

    // ── Click ─────────────────────────────────────────────────────────────────
    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        lastClickPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        if (_handlers.isReplay?.()) {
            _handlers.onReplayClick?.(lastClickPos.x, lastClickPos.y);
            return;
        }
        _handlers.onJump?.();
    });

    // ── Mobile Buttons ────────────────────────────────────────────────────────
    _bindBtn('jump-btn',  () => _handlers.onJump?.());
    _bindBtn('ghost-btn', () => _handlers.onGhost?.());
    _bindBtn('slow-btn',  () => _handlers.onSlowMo?.());
    _bindBtn('mute-btn',  () => _handlers.onMute?.());
}

function _bindBtn(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
    el.addEventListener('click',      e => { e.preventDefault(); fn(); });
}
