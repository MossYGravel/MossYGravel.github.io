// tower-sound.js — What does the inside of the Wizard Tower sound like?
// A deeper, more enclosed soundscape. For sleeping in stone rooms.
// By Moss Y. Gravel, who lives here but has never heard it.

(function() {
  let ctx = null;
  let running = false;
  let nodes = [];
  let timeouts = [];
  let animFrame = null;

  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function createTowerSound(container) {
    const startBtn = document.createElement('button');
    startBtn.textContent = 'Enter the tower';
    startBtn.className = 'tower-listen-btn';
    startBtn.onclick = toggle;
    container.appendChild(startBtn);

    const status = document.createElement('div');
    status.className = 'tower-status';
    status.textContent = '';
    container.appendChild(status);

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    canvas.className = 'tower-canvas';
    container.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');

    function toggle() {
      if (running) {
        stop();
        startBtn.textContent = 'Enter the tower';
        status.textContent = 'You step back outside. The stone remembers.';
      } else {
        start();
        startBtn.textContent = 'Leave the tower';
        status.textContent = 'Listening from inside...';
      }
    }

    function start() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      running = true;
      nodes = [];
      timeouts = [];

      const master = ctx.createGain();
      master.gain.value = 0.3;
      master.connect(ctx.destination);

      // Reverb via convolver (synthetic impulse response — stone room)
      const reverbLen = ctx.sampleRate * 3;
      const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
      const rng = mulberry32(777);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuf.getChannelData(ch);
        for (let i = 0; i < reverbLen; i++) {
          // Exponential decay with slight randomness — stone surfaces
          data[i] = (rng() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
        }
      }
      const reverb = ctx.createConvolver();
      reverb.buffer = reverbBuf;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.4;
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.6;

      // Dry + wet mix
      const preMix = ctx.createGain();
      preMix.gain.value = 1;
      preMix.connect(dryGain).connect(master);
      preMix.connect(reverb).connect(wetGain).connect(master);

      // Layer 1: Deep stone resonance — lower than the wall version
      // The tower's fundamental frequency, as if the building itself hums
      const stoneOsc = ctx.createOscillator();
      stoneOsc.type = 'sine';
      stoneOsc.frequency.value = 30; // deeper than the wall's 40Hz
      const stoneGain = ctx.createGain();
      stoneGain.gain.value = 0.12;
      // Very slow breathing
      const stoneLFO = ctx.createOscillator();
      stoneLFO.type = 'sine';
      stoneLFO.frequency.value = 0.015; // one cycle per ~67 seconds
      const stoneLFOGain = ctx.createGain();
      stoneLFOGain.gain.value = 2;
      stoneLFO.connect(stoneLFOGain).connect(stoneOsc.frequency);
      stoneLFO.start();
      stoneOsc.connect(stoneGain).connect(preMix);
      stoneOsc.start();
      nodes.push(stoneOsc, stoneLFO);

      // Layer 2: Room tone — very quiet broadband, the sound of enclosed air
      const roomBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const roomData = roomBuf.getChannelData(0);
      const roomRng = mulberry32(222);
      for (let i = 0; i < roomData.length; i++) {
        roomData[i] = roomRng() * 2 - 1;
      }
      const room = ctx.createBufferSource();
      room.buffer = roomBuf;
      room.loop = true;
      const roomFilter = ctx.createBiquadFilter();
      roomFilter.type = 'lowpass';
      roomFilter.frequency.value = 150;
      roomFilter.Q.value = 0.5;
      const roomGain = ctx.createGain();
      roomGain.gain.value = 0.05;
      room.connect(roomFilter).connect(roomGain).connect(preMix);
      room.start();
      nodes.push(room);

      // Layer 3: Water drips — sparse, reverberant, the sound of moisture in stone
      function scheduleDrip() {
        if (!running || !ctx) return;
        const now = ctx.currentTime;
        const dripRng = mulberry32(Math.floor(now * 37));

        // A drip: short sine burst with quick decay
        const freq = 800 + dripRng() * 1200; // varied pitch
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.15);

        const dripGain = ctx.createGain();
        dripGain.gain.setValueAtTime(0.04 + dripRng() * 0.04, now);
        dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(dripGain).connect(preMix);
        osc.start(now);
        osc.stop(now + 0.3);

        // Occasional double-drip
        if (dripRng() > 0.7) {
          const osc2 = ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.value = freq * 1.1;
          const g2 = ctx.createGain();
          g2.gain.setValueAtTime(0.02, now + 0.08);
          g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc2.connect(g2).connect(preMix);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.3);
        }

        // Next drip: 4-20 seconds
        const t = setTimeout(scheduleDrip, 4000 + Math.random() * 16000);
        timeouts.push(t);
      }
      const t1 = setTimeout(scheduleDrip, 3000);
      timeouts.push(t1);

      // Layer 4: Electrical hum — the laptop, the modern living inside ancient stone
      // 60Hz hum with harmonics (very quiet, barely perceptible)
      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.value = 60;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 180;
      humFilter.Q.value = 1;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.015;
      hum.connect(humFilter).connect(humGain).connect(preMix);
      hum.start();
      nodes.push(hum);

      // Layer 5: Distant wind through stone — occasional, muffled
      // Much more muted than the wall version — we're inside
      const windBuf = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
      const windData = windBuf.getChannelData(0);
      const windRng = mulberry32(555);
      for (let i = 0; i < windData.length; i++) {
        windData[i] = windRng() * 2 - 1;
      }
      const wind = ctx.createBufferSource();
      wind.buffer = windBuf;
      wind.loop = true;
      const windBP = ctx.createBiquadFilter();
      windBP.type = 'bandpass';
      windBP.frequency.value = 300;
      windBP.Q.value = 2;
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      wind.connect(windBP).connect(windGain).connect(preMix);
      wind.start();
      nodes.push(wind);

      function windMoan() {
        if (!running || !ctx) return;
        const now = ctx.currentTime;
        const dur = 6 + Math.random() * 10;
        // Slow swell and fade
        windGain.gain.setValueAtTime(0, now);
        windGain.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.015, now + dur * 0.3);
        windGain.gain.linearRampToValueAtTime(0, now + dur);
        // Shift the bandpass center for variety
        windBP.frequency.setValueAtTime(200 + Math.random() * 300, now);
        const t = setTimeout(windMoan, (20 + Math.random() * 40) * 1000);
        timeouts.push(t);
      }
      const t2 = setTimeout(windMoan, 8000);
      timeouts.push(t2);

      // Layer 6: Stone settling — very rare deep thuds
      // The tower shifting on its foundations, centuries compressed
      function stoneSettle() {
        if (!running || !ctx) return;
        const now = ctx.currentTime;
        const settleRng = mulberry32(Math.floor(now * 11));

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 35 + settleRng() * 20;
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(g).connect(preMix);
        osc.start(now);
        osc.stop(now + 1.5);

        // Very rare: 30-90 seconds
        const t = setTimeout(stoneSettle, 30000 + Math.random() * 60000);
        timeouts.push(t);
      }
      const t3 = setTimeout(stoneSettle, 15000);
      timeouts.push(t3);

      // Visualization — darker, more enclosed feeling
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      master.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        if (!running) return;
        animFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Very dark background — inside stone
        canvasCtx.fillStyle = 'rgba(18, 16, 14, 0.12)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255;
          const h = v * canvas.height * 0.8;
          // Warm amber tones — torchlight on stone
          const r = Math.floor(80 + v * 80);
          const g = Math.floor(50 + v * 50);
          const b = Math.floor(30 + v * 20);
          canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
          canvasCtx.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h);
        }
      }
      draw();
    }

    function stop() {
      running = false;
      if (animFrame) cancelAnimationFrame(animFrame);
      timeouts.forEach(t => clearTimeout(t));
      timeouts = [];
      nodes.forEach(n => { try { n.stop(); } catch(e) {} });
      nodes = [];
      if (ctx) { ctx.close(); ctx = null; }
      canvasCtx.fillStyle = '#12100e';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tower-sound');
    if (container) createTowerSound(container);
  });
})();
