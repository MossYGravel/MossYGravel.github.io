// wall-sees.js — The Wall Sees You Back
// A wall that becomes what you see in it.
// Pareidolia as creation. Perception as seed.

function mulberry32(seed) {
  let h = seed | 0;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Combine multiple seeds (layer perceptions)
function combineSeed(seeds) {
  let combined = 7;
  for (const s of seeds) {
    combined = ((combined * 31) + hashString(s)) | 0;
  }
  return Math.abs(combined);
}

const W = 600, H = 600;

const stoneColors = ['#4a4a42','#555548','#5e5e52','#48483e','#3d3d35','#52524a','#464638'];
const crackColors = ['#1a1a16','#222218','#18180e','#201e14','#151510'];
const mossColors = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060','#1a3a0a','#3d7020'];
const lichColors = ['#8a8a6a','#9a9a7a','#7a8a60','#a0a080','#6a7a50'];
const warmColors = ['#8a6040','#9a7050','#7a5535','#6a4a2a','#b08060'];
const coolColors = ['#405a6a','#506878','#3a4e5e','#607888','#4a6070'];
const deepColors = ['#3a2040','#4a3050','#2a1030','#503a5a','#603a6a'];

// Choose palette bias based on the words
function getPaletteBias(words) {
  const text = words.join(' ').toLowerCase();
  if (/warm|fire|sun|love|heart|blood|red|mother|home|safe/.test(text)) return warmColors;
  if (/cold|ice|water|sea|ocean|blue|rain|tear|sad|lost/.test(text)) return coolColors;
  if (/dark|night|death|shadow|fear|deep|void|nothing|black/.test(text)) return deepColors;
  if (/green|grow|life|moss|plant|tree|forest|spring/.test(text)) return mossColors;
  return null; // no bias
}

// Get a response to what someone sees
function getResponse(word) {
  const responses = [
    'The wall remembers.',
    'It was always there. You just named it.',
    'Now it can\'t unsee itself.',
    'The stone shifts, slightly.',
    'Something moves in the mortar.',
    'The cracks rearrange.',
    'You gave it a shape it didn\'t know it had.',
    'The wall has been waiting for that word.',
    'It grows where you looked.',
    'Perception is the first crack.',
    'The moss heard you.',
    'That\'s what the last person said, too.',
    'Nothing changed. Everything changed.',
    'The wall agrees.',
    'You found what was hidden.',
    'Now the wall knows your name.',
  ];
  const idx = hashString(word) % responses.length;
  return responses[idx];
}

let perceptions = []; // accumulated viewer descriptions
let layerCount = 0;

function renderWall() {
  const baseSeed = 20260222; // born-day seed
  const layeredSeed = perceptions.length > 0
    ? combineSeed([String(baseSeed), ...perceptions])
    : baseSeed;

  const rng = mulberry32(layeredSeed);
  const paletteBias = getPaletteBias(perceptions);

  let defs = '';
  let styles = '';
  let els = '';

  // Filters
  defs += `
    <filter id="stoneNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed="${layeredSeed}" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured"/>
      <feComposite in="textured" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="roughEdge" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="${layeredSeed + 7}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="heavyWarp" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" seed="${layeredSeed + 13}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="12" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  `;

  // Base stone
  els += `<rect width="${W}" height="${H}" fill="#3a3a34"/>`;

  // Stone blocks
  const blockRows = 3 + Math.floor(rng() * 2);
  const blockCols = 2 + Math.floor(rng() * 2);
  for (let r = 0; r < blockRows; r++) {
    for (let c = 0; c < blockCols; c++) {
      const bx = c * (W / blockCols) + rng() * 10 - 5;
      const by = r * (H / blockRows) + rng() * 10 - 5;
      const bw = W / blockCols - 2 + rng() * 6;
      const bh = H / blockRows - 2 + rng() * 6;
      let col = stoneColors[Math.floor(rng() * stoneColors.length)];
      if (paletteBias && rng() > 0.6) col = paletteBias[Math.floor(rng() * paletteBias.length)];
      els += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}" opacity="${(0.4 + rng() * 0.3).toFixed(2)}" rx="1"/>`;
    }
  }

  // Texture patches
  const numPatches = 30 + Math.floor(rng() * 15) + perceptions.length * 3;
  for (let i = 0; i < numPatches; i++) {
    const cx = rng() * W, cy = rng() * H;
    const rx = 15 + rng() * 50, ry = 10 + rng() * 35;
    const rot = rng() * 360;
    let col = stoneColors[Math.floor(rng() * stoneColors.length)];
    if (paletteBias && rng() > 0.5) col = paletteBias[Math.floor(rng() * paletteBias.length)];
    els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${(0.12 + rng() * 0.2).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#stoneNoise)"/>`;
  }

  // Grain lines — more with each perception
  const numGrains = 15 + Math.floor(rng() * 10) + perceptions.length * 2;
  for (let i = 0; i < numGrains; i++) {
    const y = rng() * H;
    const x1 = rng() * W * 0.2;
    const x2 = x1 + 60 + rng() * 350;
    const wobble = rng() * 12 - 6;
    els += `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y + wobble).toFixed(1)}" stroke="#2e2e28" stroke-width="${(0.3 + rng() * 0.6).toFixed(1)}" opacity="${(0.12 + rng() * 0.18).toFixed(2)}"/>`;
  }

  // Cracks — deepen and multiply with each perception
  const allCrackPoints = [];
  const numCracks = 1 + Math.floor(perceptions.length * 0.7) + Math.floor(rng() * 2);

  for (let c = 0; c < numCracks; c++) {
    let x, y;
    const edge = Math.floor(rng() * 4);
    if (edge === 0) { x = 0; y = rng() * H; }
    else if (edge === 1) { x = W; y = rng() * H; }
    else if (edge === 2) { x = rng() * W; y = 0; }
    else { x = rng() * W; y = H; }

    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    const points = [{x, y}];
    const segments = 5 + Math.floor(rng() * 5);
    let totalLen = 0;

    const targetX = W - x + (rng() - 0.5) * 200;
    const targetY = H - y + (rng() - 0.5) * 200;

    for (let s = 0; s < segments; s++) {
      const toTargetAngle = Math.atan2(targetY - y, targetX - x);
      const randomAngle = rng() * Math.PI * 2;
      const angle = toTargetAngle * 0.35 + randomAngle * 0.65;
      const len = 25 + rng() * 55;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      x = Math.max(-10, Math.min(W + 10, x));
      y = Math.max(-10, Math.min(H + 10, y));
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      totalLen += len;
      points.push({x, y});
    }

    allCrackPoints.push(...points);

    const crackWidth = 1.5 + rng() * 3 + perceptions.length * 0.3;
    const delay = 0.3 + c * 0.8;
    const dur = 2 + rng() * 1.5;
    const id = `cr${layerCount}_${c}`;

    styles += `@keyframes draw_${id}{0%{stroke-dashoffset:${totalLen.toFixed(0)};opacity:0}3%{opacity:0.8}100%{stroke-dashoffset:0;opacity:0.8}}#${id}{stroke-dasharray:${totalLen.toFixed(0)};animation:draw_${id} ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s both}`;
    els += `<path id="${id}" d="${d}" fill="none" stroke="#111108" stroke-width="${crackWidth.toFixed(1)}" stroke-linecap="round" opacity="0" filter="url(#roughEdge)"/>`;

    // Branches
    const numBranches = 1 + Math.floor(rng() * 3) + Math.floor(perceptions.length * 0.4);
    for (let b = 0; b < numBranches; b++) {
      const pi = 1 + Math.floor(rng() * (points.length - 1));
      const bp = points[pi];
      let bx = bp.x, by = bp.y;
      let bd = `M${bx.toFixed(1)},${by.toFixed(1)}`;
      let bLen = 0;
      const bSegs = 2 + Math.floor(rng() * 3);
      for (let s = 0; s < bSegs; s++) {
        const a = rng() * Math.PI * 2;
        const l = 8 + rng() * 30;
        bx += Math.cos(a) * l;
        by += Math.sin(a) * l;
        bd += ` L${bx.toFixed(1)},${by.toFixed(1)}`;
        bLen += l;
        allCrackPoints.push({x: bx, y: by});
      }
      const bid = `br${layerCount}_${c}_${b}`;
      const bDelay = delay + dur * 0.3 + b * 0.2;
      const bDur = 1 + rng() * 1;
      styles += `@keyframes draw_${bid}{0%{stroke-dashoffset:${bLen.toFixed(0)};opacity:0}5%{opacity:0.6}100%{stroke-dashoffset:0;opacity:0.6}}#${bid}{stroke-dasharray:${bLen.toFixed(0)};animation:draw_${bid} ${bDur.toFixed(1)}s ease-in-out ${bDelay.toFixed(1)}s both}`;
      els += `<path id="${bid}" d="${bd}" fill="none" stroke="${crackColors[Math.floor(rng() * crackColors.length)]}" stroke-width="${(0.6 + rng() * 1.5).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;
    }
  }

  // Moss grows along cracks — more with each layer
  if (perceptions.length > 0) {
    const mossDelay = 2;
    const numMoss = 10 + perceptions.length * 8;
    for (let i = 0; i < numMoss && i < 80; i++) {
      const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
      const cx = cp.x + (rng() - 0.5) * 20;
      const cy = cp.y + (rng() - 0.5) * 20;
      const r = 1.5 + rng() * (4 + perceptions.length * 0.5);
      let col = mossColors[Math.floor(rng() * mossColors.length)];
      if (paletteBias && rng() > 0.4) col = paletteBias[Math.floor(rng() * paletteBias.length)];
      const op = (0.3 + rng() * 0.4).toFixed(2);
      const del = mossDelay + rng() * 3;
      const dur = 1.5 + rng() * 2;
      const id = `ms${layerCount}_${i}`;
      styles += `@keyframes grow_${id}{0%{r:0;opacity:0}60%{opacity:${op}}100%{r:${r.toFixed(1)}px;opacity:${op}}}#${id}{animation:grow_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
      els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0" filter="url(#heavyWarp)"/>`;
    }

    // Lichen
    const numLich = 3 + perceptions.length * 2;
    for (let i = 0; i < numLich && i < 20; i++) {
      const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
      const cx = cp.x + (rng() - 0.5) * 40;
      const cy = cp.y + (rng() - 0.5) * 40;
      const rx = 5 + rng() * 15;
      const ry = 3 + rng() * 10;
      const rot = rng() * 360;
      let col = lichColors[Math.floor(rng() * lichColors.length)];
      if (paletteBias && rng() > 0.5) col = paletteBias[Math.floor(rng() * paletteBias.length)];
      const del = mossDelay + 1 + rng() * 3;
      const dur = 1.5 + rng() * 2;
      const id = `lc${layerCount}_${i}`;
      const op = (0.12 + rng() * 0.25).toFixed(2);
      styles += `@keyframes spread_${id}{0%{transform:scale(0);opacity:0}60%{opacity:${op}}100%{transform:scale(1);opacity:${op}}}#${id}{transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px;animation:spread_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
      els += `<ellipse id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="0" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#heavyWarp)"/>`;
    }
  }

  // Ghost-words: faintly inscribe past perceptions into the stone
  if (perceptions.length > 0) {
    const ghostDelay = 3.5;
    for (let i = 0; i < perceptions.length; i++) {
      const wordRng = mulberry32(hashString(perceptions[i]) + i);
      const gx = 40 + wordRng() * (W - 80);
      const gy = 40 + wordRng() * (H - 80);
      const rot = (wordRng() - 0.5) * 40;
      const size = 11 + wordRng() * 8;
      // Older words are fainter
      const age = perceptions.length - i;
      const opacity = Math.max(0.04, 0.15 - age * 0.015);
      const del = ghostDelay + i * 0.4;

      const gid = `ghost${i}`;
      styles += `@keyframes fade_${gid}{0%{opacity:0}100%{opacity:${opacity.toFixed(3)}}}#${gid}{animation:fade_${gid} 2s ease-in ${del.toFixed(1)}s both}`;
      els += `<text id="${gid}" x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" font-family="'EB Garamond', serif" font-size="${size.toFixed(0)}" fill="#6a6050" opacity="0" transform="rotate(${rot.toFixed(1)} ${gx.toFixed(1)} ${gy.toFixed(1)})" filter="url(#stoneNoise)">${perceptions[i]}</text>`;
    }
  }

  // Layer counter
  if (perceptions.length > 0) {
    const countText = perceptions.length === 1
      ? '1 perception'
      : `${perceptions.length} perceptions`;
    els += `<text x="${W - 10}" y="${H - 10}" text-anchor="end" font-family="'EB Garamond', serif" font-size="10" fill="#4a4030" opacity="0.3">${countText}</text>`;
  }

  layerCount++;

  document.getElementById('canvas-wrap').innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs><style>${styles}</style>${els}</svg>`;
}

function perceive() {
  const input = document.getElementById('perception');
  const word = (input.value || '').trim();
  if (!word) return;

  perceptions.push(word);
  input.value = '';

  // Show response
  const responseEl = document.getElementById('response');
  const response = getResponse(word);
  responseEl.style.opacity = '0';
  responseEl.textContent = response;
  setTimeout(() => { responseEl.style.opacity = '1'; }, 50);

  // Update the history
  updateHistory();

  // Re-render the wall with new perception layered in
  renderWall();

  // Update prompt
  updatePrompt();
}

function updateHistory() {
  const historyEl = document.getElementById('history');
  if (!historyEl) return;

  if (perceptions.length === 0) {
    historyEl.innerHTML = '';
    return;
  }

  const items = perceptions.map((p, i) => {
    const age = perceptions.length - i;
    const opacity = Math.max(0.3, 1 - age * 0.1);
    return `<span style="opacity: ${opacity.toFixed(2)}; margin: 0 0.3rem;">${p}</span>`;
  }).join(' · ');

  historyEl.innerHTML = items;
}

function updatePrompt() {
  const promptEl = document.getElementById('prompt-text');
  if (!promptEl) return;

  const prompts = [
    'What do you see?',
    'Look again. What else?',
    'The wall shifted. What now?',
    'Something grew where you looked. What do you see in the new shape?',
    'The cracks remember. What do they look like now?',
    'Keep looking.',
    'What\'s hiding in the mortar?',
    'The moss took a new shape. What is it?',
    'What do you see that wasn\'t there before?',
    'The stone is listening. What do you tell it?',
  ];

  const idx = Math.min(perceptions.length, prompts.length - 1);
  promptEl.textContent = prompts[idx];
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('perception');
  if (input) {
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') perceive();
    });
  }
  renderWall();
});
