import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getDatabase, ref, get, push } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';

// --- Canvas Setup ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// --- Firebase konfigurieren ---
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
// Firebase App initialisieren
const app = initializeApp(firebaseConfig);
// Realtime Database
const db = getDatabase(app);


// --- Spielvariablen ---
let gravity = 0.8;
let gameSpeed = 6;
let score = 0;
let gameOver = false;
let cameraOffsetY = 0;
let cameraTargetY = 0;
let highscoreSaved = false;
let currentTopScores = [];
let gameStarted = false;

// ---Bodenwdw
let groundHeight = 100;
let groundOffsetFront = 0;
let groundOffsetBack = 0;

// --- Spieler ---
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    vy: 0,
    jumping: false
};
player.y = canvas.height - groundHeight - player.height;

// --- Hindernisse ---
const obstacles = [];
// --- Grundabstand
let nextObstacleIn = randomRange(300, 500);

// --- Entwickler-Logo vorbereiten ---
const logoImg = new Image();
logoImg.src = "fuchs-logo.png"; // dein Logo, rund

// --- Wolken ---
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: randomRange(50, canvas.height / 2),
        width: randomRange(80, 150),
        height: randomRange(30, 60),
        speed: randomRange(0.5, 1.5)
    });
}

// --- Hilfsfunktionen ---
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getPlayerName() {
    let name = localStorage.getItem("playerName");
    if (!name) {
        name = prompt("Gib deinen Namen ein:") || "Anonym";
        localStorage.setItem("playerName", name);
    }
    return name;
}

function saveScore(name, score) {
    const scoresRef = ref(db, 'highscores');
    push(scoresRef, {
        name: name,
        score: score,
        time: Date.now()
    })
        .then(() => console.log("Score gespeichert"))
        .catch(err => console.error("Fehler beim Speichern:", err));
}

async function loadHighscores(limit = 20) {
    const snapshot = await get(ref(db, 'highscores'));
    if (!snapshot.exists()) return [];

    const list = Object.values(snapshot.val());
    list.sort((a, b) => b.score - a.score);

    return list.slice(0, limit);
}

function drawHighscores(scores) {
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText("Highscores:", 20, 80);

    scores.forEach((e, i) => {
        ctx.fillText(
            `${i + 1}. ${e.name}: ${e.score}`,
            20,
            110 + i * 25
        );
    });
}

function createObstacle() {
    const type = Math.random() < 0.5 ? "rect" : "logo";
    const obstacle = {
        x: canvas.width + 50,
        width: type === "rect" ? 40 : 60,
        height: type === "rect" ? 60 : 60,
        type: type,
        img: type === "logo" ? logoImg : null,
        angle: 0
    };
    obstacles.push(obstacle);

    // Abstand für das nächste Hindernis dynamisch an Score anpassen
    let baseDistance = randomRange(350, 1000);
    let difficultyFactor = Math.max(0.5, 1 - score / 100); // nie < 0.5
    nextObstacleIn = baseDistance * difficultyFactor;

    // Manchmal zufällige Pause
    if (Math.random() < 0.2) nextObstacleIn += randomRange(50, 300);
}
// --- Wolken Zeichnen
function drawClouds() {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bewegung
        c.x -= c.speed;
        if (c.x + c.width / 2 < 0) {
            c.x = canvas.width + c.width / 2;
            c.y = randomRange(50, canvas.height / 2);
            c.width = randomRange(80, 150);
            c.height = randomRange(30, 60);
            c.speed = randomRange(0.5, 1.5);
        }
    });
}

// --- Canvas Wackler beo springen ---
function updateCamera() {
    // Kamera sanft zum Ziel bewegen
    cameraOffsetY += (cameraTargetY - cameraOffsetY) * 0.2;

    // Ziel wieder zurücksetzen, wenn fast angekommen
    if (Math.abs(cameraOffsetY - cameraTargetY) < 0.5) {
        cameraTargetY = 0; // zurück auf Null gleiten
    }
}

// --- Input ---
function jump() {
    if (!player.jumping && !gameOver) {
        player.vy = -15;
        player.jumping = true;
        // einmaliger Kamerakick beim Absprung
        cameraTargetY = 5; // alles bewegt sich leicht nach unten
    }
    if (gameOver) restart();
}

window.addEventListener("keydown", e => { if (e.code === "Space") jump(); });
window.addEventListener("touchstart", jump);

// --- Spiel-Reset ---
function restart() {
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    obstacles.length = 0;
    nextObstacleIn = randomRange(200, 500);
    highscoreSaved = false; // Reset, damit beim nächsten Game Over wieder gespeichert werden kann
}


// --- Game Loop ---
function update() {
    if (gameOver) return;

    // --- Boden Bewegung
    groundOffsetFront -= gameSpeed;
    groundOffsetBack -= gameSpeed * 0.4;
    if (groundOffsetFront <= -40) groundOffsetFront = 0;
    if (groundOffsetBack <= -80) groundOffsetBack = 0;

    // Spieler Bewegung
    player.vy += gravity;
    player.y += player.vy;

    const groundY = canvas.height - groundHeight - player.height;

    // Boden-Kollision
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.jumping = false;
    }

    // Spieler-Bobbing nur, wenn auf dem Boden
    if (!player.jumping) {
        const bobAmplitude = 3;   // Höhe des Bobs
        const bobSpeed = 0.02;   // Geschwindigkeit
        player.currentBob = Math.sin(Date.now() * bobSpeed) * bobAmplitude;
    } else {
        player.currentBob = 0; // in der Luft kein Bobbing
    }

    // Hindernisse bewegen
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= gameSpeed;
        if (o.type === "logo") o.angle -= 0.1;

        // Kollision
        if (
            player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < canvas.height - groundHeight &&
            player.y + player.height > canvas.height - groundHeight - o.height
        ) {
            gameOver = true;
        }

        // Punkt + entfernen
        if (o.x + o.width < 0) {
            obstacles.splice(i, 1);
            score++;
            gameSpeed = 6 + Math.pow(score, 0.6);
        }
    }

    // Neues Hindernis?
    nextObstacleIn -= gameSpeed;
    if (nextObstacleIn <= 0) createObstacle();

    if (gameOver && !highscoreSaved) {
        const name = getPlayerName();
        saveScore(name, score);
        loadHighscores().then(scores => {
            currentTopScores = scores;
        });
        highscoreSaved = true;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "48px sans-serif";
        ctx.fillText("RUNNER", canvas.width / 2 - 100, canvas.height / 2 - 50);
        ctx.font = "24px sans-serif";
        ctx.fillText("Drücke Space oder Klick auf Start", canvas.width / 2 - 150, canvas.height / 2);
        return; // nichts anderes wird gezeichnet
    }

    // Wolken
    drawClouds();

    // Boden
    const groundTopY = canvas.height - groundHeight;
    const groundVisualHeight = groundHeight / 2;

    // Oberer Boden
    ctx.fillStyle = "#444";
    ctx.fillRect(0, groundTopY + cameraOffsetY, canvas.width, groundVisualHeight);
    //langsame Linien
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    for (let x = groundOffsetBack; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, groundTopY + cameraOffsetY);
        ctx.lineTo(x, groundTopY + groundVisualHeight + cameraOffsetY);
        ctx.stroke();
    }


    // Unterer Boden
    ctx.fillStyle = "#333";
    ctx.fillRect(0, groundTopY + groundVisualHeight + cameraOffsetY, canvas.width, groundVisualHeight);
    // Schnelle Linien
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    for (let x = groundOffsetFront; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundTopY + groundVisualHeight + cameraOffsetY);
        ctx.lineTo(x, canvas.height + cameraOffsetY);
        ctx.stroke();
    }

    // Spieler
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y + (player.currentBob || 0) + cameraOffsetY, player.width, player.height);

    // Hindernisse
    obstacles.forEach(o => {
        const baseY = canvas.height - groundHeight - o.height + cameraOffsetY;
        if (o.type === "rect") {
            const bob = Math.sin(Date.now() * 0.005 + o.x * 0.02) * 5;
            ctx.fillStyle = "red";
            ctx.fillRect(o.x, baseY + bob, o.width, o.height);
        } else if (o.type === "logo" && o.img.complete) {
            const r = o.width / 2;
            ctx.save();
            ctx.translate(o.x + r, baseY + r);
            ctx.rotate(o.angle);
            ctx.drawImage(o.img, -r, -r, o.width, o.height);
            ctx.restore();
        }
    });

    // Score
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Game Over
    if (gameOver) {
        ctx.font = "48px sans-serif";
        ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);
        ctx.font = "20px sans-serif";
        ctx.fillText("Tippen oder Space zum Neustart", canvas.width / 2 - 150, canvas.height / 2 + 40);
        // Highscores zeichnen
        drawHighscores(currentTopScores);
    }
}

function loop() {
    update();
    updateCamera();
    draw();
    requestAnimationFrame(loop);
}
// --- Input: Start Game ---
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        restart(); // Reset Startwerte
    }
}

window.addEventListener("keydown", e => { 
    if (e.code === "Space") startGame(); 
});
window.addEventListener("touchstart", startGame);

// --- Game Loop starten ---

loop();
