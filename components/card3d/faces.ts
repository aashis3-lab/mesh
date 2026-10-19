// Paints the card's faces onto 2D canvases. Each face is drawn three times with different
// palettes: a color map, a roughness/metalness map (G = roughness, B = metalness, as three.js
// reads them) and a bump map, so only the gold strands, logo and NFC mark are metallic.

export const TEX_W = 1024;
export const TEX_H = Math.round(TEX_W / (85.6 / 54));

export type Palette = { base: string; gold: string };

export const COLOR: Palette = { base: "#F8F0E0", gold: "#D9B464" };
export const SURFACE: Palette = { base: "rgb(0,165,0)", gold: "rgb(0,55,255)" };
export const BUMP: Palette = { base: "#000", gold: "#fff" };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Two families of diagonal strands; at each crossing one passes over and the other breaks,
// alternating like woven wire.
function weave(ctx: CanvasRenderingContext2D, color: string) {
  const s = 25;
  const gap = 4;
  const n = Math.ceil(Math.hypot(TEX_W, TEX_H) / 2 / s) + 1;
  ctx.save();
  ctx.translate(TEX_W / 2, TEX_H / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let a = -n; a <= n; a++) {
    for (let b = -n; b < n; b++) {
      // Strand along u at v = a: it's on top where (b + a) is even.
      const u0 = ((b + a) & 1) === 0 ? b * s : b * s + gap;
      const u1 = ((b + 1 + a) & 1) === 0 ? (b + 1) * s : (b + 1) * s - gap;
      ctx.moveTo(u0, a * s);
      ctx.lineTo(u1, a * s);
      // Strand along v at u = a: it's on top where (a + b) is odd.
      const v0 = ((a + b) & 1) === 1 ? b * s : b * s + gap;
      const v1 = ((a + b + 1) & 1) === 1 ? (b + 1) * s : (b + 1) * s - gap;
      ctx.moveTo(a * s, v0);
      ctx.lineTo(a * s, v1);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function frame(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 22, 22, TEX_W - 44, TEX_H - 44, 30);
  ctx.stroke();
}

// Marks get a thin halo in the base color first so they sit cleanly on top of the weave.
const HALO = 14;

function nfc(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette) {
  ctx.lineCap = "round";
  for (const [color, width] of [[p.base, 7 + HALO], [p.gold, 7]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const r of [16, 32, 48]) {
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
    }
  }
}

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, font: string, p: Palette) {
  ctx.font = `600 ${size}px ${font}`;
  ctx.letterSpacing = `${-size * 0.04}px`;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.strokeStyle = p.base;
  ctx.lineWidth = HALO;
  ctx.strokeText("mesh.", x, y);
  ctx.fillStyle = p.gold;
  ctx.fillText("mesh.", x, y);
}

export function drawFront(ctx: CanvasRenderingContext2D, p: Palette, font: string) {
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  weave(ctx, p.gold);
  frame(ctx, p.gold);
  wordmark(ctx, 70, 122, 66, font, p);
  nfc(ctx, TEX_W - 132, TEX_H - 100, p);
}

// A decorative QR-style code: fixed finder squares plus a seeded module pattern.
function qr(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const n = 25;
  const m = size / n;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const inFinder = (i: number, j: number) =>
    (i < 8 && j < 8) || (i >= n - 8 && j < 8) || (i < 8 && j >= n - 8);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!inFinder(i, j) && rand() > 0.52) ctx.fillRect(x + i * m, y + j * m, m + 0.5, m + 0.5);
    }
  }
  for (const [fi, fj] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    const fx = x + fi * m;
    const fy = y + fj * m;
    ctx.lineWidth = m;
    ctx.strokeStyle = color;
    ctx.strokeRect(fx + m / 2, fy + m / 2, 6 * m, 6 * m);
    ctx.fillRect(fx + 2 * m, fy + 2 * m, 3 * m, 3 * m);
  }
}

export function drawBack(ctx: CanvasRenderingContext2D, p: Palette, font: string) {
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  frame(ctx, p.gold);

  const size = 230;
  qr(ctx, TEX_W - size - 92, (TEX_H - size) / 2, size, p.gold);
  wordmark(ctx, 92, TEX_H - 92, 44, font, p);
}
