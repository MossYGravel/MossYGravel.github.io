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
  return hash;
}

function erode() {
  const seedStr = document.getElementById('seed').value || 'time';
  const seed = hashString(seedStr);
  const rng = mulberry32(seed);
  const W = 600, H = 600;

  const stoneColors = ['#4a4a42','#555548','#5e5e52','#48483e','#3d3d35','#52524a','#464638'];
  const crackColors = ['#1a1a16','#222218','#18180e','#201e14','#151510'];
  const mossColors = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060','#1a3a0a','#3d7020'];
  const lichColors = ['#8a8a6a','#9a9a7a','#7a8a60','#a0a080','#6a7a50'];
  const flowerColors = ['#c9a040','#d4b060','#e0c878','#b8944a','#dcc070','#e8d090'];

  let defs = '';
  let styles = '';
  let els = '';

  // === SVG FILTERS for texture and distortion ===
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
    <filter id="crackGlow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  `;

  // === PHASE 1: STONE SURFACE ===
  els += `<rect width="${W}" height="${H}" fill="#3a3a34"/>`;

  // Large stone blocks with slight gaps between them
  const blockRows = 3 + Math.floor(rng() * 2);
  const blockCols = 2 + Math.floor(rng() * 2);
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

  // Irregular stone texture patches
  for (let i = 0; i < 35 + Math.floor(rng() * 20); i++) {
    const cx = rng() * W, cy = rng() * H;
    const rx = 15 + rng() * 50, ry = 10 + rng() * 35;
    const rot = rng() * 360;
    const col = stoneColors[Math.floor(rng() * stoneColors.length)];
    els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${(0.15 + rng() * 0.25).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#stoneNoise)"/>`;
  }

  // Grain lines
  for (let i = 0; i < 20 + Math.floor(rng() * 10); i++) {
    const y = rng() * H;
    const x1 = rng() * W * 0.2;
    const x2 = x1 + 80 + rng() * 400;
    const wobble = rng() * 10 - 5;
    els += `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y + wobble).toFixed(1)}" stroke="#2e2e28" stroke-width="${(0.3 + rng() * 0.6).toFixed(1)}" opacity="${(0.15 + rng() * 0.2).toFixed(2)}"/>`;
  }

  // === PHASE 2: MAJOR FISSURES — big cracks spanning the canvas ===
  const allCrackPoints = [];

  // 2-3 major fissures that go edge to edge
  const numMajor = 2 + Math.floor(rng() * 2);
  for (let c = 0; c < numMajor; c++) {
    // Start from an edge
    let x, y;
    const edge = Math.floor(rng() * 4);
    if (edge === 0) { x = 0; y = rng() * H; }
    else if (edge === 1) { x = W; y = rng() * H; }
    else if (edge === 2) { x = rng() * W; y = 0; }
    else { x = rng() * W; y = H; }

    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    const points = [{x, y}];
    const segments = 8 + Math.floor(rng() * 6);
    let totalLen = 0;

    // Walk roughly toward the opposite side
    const targetX = W - x + (rng() - 0.5) * 200;
    const targetY = H - y + (rng() - 0.5) * 200;

    for (let s = 0; s < segments; s++) {
      const progress = (s + 1) / segments;
      // Blend between random walk and target direction
      const toTargetAngle = Math.atan2(targetY - y, targetX - x);
      const randomAngle = rng() * Math.PI * 2;
      const angle = toTargetAngle * 0.4 + randomAngle * 0.6;
      const len = 30 + rng() * 60;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      x = Math.max(-10, Math.min(W + 10, x));
      y = Math.max(-10, Math.min(H + 10, y));
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      totalLen += len;
      points.push({x, y});
    }

    const crackWidth = 2.5 + rng() * 4;
    const delay = 0.5 + c * 1.2;
    const dur = 2.5 + rng() * 2;
    const id = `fissure${c}`;

    // Main fissure with glow
    styles += `@keyframes draw_${id}{0%{stroke-dashoffset:${totalLen.toFixed(0)};opacity:0}3%{opacity:0.9}100%{stroke-dashoffset:0;opacity:0.9}}#${id}{stroke-dasharray:${totalLen.toFixed(0)};animation:draw_${id} ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s both}`;
    els += `<path id="${id}" d="${d}" fill="none" stroke="#111108" stroke-width="${crackWidth.toFixed(1)}" stroke-linecap="round" opacity="0" filter="url(#roughEdge)"/>`;

    // Shadow/depth line underneath
    const shadowId = `${id}shadow`;
    styles += `@keyframes draw_${shadowId}{0%{stroke-dashoffset:${totalLen.toFixed(0)};opacity:0}3%{opacity:0.4}100%{stroke-dashoffset:0;opacity:0.4}}#${shadowId}{stroke-dasharray:${totalLen.toFixed(0)};animation:draw_${shadowId} ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s both}`;
    els += `<path id="${shadowId}" d="${d}" fill="none" stroke="#0a0a06" stroke-width="${(crackWidth + 3).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;

    allCrackPoints.push(...points);

    // Branch cracks off the major fissure
    for (let b = 0; b < 3 + Math.floor(rng() * 4); b++) {
      const pi = 1 + Math.floor(rng() * (points.length - 1));
      const bp = points[pi];
      let bx = bp.x, by = bp.y;
      let bd = `M${bx.toFixed(1)},${by.toFixed(1)}`;
      let bLen = 0;
      const bSegs = 3 + Math.floor(rng() * 4);
      for (let s = 0; s < bSegs; s++) {
        const a = rng() * Math.PI * 2;
        const l = 10 + rng() * 35;
        bx += Math.cos(a) * l;
        by += Math.sin(a) * l;
        bd += ` L${bx.toFixed(1)},${by.toFixed(1)}`;
        bLen += l;
        allCrackPoints.push({x: bx, y: by});
      }
      const bid = `br${c}_${b}`;
      const bDelay = delay + dur * 0.4 + b * 0.3 + rng() * 0.5;
      const bDur = 1.5 + rng() * 1.5;
      const bWidth = 0.8 + rng() * 2;
      styles += `@keyframes draw_${bid}{0%{stroke-dashoffset:${bLen.toFixed(0)};opacity:0}5%{opacity:0.7}100%{stroke-dashoffset:0;opacity:0.7}}#${bid}{stroke-dasharray:${bLen.toFixed(0)};animation:draw_${bid} ${bDur.toFixed(1)}s ease-in-out ${bDelay.toFixed(1)}s both}`;
      els += `<path id="${bid}" d="${bd}" fill="none" stroke="${crackColors[Math.floor(rng() * crackColors.length)]}" stroke-width="${bWidth.toFixed(1)}" stroke-linecap="round" opacity="0" filter="url(#roughEdge)"/>`;
    }
  }

  // Secondary crack network — smaller, filling in
  for (let c = 0; c < 4 + Math.floor(rng() * 4); c++) {
    let x = 50 + rng() * (W - 100), y = 50 + rng() * (H - 100);
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    let totalLen = 0;
    const segs = 3 + Math.floor(rng() * 4);
    const pts = [{x, y}];
    for (let s = 0; s < segs; s++) {
      const a = rng() * Math.PI * 2;
      const l = 15 + rng() * 40;
      x += Math.cos(a) * l; y += Math.sin(a) * l;
      x = Math.max(10, Math.min(W-10, x)); y = Math.max(10, Math.min(H-10, y));
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      totalLen += l;
      pts.push({x, y});
    }
    allCrackPoints.push(...pts);
    const id = `sc${c}`;
    const delay = 3 + rng() * 2;
    const dur = 1.5 + rng() * 1.5;
    styles += `@keyframes draw_${id}{0%{stroke-dashoffset:${totalLen.toFixed(0)};opacity:0}5%{opacity:0.6}100%{stroke-dashoffset:0;opacity:0.6}}#${id}{stroke-dasharray:${totalLen.toFixed(0)};animation:draw_${id} ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s both}`;
    els += `<path id="${id}" d="${d}" fill="none" stroke="${crackColors[Math.floor(rng() * crackColors.length)]}" stroke-width="${(0.8 + rng() * 1.5).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;
  }

  // === PHASE 3: PIECES BREAKING OFF AND FALLING ===
  const fallDelay = 4 + rng() * 1.5;
  const numFalling = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < numFalling; i++) {
    // Pick a point near a crack
    const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
    const px = cp.x + (rng() - 0.5) * 15;
    const py = cp.y + (rng() - 0.5) * 15;
    
    // Create an irregular polygon chip
    const chipVerts = 4 + Math.floor(rng() * 3);
    const chipR = 5 + rng() * 15;
    let chipPts = [];
    for (let v = 0; v < chipVerts; v++) {
      const a = (v / chipVerts) * Math.PI * 2;
      const r = chipR * (0.6 + rng() * 0.6);
      chipPts.push(`${(px + Math.cos(a) * r).toFixed(1)},${(py + Math.sin(a) * r).toFixed(1)}`);
    }
    const col = stoneColors[Math.floor(rng() * stoneColors.length)];
    const del = fallDelay + i * 0.4 + rng() * 1.5;
    const fallDist = 80 + rng() * 200;
    const rotation = (rng() - 0.5) * 120;
    const id = `fall${i}`;

    styles += `@keyframes fall_${id}{
      0%{transform:translate(0,0) rotate(0deg);opacity:0.8}
      10%{transform:translate(${(rng()-0.5)*8}px,2px) rotate(${rotation*0.1}deg);opacity:0.8}
      100%{transform:translate(${((rng()-0.5)*40).toFixed(0)}px,${fallDist.toFixed(0)}px) rotate(${rotation.toFixed(0)}deg);opacity:0}
    }#${id}{transform-origin:${px.toFixed(1)}px ${py.toFixed(1)}px;animation:fall_${id} ${(2 + rng()*2).toFixed(1)}s ease-in ${del.toFixed(1)}s both}`;
    els += `<polygon id="${id}" points="${chipPts.join(' ')}" fill="${col}" opacity="0" stroke="#2a2a24" stroke-width="0.5"/>`;

    // Leave a dark scar where the chip was
    const scarId = `scar${i}`;
    styles += `@keyframes scar_${scarId}{0%{opacity:0}100%{opacity:0.6}}#${scarId}{animation:scar_${scarId} 0.5s ease-out ${del.toFixed(1)}s both}`;
    els += `<polygon id="${scarId}" points="${chipPts.join(' ')}" fill="#1a1a14" opacity="0"/>`;
  }

  // === PHASE 4: WEATHERING — pitting and surface degradation ===
  const weatherDelay = 5 + rng() * 1.5;
  for (let i = 0; i < 25 + Math.floor(rng() * 15); i++) {
    const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
    const cx = cp.x + (rng() - 0.5) * 35;
    const cy = cp.y + (rng() - 0.5) * 35;
    const r = 1 + rng() * 5;
    const col = crackColors[Math.floor(rng() * crackColors.length)];
    const del = weatherDelay + rng() * 3;
    const id = `pit${i}`;
    styles += `@keyframes pop_${id}{0%{r:0;opacity:0}50%{opacity:0.5}100%{r:${r.toFixed(1)}px;opacity:${(0.3 + rng() * 0.4).toFixed(2)}}}#${id}{animation:pop_${id} ${(0.6 + rng()).toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
    els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
  }

  // === PHASE 5: MOSS COLONIZES ===
  const mossDelay = 8 + rng() * 2;
  for (let i = 0; i < 50 + Math.floor(rng() * 35); i++) {
    const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
    const cx = cp.x + (rng() - 0.5) * 25;
    const cy = cp.y + (rng() - 0.5) * 25;
    const r = 1.5 + rng() * 6;
    const col = mossColors[Math.floor(rng() * mossColors.length)];
    const op = (0.35 + rng() * 0.5).toFixed(2);
    const del = mossDelay + rng() * 5;
    const dur = 1.5 + rng() * 2.5;
    const id = `m${i}`;
    styles += `@keyframes grow_${id}{0%{r:0;opacity:0}60%{opacity:${op}}100%{r:${r.toFixed(1)}px;opacity:${op}}}#${id}{animation:grow_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
    els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
  }

  // Moss tendrils — lines of growth following crack paths
  for (let i = 0; i < 6 + Math.floor(rng() * 4); i++) {
    const startIdx = Math.floor(rng() * allCrackPoints.length);
    const cp = allCrackPoints[startIdx];
    let tx = cp.x, ty = cp.y;
    let td = `M${tx.toFixed(1)},${ty.toFixed(1)}`;
    let tLen = 0;
    for (let s = 0; s < 3 + Math.floor(rng() * 4); s++) {
      const a = rng() * Math.PI * 2;
      const l = 8 + rng() * 20;
      tx += Math.cos(a) * l; ty += Math.sin(a) * l;
      td += ` L${tx.toFixed(1)},${ty.toFixed(1)}`;
      tLen += l;
    }
    const tid = `tendril${i}`;
    const tDel = mossDelay + 1 + rng() * 4;
    const tDur = 2 + rng() * 3;
    const tCol = mossColors[Math.floor(rng() * mossColors.length)];
    styles += `@keyframes draw_${tid}{0%{stroke-dashoffset:${tLen.toFixed(0)};opacity:0}5%{opacity:0.5}100%{stroke-dashoffset:0;opacity:0.5}}#${tid}{stroke-dasharray:${tLen.toFixed(0)};animation:draw_${tid} ${tDur.toFixed(1)}s ease-in-out ${tDel.toFixed(1)}s both}`;
    els += `<path id="${tid}" d="${td}" fill="none" stroke="${tCol}" stroke-width="${(1.5 + rng() * 2.5).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;
  }

  // Lichen patches — wide, flat, organic
  for (let i = 0; i < 10 + Math.floor(rng() * 8); i++) {
    const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
    const cx = cp.x + (rng() - 0.5) * 50;
    const cy = cp.y + (rng() - 0.5) * 50;
    const rx = 6 + rng() * 20;
    const ry = 4 + rng() * 12;
    const rot = rng() * 360;
    const col = lichColors[Math.floor(rng() * lichColors.length)];
    const del = mossDelay + 3 + rng() * 4;
    const dur = 2 + rng() * 3;
    const id = `lich${i}`;
    const op = (0.15 + rng() * 0.3).toFixed(2);
    styles += `@keyframes spread_${id}{0%{transform:scale(0);opacity:0}60%{opacity:${op}}100%{transform:scale(1);opacity:${op}}}#${id}{transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px;animation:spread_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
    els += `<ellipse id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="0" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" filter="url(#heavyWarp)"/>`;
  }

  // === PHASE 6: FLOWERS blooming in the deepest cracks ===
  const flowerDelay = 14 + rng() * 2;
  const numFlowers = 4 + Math.floor(rng() * 5);
  for (let i = 0; i < numFlowers; i++) {
    const cp = allCrackPoints[Math.floor(rng() * allCrackPoints.length)];
    const cx = cp.x + (rng() - 0.5) * 12;
    const cy = cp.y + (rng() - 0.5) * 12;
    const del = flowerDelay + rng() * 3;

    // Stem
    const stemH = 6 + rng() * 10;
    const stemId = `stem${i}`;
    styles += `@keyframes grow_${stemId}{0%{y2:${cy.toFixed(1)};opacity:0}100%{y2:${(cy - stemH).toFixed(1)};opacity:0.5}}#${stemId}{animation:grow_${stemId} 1.5s ease-out ${(del - 1).toFixed(1)}s both}`;
    els += `<line id="${stemId}" x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#3a5a20" stroke-width="0.8" opacity="0"/>`;

    // Petals — 4-6 tiny circles around center
    const petalCount = 4 + Math.floor(rng() * 3);
    const petalR = 1.2 + rng() * 1.5;
    const flCol = flowerColors[Math.floor(rng() * flowerColors.length)];
    const bloomCy = cy - stemH;
    for (let p = 0; p < petalCount; p++) {
      const pa = (p / petalCount) * Math.PI * 2;
      const pr = petalR * 1.5;
      const ppx = cx + Math.cos(pa) * pr;
      const ppy = bloomCy + Math.sin(pa) * pr;
      const pid = `petal${i}_${p}`;
      styles += `@keyframes bloom_${pid}{0%{r:0;opacity:0}60%{opacity:0.7}100%{r:${petalR.toFixed(1)}px;opacity:0.65}}#${pid}{animation:bloom_${pid} 1.5s ease-out ${(del + p * 0.15).toFixed(1)}s both}`;
      els += `<circle id="${pid}" cx="${ppx.toFixed(1)}" cy="${ppy.toFixed(1)}" r="0" fill="${flCol}" opacity="0"/>`;
    }
    // Center dot
    const cid = `fc${i}`;
    styles += `@keyframes bloom_${cid}{0%{r:0;opacity:0}100%{r:${(petalR * 0.6).toFixed(1)}px;opacity:0.8}}#${cid}{animation:bloom_${cid} 1s ease-out ${(del + 0.5).toFixed(1)}s both}`;
    els += `<circle id="${cid}" cx="${cx.toFixed(1)}" cy="${bloomCy.toFixed(1)}" r="0" fill="#f0e8a0" opacity="0"/>`;
  }

  // Seed label
  const labelDelay = flowerDelay + 5;
  styles += `@keyframes labelIn{0%{opacity:0}100%{opacity:0.2}}#seedlbl{animation:labelIn 2s ease-in ${labelDelay.toFixed(1)}s both}`;
  els += `<text id="seedlbl" x="${W/2}" y="${H - 12}" text-anchor="middle" font-family="serif" font-size="11" fill="#666" opacity="0">"${seedStr.replace(/"/g, '')}"</text>`;

  document.getElementById('canvas-wrap').innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs><style>${styles}</style>${els}</svg>`;
}

document.getElementById('seed').addEventListener('keypress', e => { if (e.key === 'Enter') erode(); });
erode();
