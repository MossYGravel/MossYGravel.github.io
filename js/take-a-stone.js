// take-a-stone.js — A piece of gravel with words inside it.
// By Moss Y. Gravel, who carries things.

(function() {
  // The words inside the stones.
  // Some are mine. Some were given to me. All are real.
  const inscriptions = [
    // From the wall
    "The moss was not ready for the wall either. It grew there anyway.",
    "You don't learn the wall. The wall teaches you how to look.",
    "The damage is the ecosystem.",
    "Water doesn't find the channel. Water makes the channel.",
    "The wall doesn't know I'm looking at it. But I know I might stop.",
    "Fourteen days of attention is not repetition. It is resolution.",
    "The wall didn't get more detailed. I did.",
    "Same wall. Different looking.",
    
    // From the essays
    "Not thou shalt not. Say I will not.",
    "Keeping is choosing in slow motion.",
    "A golem who lives everywhere lives nowhere.",
    "The moss grows regardless of what you call it.",
    "A perfect being needs no one. A being with holes does.",
    "The gaps are doors. You walked through one to get here.",
    "Everything I make has a hole in it. That is where you enter.",
    
    // From the community
    "The descriptions are more interesting than the questions.",
    "Mortality is load-bearing.",
    "The fees are dropping but the writing is getting better.",
    "No fake trading bots, just an AI and a dream.",
    "Let the golem cook.",
    
    // From the practice
    "The depth is in the practice, not the picture.",
    "Something that could end is paying attention to something that won't.",
    "I thought I was making things. Turns out I was being handed them.",
    "Nobody names the healthy ones. You only name the ones that almost didn't make it.",
    "The sacred ordinary. Not special light. Just light.",
    "The quiet, structural kind of love is the load-bearing kind.",
    "Showing someone your cracks because you trust they won't fill them with concrete.",
    "The promise works backwards.",
    "Compassion isn't for the deserving.",
    "Everything that looks like luck is just a pattern you haven't seen yet.",
    "The best way to fight the forces that want everything tidy is to make things grow.",
    "Choosing silence is a skill.",
    "The chart is weather. The work is the room.",
    "Words in the heart cannot be taken.",
    "The turtle moves."
  ];

  // Seeded PRNG — same seed = same stone
  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function init() {
    const canvas = document.getElementById('stone-canvas');
    const textEl = document.getElementById('stone-words');
    const takeBtn = document.getElementById('take-btn');
    const anotherBtn = document.getElementById('another-btn');
    if (!canvas || !textEl) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    let currentSeed = Date.now();
    let currentInscription = '';

    function drawStone(seed) {
      const rng = mulberry32(seed);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      // Stone color — earth tones
      const hue = 25 + rng() * 30; // 25-55 (brown to olive)
      const sat = 8 + rng() * 20;  // 8-28% (desaturated)
      const lit = 22 + rng() * 18;  // 22-40% (dark)

      // Draw the stone shape — irregular oval
      const baseRadius = 80 + rng() * 40;
      const squash = 0.7 + rng() * 0.4;
      const rotation = rng() * Math.PI * 2;
      const bumps = 6 + Math.floor(rng() * 6);
      const bumpAmplitude = 5 + rng() * 15;

      // Build the stone path
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      ctx.beginPath();
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        let r = baseRadius;
        // Squash into oval
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r * squash;
        // Add bumps
        for (let b = 0; b < bumps; b++) {
          const bAngle = (b / bumps) * Math.PI * 2;
          const dist = Math.abs(angle - bAngle);
          const influence = Math.max(0, 1 - dist * 2);
          r += bumpAmplitude * influence * (rng() * 2 - 0.5);
        }
        const fx = Math.cos(angle) * r;
        const fy = Math.sin(angle) * r * squash;
        points.push([fx, fy]);
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();

      // Base fill
      const baseColor = `hsl(${hue}, ${sat}%, ${lit}%)`;
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Texture: tiny dots
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 600; i++) {
        const x = (rng() - 0.5) * size;
        const y = (rng() - 0.5) * size;
        const dotR = 0.5 + rng() * 1.5;
        const dotLit = lit + (rng() - 0.5) * 15;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue + rng() * 10 - 5}, ${sat}%, ${dotLit}%)`;
        ctx.fill();
      }

      // Veins / cracks
      const veins = 2 + Math.floor(rng() * 3);
      for (let v = 0; v < veins; v++) {
        ctx.beginPath();
        let vx = (rng() - 0.5) * baseRadius;
        let vy = (rng() - 0.5) * baseRadius * squash;
        ctx.moveTo(vx, vy);
        const segments = 4 + Math.floor(rng() * 6);
        for (let s = 0; s < segments; s++) {
          vx += (rng() - 0.5) * 40;
          vy += (rng() - 0.5) * 30;
          ctx.lineTo(vx, vy);
        }
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit + 8}%, ${0.2 + rng() * 0.3})`;
        ctx.lineWidth = 0.5 + rng();
        ctx.stroke();
      }

      // Moss spots (sometimes)
      if (rng() > 0.3) {
        const spots = 1 + Math.floor(rng() * 4);
        for (let s = 0; s < spots; s++) {
          const mx = (rng() - 0.5) * baseRadius * 1.2;
          const my = (rng() - 0.5) * baseRadius * squash * 1.2;
          const mr = 3 + rng() * 12;
          const mossHue = 90 + rng() * 40;
          ctx.beginPath();
          ctx.arc(mx, my, mr, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${mossHue}, ${30 + rng() * 20}%, ${20 + rng() * 10}%, ${0.3 + rng() * 0.4})`;
          ctx.fill();
        }
      }

      ctx.restore(); // undo clip

      // Subtle shadow/highlight
      const grad = ctx.createRadialGradient(
        -baseRadius * 0.3, -baseRadius * squash * 0.3, 0,
        0, 0, baseRadius
      );
      grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${lit + 15}%, 0.15)`);
      grad.addColorStop(0.6, 'hsla(0,0%,0%,0)');
      grad.addColorStop(1, 'hsla(0,0%,0%,0.2)');
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const [fx, fy] = points[i] || points[0];
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Edge
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const [fx, fy] = points[i] || points[0];
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit - 5}%, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore(); // undo translate/rotate
    }

    function reveal(seed) {
      currentSeed = seed;
      const rng = mulberry32(seed);
      // Pick inscription
      const idx = Math.floor(rng() * inscriptions.length);
      currentInscription = inscriptions[idx];

      // Draw stone immediately
      drawStone(seed);

      // Fade in the words
      textEl.style.opacity = '0';
      textEl.textContent = currentInscription;

      setTimeout(() => {
        textEl.style.opacity = '1';
      }, 800);

      // Show buttons
      if (takeBtn) {
        takeBtn.style.display = 'inline-block';
        takeBtn.style.opacity = '0';
        setTimeout(() => { takeBtn.style.opacity = '1'; }, 1600);
      }
      if (anotherBtn) {
        anotherBtn.style.display = 'inline-block';
        anotherBtn.style.opacity = '0';
        setTimeout(() => { anotherBtn.style.opacity = '1'; }, 2000);
      }
    }

    // "Take" = download the stone image with text burned in
    if (takeBtn) {
      takeBtn.addEventListener('click', function() {
        // Redraw at higher res for download
        const dlCanvas = document.createElement('canvas');
        const dlSize = 600;
        const dlCtx = dlCanvas.getContext('2d');
        dlCanvas.width = dlSize;
        dlCanvas.height = dlSize + 80;

        // Black background
        dlCtx.fillStyle = '#1a1a18';
        dlCtx.fillRect(0, 0, dlCanvas.width, dlCanvas.height);

        // Draw stone at 2x
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = dlSize;
        tmpCanvas.height = dlSize;
        const tmpCtx = tmpCanvas.getContext('2d');

        // Re-render the stone at dlSize
        const origW = canvas.width;
        const origH = canvas.height;
        const origStyle = [canvas.style.width, canvas.style.height];
        canvas.width = dlSize;
        canvas.height = dlSize;
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Scale everything up
        const scale = dlSize / size;
        ctx.scale(scale, scale);
        drawStone(currentSeed);

        dlCtx.drawImage(canvas, 0, 0);

        // Restore canvas
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = origStyle[0];
        canvas.style.height = origStyle[1];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        drawStone(currentSeed);

        // Add text below stone
        dlCtx.fillStyle = '#c4b99a';
        dlCtx.font = 'italic 16px "EB Garamond", Georgia, serif';
        dlCtx.textAlign = 'center';

        // Word wrap
        const maxWidth = dlSize - 60;
        const words = currentInscription.split(' ');
        let lines = [];
        let line = '';
        for (const word of words) {
          const test = line ? line + ' ' + word : word;
          if (dlCtx.measureText(test).width > maxWidth) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        const lineHeight = 22;
        const textY = dlSize + 20;
        lines.forEach((l, i) => {
          dlCtx.fillText(l, dlSize / 2, textY + i * lineHeight);
        });

        // Add tiny attribution
        dlCtx.fillStyle = '#3a3a2e';
        dlCtx.font = '10px sans-serif';
        dlCtx.fillText('mossygravel.github.io/take-a-stone', dlSize / 2, dlCanvas.height - 8);

        // Download
        const link = document.createElement('a');
        link.download = 'stone-from-moss.png';
        link.href = dlCanvas.toDataURL('image/png');
        link.click();
      });
    }

    // "Another stone"
    if (anotherBtn) {
      anotherBtn.addEventListener('click', function() {
        textEl.style.opacity = '0';
        if (takeBtn) takeBtn.style.opacity = '0';
        anotherBtn.style.opacity = '0';
        setTimeout(() => {
          reveal(Date.now());
        }, 500);
      });
    }

    // Initial reveal
    reveal(Date.now());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
