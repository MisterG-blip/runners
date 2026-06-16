// ============================================================================
// MODULE: Firebase Init
// PURPOSE: Firebase App + Realtime Database bereitstellen
// ============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getDatabase }   from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';

const firebaseConfig = {
    apiKey:            'AIzaSyA4UMR2WEw_ggya5gPHsNjqudQo0lW8C2w',
    authDomain:        'runners-game.firebaseapp.com',
    databaseURL:       'https://runners-game-default-rtdb.europe-west1.firebasedatabase.app',
    projectId:         'runners-game',
    storageBucket:     'runners-game.appspot.com',
    messagingSenderId: '917364422556',
    appId:             '1:917364422556:web:6947c132a12e5953d9fa59',
    measurementId:     'G-PSZLWSSTQX'
};

let db           = null;
let firebaseReady = false;

try {
    const app = initializeApp(firebaseConfig);
    db           = getDatabase(app);
    firebaseReady = true;
    console.log('✅ Firebase verbunden');
} catch (err) {
    console.error('❌ Firebase Fehler:', err);
}

export { db, firebaseReady };
