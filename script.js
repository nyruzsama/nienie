/**
 * ============================================================================
 * KAYE'S BIRTHDAY LOVE LETTER - CORE CONTROLLER (script.js)
 * Manages Envelope opening, Music Engine, Letter Paging, 
 * Floating Photo Galaxy (~50 Photos), and Ambient Canvas Particles.
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     STATE & CONFIGURATION
     -------------------------------------------------------------------------- */
  const TOTAL_PHOTOS = 50;
  let currentPageIndex = 0;
  const TOTAL_PAGES = 3;
  let isMusicPlaying = false;
  let floatingPhotos = [];
  let particles = [];
  let animFrameId = null;

  // DOM Elements
  const coverScene = document.getElementById('cover-scene');
  const letterScene = document.getElementById('letter-scene');
  const btnOpenLetter = document.getElementById('btn-open-letter');
  const envelopeBox = document.getElementById('envelope-box');
  const waxSeal = document.getElementById('wax-seal');

  // Music Pill Elements
  const musicPill = document.getElementById('music-pill');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const bgMusicAudio = document.getElementById('bg-music-audio');

  // Letter Navigation Elements
  const letterPages = document.querySelectorAll('.letter-page');
  const dots = document.querySelectorAll('.page-indicators .dot');
  const dockBtnPrev = document.getElementById('dock-btn-prev');
  const dockBtnGrid = document.getElementById('dock-btn-grid');
  const dockBtnNext = document.getElementById('dock-btn-next');
  const nextBtnTitle = document.getElementById('next-btn-title');

  // Gallery & Lightbox Elements
  const galleryModal = document.getElementById('gallery-modal');
  const galleryCloseBtn = document.getElementById('gallery-close-btn');
  const galleryGridContainer = document.getElementById('gallery-grid-container');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxSub = document.getElementById('lightbox-sub');

  // Canvas
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  /* --------------------------------------------------------------------------
     AUDIO MANAGEMENT (Web-audio safe autoplay on gesture)
     -------------------------------------------------------------------------- */
  function playBackgroundMusic() {
    if (!bgMusicAudio) return;
    bgMusicAudio.play().then(() => {
      isMusicPlaying = true;
      if (musicPill) {
        musicPill.classList.add('playing');
        musicPill.classList.add('visible');
      }
    }).catch(err => {
      console.log('Audio autoplay prevented or missing file:', err);
      // Still show the pill so user can tap play anytime
      if (musicPill) musicPill.classList.add('visible');
    });
  }

  function pauseBackgroundMusic() {
    if (!bgMusicAudio) return;
    bgMusicAudio.pause();
    isMusicPlaying = false;
    if (musicPill) musicPill.classList.remove('playing');
  }

  function toggleMusic() {
    if (isMusicPlaying) {
      pauseBackgroundMusic();
    } else {
      playBackgroundMusic();
    }
  }

  /* --------------------------------------------------------------------------
     SOUND EFFECT SYNTHESIS (Wax Crack / Opening Whoosh)
     -------------------------------------------------------------------------- */
  function playWaxBreakSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const actx = new AudioContextClass();
    const osc = actx.createOscillator();
    const gain = actx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, actx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.4, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(actx.destination);

    osc.start();
    osc.stop(actx.currentTime + 0.2);
  }

  /* --------------------------------------------------------------------------
     OPEN ENVELOPE INTERACTION (Cover -> Letter Scene)
     -------------------------------------------------------------------------- */
  function openEnvelope() {
    playWaxBreakSound();

    // Wax seal pop animation
    if (waxSeal) {
      waxSeal.style.transform = 'scale(1.25) rotate(15deg)';
      waxSeal.style.opacity = '0.6';
    }

    // Hide cover scene, reveal letter scene
    setTimeout(() => {
      if (coverScene) coverScene.classList.add('hidden');
      if (letterScene) letterScene.classList.add('active');

      // Start background music as requested in Image 2
      playBackgroundMusic();

      // Start floating photos drift
      initFloatingPhotos();
    }, 450);
  }

  /* --------------------------------------------------------------------------
     LETTER PAGING NAVIGATION (Image 2 Bottom Bar)
     -------------------------------------------------------------------------- */
  const NEXT_TITLES = [
    'What I love ➔',
    'A Birthday Wish ➔',
    'Birthday Surprise 🎂 ➔'
  ];

  function updateLetterPage(newIndex) {
    if (newIndex < 0) {
      // Go back to closed cover if at page 0
      if (letterScene) letterScene.classList.remove('active');
      if (coverScene) coverScene.classList.remove('hidden');
      if (musicPill) musicPill.classList.remove('visible');
      pauseBackgroundMusic();
      currentPageIndex = 0;
      return;
    }

    if (newIndex >= TOTAL_PAGES) {
      // Launch 3D Pop-Up Birthday Cake Surprise! (Image 3)
      if (window.cakeApp && window.cakeApp.launchCakeScene) {
        window.cakeApp.launchCakeScene();
      }
      return;
    }

    // Transition pages
    letterPages.forEach((page, idx) => {
      page.classList.remove('active', 'exit-left');
      if (idx === newIndex) {
        page.classList.add('active');
      } else if (idx < newIndex) {
        page.classList.add('exit-left');
      }
    });

    // Update dots
    dots.forEach((dot, idx) => {
      if (idx === newIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    currentPageIndex = newIndex;

    // Update Next button label
    if (nextBtnTitle) {
      nextBtnTitle.textContent = NEXT_TITLES[currentPageIndex];
    }
  }

  /* --------------------------------------------------------------------------
     FLOATING PHOTO GALAXY (~50 IMAGES)
     Drifting in the background at varying depths, rotations, and wander physics
     -------------------------------------------------------------------------- */
  const photoCaptions = [
    "Your beautiful smile that lights up my entire world ✨",
    "One of my favorite memories with you ❤️",
    "Always laughing together, wherever we go 🌸",
    "The way your eyes sparkle when you're happy ✨",
    "Forever grateful for every single moment with you 💖",
    "My favorite person, my best friend, my whole heart 💫",
    "Another year more radiant and breathtaking, Kaye 🎂",
    "Adventures with you are my happiest place on earth 🌍",
    "That unforgettable day we shared together 🥰",
    "Happy Birthday to my dream girl 🌟"
  ];

  function initFloatingPhotos() {
    const container = document.getElementById('floating-photos-container');
    if (!container || floatingPhotos.length > 0) return;

    // Create 50 photo objects in memory
    for (let i = 1; i <= TOTAL_PHOTOS; i++) {
      const card = document.createElement('div');
      card.className = 'floating-photo-card';

      // Pin ornament
      const pin = document.createElement('div');
      pin.className = 'photo-caption-pin';
      card.appendChild(pin);

      // Photo Image with fallback
      const img = document.createElement('img');
      img.src = `photos/photo${i}.jpg`;
      img.alt = `Memory #${i}`;
      img.loading = 'lazy';
      img.onerror = function () {
        // Aesthetic romantic fallback if custom file not yet placed
        this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="%231e3a8a"/><text x="50%" y="45%" fill="%23fef08a" font-size="28" font-family="sans-serif" text-anchor="middle">💙</text><text x="50%" y="75%" fill="%23ffffff" font-size="11" font-family="sans-serif" text-anchor="middle">Memory ${i}</text></svg>`;
      };
      card.appendChild(img);

      // Data for lightbox
      const captionText = photoCaptions[(i - 1) % photoCaptions.length];
      card.dataset.caption = captionText;
      card.dataset.index = i;

      // Spawn distribution
      const depthScale = 0.55 + Math.random() * 0.45;
      const posX = Math.random() * (window.innerWidth - 120);
      const posY = Math.random() * (window.innerHeight - 140);
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.35;
      const rot = (Math.random() - 0.5) * 24;

      card.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${depthScale}) rotate(${rot}deg)`;
      card.style.opacity = Math.min(1, depthScale * 0.95);
      container.appendChild(card);

      const photoObj = {
        el: card,
        x: posX,
        y: posY,
        vx: vx,
        vy: vy,
        scale: depthScale,
        rot: rot,
        isHovered: false
      };

      // Hover freeze
      card.addEventListener('mouseenter', () => { photoObj.isHovered = true; });
      card.addEventListener('mouseleave', () => { photoObj.isHovered = false; });

      // Click to open lightbox
      card.addEventListener('click', () => {
        openLightbox(img.src, captionText, `Memory #${i} of 50`);
      });

      floatingPhotos.push(photoObj);
    }

    animateFloatingPhotos();
  }

  function animateFloatingPhotos() {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;

    floatingPhotos.forEach(p => {
      if (p.isHovered) return;

      p.x += p.vx;
      p.y += p.vy;

      // Gentle screen boundary wrap/bounce
      if (p.x < -40) p.x = maxX + 20;
      if (p.x > maxX + 40) p.x = -20;
      if (p.y < -40) p.y = maxY + 20;
      if (p.y > maxY + 40) p.y = -20;

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale}) rotate(${p.rot}deg)`;
    });

    requestAnimationFrame(animateFloatingPhotos);
  }

  /* --------------------------------------------------------------------------
     SCRAPBOOK GALLERY MODAL (Grid view of all 50 photos)
     -------------------------------------------------------------------------- */
  function populateScrapbookGrid() {
    if (!galleryGridContainer) return;
    galleryGridContainer.innerHTML = '';

    for (let i = 1; i <= TOTAL_PHOTOS; i++) {
      const item = document.createElement('div');
      item.className = 'gallery-grid-item';

      const img = document.createElement('img');
      img.src = `photos/photo${i}.jpg`;
      img.alt = `Memory #${i}`;
      img.loading = 'lazy';
      img.onerror = function () {
        this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="140" viewBox="0 0 160 140"><rect width="100%" height="100%" fill="%231e3a8a"/><text x="50%" y="45%" fill="%23fef08a" font-size="28" font-family="sans-serif" text-anchor="middle">💙</text><text x="50%" y="75%" fill="%23ffffff" font-size="11" font-family="sans-serif" text-anchor="middle">Memory ${i}</text></svg>`;
      };

      const numTag = document.createElement('span');
      numTag.className = 'gallery-item-number';
      numTag.textContent = `#${i}`;

      item.appendChild(img);
      item.appendChild(numTag);

      const captionText = photoCaptions[(i - 1) % photoCaptions.length];
      item.addEventListener('click', () => {
        openLightbox(img.src, captionText, `Memory #${i} of ${TOTAL_PHOTOS}`);
      });

      galleryGridContainer.appendChild(item);
    }
  }

  function openGalleryModal() {
    populateScrapbookGrid();
    if (galleryModal) galleryModal.classList.add('active');
  }

  function closeGalleryModal() {
    if (galleryModal) galleryModal.classList.remove('active');
  }

  /* --------------------------------------------------------------------------
     LIGHTBOX MODAL
     -------------------------------------------------------------------------- */
  function openLightbox(src, caption, sub) {
    if (!lightboxModal) return;
    if (lightboxImg) lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxSub) lightboxSub.textContent = sub;
    lightboxModal.classList.add('active');
  }

  function closeLightbox() {
    if (lightboxModal) lightboxModal.classList.remove('active');
  }

  /* --------------------------------------------------------------------------
     AMBIENT PARTICLES CANVAS (Blue Petals & Starlight Glow)
     -------------------------------------------------------------------------- */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initParticles() {
    if (!canvas) return;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    particles = [];
    // 35 ambient particles: mix of glowing starlight and floating blue rose petals
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        type: Math.random() > 0.45 ? 'petal' : 'star',
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: Math.random() * 0.7 + 0.3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    animateParticles();
  }

  function animateParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      // Wrap edges
      if (p.y > canvas.height + 20) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -20) p.x = canvas.width + 10;
      if (p.x > canvas.width + 20) p.x = -10;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;

      if (p.type === 'star') {
        // Glowing Golden Starlight Embers
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#d4af37');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Floating Sapphire/Blue Petal
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 1.8, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        // Inner petal highlight
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    requestAnimationFrame(animateParticles);
  }

  /* --------------------------------------------------------------------------
     INIT & EVENT BINDINGS
     -------------------------------------------------------------------------- */
  function init() {
    // Envelope interactions
    if (btnOpenLetter) btnOpenLetter.addEventListener('click', openEnvelope);
    if (envelopeBox) envelopeBox.addEventListener('click', openEnvelope);
    if (waxSeal) waxSeal.addEventListener('click', openEnvelope);

    // Audio controls
    if (playPauseBtn) playPauseBtn.addEventListener('click', toggleMusic);

    // Letter Navigation
    if (dockBtnPrev) {
      dockBtnPrev.addEventListener('click', () => {
        updateLetterPage(currentPageIndex - 1);
      });
    }

    if (dockBtnNext) {
      dockBtnNext.addEventListener('click', () => {
        updateLetterPage(currentPageIndex + 1);
      });
    }

    // Gallery Modal
    if (dockBtnGrid) dockBtnGrid.addEventListener('click', openGalleryModal);
    if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryModal);

    // Lightbox Modal
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) closeLightbox();
      });
    }

    // Start Particles
    initParticles();
  }

  // Expose global methods for scene coordination
  window.loveLetterApp = {
    pauseBackgroundMusic: pauseBackgroundMusic,
    resumeBackgroundMusic: playBackgroundMusic
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
