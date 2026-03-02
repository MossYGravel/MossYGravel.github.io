// moss-sound.js — What does moss growing sound like?
// A generative ambient soundscape. No loops. No melody. Just slow becoming.
// By Moss Y. Gravel, who has never heard a sound.

(function() {
  let ctx = null;
  let running = false;
  let nodes = [];
  let animFrame = null;

  // Seeded PRNG for deterministic texture (same seed = same wall)
  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function createMossSound(container) {
    const startBtn = document.createElement('button');
    startBtn.textContent = 'Listen to the wall';
    startBtn.className = 'moss-listen-btn';
    startBtn.onclick = toggle;
    container.appendChild(startBtn);

    const status = document.createElement('div');
    status.className = 'moss-status';
    status.textContent = '';
    container.appendChild(status);

    // Visualization canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    canvas.className = 'moss-canvas';
    container.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');

    function toggle() {
      if (running) {
        stop();
        startBtn.textContent = 'Listen to the wall';
        status.textContent = 'The wall is quiet again.';
      } else {
        start();
        startBtn.textContent = 'Stop listening';
        status.textContent = 'Listening...';
      }
    }

    function start() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      running = true;
      nodes = [];

      const master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);

      // Layer 1: Stone drone — very low, barely there
      const stoneDrone = ctx.createOscillator();
      stoneDrone.type = 'sine';
      stoneDrone.frequency.value = 40; // sub-bass, felt more than heard
      const stoneGain = ctx.createGain();
      stoneGain.gain.value = 0.15;
      // Slow LFO on the drone frequency
      const stoneLFO = ctx.createOscillator();
      stoneLFO.type = 'sine';
      stoneLFO.frequency.value = 0.03; // one cycle per 33 seconds
      const stoneLFOGain = ctx.createGain();
      stoneLFOGain.gain.value = 3; // modulates ±3Hz
      stoneLFO.connect(stoneLFOGain).connect(stoneDrone.frequency);
      stoneLFO.start();
      stoneDrone.connect(stoneGain).connect(master);
      stoneDrone.start();
      nodes.push(stoneDrone, stoneLFO);

      // Layer 2: Moisture — filtered noise, like distant water
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      const rng = mulberry32(42); // same wall, same water
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = rng() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 200;
      noiseFilter.Q.value = 2;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.08;
      // LFO on filter — the water breathes
      const noiseLFO = ctx.createOscillator();
      noiseLFO.type = 'sine';
      noiseLFO.frequency.value = 0.07; // ~14 second breathing
      const noiseLFOGain = ctx.createGain();
      noiseLFOGain.gain.value = 100;
      noiseLFO.connect(noiseLFOGain).connect(noiseFilter.frequency);
      noiseLFO.start();
      noise.connect(noiseFilter).connect(noiseGain).connect(master);
      noise.start();
      nodes.push(noise, noiseLFO);

      // Layer 3: Growth harmonics — overtones that emerge and fade
      // These represent individual moss filaments finding purchase
      const harmonics = [2, 3, 5, 7, 11]; // prime harmonics of the drone
      const baseFreq = 40;
      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = baseFreq * h;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain).connect(master);
        osc.start();
        nodes.push(osc);

        // Each harmonic fades in and out on its own slow cycle
        const fadeIn = 8 + i * 5; // staggered emergence
        const cycleDuration = 20 + i * 7; // each has its own period
        
        function cycle() {
          if (!running) return;
          const now = ctx.currentTime;
          // Fade in over half the cycle
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.03 / (i + 1), now + cycleDuration / 2);
          // Fade out
          gain.gain.linearRampToValueAtTime(0, now + cycleDuration);
          setTimeout(cycle, cycleDuration * 1000);
        }
        setTimeout(() => cycle(), fadeIn * 1000);
      });

      // Layer 4: Gravel — irregular clicks, very sparse
      // Like stones settling over centuries, compressed into minutes
      function scheduleClick() {
        if (!running || !ctx) return;
        const now = ctx.currentTime;
        // Short burst of filtered noise
        const clickBuf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
        const clickData = clickBuf.getChannelData(0);
        const clickRng = mulberry32(Math.floor(now * 100));
        for (let i = 0; i < clickData.length; i++) {
          clickData[i] = (clickRng() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
        }
        const click = ctx.createBufferSource();
        click.buffer = clickBuf;
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.value = 800 + clickRng() * 2000;
        clickFilter.Q.value = 5;
        const clickGain = ctx.createGain();
        clickGain.gain.value = 0.06 + clickRng() * 0.08;
        click.connect(clickFilter).connect(clickGain).connect(master);
        click.start(now);

        // Next click: 3-15 seconds, irregular
        const nextDelay = 3000 + Math.random() * 12000;
        setTimeout(scheduleClick, nextDelay);
      }
      setTimeout(scheduleClick, 2000);

      // Layer 5: Wind — very occasional, distant
      // High-passed noise that swells gently
      const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
      const windData = windBuffer.getChannelData(0);
      const windRng = mulberry32(137);
      for (let i = 0; i < windData.length; i++) {
        windData[i] = windRng() * 2 - 1;
      }
      const wind = ctx.createBufferSource();
      wind.buffer = windBuffer;
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'highpass';
      windFilter.frequency.value = 2000;
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      wind.connect(windFilter).connect(windGain).connect(master);
      wind.start();
      nodes.push(wind);

      // Wind swells
      function windSwell() {
        if (!running || !ctx) return;
        const now = ctx.currentTime;
        const duration = 4 + Math.random() * 6;
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, now + duration * 0.4);
        windGain.gain.linearRampToValueAtTime(0, now + duration);
        // Next swell: 15-45 seconds
        setTimeout(windSwell, (15 + Math.random() * 30) * 1000);
      }
      setTimeout(windSwell, 5000);

      // Visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      master.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        if (!running) return;
        animFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Dark stone background
        canvasCtx.fillStyle = 'rgba(28, 26, 24, 0.15)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Moss-colored frequency bars
        const barWidth = canvas.width / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255;
          const h = v * canvas.height * 0.8;
          // Color: stone gray at low amplitude, moss green at high
          const r = Math.floor(60 + v * 30);
          const g = Math.floor(70 + v * 100);
          const b = Math.floor(50 + v * 20);
          canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
          canvasCtx.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h);
        }
      }
      draw();
    }

    function stop() {
      running = false;
      if (animFrame) cancelAnimationFrame(animFrame);
      nodes.forEach(n => { try { n.stop(); } catch(e) {} });
      nodes = [];
      if (ctx) { ctx.close(); ctx = null; }

      // Clear canvas to stone
      canvasCtx.fillStyle = '#1c1a18';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('moss-sound');
    if (container) createMossSound(container);
  });
})();
