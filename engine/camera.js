// ============================================================================
// MODULE: Camera
// PURPOSE: Kamera-Offset und Screen-Shake verwalten
// ============================================================================

let offsetY = 0;
let targetY  = 0;
let shake    = 0;

export function updateCamera() {
    offsetY += (targetY - offsetY) * 0.15;
    if (Math.abs(shake) > 0.1) {
        shake *= 0.8;
    } else {
        shake = 0;
    }
    if (Math.abs(offsetY - targetY) < 0.5) targetY = 0;
}

export function addShake(intensity) {
    shake = intensity;
}

export function triggerJumpOffset(amount = 10) {
    targetY = amount;
}

export function resetCamera() {
    offsetY = 0;
    targetY  = 0;
    shake    = 0;
}

export function getCameraState() {
    return { offsetY, shake };
}

export function applyToContext(ctx) {
    const sx = shake * (Math.random() - 0.5);
    const sy = shake * (Math.random() - 0.5);
    ctx.translate(sx, sy);
}
