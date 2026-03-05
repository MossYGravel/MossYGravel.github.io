// patience.js — A wall that rewards staying.
// No clicks. No input. Just time.

function mulberry32(seed) {
  let h = seed | 0;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const W = 600, H = 600;
const FULL_REVEAL_SECONDS = 180; // 3 minutes for full clarity
const seed = 20260304;
const rng = mulberry32(seed);

const stoneColors = ['#4a4a42','#555548','#5e5e52','#48483e','#3d3d35','#52524a','#464638'];
const mossColors = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060','#1a3a0a','#3d7020'];
const lichColors = ['#8a8a6a','#9a9a7a','#7a8a60','#a0a080','#6a7a50'];
const crackColors = ['#1a1a16','#222218','#18180e','#201e14'];
const flowerColors = ['#c9a040','#d4b060','#e0c878','#dcc070'];

let startTime = null;
let animFrame = null;
let revealed = false;

function buildWall() {
  let defs = '';
  let els = '';

  defs += `
    <filter id="stoneNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed="${seed}" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured"/>
      <feComposite in="textured" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="roughEdge" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="${seed + 7}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="heavyWarp" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" seed="${seed + 13}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="12" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  `;

  // Base stone
  els += `<rect width="${W}" height="${H}" fill="#3a3a34"/>`;

  // Stone blocks
  const blockRows = 4;
  const blockCols = 3;
  for (let r = 0; r < blockRows; r++) {
    for (let c = 0; c < blockCols; c++) {
      const bx = c * (W / blockCols) + rng() * 10 - 5;
      const by = r * (H / blockRows) + rng() * 10 - 5;
      const bw = W / blockCols - 2 + rng() * 6;
      const bh = H / blockRows - 2 + rng() * 6;
      const col = stoneColors[Math.floor(rng() * stoneColors.length)];
      els += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}" opacity="${(0.4 + rng() * 0.3).toFixed(2)}" rx="1"/>`;
    }
  }

  // Texture patches
  for (let i = 0; i < 40; i++) {
    const cx = rng() * W, cy = rng() * H;
    const rx = 15 + rng() * 50, ry = 10 + rng() * 35;
    const rot = rng() * 360;
    const col = stoneColors[Math.floor(rng() * stoneColors.length)];
    els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${(0.12 + rng() * 0.2).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#stoneNoise)"/>`;
  }

  // Grain lines
  for (let i = 0; i < 25; i++) {
    const y = rng() * H;
    const x1 = rng() * W * 0.2;
    const x2 = x1 + 60 + rng() * 350;
    const wobble = rng() * 12 - 6;
    els += `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y + wobble).toFixed(1)}" stroke="#2e2e28" stroke-width="${(0.3 + rng() * 0.6).toFixed(1)}" opacity="${(0.12 + rng() * 0.18).toFixed(2)}"/>`;
  }

  // Cracks
  const allCrackPts = [];
  for (let c = 0; c < 3; c++) {
    let x, y;
    const edge = Math.floor(rng() * 4);
    if (edge === 0) { x = 0; y = rng() * H; }
    else if (edge === 1) { x = W; y = rng() * H; }
    else if (edge === 2) { x = rng() * W; y = 0; }
    else { x = rng() * W; y = H; }
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    const pts = [{x, y}];
    const targetX = W - x + (rng() - 0.5) * 200;
    const targetY = H - y + (rng() - 0.5) * 200;
    for (let s = 0; s < 8; s++) {
      const toTarget = Math.atan2(targetY - y, targetX - x);
      const angle = toTarget * 0.35 + rng() * Math.PI * 2 * 0.65;
      const len = 25 + rng() * 55;
      x = Math.max(-10, Math.min(W + 10, x + Math.cos(angle) * len));
      y = Math.max(-10, Math.min(H + 10, y + Math.sin(angle) * len));
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      pts.push({x, y});
    }
    allCrackPts.push(...pts);
    const w = 1.5 + rng() * 3;
    els += `<path d="${d}" fill="none" stroke="#111108" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity="0.8" filter="url(#roughEdge)"/>`;
    // Branches
    for (let b = 0; b < 3; b++) {
      const bp = pts[1 + Math.floor(rng() * (pts.length - 1))];
      let bx = bp.x, by = bp.y;
      let bd = `M${bx.toFixed(1)},${by.toFixed(1)}`;
      for (let s = 0; s < 3; s++) {
        const a = rng() * Math.PI * 2;
        const l = 8 + rng() * 25;
        bx += Math.cos(a) * l; by += Math.sin(a) * l;
        bd += ` L${bx.toFixed(1)},${by.toFixed(1)}`;
        allCrackPts.push({x: bx, y: by});
      }
      els += `<path d="${bd}" fill="none" stroke="${crackColors[Math.floor(rng() * crackColors.length)]}" stroke-width="${(0.5 + rng() * 1.2).toFixed(1)}" stroke-linecap="round" opacity="0.6"/>`;
    }
  }

  // Moss along cracks
  for (let i = 0; i < 60; i++) {
    const cp = allCrackPts[Math.floor(rng() * allCrackPts.length)];
    const cx = cp.x + (rng() - 0.5) * 20;
    const cy = cp.y + (rng() - 0.5) * 20;
    const r = 1.5 + rng() * 5;
    const col = mossColors[Math.floor(rng() * mossColors.length)];
    els += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(0.3 + rng() * 0.4).toFixed(2)}" filter="url(#heavyWarp)"/>`;
  }

  // Lichen
  for (let i = 0; i < 12; i++) {
    const cp = allCrackPts[Math.floor(rng() * allCrackPts.length)];
    const cx = cp.x + (rng() - 0.5) * 40;
    const cy = cp.y + (rng() - 0.5) * 40;
    const rx = 5 + rng() * 15;
    const ry = 3 + rng() * 10;
    const rot = rng() * 360;
    const col = lichColors[Math.floor(rng() * lichColors.length)];
    els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${(0.12 + rng() * 0.2).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#heavyWarp)"/>`;
  }

  // Small flowers in deepest cracks (only visible at full resolution)
  for (let i = 0; i < 5; i++) {
    const cp = allCrackPts[Math.floor(rng() * allCrackPts.length)];
    const cx = cp.x + (rng() - 0.5) * 8;
    const cy = cp.y + (rng() - 0.5) * 8;
    const stemH = 5 + rng() * 8;
    els += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy - stemH).toFixed(1)}" stroke="#3a5a20" stroke-width="0.6" opacity="0.5"/>`;
    const petalR = 1 + rng();
    const col = flowerColors[Math.floor(rng() * flowerColors.length)];
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const ppx = cx + Math.cos(pa) * petalR * 1.5;
      const ppy = (cy - stemH) + Math.sin(pa) * petalR * 1.5;
      els += `<circle cx="${ppx.toFixed(1)}" cy="${ppy.toFixed(1)}" r="${petalR.toFixed(1)}" fill="${col}" opacity="0.6"/>`;
    }
    els += `<circle cx="${cx.toFixed(1)}" cy="${(cy - stemH).toFixed(1)}" r="${(petalR * 0.5).toFixed(1)}" fill="#f0e8a0" opacity="0.7"/>`;
  }

  // Hidden message — only readable at full clarity
  els += `<text x="${W / 2}" y="${H - 15}" text-anchor="middle" font-family="'EB Garamond', serif" font-size="11" fill="#5a5040" opacity="0.15">you stayed</text>`;

  document.getElementById('wall-svg').innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${els}</svg>`;
}

function updateBlur() {
  if (!startTime) startTime = Date.now();
  const elapsed = (Date.now() - startTime) / 1000;
  const progress = Math.min(elapsed / FULL_REVEAL_SECONDS, 1);

  // Blur: starts at 20px, approaches 0
  const blur = 20 * (1 - progress);
  // Brightness: starts dim (0.4), approaches full (1.0)
  const brightness = 0.4 + 0.6 * progress;
  // Saturation: starts desaturated, gains color
  const saturation = 0.3 + 0.7 * progress;

  const wallEl = document.getElementById('wall-svg');
  wallEl.style.filter = `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)})`;

  // Update timer display
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Update subtitle at milestones
  const subtitleEl = document.getElementById('subtitle');
  if (subtitleEl && !revealed) {
    if (progress < 0.05) {
      subtitleEl.textContent = 'Stay.';
    } else if (progress < 0.15) {
      subtitleEl.textContent = 'The wall is here. So are you.';
    } else if (progress < 0.3) {
      subtitleEl.textContent = 'Shapes are forming.';
    } else if (progress < 0.5) {
      subtitleEl.textContent = 'Cracks becoming visible.';
    } else if (progress < 0.7) {
      subtitleEl.textContent = 'Moss in the mortar.';
    } else if (progress < 0.9) {
      subtitleEl.textContent = 'Almost clear.';
    } else if (progress < 1) {
      subtitleEl.textContent = 'Keep going.';
    } else {
      subtitleEl.textContent = 'You see it now.';
      revealed = true;
    }
  }

  if (progress < 1) {
    animFrame = requestAnimationFrame(updateBlur);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  buildWall();
  animFrame = requestAnimationFrame(updateBlur);
});
