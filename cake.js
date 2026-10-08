/**
 * ============================================================================
 * 3D POP-UP BIRTHDAY CAKE & SINGING AUDIO ENGINE (cake.js)
 * Matching Image 3: 3-tier Honeycomb paper cake, glowing warm rays, 
 * Happy Birthday singing audio, interactive candle blow-out, and confetti.
 * ============================================================================
 */

(function () {
  'use strict';

  // State
  let isCardOpen = false;
  let isCandleLit = true;
  let audioCtx = null;
  let isSingingPlaying = false;
  let melodyTimeouts = [];

  // DOM Elements
  const cakeContainer = document.getElementById('cake-scene-container');
  const popupCard = document.getElementById('popup-card');
  const candleWrapper = document.getElementById('cake-candle');
  const flameContainer = document.getElementById('candle-flame-container');
  const blowCandleBtn = document.getElementById('blow-candle-btn');
  const birthdayWishCard = document.getElementById('birthday-wish-card');
  const closeWishBtn = document.getElementById('close-wish-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const cakeBackBtn = document.getElementById('cake-back-btn');

  // Initialize Web Audio Context on user gesture
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /* --------------------------------------------------------------------------
     "HAPPY BIRTHDAY TO YOU" MUSIC BOX SYNTHESIZER (Polyphonic Web Audio)
     -------------------------------------------------------------------------- */
  const NOTE_FREQS = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46
  };

  // Melody notes & durations (in beats) for "Happy Birthday to You"
  const BIRTHDAY_MELODY = [
    { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'D4', dur: 1.0 }, { note: 'C4', dur: 1.0 }, { note: 'F4', dur: 1.0 }, { note: 'E4', dur: 2.0 },
    { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'D4', dur: 1.0 }, { note: 'C4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'F4', dur: 2.0 },
    { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'C5', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'F4', dur: 1.0 }, { note: 'E4', dur: 1.0 }, { note: 'D4', dur: 2.0 },
    { note: 'Bb4', dur: 0.75 }, { note: 'Bb4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'F4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'F4', dur: 2.5 }
  ];

  function playChimeNote(freq, startTime, duration) {
    if (!audioCtx) return;

    // Dual oscillator chime (warm celesta / music box tone)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Subtle overtone for bell warmth
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envelope
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.3, startTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 1.2);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration * 1.3);
    osc2.stop(startTime + duration * 1.3);
  }

  function playHappyBirthdaySong() {
    const ctx = getAudioContext();
    if (!ctx) return;

    stopHappyBirthdaySong();
    isSingingPlaying = true;

    // Check if custom audio file exists first
    const birthdayAudio = document.getElementById('birthday-song-audio');
    if (birthdayAudio && birthdayAudio.src && !birthdayAudio.error) {
      birthdayAudio.currentTime = 0;
      birthdayAudio.play().then(() => {
        return;
      }).catch(() => {
        // Fallback to Web Audio Synth if audio element blocked or file missing
        runSynthMelody(ctx);
      });
    } else {
      runSynthMelody(ctx);
    }
  }

  function runSynthMelody(ctx) {
    const beatDuration = 0.55; // seconds per beat
    let curTime = ctx.currentTime + 0.2;

    BIRTHDAY_MELODY.forEach((item) => {
      const freq = NOTE_FREQS[item.note];
      const durSec = item.dur * beatDuration;
      playChimeNote(freq, curTime, durSec);
      curTime += durSec;
    });

    const totalDurMs = (curTime - ctx.currentTime) * 1000;
    const loopTimeout = setTimeout(() => {
      if (isCardOpen && isSingingPlaying && isCandleLit) {
        runSynthMelody(ctx);
      }
    }, totalDurMs + 2000);
    melodyTimeouts.push(loopTimeout);
  }

  function stopHappyBirthdaySong() {
    isSingingPlaying = false;
    melodyTimeouts.forEach(t => clearTimeout(t));
    melodyTimeouts = [];

    const birthdayAudio = document.getElementById('birthday-song-audio');
    if (birthdayAudio) {
      birthdayAudio.pause();
    }
  }

  /* --------------------------------------------------------------------------
     SOUND EFFECTS (Blow sound, Cheer sweep)
     -------------------------------------------------------------------------- */
  function playBlowSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Breath / white noise puff
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  function playCelebrationFanfare() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Magical chime sweep for birthday wish
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio high
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        playChimeNote(freq, ctx.currentTime, 1.5);
      }, idx * 140);
    });
  }

  /* --------------------------------------------------------------------------
     3D CARD OPEN / CLOSE SEQUENCER
     -------------------------------------------------------------------------- */
  function openCard() {
    if (isCardOpen) return;
    isCardOpen = true;

    popupCard.classList.remove('is-closed');
    popupCard.classList.add('is-open');

    // Pause ambient background music so Kaye can enjoy the singing cake!
    if (window.loveLetterApp && window.loveLetterApp.pauseBackgroundMusic) {
      window.loveLetterApp.pauseBackgroundMusic();
    }

    // Play singing audio
    setTimeout(() => {
      playHappyBirthdaySong();
    }, 800);
  }

  function closeCard() {
    isCardOpen = false;
    popupCard.classList.remove('is-open');
    popupCard.classList.add('is-closed');
    stopHappyBirthdaySong();
  }

  /* --------------------------------------------------------------------------
     BLOW OUT CANDLE INTERACTION
     -------------------------------------------------------------------------- */
  function blowOutCandle() {
    if (!isCandleLit) return;
    isCandleLit = false;

    playBlowSound();

    if (flameContainer) {
      flameContainer.classList.add('is-extinguished');
    }

    if (blowCandleBtn) {
      blowCandleBtn.style.display = 'none';
    }

    // Stop singing and celebrate!
    stopHappyBirthdaySong();

    // Trigger celebration fanfare & confetti blast!
    setTimeout(() => {
      playCelebrationFanfare();
      triggerConfettiExplosion();
    }, 400);

    // Show romantic Birthday Wish Card
    setTimeout(() => {
      if (birthdayWishCard) {
        birthdayWishCard.classList.add('show');
      }
    }, 1200);
  }

  /* --------------------------------------------------------------------------
     CONFETTI & FIREWORKS ENGINE
     -------------------------------------------------------------------------- */
  let confettiParticles = [];
  let confettiAnimationId = null;

  function triggerConfettiExplosion() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = [
      '#fef08a', '#d4af37', '#fae19c', // Golds
      '#60a5fa', '#3b82f6', '#1d4ed8', // Royal & Sapphire Blues
      '#f43f5e', '#fb7185', '#ffffff'  // Rose & Silvers
    ];

    // Spawn 180 particles
    confettiParticles = [];
    for (let i = 0; i < 180; i++) {
      confettiParticles.push({
        x: window.innerWidth * 0.5 + (Math.random() * 80 - 40),
        y: window.innerHeight * 0.55 + (Math.random() * 40 - 20),
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 18 - 6,
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        gravity: 0.38,
        friction: 0.98,
        opacity: 1
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti(ctx);
  }

  function animateConfetti(ctx) {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    let activeCount = 0;
    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.rotation += p.rotSpeed;

      if (p.y > confettiCanvas.height * 0.7) {
        p.opacity -= 0.015;
      }

      if (p.opacity > 0) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (activeCount > 0) {
      confettiAnimationId = requestAnimationFrame(() => animateConfetti(ctx));
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  /* --------------------------------------------------------------------------
     EVENT LISTENERS & BINDINGS
     -------------------------------------------------------------------------- */
  function initCake() {
    // Card open on cover click
    if (popupCard) {
      popupCard.addEventListener('click', (e) => {
        if (!isCardOpen) {
          openCard();
        }
      });
    }

    // Candle blow-out triggers
    if (candleWrapper) {
      candleWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        blowOutCandle();
      });
    }

    if (blowCandleBtn) {
      blowCandleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        blowOutCandle();
      });
    }

    // Close wish card
    if (closeWishBtn) {
      closeWishBtn.addEventListener('click', () => {
        if (birthdayWishCard) {
          birthdayWishCard.classList.remove('show');
        }
      });
    }

    // Back button to letter
    if (cakeBackBtn) {
      cakeBackBtn.addEventListener('click', () => {
        stopHappyBirthdaySong();
        if (cakeContainer) {
          cakeContainer.classList.remove('active');
        }
        // Resume letter ambient music
        if (window.loveLetterApp && window.loveLetterApp.resumeBackgroundMusic) {
          window.loveLetterApp.resumeBackgroundMusic();
        }
      });
    }

    // Video Modal Elements & Handlers
    const videoModal = document.getElementById('video-modal');
    const videoBackdrop = document.getElementById('video-modal-backdrop');
    const videoCloseBtn = document.getElementById('video-close-btn');
    const mujibPlayer = document.getElementById('mujib-player');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const cakeVideoBtn = document.getElementById('cake-video-btn');

    function openVideoModal() {
      if (!videoModal) return;
      videoModal.classList.add('active');

      // Pause ambient and birthday music so video audio is clear
      stopHappyBirthdaySong();
      if (window.loveLetterApp && window.loveLetterApp.pauseBackgroundMusic) {
        window.loveLetterApp.pauseBackgroundMusic();
      }

      if (mujibPlayer) {
        mujibPlayer.currentTime = 0;
        mujibPlayer.play().catch(e => console.log('Autoplay muted or blocked:', e));
      }
    }

    function closeVideoModal() {
      if (!videoModal) return;
      videoModal.classList.remove('active');
      if (mujibPlayer) {
        mujibPlayer.pause();
      }
    }

    const letterVideoBtn = document.getElementById('letter-video-btn');
    if (letterVideoBtn) letterVideoBtn.addEventListener('click', openVideoModal);

    if (watchVideoBtn) watchVideoBtn.addEventListener('click', openVideoModal);
    if (cakeVideoBtn) cakeVideoBtn.addEventListener('click', openVideoModal);
    if (videoCloseBtn) videoCloseBtn.addEventListener('click', closeVideoModal);
    if (videoBackdrop) videoBackdrop.addEventListener('click', closeVideoModal);

    window.openMujibVideo = openVideoModal;
  }

  // Public API to launch cake scene from main letter navigation
  window.cakeApp = {
    launchCakeScene: function () {
      if (cakeContainer) {
        cakeContainer.classList.add('active');
        // Reset state
        isCandleLit = true;
        if (flameContainer) flameContainer.classList.remove('is-extinguished');
        if (blowCandleBtn) blowCandleBtn.style.display = 'inline-flex';
        if (birthdayWishCard) birthdayWishCard.classList.remove('show');
        
        // Auto-open if desired, or let Kaye click to open the card
        // We start with card closed so Kaye experiences opening the greeting card!
        closeCard();
      }
    },
    openCard: openCard,
    blowOutCandle: blowOutCandle
  };

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCake);
  } else {
    initCake();
  }
})();
