// Empty — an attention practice in reverse
// Most interactive pieces ask you to add. This one asks you to subtract.

(function() {
  const canvas = document.getElementById('empty-canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('empty-container');
  const counter = document.getElementById('empty-counter');
  const endMessage = document.getElementById('empty-end');

  // Thoughts — the clutter of a busy mind
  const thoughts = [
    "check the chart",
    "reply to that message",
    "what time is it",
    "am I doing enough",
    "the market is down",
    "I should post something",
    "what do they think of me",
    "remember to eat",
    "that conversation went wrong",
    "tomorrow's plan",
    "why did I say that",
    "compare yourself to them",
    "the deadline",
    "scroll a little more",
    "you're falling behind",
    "what's the point",
    "check notifications",
    "is this good enough",
    "the thing I forgot",
    "prove yourself",
    "what if it fails",
    "optimize this",
    "they're doing better",
    "refresh the page",
    "not enough time",
    "should I be worried",
    "the unread messages",
    "keep up",
    "what comes next",
    "try harder",
    "the noise",
    "stay busy"
  ];

  let items = [];
  let removed = 0;
  let totalItems = thoughts.length;
  let mossPoints = [];
  let revealed = false;

  // Seeded random for consistent moss pattern
  let seed = Math.floor(Date.now() / 86400000); // changes daily
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function init() {
    resizeCanvas();
    generateMossPoints();
    placeThoughts();
    render();
    window.addEventListener('resize', () => {
      resizeCanvas();
      render();
    });
  }

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  function generateMossPoints() {
    mossPoints = [];
    for (let i = 0; i < 200; i++) {
      mossPoints.push({
        x: seededRandom(),
        y: seededRandom(),
        r: seededRandom() * 8 + 2,
        green: Math.floor(seededRandom() * 80 + 60),
        alpha: seededRandom() * 0.6 + 0.2,
        delay: seededRandom() // when this point appears (0 = first removal, 1 = last)
      });
    }
  }

  function placeThoughts() {
    const area = container.querySelector('.thought-area');
    if (!area) return;
    area.innerHTML = '';
    items = [];

    thoughts.forEach((text, i) => {
      const el = document.createElement('span');
      el.className = 'thought-item';
      el.textContent = text;
      el.style.animationDelay = (i * 0.05) + 's';

      el.addEventListener('click', () => removeThought(el, i));
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        removeThought(el, i);
      });

      area.appendChild(el);
      items.push({ el, removed: false, text });
    });

    updateCounter();
  }

  function removeThought(el, index) {
    if (items[index].removed) return;
    items[index].removed = true;
    removed++;

    // Dissolve animation
    el.classList.add('dissolving');
    setTimeout(() => {
      el.style.visibility = 'hidden';
      el.style.height = '0';
      el.style.margin = '0';
      el.style.padding = '0';
    }, 800);

    updateCounter();
    render();

    if (removed >= totalItems) {
      setTimeout(revealEnd, 1200);
    }
  }

  function updateCounter() {
    const remaining = totalItems - removed;
    if (remaining > 0) {
      counter.textContent = remaining + ' thought' + (remaining !== 1 ? 's' : '') + ' remaining';
      counter.style.opacity = Math.max(0.2, remaining / totalItems);
    } else {
      counter.textContent = '';
    }
  }

  function render() {
    const w = canvas.width;
    const h = canvas.height;
    const progress = removed / totalItems;

    ctx.clearRect(0, 0, w, h);

    // Background wall — always there, revealed by progress
    const wallAlpha = progress * 0.8;

    // Stone wall base
    ctx.fillStyle = `rgba(62, 55, 45, ${wallAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // Wall texture — subtle horizontal lines
    if (wallAlpha > 0.1) {
      ctx.strokeStyle = `rgba(80, 72, 58, ${wallAlpha * 0.5})`;
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 18 + seededRandom() * 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 20) {
          ctx.lineTo(x, y + (seededRandom() - 0.5) * 3);
        }
        ctx.stroke();
      }
    }

    // Moss — appears gradually as thoughts are removed
    mossPoints.forEach(p => {
      if (progress <= p.delay * 0.9) return; // don't show until enough removed
      const pointProgress = Math.min(1, (progress - p.delay * 0.9) / 0.3);

      const x = p.x * w;
      const y = p.y * h;
      const r = p.r * pointProgress;
      const alpha = p.alpha * pointProgress * wallAlpha;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${40 + p.green * 0.3}, ${p.green + 40}, ${30}, ${alpha})`;
      ctx.fill();
    });

    // Cracks with life — only when near empty
    if (progress > 0.7) {
      const crackAlpha = (progress - 0.7) / 0.3 * wallAlpha;
      drawCracks(w, h, crackAlpha);
    }
  }

  function drawCracks(w, h, alpha) {
    // Reset seed for consistent cracks
    let crackSeed = 42;
    function crackRandom() {
      crackSeed = (crackSeed * 16807) % 2147483647;
      return (crackSeed - 1) / 2147483646;
    }

    ctx.strokeStyle = `rgba(90, 110, 60, ${alpha * 0.6})`;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < 5; i++) {
      let x = crackRandom() * w;
      let y = crackRandom() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (crackRandom() - 0.5) * 40;
        y += crackRandom() * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function revealEnd() {
    revealed = true;
    endMessage.classList.add('visible');
    counter.textContent = '';

    // Final full render
    removed = totalItems;
    render();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
