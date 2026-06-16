// ============================================================================
// MODULE: Game State
// PURPOSE: Zentrale Wahrheit über den aktuellen Spielzustand
// ============================================================================

export const GAME_STATE = {
    MODE_SELECT: 'mode_select',   // Moduswahl auf dem Startscreen
    MENU:        'menu',
    PLAYING:     'playing',
    GAME_OVER:   'gameover'
};

export const MILESTONES = [10, 20, 30, 40, 50];

let _state = GAME_STATE.MODE_SELECT;

// Spielmodus: 'arcade' | 'practice'
let _mode = null;

export function getState()         { return _state; }
export function setState(s)        { _state = s; }
export function getMode()          { return _mode; }
export function setMode(m)         { _mode = m; }
export function isArcade()         { return _mode === 'arcade'; }
export function isPractice()       { return _mode === 'practice'; }
export function isPlaying()        { return _state === GAME_STATE.PLAYING; }
export function isGameOver()       { return _state === GAME_STATE.GAME_OVER; }
export function isModeSelect()     { return _state === GAME_STATE.MODE_SELECT; }

// Score-Meilenstein-Check
let _lastMilestoneAt = -1;
export function checkMilestone(score) {
    for (const m of MILESTONES) {
        if (score >= m && _lastMilestoneAt < m) {
            _lastMilestoneAt = m;
            return m;
        }
    }
    return null;
}

export function resetMilestones() {
    _lastMilestoneAt = -1;
}
