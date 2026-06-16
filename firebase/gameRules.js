// ============================================================================
// MODULE: Game Rules
// PURPOSE: Monats-Champion bestimmen und in Firebase krönen
// ============================================================================

import {
    loadScores, saveWinner, addHallOfFameEntry, checkWinnerExists
} from './firebaseService.js';
import { getPreviousMonth } from '../utils/date.js';

export async function crownChampionForMonth(month) {
    const scores = await loadScores(month);
    if (!scores.length) return null;
    scores.sort((a, b) => b.score - a.score);
    const champion = scores[0];
    await saveWinner(month, champion);
    await addHallOfFameEntry(month, champion);
    return champion;
}

export async function checkAndCrownMonthlyChampion() {
    const lastMonth = getPreviousMonth();
    try {
        if (await checkWinnerExists(lastMonth)) {
            console.log('✅ Champion bereits gekrönt für', lastMonth);
            return;
        }
        await crownChampionForMonth(lastMonth);
        console.log('👑 Neuer Champion für', lastMonth);
    } catch (err) {
        console.error('❌ Champion-Check fehlgeschlagen:', err);
    }
}
