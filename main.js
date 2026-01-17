const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- Canvas an Bildschirm anpassen ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// --- Spielvariablen ---
let gravity = 0.8;
let groundHeight = 100;
let gameSpeed = 6;
let score = 0;
let gameOver = false;

// --- Spieler ---
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    vy: 0,
    jumping: false
};

// Startposition auf Boden
player.y = canvas.height - groundHeight - player.height;

// --- Hindernis ---
const obstacle = {
    x: canvas.width,
    width: 40,
    height: 60
};

function resetObstacle() {
    obstacle.x = canvas.width + Math.random() * 300;
}
resetObstacle();

// --- Input ---
function jump() {
    if (!player.jumping && !gameOver) {
        player.vy = -15;
        player.jumping = true;
    }
    if (gameOver) restart();
}

window.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

window.addEventListener("touchstart", jump);

// --- Spiel-Reset ---
function restart() {
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    resetObstacle();
}

// --- Game Loop ---
function update() {
    if (gameOver) return;

    // Spieler bewegen
    player.vy += gravity;
    player.y += player.vy;

    // Boden-Kollision
    const groundY = canvas.height - groundHeight - player.height;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.jumping = false;
    }

    // Hindernis bewegen
    obstacle.x -= gameSpeed;
    if (obstacle.x + obstacle.width < 0) {
        resetObstacle();
        score++;
        gameSpeed += 0.2;
    }

    // Kollision
    if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < canvas.height - groundHeight &&
        player.y + player.height > canvas.height - groundHeight - obstacle.height
    ) {
        gameOver = true;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Boden
    ctx.fillStyle = "#444";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Spieler
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Hindernis
    ctx.fillStyle = "red";
    ctx.fillRect(
        obstacle.x,
        canvas.height - groundHeight - obstacle.height,
        obstacle.width,
        obstacle.height
    );

    // Score
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Score: ${score}`, 20, 40);

    if (gameOver) {
        ctx.font = "48px sans-serif";
        ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);
        ctx.font = "20px sans-serif";
        ctx.fillText("Tippen oder Space zum Neustart", canvas.width / 2 - 150, canvas.height / 2 + 40);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

