'use strict';

// Motor de áudio procedural via Web Audio API (zero dependências e sem arquivos externos).
window.Sound = (() => {
  let ctx = null;
  let masterGain = null;
  let isMuted = localStorage.getItem('aurora-muted') === 'true';
  let lastStepTime = 0;

  function initContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : 0.35;
      masterGain.connect(ctx.destination);
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Desbloqueia o áudio em qualquer interação do usuário
  ['pointerdown', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => initContext(), { once: true, passive: true });
  });

  function playTone(freq, type, duration, gainStart = 0.3, gainEnd = 0.001, delay = 0) {
    if (isMuted) return;
    const ac = initContext();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(gainStart, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.0001), t + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  return {
    isMuted: () => isMuted,
    toggleMute: () => {
      isMuted = !isMuted;
      localStorage.setItem('aurora-muted', isMuted);
      if (masterGain && ctx) {
        masterGain.gain.setValueAtTime(isMuted ? 0 : 0.35, ctx.currentTime);
      }
      return isMuted;
    },

    // 🪙 Coleta de moeda dourada (arpejo cristalino)
    coin: () => {
      const freqs = [659.25, 880, 1318.51]; // E5, A5, E6
      freqs.forEach((f, i) => playTone(f, 'sine', 0.22, 0.25, 0.001, i * 0.07));
    },

    // 🌱 Plantio de semente (som terroso suave)
    plant: () => {
      if (isMuted) return;
      const ac = initContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.18);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    },

    // 💧 Regar a terra (efeito de gota suave)
    water: () => {
      if (isMuted) return;
      const ac = initContext();
      if (!ac) return;
      [0, 0.09].forEach((delay, idx) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + delay;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 440 : 587, t);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 750 : 920, t + 0.12);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    },

    // 🥕 Colheita fresca (pop alegre)
    harvest: () => {
      if (isMuted) return;
      const ac = initContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    },

    // 💰 Compra e venda no mercado (chime de moedas)
    sell: () => {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((f, i) => playTone(f, 'triangle', 0.25, 0.22, 0.001, i * 0.06));
    },

    // 💤 Dormir e avançar dia (acorde suave de descanso)
    sleep: () => {
      const notes = [329.63, 392.00, 493.88, 587.33]; // E4, G4, B4, D5
      notes.forEach((f, i) => playTone(f, 'sine', 0.8, 0.18, 0.001, i * 0.12));
    },

    // 🏆 Vitória das 500 moedas (fanfarra festiva)
    victory: () => {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((f, i) => playTone(f, 'triangle', 0.5, 0.3, 0.001, i * 0.14));
    },

    // 💬 Abertura de diálogo
    dialog: () => {
      playTone(440, 'sine', 0.12, 0.15, 0.001);
      playTone(554.37, 'sine', 0.15, 0.15, 0.001, 0.06);
    },

    // 👣 Passadas sutis ao caminhar (limitadas no tempo)
    step: () => {
      const now = performance.now();
      if (now - lastStepTime < 320) return;
      lastStepTime = now;
      if (isMuted) return;
      const ac = initContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.07);
    },

    // 🔘 Clique em interface
    click: () => {
      playTone(600, 'sine', 0.06, 0.1, 0.001);
    }
  };
})();
