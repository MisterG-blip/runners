// ============================================================================
// MODULE: Firebase Service
// PURPOSE: Datenzugriff – Scores laden/speichern, Hall of Fame
// ============================================================================

import { ref, get, set, push } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';
import { db, firebaseReady }   from './firebaseInit.js';
import { getCurrentMonth }     from '../utils/date.js';

function withTimeout(promise, ms = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
}

export async function saveScore(name, score) {
    if (!firebaseReady) throw new Error('Firebase nicht verfügbar');
    const month = getCurrentMonth();
    const ref_  = ref(db, `monthly_highscores/${month}/scores`);
    await withTimeout(push(ref_, { name, score, timestamp: Date.now() }), 3000);
}

export async function loadCurrentMonthScores(limit = 20) {
    if (!firebaseReady) return [];
    try {
        const month    = getCurrentMonth();
        const scRef    = ref(db, `monthly_highscores/${month}/scores`);
        const snapshot = await withTimeout(get(scRef), 3000);
        if (!snapshot.exists()) return [];
        const list = Object.values(snapshot.val());
        list.sort((a, b) => b.score - a.score);   // ← Sortierung gehört hier hin
        return list.slice(0, limit);
    } catch (err) {
        console.error('❌ Scores laden:', err);
        return [];
    }
}

export async function loadHallOfFame() {
    if (!firebaseReady) return [];
    try {
        const hofRef   = ref(db, 'hall_of_fame');
        const snapshot = await withTimeout(get(hofRef), 3000);
        if (!snapshot.exists()) return [];
        const list = Object.values(snapshot.val());
        list.sort((a, b) => b.score - a.score);
        return list.slice(0, 12);
    } catch (err) {
        console.error('❌ Hall of Fame laden:', err);
        return [];
    }
}

export async function saveWinner(month, champion) {
    if (!firebaseReady) return;
    const wRef = ref(db, `monthly_highscores/${month}/winner`);
    await withTimeout(set(wRef, { name: champion.name, score: champion.score, timestamp: Date.now() }), 3000);
}

export async function addHallOfFameEntry(month, champion) {
    if (!firebaseReady) return;
    const hofRef = ref(db, 'hall_of_fame');
    await withTimeout(push(hofRef, { name: champion.name, score: champion.score, month, timestamp: Date.now() }), 3000);
}

export async function checkWinnerExists(month) {
    if (!firebaseReady) return false;
    const wRef     = ref(db, `monthly_highscores/${month}/winner`);
    const snapshot = await withTimeout(get(wRef), 3000);
    return snapshot.exists();
}

export async function loadScores(month) {
    if (!firebaseReady) return [];
    try {
        const scRef    = ref(db, `monthly_highscores/${month}/scores`);
        const snapshot = await withTimeout(get(scRef), 3000);
        if (!snapshot.exists()) return [];
        return Object.values(snapshot.val());
    } catch { return []; }
}
