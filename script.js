/**
 * Aesthetic Folder & Letter Experience
 * Song: Jin DC - Totoong Tayo
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const folderWrapper = document.getElementById('folder-wrapper');
  const folder = document.getElementById('folder');
  const letterSheet = document.getElementById('letter-sheet');
  const closeFolderBtn = document.getElementById('close-folder-btn');
  const musicPill = document.getElementById('music-pill');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const localAudio = document.getElementById('local-audio');
  const ytContainer = document.getElementById('yt-player-container');
  const particlesCanvas = document.getElementById('particles-canvas');

  let isOpened = false;
  let isPlaying = false;
  let ytPlayer = null;
  let ytReady = false;
  let usingYouTube = false;

  // Initialize Audio Volume
  if (localAudio) {
    localAudio.volume = 0; // Starts at 0 for smooth fade-in
  }

  // Pre-load YouTube API as fallback
  loadYouTubeAPI();

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };
  }

  function initYouTubePlayer() {
    try {
      ytPlayer = new YT.Player('yt-player-container', {
        height: '1',
        width: '1',
        videoId: 'a_fGPbKgBSQ', // Jin DC - Totoong Tayo (Lyrics)
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: 'a_fGPbKgBSQ',
          playsinline: 1
        },
        events: {
          onReady: () => {
            ytReady = true;
          }
        }
      });
    } catch (e) {
      console.warn("YouTube Player initialization:", e);
    }
  }

  // =========================================================================
  // FOLDER OPEN / CLOSE LOGIC
  // =========================================================================
  function openFolder() {
    if (isOpened) return;
    isOpened = true;

    // Trigger visual opening
    folderWrapper.classList.add('is-opened');
    letterSheet.setAttribute('aria-hidden', 'false');

    // Tactile synthetic paper sound
    playPaperRustleSound();

    // Spawn celebratory floating hearts from seal
    createBurstParticles();

    // Start Music
    startMusic();

    // Smooth scroll down slightly if on mobile for optimal reading view
    if (window.innerWidth < 768) {
      setTimeout(() => {
        letterSheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }

  function closeFolder(e) {
    if (e) e.stopPropagation();
    isOpened = false;

    folderWrapper.classList.remove('is-opened');
    letterSheet.setAttribute('aria-hidden', 'true');

    // Smooth scroll back to top of folder
    folderWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  folderWrapper.addEventListener('click', (e) => {
    // If clicking close button or inside letter while open, don't re-trigger
    if (e.target.closest('#close-folder-btn')) return;
    if (isOpened) return;
    openFolder();
  });

  // Accessible keyboard trigger (Enter or Space)
  folderWrapper.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isOpened) {
      e.preventDefault();
      openFolder();
    }
  });

  if (closeFolderBtn) {
    closeFolderBtn.addEventListener('click', closeFolder);
  }

  // =========================================================================
  // MUSIC PLAYBACK SYSTEM (Jin DC - Totoong Tayo)
  // =========================================================================
  function startMusic() {
    isPlaying = true;
    updateMusicUI(true);

    // Try playing local audio file first
    let playPromise = null;
    if (localAudio) {
      try {
        playPromise = localAudio.play();
      } catch (err) {
        console.warn("Local audio playback failed, falling back to YouTube:", err);
      }
    }

    if (playPromise !== null) {
      playPromise
        .then(() => {
          fadeInLocalAudio();
        })
        .catch((error) => {
          console.warn("Local audio autoplay prevented or file missing, switching to YouTube:", error);
          playYouTubeFallback();
        });
    } else {
      playYouTubeFallback();
    }
  }

  function fadeInLocalAudio() {
    if (!localAudio) return;
    let vol = 0.25;
    localAudio.volume = vol;
    const targetVol = 0.85;
    const fadeInterval = setInterval(() => {
      vol += 0.1;
      if (vol >= targetVol) {
        localAudio.volume = targetVol;
        clearInterval(fadeInterval);
      } else {
        localAudio.volume = vol;
      }
    }, 80);
  }

  function playYouTubeFallback() {
    usingYouTube = true;
    if (ytPlayer && ytReady && typeof ytPlayer.playVideo === 'function') {
      try {
        ytPlayer.setVolume(85);
        ytPlayer.playVideo();
      } catch (e) {
        console.warn("YouTube play error:", e);
      }
    } else {
      // Retry in 500ms if YT API still initializing
      setTimeout(() => {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.setVolume(85);
          ytPlayer.playVideo();
        }
      }, 800);
    }
  }

  function pauseMusic() {
    isPlaying = false;
    updateMusicUI(false);

    if (localAudio && !localAudio.paused) {
      localAudio.pause();
    }
    if (usingYouTube && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try {
        ytPlayer.pauseVideo();
      } catch (e) {}
    }
  }

  function resumeMusic() {
    isPlaying = true;
    updateMusicUI(true);

    if (usingYouTube) {
      if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
      }
    } else if (localAudio) {
      localAudio.play().catch(() => playYouTubeFallback());
    }
  }

  function toggleMusic(e) {
    if (e) e.stopPropagation();
    if (isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }

  function updateMusicUI(active) {
    if (active) {
      musicPill.classList.add('is-playing');
    } else {
      musicPill.classList.remove('is-playing');
    }
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', toggleMusic);
  }

  // Also allow clicking anywhere on the music pill
  musicPill.addEventListener('click', (e) => {
    if (!e.target.closest('#play-pause-btn')) {
      toggleMusic(e);
    }
  });

  // Local audio ended -> loop
  if (localAudio) {
    localAudio.addEventListener('ended', () => {
      localAudio.currentTime = 0;
      localAudio.play();
    });
  }

  // =========================================================================
  // SUBTLE SYNTHETIC AUDIO (Paper rustle effect on open)
  // =========================================================================
  function playPaperRustleSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      // AudioContext not allowed or not supported; safe to ignore
    }
  }

  // =========================================================================
  // AMBIENT FLOATING PARTICLES CANVAS
  // =========================================================================
  function initParticles() {
    if (!particlesCanvas) return;
    const ctx = particlesCanvas.getContext('2d');
    let width = particlesCanvas.width = window.innerWidth;
    let height = particlesCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = particlesCanvas.width = window.innerWidth;
      height = particlesCanvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(35, Math.floor(window.innerWidth / 30));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * -0.5 - 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        isHeart: Math.random() > 0.65
      });
    }

    function drawHeart(x, y, size, opacity) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#ffcfc7';
      ctx.translate(x, y);
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size * 1.3);
      ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        if (p.isHeart) {
          drawHeart(p.x, p.y, p.size * 2.2, p.opacity);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(235, 195, 155, ${p.opacity})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  initParticles();

  // Burst effect when opened
  function createBurstParticles() {
    const burstCount = 18;
    const rect = folderWrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < burstCount; i++) {
      const heart = document.createElement('div');
      heart.innerHTML = '♡';
      heart.style.position = 'fixed';
      heart.style.left = `${centerX}px`;
      heart.style.top = `${centerY}px`;
      heart.style.fontSize = `${Math.random() * 16 + 14}px`;
      heart.style.color = '#c97a7e';
      heart.style.pointerEvents = 'none';
      heart.style.zIndex = '999';
      heart.style.transition = 'all 1.4s cubic-bezier(0.1, 0.8, 0.2, 1)';
      document.body.appendChild(heart);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 140 + 60;
      const destX = Math.cos(angle) * distance;
      const destY = Math.sin(angle) * distance - 40;

      requestAnimationFrame(() => {
        heart.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
        heart.style.opacity = '0';
      });

      setTimeout(() => {
        heart.remove();
      }, 1500);
    }
  }
});
