import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getDatabase, ref, get, set, push, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';

// ============================================
// CANVAS SETUP
// ============================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyA4UMR2WEw_ggya5gPHsNjqudQo0lW8C2w",
    authDomain: "runners-game.firebaseapp.com",
    databaseURL: "https://runners-game-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "runners-game",
    storageBucket: "runners-game.appspot.com",
    messagingSenderId: "917364422556",
    appId: "1:917364422556:web:6947c132a12e5953d9fa59",
    measurementId: "G-PSZLWSSTQX"
};

let app, db;
let firebaseReady = false;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    firebaseReady = true;
    console.log("✅ Firebase verbunden");
} catch (error) {
    console.error("❌ Firebase Fehler:", error);
    firebaseReady = false;
}

// ============================================
// GAME STATE
// ============================================
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameover'
};

let currentState = GAME_STATE.MENU;
let gravity = 0.8;
let gameSpeed = 6;
let score = 0;
let highscoreSaved = false;
let currentTopScores = [];
let hallOfFame = [];

// Camera effects
let cameraOffsetY = 0;
let cameraTargetY = 0;
let cameraShake = 0;

// Ground
let groundHeight = 100;
let groundOffsetFront = 0;
let groundOffsetBack = 0;

// Player
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    vy: 0,
    jumping: false,
    currentBob: 0
};

// Obstacles
const obstacles = [];
let nextObstacleIn = randomRange(300, 500);

// Clouds (normal and hall of fame)
const clouds = [];
const championClouds = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPlayerName() {
    let name = localStorage.getItem("playerName");
    if (!name) {
        name = prompt("Gib deinen Namen ein:") || "Anonym";
        localStorage.setItem("playerName", name);
    }
    return name;
}

// ============================================
// FIREBASE FUNCTIONS WITH TIMEOUT PROTECTION
// ============================================

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
}

async function saveScore(name, score) {
    if (!firebaseReady) {
        console.warn("Firebase nicht verfügbar - Score nicht gespeichert");
        return;
    }

    try {
        const month = getCurrentMonth();
        const scoresRef = ref(db, `monthly_highscores/${month}/scores`);
        
        await withTimeout(
            push(scoresRef, {
                name: name,
                score: score,
                timestamp: Date.now()
            }),
            3000
        );
        
        console.log("✅ Score gespeichert");
    } catch (error) {
        console.error("❌ Fehler beim Speichern:", error);
    }
}

async function loadCurrentMonthScores(limit = 20) {
    if (!firebaseReady) return [];

    try {
        const month = getCurrentMonth();
        const scoresRef = ref(db, `monthly_highscores/${month}/scores`);
        const snapshot = await withTimeout(get(scoresRef), 3000);
        
        if (!snapshot.exists()) return [];

        const list = Object.values(snapshot.val());
        list.sort((a, b) => b.score - a.score);
        
        return list.slice(0, limit);
    } catch (error) {
        console.error("❌ Fehler beim Laden der Scores:", error);
        return [];
    }
}

async function loadHallOfFame() {
    if (!firebaseReady) return [];

    try {
        const hofRef = ref(db, 'hall_of_fame');
        const snapshot = await withTimeout(get(hofRef), 3000);
        
        if (!snapshot.exists()) return [];

        const list = Object.values(snapshot.val());
        // Sortiere nach Datum (neueste zuerst)
        list.sort((a, b) => b.timestamp - a.timestamp);
        
        return list.slice(0, 12); // Maximal 12 Champions
    } catch (error) {
        console.error("❌ Fehler beim Laden der Hall of Fame:", error);
        return [];
    }
}

async function checkAndCrownMonthlyChampion() {
    if (!firebaseReady) return;

    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        
        // Check if we already crowned this month's winner
        const winnerRef = ref(db, `monthly_highscores/${lastMonthStr}/winner`);
        const winnerSnapshot = await withTimeout(get(winnerRef), 3000);
        
        if (winnerSnapshot.exists()) {
            console.log("✅ Champion bereits gekrönt für", lastMonthStr);
            return;
        }

        // Get last month's scores
        const scoresRef = ref(db, `monthly_highscores/${lastMonthStr}/scores`);
        const scoresSnapshot = await withTimeout(get(scoresRef), 3000);
        
        if (!scoresSnapshot.exists()) {
            console.log("ℹ️ Keine Scores für letzten Monat");
            return;
        }

        const scores = Object.values(scoresSnapshot.val());
        scores.sort((a, b) => b.score - a.score);
        
        const champion = scores[0];
        
        // Save winner to last month
        await withTimeout(
            set(winnerRef, {
                name: champion.name,
                score: champion.score,
                timestamp: Date.now()
            }),
            3000
        );

        // Add to hall of fame
        const hofRef = ref(db, 'hall_of_fame');
        await withTimeout(
            push(hofRef, {
                name: champion.name,
                score: champion.score,
                month: lastMonthStr,
                timestamp: Date.now()
            }),
            3000
        );

        console.log("👑 Neuer Champion gekrönt:", champion.name, champion.score);
    } catch (error) {
        console.error("❌ Fehler beim Krönen des Champions:", error);
    }
}

// ============================================
// VISUAL ELEMENTS - LOGO LOADING
// ============================================
const logoImg = new Image();
logoImg.src = "fuchs-logo.png";

// SVG Fallback if PNG doesn't load
function createLogoCanvas() {
    const size = 60;
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = size;
    logoCanvas.height = size;
    const lctx = logoCanvas.getContext('2d');
    
    // Pink/Cyan split fox inspired
    // Left side - Pink
    lctx.fillStyle = '#d946ef';
    lctx.beginPath();
    lctx.moveTo(size * 0.5, size * 0.2);
    lctx.lineTo(size * 0.2, size * 0.4);
    lctx.lineTo(size * 0.3, size * 0.6);
    lctx.lineTo(size * 0.5, size * 0.8);
    lctx.lineTo(size * 0.5, size * 0.2);
    lctx.fill();
    
    // Right side - Cyan
    lctx.fillStyle = '#06b6d4';
    lctx.beginPath();
    lctx.moveTo(size * 0.5, size * 0.2);
    lctx.lineTo(size * 0.8, size * 0.4);
    lctx.lineTo(size * 0.7, size * 0.6);
    lctx.lineTo(size * 0.5, size * 0.8);
    lctx.lineTo(size * 0.5, size * 0.2);
    lctx.fill();
    
    return logoCanvas;
}

const logoFallback = createLogoCanvas();

// Use fallback if main logo fails to load
logoImg.onerror = () => {
    console.warn("⚠️ Logo konnte nicht geladen werden, nutze Fallback");
    logoImg.src = logoFallback.toDataURL();
};

// ============================================
// CLOUDS SYSTEM
// ============================================
function initializeClouds() {
    // Normal background clouds
    for (let i = 0; i < 6; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: randomRange(50, canvas.height * 0.4),
            width: randomRange(100, 180),
            height: randomRange(40, 70),
            speed: randomRange(0.3, 1.0)
        });
    }
}

function createChampionClouds(champions) {
    championClouds.length = 0;
    
    champions.forEach((champ, index) => {
        championClouds.push({
            name: champ.name,
            score: champ.score,
            month: champ.month,
            x: Math.random() * canvas.width,
            y: randomRange(80, canvas.height * 0.45),
            width: randomRange(140, 200),
            height: randomRange(50, 80),
            speed: randomRange(0.4, 1.2),
            glowPhase: Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            rank: index // 0 = latest champion
        });
    });
}

function drawClouds() {
    // Normal clouds (subtle background)
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        c.x -= c.speed;
        if (c.x + c.width / 2 < 0) {
            c.x = canvas.width + c.width / 2;
            c.y = randomRange(50, canvas.height * 0.4);
        }
    });

    // Champion clouds (glowing, with text)
    championClouds.forEach(cloud => {
        const centerX = cloud.x;
        const centerY = cloud.y;
        
        // Calculate glow intensity
        cloud.glowPhase += 0.02;
        cloud.pulsePhase += 0.03;
        const glow = Math.sin(cloud.glowPhase) * 0.3 + 0.7;
        const pulse = Math.sin(cloud.pulsePhase) * 0.1 + 1;
        
        // Glow colors based on rank
        let glowColor, textColor;
        if (cloud.rank === 0) {
            // Latest champion - gold
            glowColor = `rgba(255, 215, 0, ${0.6 * glow})`;
            textColor = '#FFD700';
        } else if (cloud.rank === 1) {
            // Silver
            glowColor = `rgba(192, 192, 192, ${0.5 * glow})`;
            textColor = '#C0C0C0';
        } else if (cloud.rank === 2) {
            // Bronze
            glowColor = `rgba(205, 127, 50, ${0.4 * glow})`;
            textColor = '#CD7F32';
        } else {
            // Others - white/blue
            glowColor = `rgba(100, 150, 255, ${0.3 * glow})`;
            textColor = '#88AAFF';
        }

        // Outer glow
        ctx.shadowBlur = 30 * glow;
        ctx.shadowColor = glowColor;
        
        // Cloud shape
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.1 * glow})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, (cloud.width / 2) * pulse, (cloud.height / 2) * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Champion name
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`👑 ${cloud.name}`, centerX, centerY - 8);
        
        // Score
        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`${cloud.score}`, centerX, centerY + 8);

        // Movement
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width / 2 < 0) {
            cloud.x = canvas.width + cloud.width / 2;
            cloud.y = randomRange(80, canvas.height * 0.45);
        }
    });
}

// ============================================
// OBSTACLES
// ============================================
function createObstacle() {
    const type = Math.random() < 0.5 ? "rect" : "logo";
    const obstacle = {
        x: canvas.width + 50,
        width: type === "rect" ? 40 : 60,
        height: type === "rect" ? 60 : 60,
        type: type,
        angle: 0,
        bobPhase: Math.random() * Math.PI * 2
    };
    obstacles.push(obstacle);

    // Adaptive difficulty - gets MUCH harder quickly
    let baseDistance = randomRange(350, 1000);
    let difficultyFactor = Math.max(0.5, 1 - score / 100); // Was 150, now 100 = faster difficulty ramp
    nextObstacleIn = baseDistance * difficultyFactor;

    // Random pause (sometimes)
    if (Math.random() < 0.2) {
        nextObstacleIn += randomRange(50, 300);
    }
}

// ============================================
// CAMERA EFFECTS
// ============================================
function updateCamera() {
    // Smooth camera movement
    cameraOffsetY += (cameraTargetY - cameraOffsetY) * 0.15;

    // Camera shake decay
    if (Math.abs(cameraShake) > 0.1) {
        cameraShake *= 0.8;
    } else {
        cameraShake = 0;
    }

    // Reset target
    if (Math.abs(cameraOffsetY - cameraTargetY) < 0.5) {
        cameraTargetY = 0;
    }
}

function addCameraShake(intensity) {
    cameraShake = intensity;
}

// ============================================
// PLAYER ACTIONS
// ============================================
function jump() {
    if (currentState === GAME_STATE.MENU) {
        startGame();
        return;
    }

    if (currentState === GAME_STATE.GAME_OVER) {
        restart();
        return;
    }

    if (!player.jumping && currentState === GAME_STATE.PLAYING) {
        player.vy = -15;
        player.jumping = true;
        cameraTargetY = 10;
    }
}

function startGame() {
    currentState = GAME_STATE.PLAYING;
    restart();
}

function restart() {
    currentState = GAME_STATE.PLAYING;
    score = 0;
    gameSpeed = 6;
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    player.jumping = false;
    obstacles.length = 0;
    nextObstacleIn = randomRange(200, 500);
    highscoreSaved = false;
    cameraOffsetY = 0;
    cameraTargetY = 0;
    cameraShake = 0;
}

// ============================================
// GAME LOOP - UPDATE
// ============================================
function update() {
    if (currentState !== GAME_STATE.PLAYING) return;

    // Ground movement
    groundOffsetFront -= gameSpeed;
    groundOffsetBack -= gameSpeed * 0.4;
    if (groundOffsetFront <= -40) groundOffsetFront = 0;
    if (groundOffsetBack <= -80) groundOffsetBack = 0;

    // Player physics
    player.vy += gravity;
    player.y += player.vy;

    const groundY = canvas.height - groundHeight - player.height;

    // Ground collision
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.jumping = false;
    }

    // Player bobbing animation (only on ground)
    if (!player.jumping) {
        player.currentBob = Math.sin(Date.now() * 0.01) * 3;
    } else {
        player.currentBob = 0;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= gameSpeed;
        if (o.type === "logo") o.angle -= 0.1;
        o.bobPhase += 0.05;

        // Collision detection
        const obstacleY = canvas.height - groundHeight - o.height;
        if (
            player.x < o.x + o.width - 5 &&
            player.x + player.width > o.x + 5 &&
            player.y < obstacleY + o.height - 5 &&
            player.y + player.height > obstacleY + 5
        ) {
            currentState = GAME_STATE.GAME_OVER;
            addCameraShake(15);
        }

        // Score point and remove
        if (o.x + o.width < 0) {
            obstacles.splice(i, 1);
            score++;
            // Aggressive speed increase like original - gets FAST quickly
            gameSpeed = 6 + Math.pow(score, 0.6);
        }
    }

    // Spawn new obstacles
    nextObstacleIn -= gameSpeed;
    if (nextObstacleIn <= 0) {
        createObstacle();
    }

    // Handle game over
    if (currentState === GAME_STATE.GAME_OVER && !highscoreSaved) {
        const name = getPlayerName();
        saveScore(name, score);
        loadCurrentMonthScores().then(scores => {
            currentTopScores = scores;
            console.log(`📊 ${scores.length} Scores geladen:`, scores);
        }).catch(err => {
            console.error("❌ Fehler beim Laden der Scores:", err);
            currentTopScores = [];
        });
        highscoreSaved = true;
    }
}

// ============================================
// GAME LOOP - DRAW
// ============================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply camera shake
    const shakeX = cameraShake * (Math.random() - 0.5);
    const shakeY = cameraShake * (Math.random() - 0.5);
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Sky gradient (already in canvas CSS, but we can enhance)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    drawClouds();

    // Speed lines effect when fast
    if (gameSpeed > 12) {
        const speedLineIntensity = Math.min((gameSpeed - 12) / 15, 1);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * speedLineIntensity})`;
        ctx.lineWidth = 2;
        
        const numLines = Math.floor(5 * speedLineIntensity);
        for (let i = 0; i < numLines; i++) {
            const y = Math.random() * canvas.height;
            const length = randomRange(50, 150);
            const x = Math.random() * canvas.width;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - length, y);
            ctx.stroke();
        }
    }

    // Ground layers
    const groundTopY = canvas.height - groundHeight;
    const groundVisualHeight = groundHeight / 2;

    // Upper ground layer
    ctx.fillStyle = "#3a3a5a";
    ctx.fillRect(0, groundTopY + cameraOffsetY, canvas.width, groundVisualHeight);
    
    // Slow lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    for (let x = groundOffsetBack; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, groundTopY + cameraOffsetY);
        ctx.lineTo(x, groundTopY + groundVisualHeight + cameraOffsetY);
        ctx.stroke();
    }

    // Lower ground layer
    ctx.fillStyle = "#2a2a4a";
    ctx.fillRect(0, groundTopY + groundVisualHeight + cameraOffsetY, canvas.width, groundVisualHeight);
    
    // Fast lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    for (let x = groundOffsetFront; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundTopY + groundVisualHeight + cameraOffsetY);
        ctx.lineTo(x, canvas.height + cameraOffsetY);
        ctx.stroke();
    }

    if (currentState === GAME_STATE.MENU) {
        drawMenu();
    } else {
        drawGameplay();
    }

    ctx.restore();
}

function drawMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RUNNER", canvas.width / 2, canvas.height / 2 - 80);

    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("🏆 Monatliches Highscore-System 🏆", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Werde Champion und schwebe als goldene Wolke!", canvas.width / 2, canvas.height / 2 + 20);

    // Animated start hint
    const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.font = "28px sans-serif";
    ctx.fillText("Drücke SPACE oder TAP zum Start", canvas.width / 2, canvas.height / 2 + 80);

    // Show hall of fame preview
    if (championClouds.length > 0) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
        ctx.font = "18px sans-serif";
        ctx.fillText(`👑 Aktuelle Champions fliegen als Wolken!`, canvas.width / 2, canvas.height - 60);
    }
}

function drawGameplay() {
    // Draw player
    const playerY = player.y + player.currentBob + cameraOffsetY;
    
    // Player shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(player.x + 5, canvas.height - groundHeight + cameraOffsetY, player.width - 10, 5);
    
    // Player body
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, playerY, player.width, player.height);
    
    // Player eye
    ctx.fillStyle = "#000";
    ctx.fillRect(player.x + 25, playerY + 10, 8, 8);

    // Draw obstacles
    obstacles.forEach(o => {
        const baseY = canvas.height - groundHeight - o.height + cameraOffsetY;
        
        if (o.type === "rect") {
            const bob = Math.sin(o.bobPhase) * 4;
            
            // Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(o.x + 5, canvas.height - groundHeight + cameraOffsetY, o.width - 10, 5);
            
            // Body
            ctx.fillStyle = "#e63946";
            ctx.fillRect(o.x, baseY + bob, o.width, o.height);
            
            // Highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(o.x + 5, baseY + bob + 5, o.width - 10, 10);
        } else if (o.type === "logo") {
            const r = o.width / 2;
            const centerX = o.x + r;
            const centerY = baseY + r;
            
            // Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.arc(centerX, canvas.height - groundHeight + cameraOffsetY, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(o.angle);
            
            // Draw logo if loaded, otherwise use fallback
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                ctx.drawImage(logoImg, -r, -r, o.width, o.height);
            } else {
                ctx.drawImage(logoFallback, -r, -r, o.width, o.height);
            }
            
            ctx.restore();
        }
    });

    // Score display
    ctx.fillStyle = "white";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 20, 50);

    // Speed indicator with color coding (compact version)
    const speedPercent = Math.min(((gameSpeed - 6) / 20) * 100, 100);
    let speedColor = "#4ade80"; // green
    if (speedPercent > 66) speedColor = "#ef4444"; // red
    else if (speedPercent > 33) speedColor = "#fbbf24"; // yellow
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}x`, 20, 80);
    
    // Speed bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(20, 88, 120, 8);
    ctx.fillStyle = speedColor;
    ctx.fillRect(20, 88, 120 * (speedPercent / 100), 8);

    // Game over screen
    if (currentState === GAME_STATE.GAME_OVER) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title - smaller and higher
        ctx.fillStyle = "#e63946";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, 80);

        // Final Score
        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 120);

        // Restart hint
        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = "16px sans-serif";
        ctx.fillText("SPACE oder TAP für Neustart", canvas.width / 2, 150);

        // Highscore List - Centered and Responsive
        if (currentTopScores.length > 0) {
            const listStartY = 190;
            const listWidth = Math.min(500, canvas.width - 80);
            const listX = canvas.width / 2 - listWidth / 2;
            
            // Header with background
            ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
            ctx.fillRect(listX - 10, listStartY - 5, listWidth + 20, 40);
            
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            const currentMonth = getCurrentMonth();
            ctx.fillText(`🏆 Top Scores - ${currentMonth}`, canvas.width / 2, listStartY + 20);

            // Scores list with alternating background
            ctx.textAlign = "left";
            ctx.font = "15px sans-serif";
            
            // Calculate how many scores fit on screen - much tighter
            const availableHeight = canvas.height - listStartY - 80; // Leave 80px at bottom
            const lineHeight = 24; // Tighter spacing
            const maxVisible = Math.floor(availableHeight / lineHeight);
            const scoresToShow = Math.min(currentTopScores.length, maxVisible, 20);

            currentTopScores.slice(0, scoresToShow).forEach((entry, i) => {
                const y = listStartY + 50 + i * lineHeight;
                
                // Alternating background
                if (i % 2 === 0) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                    ctx.fillRect(listX - 10, y - 16, listWidth + 20, lineHeight);
                }
                
                // Medal/Number
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                ctx.fillStyle = i < 3 ? "#FFD700" : "white";
                ctx.fillText(medal, listX, y);
                
                // Name and Score
                ctx.fillStyle = "white";
                const nameMaxWidth = listWidth - 100;
                let displayName = entry.name;
                
                // Truncate long names
                if (ctx.measureText(displayName).width > nameMaxWidth) {
                    while (ctx.measureText(displayName + "...").width > nameMaxWidth && displayName.length > 0) {
                        displayName = displayName.slice(0, -1);
                    }
                    displayName += "...";
                }
                
                ctx.fillText(displayName, listX + 45, y);
                
                // Score (right aligned)
                ctx.fillStyle = i < 3 ? "#FFD700" : "#aaa";
                ctx.textAlign = "right";
                ctx.fillText(`${entry.score}`, listX + listWidth, y);
                ctx.textAlign = "left";
            });
            
            // Show "..." if there are more scores
            if (currentTopScores.length > scoresToShow) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.font = "13px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`... und ${currentTopScores.length - scoresToShow} weitere`, canvas.width / 2, listStartY + 50 + scoresToShow * lineHeight + 10);
            }
        } else {
            // Show loading message centered
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.font = "18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⏳ Lade Highscores...", canvas.width / 2, 250);
        }
    }
}

// ============================================
// INPUT HANDLERS
// ============================================
function setupInputHandlers() {
    // Keyboard
    window.addEventListener("keydown", e => {
        if (e.code === "Space") {
            e.preventDefault();
            jump();
        }
    });

    // Touch/Click
    canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        jump();
    });

    canvas.addEventListener("click", jump);

    // Mobile button
    const jumpBtn = document.getElementById("jump-btn");
    if (jumpBtn) {
        jumpBtn.addEventListener("touchstart", e => {
            e.preventDefault();
            jump();
        });
        jumpBtn.addEventListener("click", e => {
            e.preventDefault();
            jump();
        });
    }
}

// ============================================
// GAME LOOP
// ============================================
function gameLoop() {
    update();
    updateCamera();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    console.log("🎮 Spiel wird initialisiert...");
    
    // Hide loading screen
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";

    // Initialize clouds
    initializeClouds();

    // Setup input
    setupInputHandlers();

    // Position player
    player.y = canvas.height - groundHeight - player.height;

    // Start game loop IMMEDIATELY - don't wait for Firebase
    gameLoop();
    console.log("✅ Spiel gestartet!");

    // Load Firebase data in background (non-blocking)
    if (firebaseReady) {
        console.log("⏳ Lade Firebase-Daten im Hintergrund...");
        
        // Don't await - let these run in background
        checkAndCrownMonthlyChampion().catch(err => {
            console.warn("⚠️ Champion-Check fehlgeschlagen:", err);
        });
        
        loadHallOfFame().then(champions => {
            hallOfFame = champions;
            if (champions.length > 0) {
                createChampionClouds(champions);
                console.log(`👑 ${champions.length} Champions geladen`);
            }
        }).catch(err => {
            console.warn("⚠️ Hall of Fame laden fehlgeschlagen:", err);
        });

        loadCurrentMonthScores().then(scores => {
            currentTopScores = scores;
            console.log(`📊 ${scores.length} Scores geladen`);
        }).catch(err => {
            console.warn("⚠️ Scores laden fehlgeschlagen:", err);
        });
    } else {
        console.warn("⚠️ Firebase nicht verfügbar - Spiel läuft offline");
    }
}

// Start everything
init();
