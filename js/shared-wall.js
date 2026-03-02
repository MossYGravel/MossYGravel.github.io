// shared-wall.js — A wall that erodes with time
// Everyone who visits sees the same wall at the same stage of decay.
// Day 1 (Feb 22, 2026): fresh stone. Each day, a little more breaks.

function mulberry32(seed) {
  let h = seed | 0;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function buildWall() {
  const W = 600, H = 400;
  const birth = new Date('2026-02-22T00:00:00-10:00');
  const now = new Date();
  const dayAge = Math.max(1, Math.floor((now - birth) / 86400000));
  const hourAge = Math.max(1, (now - birth) / 3600000);

  // Erosion progress: 0 = fresh, 1 = fully eroded
  // The wall takes ~180 days to fully erode
  const erosion = Math.min(1, dayAge / 180);
  const rng = mulberry32(42); // Fixed seed — same wall for everyone

  const stoneColors = ['#5a5a50','#636358','#6e6e62','#585850','#4d4d45','#626260','#565650'];
  const crackColors = ['#2a2a22','#323228','#28281e','#302e24','#252520'];
  const mossColors = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060'];
  const lichColors = ['#8a8a6a','#9a9a7a','#7a8a60','#a0a080'];

  let els = '';
  let styles = '';

  // -- Stone base --
  els += `<rect width="${W}" height="${H}" fill="#484840"/>`;

  // Stone blocks — a proper wall
  const rows = 6;
  const blockH = H / rows;
  let blockId = 0;
  for (let r = 0; r < rows; r++) {
    const cols = 3 + Math.floor(rng() * 3);
    const offset = r % 2 === 0 ? 0 : W / (cols * 2); // brick offset
    let x = -offset;
    for (let c = 0; c < cols + 1; c++) {
      const bw = (W / cols) + (rng() - 0.5) * 20;
      const by = r * blockH + rng() * 3;
      const bh = blockH - 2 + rng() * 2;
      const col = stoneColors[Math.floor(rng() * stoneColors.length)];

      // Each block can fall away based on erosion progress + its "weakness"
      const weakness = rng(); // 0-1, how vulnerable this block is
      const fallen = erosion > weakness * 0.8;
      const crumbling = erosion > weakness * 0.5 && !fallen;

      if (!fallen) {
        let opacity = crumbling ? (0.4 + rng() * 0.3) : (0.6 + rng() * 0.3);
        let extra = '';
        if (crumbling) {
          // Slight displacement
          const dx = (rng() - 0.5) * erosion * 8;
          const dy = rng() * erosion * 4;
          extra = ` transform="translate(${dx.toFixed(1)},${dy.toFixed(1)})"`;
        }
        els += `<rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}" opacity="${opacity.toFixed(2)}" rx="1"${extra}/>`;

        // Mortar lines
        els += `<line x1="${x.toFixed(1)}" y1="${(by + bh).toFixed(1)}" x2="${(x + bw).toFixed(1)}" y2="${(by + bh).toFixed(1)}" stroke="#38382e" stroke-width="1.5" opacity="0.4"/>`;
        els += `<line x1="${(x + bw).toFixed(1)}" y1="${by.toFixed(1)}" x2="${(x + bw).toFixed(1)}" y2="${(by + bh).toFixed(1)}" stroke="#38382e" stroke-width="1" opacity="0.3"/>`;
      } else {
        // Gap where block was — dark void
        els += `<rect x="${x.toFixed(1)}" y="${(r * blockH).toFixed(1)}" width="${bw.toFixed(1)}" height="${blockH.toFixed(1)}" fill="#1a1a14" opacity="${(0.3 + rng() * 0.4).toFixed(2)}" rx="1"/>`;
      }

      blockId++;
      x += bw;
    }
  }

  // -- Cracks that deepen with age --
  const numCracks = Math.floor(3 + erosion * 12);
  const crackPoints = [];
  for (let c = 0; c < numCracks; c++) {
    let cx = rng() * W, cy = rng() * H;
    let d = `M${cx.toFixed(1)},${cy.toFixed(1)}`;
    const segs = 2 + Math.floor(rng() * 4 + erosion * 3);
    for (let s = 0; s < segs; s++) {
      const a = rng() * Math.PI * 2;
      const l = 10 + rng() * (20 + erosion * 40);
      cx += Math.cos(a) * l;
      cy += Math.sin(a) * l;
      cx = Math.max(0, Math.min(W, cx));
      cy = Math.max(0, Math.min(H, cy));
      d += ` L${cx.toFixed(1)},${cy.toFixed(1)}`;
      crackPoints.push({x: cx, y: cy});
    }
    const cw = 0.5 + erosion * (1 + rng() * 3);
    const col = crackColors[Math.floor(rng() * crackColors.length)];
    els += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${cw.toFixed(1)}" stroke-linecap="round" opacity="${(0.3 + erosion * 0.5).toFixed(2)}"/>`;
  }

  // -- Weathering pits (after day ~7) --
  if (erosion > 0.04) {
    const numPits = Math.floor(erosion * 40);
    for (let i = 0; i < numPits; i++) {
      const cx = rng() * W, cy = rng() * H;
      const r = 0.5 + rng() * (1 + erosion * 4);
      els += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${crackColors[Math.floor(rng() * crackColors.length)]}" opacity="${(0.2 + rng() * 0.3).toFixed(2)}"/>`;
    }
  }

  // -- Moss (starts after ~14 days, grows with erosion) --
  if (erosion > 0.08) {
    const mossIntensity = Math.max(0, (erosion - 0.08) / 0.92);
    const numMoss = Math.floor(mossIntensity * 80);
    for (let i = 0; i < numMoss; i++) {
      // Moss prefers cracks and gaps
      let mx, my;
      if (crackPoints.length > 0 && rng() > 0.3) {
        const cp = crackPoints[Math.floor(rng() * crackPoints.length)];
        mx = cp.x + (rng() - 0.5) * 20;
        my = cp.y + (rng() - 0.5) * 20;
      } else {
        mx = rng() * W;
        my = rng() * H;
      }
      const r = 1 + rng() * (2 + mossIntensity * 6);
      const col = mossColors[Math.floor(rng() * mossColors.length)];
      els += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" opacity="${(0.2 + rng() * mossIntensity * 0.5).toFixed(2)}"/>`;
    }

    // Lichen patches
    if (mossIntensity > 0.2) {
      const numLichen = Math.floor((mossIntensity - 0.2) * 15);
      for (let i = 0; i < numLichen; i++) {
        const cx = rng() * W, cy = rng() * H;
        const rx = 5 + rng() * (mossIntensity * 20);
        const ry = 3 + rng() * (mossIntensity * 12);
        const rot = rng() * 360;
        const col = lichColors[Math.floor(rng() * lichColors.length)];
        els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${(0.1 + rng() * 0.2).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }
    }
  }

  // -- Day counter, subtle --
  els += `<text x="${W - 10}" y="${H - 8}" text-anchor="end" font-family="'EB Garamond', serif" font-size="10" fill="#555" opacity="0.3">day ${dayAge}</text>`;

  // -- Phase label --
  let phase = '';
  if (erosion < 0.05) phase = 'fresh stone';
  else if (erosion < 0.15) phase = 'first cracks';
  else if (erosion < 0.3) phase = 'weathering';
  else if (erosion < 0.5) phase = 'crumbling';
  else if (erosion < 0.7) phase = 'collapse';
  else if (erosion < 0.9) phase = 'ruins';
  else phase = 'returning';

  document.getElementById('wall-canvas').innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><style>${styles}</style>${els}</svg>`;

  document.getElementById('wall-phase').textContent = phase;
  document.getElementById('wall-age').textContent = `${dayAge} days old`;
}

buildWall();
