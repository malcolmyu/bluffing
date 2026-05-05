/**
 * Build game pet textures from source IP images.
 * Takes daodun.jpeg and bibilabu.jpg, generates 5 state variants each.
 * Usage: node scripts/build-pets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from 'canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_ASSETS = resolve(ROOT, 'src', 'assets');
const OUT_DIR = resolve(ROOT, 'public', 'assets', 'pets');

const SPRITE_W = 200;
const SPRITE_H = 240;

const PETS = [
  { name: 'daodun', file: 'daodun.jpeg' },
  { name: 'bibilabu', file: 'bibilabu.jpg' },
];

const STATES = ['idle', 'attack', 'hit', 'victory', 'defeated'];

function applyStateEffects(ctx, state, w, h) {
  switch (state) {
    case 'attack': {
      // Red tint overlay + action lines
      ctx.fillStyle = 'rgba(255, 60, 30, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lx = w * 0.7 + Math.random() * 20;
        ctx.beginPath();
        ctx.moveTo(lx, 20 + i * 35);
        ctx.lineTo(lx - 30 - Math.random() * 20, 20 + i * 35);
        ctx.stroke();
      }
      break;
    }
    case 'hit': {
      // X eyes overlay + blue tint
      ctx.fillStyle = 'rgba(80, 80, 220, 0.1)';
      ctx.fillRect(0, 0, w, h);
      // X marks for eyes
      const ex = w / 2, ey = h * 0.32;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 2.5;
      [-16, 16].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(ex + ox - 5, ey - 5);
        ctx.lineTo(ex + ox + 5, ey + 5);
        ctx.moveTo(ex + ox + 5, ey - 5);
        ctx.lineTo(ex + ox - 5, ey + 5);
        ctx.stroke();
      });
      // Sweat drops
      ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(w * 0.7, h * 0.2, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'victory': {
      // Golden glow + sparkles
      const gradient = ctx.createRadialGradient(w / 2, h * 0.3, 20, w / 2, h * 0.3, w * 0.6);
      gradient.addColorStop(0, 'rgba(255, 220, 50, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 220, 50, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      // Stars
      ctx.fillStyle = 'rgba(255, 255, 100, 0.9)';
      for (let i = 0; i < 8; i++) {
        const sx = 30 + Math.random() * (w - 60);
        const sy = 20 + Math.random() * (h * 0.5);
        const size = 2 + Math.random() * 3;
        drawStar(ctx, sx, sy, size);
      }
      break;
    }
    case 'defeated': {
      // Desaturate + dark vignette + tears
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(30, 30, 60, 0.25)';
      ctx.fillRect(0, 0, w, h);
      // Tears
      ctx.fillStyle = 'rgba(100, 160, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.36, 3, 7, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.58, h * 0.37, 3, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'idle':
    default:
      break;
  }
}

function drawStar(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const r = i === 0 ? size : size * 0.4;
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
    else ctx.lineTo(cx + Math.cos(angle) * size * 0.4, cy + Math.sin(angle) * size * 0.4);
    const angle2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(angle2) * size, cy + Math.sin(angle2) * size);
  }
  ctx.closePath();
  ctx.fill();
}

async function buildSprite(name, filePath, state) {
  const img = await loadImage(filePath);

  // Calculate fit to cover the sprite area while maintaining aspect ratio
  const imgAspect = img.width / img.height;
  const spriteAspect = SPRITE_W / SPRITE_H;

  let sw, sh, sx, sy;
  if (imgAspect > spriteAspect) {
    // Image wider — fit height, crop sides
    sh = SPRITE_H;
    sw = SPRITE_H * imgAspect;
    sx = (sw - SPRITE_W) / 2;
    sy = 0;
  } else {
    // Image taller — fit width, crop top/bottom
    sw = SPRITE_W;
    sh = SPRITE_W / imgAspect;
    sx = 0;
    sy = (sh - SPRITE_H) / 3; // bias toward top (face area)
  }

  const canvas = createCanvas(SPRITE_W, SPRITE_H);
  const ctx = canvas.getContext('2d');

  // Rounded rect clip for clean edges
  const radius = 16;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(SPRITE_W - radius, 0);
  ctx.quadraticCurveTo(SPRITE_W, 0, SPRITE_W, radius);
  ctx.lineTo(SPRITE_W, SPRITE_H - radius);
  ctx.quadraticCurveTo(SPRITE_W, SPRITE_H, SPRITE_W - radius, SPRITE_H);
  ctx.lineTo(radius, SPRITE_H);
  ctx.quadraticCurveTo(0, SPRITE_H, 0, SPRITE_H - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // Fill background with a soft gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, SPRITE_H);
  bgGrad.addColorStop(0, '#3a3a5e');
  bgGrad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SPRITE_W, SPRITE_H);

  // Draw image
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SPRITE_W, SPRITE_H);

  // Draw a subtle inner shadow / border
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, SPRITE_W - 4, SPRITE_H - 4, radius - 2);
  ctx.stroke();

  // State-specific effects
  applyStateEffects(ctx, state, SPRITE_W, SPRITE_H);

  // Label badge at bottom
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const badgeH = 28;
  ctx.beginPath();
  ctx.roundRect(0, SPRITE_H - badgeH, SPRITE_W, badgeH, [0, 0, radius, radius]);
  ctx.fill();

  const stateLabels = { idle: '待机', attack: '攻击', hit: '受击', victory: '胜利', defeated: '败北' };
  const labelColors = { idle: '#ccc', attack: '#f66', hit: '#88f', victory: '#fd4', defeated: '#888' };
  ctx.fillStyle = labelColors[state] || '#ccc';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stateLabels[state], SPRITE_W / 2, SPRITE_H - 9);

  // Also add name label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  const displayName = name === 'daodun' ? '刀盾' : '比比拉布';
  ctx.fillText(displayName, 10, SPRITE_H - 12);

  const buf = canvas.toBuffer('image/png');
  const outPath = resolve(OUT_DIR, `${name}_${state}.png`);
  writeFileSync(outPath, buf);
  console.log(`  ${name}_${state}.png (${buf.length} bytes)`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const pet of PETS) {
    const filePath = resolve(SRC_ASSETS, pet.file);
    console.log(`Building ${pet.name} sprites from ${pet.file}...`);
    for (const state of STATES) {
      await buildSprite(pet.name, filePath, state);
    }
  }

  console.log('\nDone! All pet sprites generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
