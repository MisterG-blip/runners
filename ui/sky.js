// ============================================================================
// MODULE: Sky
// PURPOSE: Tageszeit-Gradient, Sonne, Mond (echte Phase), Sterne,
//          13 echte Sternbilder (astronomisch, mit Ophiuchus)
// ============================================================================

// ── Tageszeit-Phasen ─────────────────────────────────────────────────────────
const SKY_PHASES = [
    [0,  ['#020408', '#050d1a', '#0a1628']],
    [4,  ['#020408', '#050d1a', '#0a1628']],
    [5,  ['#1a0a05', '#2d1520', '#4a1535']],
    [6,  ['#ff6b35', '#c0392b', '#6b1a6e']],
    [7,  ['#ff9a3c', '#e67e22', '#3498db']],
    [8,  ['#1a6bb5', '#2980b9', '#5dade2']],
    [10, ['#0d47a1', '#1976d2', '#42a5f5']],
    [12, ['#0a3d91', '#1565c0', '#2196f3']],
    [15, ['#0d47a1', '#1976d2', '#42a5f5']],
    [17, ['#1a5276', '#2471a3', '#5499c7']],
    [18, ['#e67e22', '#c0392b', '#8e44ad']],
    [19, ['#922b21', '#6c3483', '#1a237e']],
    [20, ['#0d0d1a', '#1a1a3a', '#0a0a20']],
    [22, ['#020408', '#050d1a', '#0a1628']],
];

// ── Hintergrundsterne ─────────────────────────────────────────────────────────
const STARS = Array.from({ length: 120 }, () => ({
    x:     Math.random(),
    y:     Math.random() * 0.65,
    size:  Math.random() * 1.8 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.03,
}));

// ── 13 Echte Sternbilder ──────────────────────────────────────────────────────
// Relative Koordinaten [x, y] normiert auf 0..1 pro Konstellation
// Linien: Array von [vonIdx, nachIdx]
// sunStart/sunEnd: Kalender-Tage (Tag des Jahres) wann die Sonne durch dieses Sternbild zieht
// (astronomisch, nicht astrologisch)
const CONSTELLATIONS = [
    {
        name: 'Widder', nameDE: 'Widder ♈',
        sunStart: 78, sunEnd: 113,
        stars: [[0.1,0.5],[0.35,0.4],[0.6,0.35],[0.85,0.45],[1.0,0.3]],
        lines: [[0,1],[1,2],[2,3],[3,4]],
    },
    {
        name: 'Stier', nameDE: 'Stier ♉',
        sunStart: 113, sunEnd: 138,
        stars: [[0.0,0.6],[0.2,0.5],[0.45,0.4],[0.6,0.2],[0.75,0.55],[0.9,0.45],[0.7,0.7]],
        lines: [[0,1],[1,2],[2,3],[2,4],[4,5],[4,6]],
    },
    {
        name: 'Zwillinge', nameDE: 'Zwillinge ♊',
        sunStart: 138, sunEnd: 168,
        stars: [[0.0,0.2],[0.15,0.5],[0.3,0.8],[0.55,0.15],[0.65,0.45],[0.7,0.75],[0.85,0.55],[1.0,0.35]],
        lines: [[0,1],[1,2],[3,4],[4,5],[1,4],[4,6],[6,7]],
    },
    {
        name: 'Krebs', nameDE: 'Krebs ♋',
        sunStart: 168, sunEnd: 204,
        stars: [[0.1,0.3],[0.35,0.5],[0.6,0.4],[0.5,0.7],[0.8,0.65],[0.9,0.2]],
        lines: [[0,1],[1,2],[1,3],[2,4],[2,5]],
    },
    {
        name: 'Löwe', nameDE: 'Löwe ♌',
        sunStart: 204, sunEnd: 235,
        stars: [[0.0,0.5],[0.15,0.3],[0.3,0.15],[0.5,0.25],[0.6,0.5],[0.75,0.6],[0.85,0.4],[1.0,0.55]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[4,0]],
    },
    {
        name: 'Jungfrau', nameDE: 'Jungfrau ♍',
        sunStart: 235, sunEnd: 268,
        stars: [[0.0,0.3],[0.2,0.2],[0.4,0.35],[0.55,0.55],[0.7,0.4],[0.85,0.6],[1.0,0.45],[0.6,0.8]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7]],
    },
    {
        name: 'Waage', nameDE: 'Waage ♎',
        sunStart: 268, sunEnd: 295,
        stars: [[0.1,0.7],[0.4,0.55],[0.6,0.3],[0.85,0.4],[0.7,0.7],[0.3,0.2]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,1],[2,5]],
    },
    {
        name: 'Skorpion', nameDE: 'Skorpion ♏',
        sunStart: 295, sunEnd: 310,
        stars: [[0.0,0.4],[0.15,0.35],[0.3,0.45],[0.45,0.5],[0.55,0.4],[0.65,0.55],[0.75,0.7],[0.85,0.8],[0.95,0.65],[1.0,0.5]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]],
    },
    {
        name: 'Schlangenträger', nameDE: 'Schlangenträger ⛎',
        sunStart: 310, sunEnd: 327,
        stars: [[0.1,0.1],[0.25,0.3],[0.4,0.5],[0.3,0.7],[0.5,0.85],[0.7,0.7],[0.6,0.5],[0.75,0.3],[0.9,0.15],[0.5,0.3]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[2,9],[6,9]],
    },
    {
        name: 'Schütze', nameDE: 'Schütze ♐',
        sunStart: 327, sunEnd: 357,
        stars: [[0.0,0.6],[0.2,0.45],[0.35,0.25],[0.5,0.4],[0.65,0.55],[0.8,0.35],[1.0,0.5],[0.75,0.7]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[4,7]],
    },
    {
        name: 'Steinbock', nameDE: 'Steinbock ♑',
        sunStart: 357, sunEnd: 387,   // bis 27. Jan
        stars: [[0.0,0.4],[0.2,0.25],[0.4,0.35],[0.6,0.5],[0.8,0.4],[1.0,0.55],[0.75,0.7],[0.45,0.65]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,3]],
    },
    {
        name: 'Wassermann', nameDE: 'Wassermann ♒',
        sunStart: 387, sunEnd: 418,   // 27. Jan – 16. Feb
        stars: [[0.0,0.35],[0.2,0.5],[0.4,0.4],[0.55,0.6],[0.7,0.45],[0.85,0.65],[1.0,0.5],[0.5,0.8]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7]],
    },
    {
        name: 'Fische', nameDE: 'Fische ♓',
        sunStart: 418, sunEnd: 443,   // 16. Feb – 11. Mär
        stars: [[0.0,0.5],[0.15,0.35],[0.3,0.2],[0.45,0.35],[0.5,0.55],[0.35,0.65],[0.6,0.4],[0.75,0.25],[0.9,0.4],[1.0,0.6]],
        lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[6,7],[7,8],[8,9]],
    },
];

// ── Aktuelle Konstellation berechnen ─────────────────────────────────────────
function getDayOfYear(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
}

function getCurrentConstellation() {
    const day = getDayOfYear();
    // Steinbock und Wassermann können ins nächste Jahr reichen
    const dayExt = day < 30 ? day + 365 : day;
    for (const c of CONSTELLATIONS) {
        if (dayExt >= c.sunStart && dayExt < c.sunEnd) return c;
    }
    return CONSTELLATIONS[0];
}

// Konstellation einmalig pro Session bestimmen
const CURRENT_CONSTELLATION = getCurrentConstellation();

// ── Mondphase (astronomisch) ──────────────────────────────────────────────────
function getMoonPhase() {
    // Bekannter Neumond: 6. Jan 2000 (JD 2451549.5)
    const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const synodicMonth = 29.53058867 * 24 * 3600 * 1000;
    const elapsed      = Date.now() - knownNewMoon;
    return ((elapsed % synodicMonth) / synodicMonth + 1) % 1; // 0=Neu, 0.5=Voll
}

// ── Milestone-Override ────────────────────────────────────────────────────────
let _skyOverride  = null;
let _overrideAlpha = 0;

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────
function getTimeOfDay() {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
}

function getSkyColors(hour) {
    let lo = SKY_PHASES[0], hi = SKY_PHASES[SKY_PHASES.length - 1];
    for (let i = 0; i < SKY_PHASES.length - 1; i++) {
        if (hour >= SKY_PHASES[i][0] && hour < SKY_PHASES[i + 1][0]) {
            lo = SKY_PHASES[i]; hi = SKY_PHASES[i + 1]; break;
        }
    }
    const t = (hour - lo[0]) / (hi[0] - lo[0]);
    return lo[1].map((c, i) => _lerpColor(c, hi[1][i], t));
}

function _lerpColor(a, b, t) {
    const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    return `#${(
        (Math.round(ar + (br - ar) * t) << 16) |
        (Math.round(ag + (bg - ag) * t) << 8)  |
         Math.round(ab + (bb - ab) * t)
    ).toString(16).padStart(6, '0')}`;
}

function _starAlpha(hour) {
    if (hour >= 8  && hour < 17) return 0;
    if (hour >= 17 && hour < 19) return (hour - 17) / 2 * 0.8;
    if (hour >= 19 || hour <  6) return 0.8;
    if (hour >=  6 && hour <  8) return Math.max(0, 0.8 - (hour - 6) / 2 * 0.8);
    return 0;
}

function getSunMoonState(hour, canvas) {
    const isSun = hour >= 6 && hour < 19;
    let angle;
    if (isSun) {
        angle = Math.PI - ((hour - 6) / 12) * Math.PI;
    } else {
        const moonHour = hour < 6 ? hour + 24 : hour;
        angle = Math.PI - ((moonHour - 19) / 12) * Math.PI;
    }
    const cx = canvas.width  * 0.5 + Math.cos(angle) * canvas.width  * 0.42;
    const cy = canvas.height * 0.35 - Math.sin(angle) * canvas.height * 0.32;
    return { x: cx, y: cy, body: isSun ? 'sun' : 'moon' };
}

// ── Zeichnen: Hintergrundsterne ───────────────────────────────────────────────
function drawStars(ctx, canvas, alpha) {
    const t = Date.now() * 0.001;
    ctx.save();
    STARS.forEach(s => {
        const twinkle  = Math.sin(t * s.speed + s.phase) * 0.4 + 0.6;
        ctx.globalAlpha = alpha * twinkle;
        ctx.fillStyle   = 'white';
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height * 0.75, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// ── Zeichnen: Sternbild ───────────────────────────────────────────────────────
function drawConstellation(ctx, canvas, alpha) {
    if (alpha <= 0) return;
    const c = CURRENT_CONSTELLATION;

    // Sternbild im oberen Drittel des Himmels platzieren, leicht links
    const areaX = canvas.width  * 0.08;
    const areaY = canvas.height * 0.04;
    const areaW = canvas.width  * 0.38;
    const areaH = canvas.height * 0.30;

    const t = Date.now() * 0.001;

    // Sternpositionen berechnen
    const pts = c.stars.map(([rx, ry]) => ({
        x: areaX + rx * areaW,
        y: areaY + ry * areaH,
    }));

    ctx.save();

    // ── Verbindungslinien ──
    ctx.strokeStyle = `rgba(160,200,255,${alpha * 0.35})`;
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 6]);
    c.lines.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // ── Sterne der Konstellation ──
    pts.forEach((p, i) => {
        // Aktuelles Sternbild-Sterne etwas größer + twinkle
        const twinkle = Math.sin(t * 0.8 + i * 1.3) * 0.35 + 0.65;
        const size    = 2.2 + (i === 0 ? 1.2 : 0);   // Hauptstern größer

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5);
        grd.addColorStop(0, `rgba(180,220,255,${alpha * twinkle * 0.6})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Kern
        ctx.globalAlpha = alpha * twinkle;
        ctx.fillStyle   = '#c8e0ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    });

    // ── Name ──
    const centerX = areaX + areaW * 0.5;
    const labelY  = areaY + areaH + 14;
    ctx.globalAlpha  = alpha * 0.7;
    ctx.fillStyle    = '#aaccff';
    ctx.font         = 'italic 13px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(c.nameDE, centerX, labelY);

    ctx.restore();
}

// ── Zeichnen: Sonne ───────────────────────────────────────────────────────────
function drawSun(ctx, x, y, hour) {
    const t   = Date.now() * 0.001;
    const low = hour < 7 || hour > 17;
    const color     = low ? '#ff7f00' : '#FFE066';
    const glowColor = low ? 'rgba(255,100,0,0.35)' : 'rgba(255,230,50,0.25)';
    const size      = low ? 28 : 32;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    grd.addColorStop(0, glowColor); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, size * 3, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 12; i++) {
        const a  = (i / 12) * Math.PI * 2 + t * 0.3;
        const r1 = size + 6, r2 = size + 14 + Math.sin(t * 2 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
        ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.45, 0, Math.PI * 2); ctx.fill();
}

// ── Zeichnen: Mond (echte Phase) ──────────────────────────────────────────────
function drawMoon(ctx, x, y) {
    const size  = 26;
    const phase = getMoonPhase();  // 0=Neu, 0.25=Erstes Viertel, 0.5=Voll, 0.75=Letztes Viertel

    // Glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
    grd.addColorStop(0, 'rgba(200,220,255,0.2)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(x, y, size * 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Mondphase auf OffscreenCanvas
    const oc   = document.createElement('canvas');
    oc.width   = (size + 12) * 2;
    oc.height  = (size + 12) * 2;
    const oc2  = oc.getContext('2d');
    const ox   = oc.width / 2, oy = oc.height / 2;

    // Beleuchteter Kreis
    oc2.fillStyle = '#d4e0f0';
    oc2.beginPath(); oc2.arc(ox, oy, size, 0, Math.PI * 2); oc2.fill();

    // Schattenberechnung je nach Phase
    // phase 0   = Neumond    (komplett dunkel)
    // phase 0.25 = zunehmend Halbmond (rechts hell)
    // phase 0.5  = Vollmond   (komplett hell)
    // phase 0.75 = abnehmend Halbmond (links hell)
    if (phase < 0.01 || phase > 0.99) {
        // Neumond – alles dunkel
        oc2.globalCompositeOperation = 'destination-out';
        oc2.fillStyle = 'rgba(0,0,0,1)';
        oc2.beginPath(); oc2.arc(ox, oy, size, 0, Math.PI * 2); oc2.fill();
        oc2.globalCompositeOperation = 'source-over';
    } else if (phase < 0.5) {
        // Zunehmend: Schatten links, Licht rechts
        const t  = phase * 2;           // 0..1
        const rx = size * (1 - t * 2);  // Ellipsen-X: +size..0..-size
        oc2.globalCompositeOperation = 'destination-out';
        oc2.fillStyle = 'rgba(0,0,0,1)';
        oc2.beginPath();
        // Halbkreis links (Schatten) + Ellipse rechts
        oc2.ellipse(ox + rx * 0.5, oy, Math.abs(rx) + 1, size, 0, Math.PI / 2, Math.PI * 1.5);
        oc2.arc(ox, oy, size, Math.PI * 1.5, Math.PI / 2);
        oc2.fill();
        oc2.globalCompositeOperation = 'source-over';
    } else if (phase > 0.5) {
        // Abnehmend: Licht links, Schatten rechts
        const t  = (phase - 0.5) * 2;
        const rx = size * (t * 2 - 1);
        oc2.globalCompositeOperation = 'destination-out';
        oc2.fillStyle = 'rgba(0,0,0,1)';
        oc2.beginPath();
        oc2.ellipse(ox + rx * 0.5, oy, Math.abs(rx) + 1, size, 0, -Math.PI / 2, Math.PI / 2);
        oc2.arc(ox, oy, size, Math.PI / 2, -Math.PI / 2);
        oc2.fill();
        oc2.globalCompositeOperation = 'source-over';
    }
    // phase === 0.5 → Vollmond, kein Schatten

    // Krater
    oc2.globalAlpha = 0.15;
    oc2.fillStyle   = '#8899aa';
    [[ox-6,oy+4,4],[ox-14,oy-6,3],[ox-4,oy-12,2.5]].forEach(([cx,cy,r]) => {
        oc2.beginPath(); oc2.arc(cx,cy,r,0,Math.PI*2); oc2.fill();
    });

    
    ctx.drawImage(oc, x - ox, y - oy);
}

// ── Haupt-Export ──────────────────────────────────────────────────────────────
export function drawSky(ctx, canvas) {
    const hour   = getTimeOfDay();
    const colors = getSkyColors(hour);

    let drawColors = colors;
    if (_overrideAlpha > 0) {
        drawColors = colors.map((c, i) => _lerpColor(c, _skyOverride[i], _overrideAlpha));
        _overrideAlpha = Math.max(0, _overrideAlpha - 0.005);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.85);
    grad.addColorStop(0,   drawColors[0]);
    grad.addColorStop(0.5, drawColors[1]);
    grad.addColorStop(1,   drawColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const starAlpha = _starAlpha(hour);

    // Sternbild (nur nachts, gemeinsam mit Sternen eingeblendet)
    if (starAlpha > 0) {
        drawStars(ctx, canvas, starAlpha);
        drawConstellation(ctx, canvas, starAlpha * 0.9);
    }

    // Sonne oder Mond
    const sm = getSunMoonState(hour, canvas);
    if (sm.body === 'sun') drawSun(ctx, sm.x, sm.y, hour);
    else                   drawMoon(ctx, sm.x, sm.y);
}

export function triggerSkyOverride(colors, intensity = 0.5) {
    _skyOverride   = colors;
    _overrideAlpha = intensity;
}

export function getTimeOfDayLabel() {
    const h = getTimeOfDay();
    if (h >= 5  && h < 7)  return 'Sonnenaufgang';
    if (h >= 7  && h < 10) return 'Morgen';
    if (h >= 10 && h < 12) return 'Vormittag';
    if (h >= 12 && h < 14) return 'Mittag';
    if (h >= 14 && h < 17) return 'Nachmittag';
    if (h >= 17 && h < 19) return 'Abend';
    if (h >= 19 && h < 22) return 'Dämmerung';
    return 'Nacht';
}

export function getCurrentConstellationName() {
    return CURRENT_CONSTELLATION.nameDE;
}
