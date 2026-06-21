// ============================================================================
// MODULE: Clouds
// PURPOSE: Normal-Wolken + Champion-Wolken zeichnen und animieren
// ============================================================================

const clouds         = [];
const championClouds = [];

export function initClouds(canvas, weatherType = 'clear') {
    const count = {
        clear:      1,
        cloudy:     5,
        overcast:   8,
        fog:        10,
        drizzle:    5,
        rain:       6,
        heavy_rain: 4,
        storm:      7,
        snow:       3,
        heavy_snow: 2,
    }[weatherType] ?? 3;

    clouds.length = 0;
    for (let i = 0; i < count; i++) {
        clouds.push({
            x:      Math.random() * canvas.width,
            y:      _rnd(50, canvas.height * 0.4),
            width:  _rnd(100, 180),
            height: _rnd(40, 70),
            speed:  _rnd(0.3, 1.0)
        });
    }
}

export function createChampionClouds(champions) {
    championClouds.length = 0;
    champions.forEach((c, i) => {
        championClouds.push({
            name: c.name, score: c.score, month: c.month,
            x: Math.random() * 800, y: _rnd(80, 300),
            width: _rnd(140, 200), height: _rnd(50, 80),
            speed: _rnd(0.4, 1.2),
            glowPhase:  Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            rank: i
        });
    });
}

export function getChampionClouds() { return championClouds; }

export function drawClouds(ctx, canvas) {
    // Normal
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        c.x -= c.speed;
        if (c.x + c.width / 2 < 0) {
            c.x = canvas.width + c.width / 2;
            c.y = _rnd(50, canvas.height * 0.4);
        }
    });

    // Champion
    championClouds.forEach(cloud => {
        cloud.glowPhase  += 0.02;
        cloud.pulsePhase += 0.03;
        const glow  = Math.sin(cloud.glowPhase)  * 0.3 + 0.7;
        const pulse = Math.sin(cloud.pulsePhase) * 0.1 + 1;

        let glowColor, textColor;
        if      (cloud.rank === 0) { glowColor = `rgba(255,215,0,${0.6*glow})`;   textColor = '#FFD700'; }
        else if (cloud.rank === 1) { glowColor = `rgba(192,192,192,${0.5*glow})`; textColor = '#C0C0C0'; }
        else if (cloud.rank === 2) { glowColor = `rgba(205,127,50,${0.4*glow})`;  textColor = '#CD7F32'; }
        else                       { glowColor = `rgba(100,150,255,${0.3*glow})`; textColor = '#88AAFF'; }

        ctx.shadowBlur  = 30 * glow;
        ctx.shadowColor = glowColor;
        ctx.fillStyle   = `rgba(255,255,255,${0.3 + 0.1 * glow})`;
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, (cloud.width/2)*pulse, (cloud.height/2)*pulse, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle    = textColor;
        ctx.font         = 'bold 16px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`👑 ${cloud.name}`, cloud.x, cloud.y - 8);
        ctx.font      = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(`${cloud.score}`, cloud.x, cloud.y + 8);

        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width / 2 < 0) {
            cloud.x = canvas.width + cloud.width / 2;
            cloud.y = _rnd(80, canvas.height * 0.45);
        }
    });
}

function _rnd(a, b) { return Math.random() * (b - a) + a; }
