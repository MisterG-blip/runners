// ============================================================================
// MODULE: Weather
// PURPOSE: Echtes Wetter via Open-Meteo API (kein Key nötig)
//          Regen, Schnee, Gewitter, Nebel als Partikel-Effekte
// ============================================================================

// WMO Wetter-Codes → interne Typen
const WMO_MAP = {
    0:  'clear',
    1:  'clear', 2: 'cloudy', 3: 'overcast',
    45: 'fog',   48: 'fog',
    51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
    61: 'rain',  63: 'rain',  65: 'heavy_rain',
    71: 'snow',  73: 'snow',  75: 'heavy_snow',
    77: 'snow',
    80: 'rain',  81: 'rain',  82: 'heavy_rain',
    85: 'snow',  86: 'heavy_snow',
    95: 'storm', 96: 'storm', 99: 'storm',
};

let weatherType  = 'clear';
let weatherLabel = 'Klar';
let particles    = [];
let lightning    = null;   // { alpha, x } für Blitze bei Gewitter
let lightningTimer = 0;
let loaded       = false;
let loadError    = null;

// ── API laden ─────────────────────────────────────────────────────────────────
export async function loadWeather() {
    return new Promise(resolve => {
        if (!navigator.geolocation) {
            weatherType  = _randomFallback();
            weatherLabel = _label(weatherType);
            loaded = true;
            resolve(weatherType);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async pos => {
                try {
                    const { latitude: lat, longitude: lon } = pos.coords;
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=weathercode,windspeed_10m&timezone=auto`;
                    const res  = await fetch(url);
                    const data = await res.json();
                    const code = data?.current?.weathercode ?? 0;
                    weatherType  = WMO_MAP[code] ?? 'clear';
                    weatherLabel = _label(weatherType);
                    loaded = true;
                    console.log(`🌤 Wetter geladen: ${weatherLabel} (WMO ${code})`);
                    resolve(weatherType);
                } catch (e) {
                    console.warn('⚠️ Wetter-API Fehler:', e);
                    weatherType  = _randomFallback();
                    weatherLabel = _label(weatherType);
                    loaded = true;
                    resolve(weatherType);
                }
            },
            () => {
                // Standort verweigert
                weatherType  = _randomFallback();
                weatherLabel = _label(weatherType);
                loaded = true;
                resolve(weatherType);
            },
            { timeout: 6000 }
        );
    });
}

function _randomFallback() {
    const types = ['clear','cloudy','rain','drizzle'];
    return types[Math.floor(Math.random() * types.length)];
}

function _label(type) {
    return {
        clear:      'Klar',
        cloudy:     'Bewölkt',
        overcast:   'Bedeckt',
        fog:        'Nebel',
        drizzle:    'Nieselregen',
        rain:       'Regen',
        heavy_rain: 'Starkregen',
        snow:       'Schnee',
        heavy_snow: 'Schneefall',
        storm:      'Gewitter',
    }[type] ?? 'Klar';
}

export function getWeatherType()  { return weatherType; }
export function getWeatherLabel() { return weatherLabel; }
export function isWeatherLoaded() { return loaded; }

// ── Partikel spawnen ──────────────────────────────────────────────────────────
export function initWeatherParticles(canvas) {
    particles = [];
    const count = _particleCount();
    for (let i = 0; i < count; i++) {
        particles.push(_makeParticle(canvas, true));
    }
}

function _particleCount() {
    return {
        clear: 0, cloudy: 0, overcast: 0,
        fog:        40,
        drizzle:    60,
        rain:       120,
        heavy_rain: 220,
        snow:       80,
        heavy_snow: 160,
        storm:      180,
    }[weatherType] ?? 0;
}

function _makeParticle(canvas, randomY = false) {
    const isSnow  = weatherType === 'snow' || weatherType === 'heavy_snow';
    const isFog   = weatherType === 'fog'  || weatherType === 'overcast';
    const isStorm = weatherType === 'storm';

    if (isFog) {
        return {
            type: 'fog',
            x:    Math.random() * canvas.width,
            y:    randomY ? Math.random() * canvas.height : -60,
            w:    120 + Math.random() * 200,
            h:    30  + Math.random() * 40,
            vx:   0.3 + Math.random() * 0.4,
            alpha: 0.06 + Math.random() * 0.08,
        };
    }

    if (isSnow) {
        return {
            type:  'snow',
            x:     Math.random() * canvas.width,
            y:     randomY ? Math.random() * canvas.height : -10,
            size:  1.5 + Math.random() * 3,
            vx:    (Math.random() - 0.5) * 0.8,
            vy:    0.6 + Math.random() * 1.2,
            wobble: Math.random() * Math.PI * 2,
            alpha:  0.6 + Math.random() * 0.4,
        };
    }

    // Regen / Gewitter
    const speed = isStorm ? 14 + Math.random() * 6 : 8 + Math.random() * 5;
    const angle = isStorm ? 0.3 : 0.1;   // Sturm-Neigung
    return {
        type:  'rain',
        x:     Math.random() * (canvas.width + 100) - 50,
        y:     randomY ? Math.random() * canvas.height : -20,
        vx:    -speed * angle,
        vy:    speed,
        len:   8 + Math.random() * 10,
        alpha: 0.35 + Math.random() * 0.3,
    };
}

// ── Update ────────────────────────────────────────────────────────────────────
export function updateWeather(canvas, speedMultiplier = 1) {
    if (!particles.length && weatherType === 'clear') return;

    // Neue Partikel nachspawnen
    const target = _particleCount();
    if (particles.length < target) {
        particles.push(_makeParticle(canvas, false));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'rain') {
            p.x += p.vx * speedMultiplier;
            p.y += p.vy * speedMultiplier;
            if (p.y > canvas.height || p.x < -50) {
                particles[i] = _makeParticle(canvas, false);
            }
        } else if (p.type === 'snow') {
            p.wobble += 0.02;
            p.x += p.vx + Math.sin(p.wobble) * 0.4;
            p.y += p.vy * speedMultiplier;
            if (p.y > canvas.height) {
                particles[i] = _makeParticle(canvas, false);
            }
        } else if (p.type === 'fog') {
            p.x += p.vx;
            if (p.x > canvas.width + p.w) p.x = -p.w;
        }
    }

    // Blitz bei Gewitter
    if (weatherType === 'storm') {
        lightningTimer--;
        if (lightningTimer <= 0) {
            lightning     = { alpha: 1, x: 0.2 + Math.random() * 0.6 };
            lightningTimer = 120 + Math.floor(Math.random() * 300);
        }
        if (lightning) {
            lightning.alpha -= 0.06;
            if (lightning.alpha <= 0) lightning = null;
        }
    }
}

// ── Draw ──────────────────────────────────────────────────────────────────────
export function drawWeather(ctx, canvas) {
    if (!particles.length && !lightning) return;

    ctx.save();

    particles.forEach(p => {
        if (p.type === 'rain') {
            ctx.globalAlpha = p.alpha;
            ctx.strokeStyle = weatherType === 'storm' ? '#aac8ff' : '#8ab4d4';
            ctx.lineWidth   = weatherType === 'heavy_rain' || weatherType === 'storm' ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 0.6, p.y + p.len);
            ctx.stroke();

        } else if (p.type === 'snow') {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle   = 'white';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

        } else if (p.type === 'fog') {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle   = '#c8d8e8';
            ctx.beginPath();
            ctx.ellipse(p.x + p.w / 2, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Blitz-Overlay
    if (lightning) {
        ctx.globalAlpha = lightning.alpha * 0.35;
        ctx.fillStyle   = '#e8f0ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blitz-Zickzack
        ctx.globalAlpha = lightning.alpha * 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2 + Math.random() * 2;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#aaccff';
        const bx = canvas.width * lightning.x;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        let cy = 0;
        while (cy < canvas.height * 0.7) {
            cy += 30 + Math.random() * 40;
            ctx.lineTo(bx + (Math.random() - 0.5) * 60, cy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Overlay-Dimm für bewölkten Himmel
export function drawOvercast(ctx, canvas) {
    if (weatherType !== 'overcast' && weatherType !== 'storm' &&
        weatherType !== 'heavy_rain' && weatherType !== 'fog') return;
    const alpha = weatherType === 'storm' ? 0.35
                : weatherType === 'fog'   ? 0.25
                : 0.2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = '#1a2030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}
