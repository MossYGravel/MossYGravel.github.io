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

function grow() {
  const seedStr = document.getElementById('seed').value || 'moss';
  const seed = hashString(seedStr);
  const rng = mulberry32(seed);
  const W = 600, H = 600;
  
  const moss = ['#2d5016','#3a6b1e','#4a7c2e','#5c8a3c','#6b9e4a','#8ab060','#a3c278','#1a3a0a'];
  const stone = ['#5c5c5c','#6e6e6e','#808080','#4a4a4a','#383838'];
  
  let styles = '';
  let els = '';
  
  els += `<rect width="${W}" height="${H}" fill="#2a2a26"/>`;
  
  for (let i = 0; i < 6 + Math.floor(rng() * 4); i++) {
    const cx = rng() * W, cy = rng() * H;
    const pts = [];
    const v = 5 + Math.floor(rng() * 4);
    const bR = 30 + rng() * 70;
    for (let j = 0; j < v; j++) {
      const a = (j / v) * Math.PI * 2;
      const r = bR + (rng() - 0.5) * bR * 0.6;
      pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    els += `<polygon points="${pts.join(' ')}" fill="${stone[Math.floor(rng() * stone.length)]}" opacity="${(0.15 + rng() * 0.2).toFixed(2)}"/>`;
  }
  
  for (let i = 0; i < 4 + Math.floor(rng() * 5); i++) {
    let x = rng() * W, y = rng() * H;
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    for (let j = 0; j < 3 + Math.floor(rng() * 4); j++) {
      x += (rng() - 0.5) * 50; y += rng() * 25;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    }
    els += `<path d="${d}" fill="none" stroke="#1a1a16" stroke-width="${(0.5 + rng()).toFixed(1)}" opacity="0.4"/>`;
  }
  
  const clusters = [];
  for (let c = 0; c < 4 + Math.floor(rng() * 4); c++) {
    clusters.push({
      cx: 60 + rng() * (W - 120), cy: 60 + rng() * (H - 120),
      delay: rng() * 3, spread: 25 + rng() * 50
    });
  }
  
  const n = 50 + Math.floor(rng() * 40);
  for (let i = 0; i < n; i++) {
    const cl = clusters[Math.floor(rng() * clusters.length)];
    const a = rng() * Math.PI * 2;
    const dist = Math.pow(rng(), 0.5) * cl.spread;
    const x = cl.cx + Math.cos(a) * dist;
    const y = cl.cy + Math.sin(a) * dist;
    const mR = 2 + rng() * 7;
    const col = moss[Math.floor(rng() * moss.length)];
    const op = (0.4 + rng() * 0.6).toFixed(2);
    const del = cl.delay + (dist / cl.spread) * 2 + rng() * 0.4;
    const dur = 1.2 + rng() * 1.8;
    const id = `s${i}`;
    
    styles += `@keyframes g_${id}{0%{r:0;opacity:0}60%{opacity:${op}}100%{r:${mR.toFixed(1)}px;opacity:${op}}}#${id}{animation:g_${id} ${dur.toFixed(1)}s ease-out ${del.toFixed(1)}s both}`;
    els += `<circle id="${id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0" fill="${col}" opacity="0"/>`;
  }
  
  for (let b = 0; b < 2 + Math.floor(rng() * 3); b++) {
    const cl = clusters[Math.floor(rng() * clusters.length)];
    let x = cl.cx + (rng()-0.5)*20, y = cl.cy + (rng()-0.5)*20;
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    let tl = 0;
    for (let s = 0; s < 3 + Math.floor(rng() * 4); s++) {
      const len = 12 + rng() * 25;
      const a = rng() * Math.PI * 2;
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`; tl += len;
    }
    const col = moss[Math.floor(rng() * moss.length)];
    const del = cl.delay + 1 + rng() * 2;
    const dur = 2.5 + rng() * 2.5;
    const id = `b${b}`;
    styles += `@keyframes d_${id}{0%{stroke-dashoffset:${tl.toFixed(0)};opacity:0}5%{opacity:0.5}100%{stroke-dashoffset:0;opacity:0.5}}#${id}{stroke-dasharray:${tl.toFixed(0)};animation:d_${id} ${dur.toFixed(1)}s ease-in-out ${del.toFixed(1)}s both}`;
    els += `<path id="${id}" d="${d}" fill="none" stroke="${col}" stroke-width="${(1+rng()*2).toFixed(1)}" stroke-linecap="round" opacity="0"/>`;
  }
  
  styles += `@keyframes ft{0%{opacity:0}100%{opacity:0.3}}#lbl{animation:ft 1.5s ease-in 7s both}`;
  els += `<text id="lbl" x="${W/2}" y="${H-15}" text-anchor="middle" font-family="serif" font-size="11" fill="#888" opacity="0">"${seedStr.replace(/"/g,'')}"</text>`;
  
  document.getElementById('canvas-wrap').innerHTML = 
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><style>${styles}</style>${els}</svg>`;
}

document.getElementById('seed').addEventListener('keypress', e => { if (e.key === 'Enter') grow(); });
grow();
