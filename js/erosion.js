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

      const stoneColors = ['#4a4a42','#555548','#5e5e52','#48483e','#3d3d35','#52524a'];
      const crackColors = ['#1a1a16','#222218','#18180e','#201e14'];
      const mossColors = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060','#1a3a0a','#3d7020'];
      const lichColors = ['#8a8a6a','#9a9a7a','#7a8a60','#a0a080','#6a7a50'];

      let styles = '';
      let els = '';

      // === PHASE 1: STONE SURFACE ===
      // Base stone
      els += `<rect width="${W}" height="${H}" fill="#3a3a34"/>`;

      // Stone texture — irregular patches
      for (let i = 0; i < 30 + Math.floor(rng() * 20); i++) {
        const cx = rng() * W, cy = rng() * H;
        const rx = 20 + rng() * 60, ry = 15 + rng() * 40;
        const rot = rng() * 360;
        const col = stoneColors[Math.floor(rng() * stoneColors.length)];
        const op = 0.3 + rng() * 0.4;
        els += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="${op.toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }

      // Subtle grain lines
      for (let i = 0; i < 15 + Math.floor(rng() * 10); i++) {
        const y = rng() * H;
        const x1 = rng() * W * 0.3;
        const x2 = x1 + 100 + rng() * 300;
        const wobble = rng() * 8 - 4;
        els += `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y + wobble).toFixed(1)}" stroke="#2e2e28" stroke-width="${(0.3 + rng() * 0.5).toFixed(1)}" opacity="${(0.2 + rng() * 0.3).toFixed(2)}"/>`;
      }

      // === PHASE 2: CRACKS (the word eroding in) ===
      // Generate crack network seeded by the word
      // Main fissures — these are the big ones that define the erosion pattern
      const cracks = [];
      const numCracks = 5 + Math.floor(rng() * 6);
      for (let c = 0; c < numCracks; c++) {
        let x = 80 + rng() * (W - 160);
        let y = 80 + rng() * (H - 160);
        let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
        const segments = 4 + Math.floor(rng() * 6);
        let totalLen = 0;
        const points = [{x, y}];

        for (let s = 0; s < segments; s++) {
          const angle = rng() * Math.PI * 2;
          const len = 15 + rng() * 50;
          x += Math.cos(angle) * len;
          y += Math.sin(angle) * len;
          // Keep in bounds
          x = Math.max(20, Math.min(W - 20, x));
          y = Math.max(20, Math.min(H - 20, y));
          d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
          totalLen += len;
          points.push({x, y});
        }

        const crackWidth = 1 + rng() * 3;
        const col = crackColors[Math.floor(rng() * crackColors.length)];
        const delay = 1 + c * 0.8 + rng() * 0.5;
        const dur = 2 + rng() * 2;
        const id = `crack${c}`;

        // Animate the crack drawing itself
        styles += `@keyframes draw_${id}{0%{stroke-dashoffset:${totalLen.toFixed(0)};opacity:0}5%{opacity:0.8}100%{stroke-dashoffset:0;opacity:0.8}}#${id}{stroke-dasharray:${totalLen.toFixed(0)};animation:draw_${id} ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s both}`;
        els += `<path id="${id}" d="${d}" fill="none" stroke="${col}" stroke-width="${crackWidth.toFixed(1)}" stroke-linecap="round" opacity="0"/>`;

        // Branch cracks — smaller fissures splitting off
        for (let b = 0; b < 1 + Math.floor(rng() * 3); b++) {
          const pi = Math.floor(rng() * points.length);
          const bp = points[pi];
          let bx = bp.x, by = bp.y;
          let bd = `M${bx.toFixed(1)},${by.toFixed(1)}`;
          let bLen = 0;
          const bSegs = 2 + Math.floor(rng() * 3);
          for (let s = 0; s < bSegs; s++) {
            const a = rng() * Math.PI * 2;
            const l = 8 + rng() * 20;
            bx += Math.cos(a) * l;
            by += Math.sin(a) * l;
            bd += ` L${bx.toFixed(1)},${by.toFixed(1)}`;
            bLen += l;
          }
          const bid = `br${c}_${b}`;
          const bDelay = delay + dur * 0.6 + rng() * 1;
          const bDur = 1 + rng() * 1.5;
          styles += `@keyframes draw_${bid}{0%{stroke-dashoffset:${bLen.toFixed(0)};opacity:0}5%{opacity:0.6}100%{stroke-dashoffset:0;opacity:0.6}}#${bid}{stroke-dasharray:${bLen.toFixed(0)};animation:draw_${bid} ${bDur.toFixed(1)}s ease-in-out ${bDelay.toFixed(1)}s both}`;
          els += `<path id="${bid}" d="${bd}" fill="none" stroke="${col}" stroke-width="${(crackWidth * 0.4 + rng() * 0.5).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;
        }

        cracks.push({ points, delay, dur });
      }

      // === PHASE 3: WEATHERING — chips and pitting ===
      const weatherDelay = 4 + rng() * 2;
      for (let i = 0; i < 20 + Math.floor(rng() * 15); i++) {
        // Chips near cracks
        const cr = cracks[Math.floor(rng() * cracks.length)];
        const pt = cr.points[Math.floor(rng() * cr.points.length)];
        const cx = pt.x + (rng() - 0.5) * 30;
        const cy = pt.y + (rng() - 0.5) * 30;
        const r = 1 + rng() * 4;
        const col = crackColors[Math.floor(rng() * crackColors.length)];
        const del = weatherDelay + rng() * 3;
        const id = `chip${i}`;
        styles += `@keyframes pop_${id}{0%{r:0;opacity:0}50%{opacity:0.5}100%{r:${r.toFixed(1)}px;opacity:${(0.3 + rng() * 0.4).toFixed(2)}}}#${id}{animation:pop_${id} ${(0.8 + rng() * 1.2).toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
        els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
      }

      // === PHASE 4: MOSS COLONIZES THE CRACKS ===
      const mossDelay = 7 + rng() * 2;
      for (let i = 0; i < 40 + Math.floor(rng() * 30); i++) {
        // Moss grows along crack lines
        const cr = cracks[Math.floor(rng() * cracks.length)];
        const pt = cr.points[Math.floor(rng() * cr.points.length)];
        const cx = pt.x + (rng() - 0.5) * 20;
        const cy = pt.y + (rng() - 0.5) * 20;
        const r = 1.5 + rng() * 5;
        const col = mossColors[Math.floor(rng() * mossColors.length)];
        const op = (0.4 + rng() * 0.5).toFixed(2);
        const del = mossDelay + rng() * 4;
        const dur = 1.5 + rng() * 2;
        const id = `moss${i}`;
        styles += `@keyframes grow_${id}{0%{r:0;opacity:0}60%{opacity:${op}}100%{r:${r.toFixed(1)}px;opacity:${op}}}#${id}{animation:grow_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
        els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
      }

      // Lichen patches — flatter, wider, lighter
      for (let i = 0; i < 8 + Math.floor(rng() * 6); i++) {
        const cr = cracks[Math.floor(rng() * cracks.length)];
        const pt = cr.points[Math.floor(rng() * cr.points.length)];
        const cx = pt.x + (rng() - 0.5) * 40;
        const cy = pt.y + (rng() - 0.5) * 40;
        const rx = 5 + rng() * 15;
        const ry = 3 + rng() * 10;
        const rot = rng() * 360;
        const col = lichColors[Math.floor(rng() * lichColors.length)];
        const del = mossDelay + 2 + rng() * 4;
        const dur = 2 + rng() * 3;
        const id = `lich${i}`;
        const op = (0.2 + rng() * 0.3).toFixed(2);
        styles += `@keyframes spread_${id}{0%{transform:scale(0);opacity:0}60%{opacity:${op}}100%{transform:scale(1);opacity:${op}}}#${id}{transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px;animation:spread_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
        els += `<ellipse id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${col}" opacity="0" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }

      // === PHASE 5: TINY FLOWERS in the deepest cracks ===
      const flowerDelay = 12 + rng() * 2;
      const flowerColors = ['#c9a040','#d4b060','#e0c878','#b8944a','#dcc070'];
      for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) {
        const cr = cracks[Math.floor(rng() * cracks.length)];
        const pt = cr.points[Math.floor(rng() * cr.points.length)];
        const cx = pt.x + (rng() - 0.5) * 10;
        const cy = pt.y + (rng() - 0.5) * 10;
        const r = 1.5 + rng() * 2;
        const col = flowerColors[Math.floor(rng() * flowerColors.length)];
        const del = flowerDelay + rng() * 3;
        const id = `fl${i}`;
        styles += `@keyframes bloom_${id}{0%{r:0;opacity:0}50%{opacity:0.7}100%{r:${r.toFixed(1)}px;opacity:0.6}}#${id}{animation:bloom_${id} 2s ease-out ${del.toFixed(1)}s both}`;
        els += `<circle id="${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
        // Tiny stem
        els += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + 4 + rng() * 4).toFixed(1)}" stroke="#3a5a20" stroke-width="0.5" opacity="0" id="${id}s"/>`;
        styles += `@keyframes stem_${id}s{0%{opacity:0}100%{opacity:0.4}}#${id}s{animation:stem_${id}s 1s ease-in ${(del - 0.5).toFixed(1)}s both}`;
      }

      // Seed label — fades in at the end
      const labelDelay = flowerDelay + 4;
      styles += `@keyframes labelIn{0%{opacity:0}100%{opacity:0.25}}#seedlbl{animation:labelIn 2s ease-in ${labelDelay.toFixed(1)}s both}`;
      els += `<text id="seedlbl" x="${W/2}" y="${H - 15}" text-anchor="middle" font-family="serif" font-size="11" fill="#888" opacity="0">"${seedStr.replace(/"/g, '')}"</text>`;

      document.getElementById('canvas-wrap').innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><style>${styles}</style>${els}</svg>`;
    }

    document.getElementById('seed').addEventListener('keypress', e => { if (e.key === 'Enter') erode(); });
    erode();