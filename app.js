/**
 * SignCraft - Main Application Controller
 * Handles tab navigation, theme management, audio preferences, and initialization.
 * Theme: Modern Emerald, Teal & Deep Obsidian Slate.
 */

class App {
  constructor() {
    this.currentTab = 'dictionary';
    const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('signcraft_theme') : null;
    this.theme = storedTheme || 'light';
    const storedSound = typeof localStorage !== 'undefined' ? localStorage.getItem('signcraft_sound') : null;
    this.soundEnabled = storedSound !== 'false';
  }

  init() {
    this.applyTheme();
    this.initSounds();
    this.bindNavigation();
    this.bindShortcuts();

    // Initialize core subsystems safely
    this.visualizer = window.visualizer || (typeof Visualizer !== 'undefined' ? new Visualizer() : null);
    window.visualizer = this.visualizer;

    if (typeof WordsStudio !== 'undefined') {
      this.wordsStudio = window.wordsStudio || new WordsStudio();
      window.wordsStudio = this.wordsStudio;
    }

    if (typeof QuizEngine !== 'undefined') {
      this.quizEngine = window.quizEngine || new QuizEngine();
      window.quizEngine = this.quizEngine;
    }

    if (typeof HandCastStudio !== 'undefined') {
      this.cameraPractice = window.cameraPractice || new HandCastStudio();
      window.cameraPractice = this.cameraPractice;
      window.cameraStudio = this.cameraPractice;
    }

    // Show initial tab
    this.switchTab('dictionary');
    this.initVideoModal();
  }

  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.switchTab(tab);
          sounds.playClick();
        }
      });
    });

    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Sound toggle button
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.toggleSound();
      });
    }
  }

  bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.switchTab('dictionary');
        const searchInput = document.getElementById('dictionary-search');
        if (searchInput) searchInput.focus();
      }
    });
  }

  switchTab(tabName) {
    if (tabName === 'speller') tabName = 'words';
    this.currentTab = tabName;

    const sections = ['dictionary', 'words', 'quiz', 'camera'];
    sections.forEach(sec => {
      const el = document.getElementById(`section-${sec}`);
      if (el) {
        if (sec === tabName) {
          el.classList.remove('hidden');
          el.classList.add('animate-in', 'fade-in', 'duration-200');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // If entering words tab, ensure theater video is active and playing
    if (tabName === 'words' && window.wordsStudio) {
      window.wordsStudio.updateTheaterMedia();
    }

    // Update active navbar styles (Emerald & Deep Slate)
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('bg-emerald-500/10', 'dark:bg-emerald-950/60', 'text-emerald-600', 'dark:text-emerald-400', 'border-emerald-500/30');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white', 'border-transparent');
      } else {
        btn.classList.remove('bg-emerald-500/10', 'dark:bg-emerald-950/60', 'text-emerald-600', 'dark:text-emerald-400', 'border-emerald-500/30');
        btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white', 'border-transparent');
      }
    });

    // If leaving camera/studio tab, safely stop video feed
    const cam = this.cameraPractice || window.cameraPractice;
    if (tabName !== 'camera' && cam && cam.isStreaming) {
      cam.stopFeed();
    }

    // If entering camera/studio tab, initialize autonomous zero-click stream
    if (tabName === 'camera' && cam) {
      cam.autoStart();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openModal(char) {
    const vis = this.visualizer || window.visualizer;
    if (vis) {
      vis.openModal(char);
    }
  }

  switchToPractice(symbol) {
    const vis = this.visualizer || window.visualizer;
    if (vis) vis.closeModal();
    this.switchTab('camera');
    const cam = this.cameraPractice || window.cameraPractice;
    if (cam) {
      if (cam.challengeList && cam.challengeList.includes(symbol)) {
        cam.currentChallengeIndex = cam.challengeList.indexOf(symbol);
      } else if (cam.challengeList) {
        cam.challengeList.unshift(symbol);
        cam.currentChallengeIndex = 0;
      }
      cam.setTarget(symbol);
      cam.autoStart();
    }
  }

  initVideoModal() {
    this.videoModal = document.getElementById('asl-video-modal');
    this.localVideo = document.getElementById('asl-demo-local-video');
    this.ytIframe = document.getElementById('asl-demo-yt-iframe');
    this.videoLetterOverlay = document.getElementById('video-letter-overlay');
    this.currentLetterSpan = document.getElementById('video-current-letter');
    this.lettersGrid = document.getElementById('video-letters-grid');
    this.videoSource = 'local';
    this.currentVideoLetter = 'A';

    if (!this.videoModal || !this.lettersGrid) return;

    // Render A to Z buttons in lettersGrid
    const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    this.lettersGrid.innerHTML = letters.map(char => `
      <button onclick="app.jumpVideoToLetter('${char}')" id="vid-letter-btn-${char}" class="vid-letter-btn w-8 h-8 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/80 dark:border-slate-700">
        ${char}
      </button>
    `).join('');

    // Local video timeupdate listener to track current letter
    if (this.localVideo) {
      this.localVideo.addEventListener('timeupdate', () => {
        const curTime = this.localVideo.currentTime;
        const timestamps = window.aslVideoTimestamps || {};
        for (const [char, span] of Object.entries(timestamps)) {
          if (curTime >= span.start && curTime < span.end) {
            this.highlightLetterButton(char);
            break;
          }
        }
      });
    }

    // Modal click on backdrop to close
    this.videoModal.addEventListener('click', (e) => {
      if (e.target === this.videoModal) this.closeVideoModal();
    });
  }

  highlightLetterButton(char) {
    if (this.currentVideoLetter === char) return;
    this.currentVideoLetter = char;
    if (this.currentLetterSpan) this.currentLetterSpan.textContent = char;
    document.querySelectorAll('.vid-letter-btn').forEach(btn => {
      btn.classList.remove('bg-rose-600', 'text-white', 'border-rose-600', 'shadow-md');
      btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });
    const activeBtn = document.getElementById(`vid-letter-btn-${char}`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      activeBtn.classList.add('bg-rose-600', 'text-white', 'border-rose-600', 'shadow-md');
    }
  }

  openVideoModal(initialChar = 'A') {
    if (!this.videoModal) this.initVideoModal();
    if (!this.videoModal) return;

    this.videoModal.classList.remove('hidden');
    this.videoModal.classList.add('flex');

    const upper = (initialChar || 'A').toUpperCase();
    this.jumpVideoToLetter(upper);
    sounds.playClick();
  }

  closeVideoModal() {
    if (!this.videoModal) return;
    this.videoModal.classList.add('hidden');
    this.videoModal.classList.remove('flex');
    if (this.localVideo) this.localVideo.pause();
    if (this.ytIframe) this.ytIframe.src = '';
  }

  jumpVideoToLetter(letter) {
    const char = (letter || 'A').toUpperCase();
    const timestamps = window.aslVideoTimestamps || {};
    const span = timestamps[char] || { start: 4.0, end: 7.5 };
    this.highlightLetterButton(char);

    if (this.videoSource === 'local') {
      if (this.localVideo) {
        this.localVideo.currentTime = span.start;
        this.localVideo.play().catch(() => {});
      }
    } else {
      if (this.ytIframe) {
        const startSec = Math.floor(span.start);
        this.ytIframe.src = `https://www.youtube-nocookie.com/embed/tkMg8g8vVUo?start=${startSec}&autoplay=1&rel=0&modestbranding=1`;
      }
    }
  }

  setVideoSource(source) {
    this.videoSource = source;
    const localBtn = document.getElementById('video-src-local-btn');
    const ytBtn = document.getElementById('video-src-yt-btn');
    const timestamps = window.aslVideoTimestamps || {};
    const span = timestamps[this.currentVideoLetter] || { start: 4.0 };

    if (source === 'local') {
      if (localBtn) {
        localBtn.className = 'px-3 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all';
      }
      if (ytBtn) {
        ytBtn.className = 'px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all';
      }
      if (this.ytIframe) {
        this.ytIframe.classList.add('hidden');
        this.ytIframe.src = '';
      }
      if (this.localVideo) {
        this.localVideo.classList.remove('hidden');
        this.localVideo.currentTime = span.start;
        this.localVideo.play().catch(() => {});
      }
    } else {
      if (ytBtn) {
        ytBtn.className = 'px-3 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all';
      }
      if (localBtn) {
        localBtn.className = 'px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all';
      }
      if (this.localVideo) {
        this.localVideo.pause();
        this.localVideo.classList.add('hidden');
      }
      if (this.ytIframe) {
        this.ytIframe.classList.remove('hidden');
        const startSec = Math.floor(span.start);
        this.ytIframe.src = `https://www.youtube-nocookie.com/embed/tkMg8g8vVUo?start=${startSec}&autoplay=1&rel=0&modestbranding=1`;
      }
    }
  }

  setVideoSpeed(speed) {
    if (this.localVideo) {
      this.localVideo.playbackRate = speed;
    }
    document.querySelectorAll('.speed-btn').forEach(btn => {
      if (parseFloat(btn.dataset.speed) === speed) {
        btn.className = 'speed-btn px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-emerald-600 shadow-sm';
      } else {
        btn.className = 'speed-btn px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900';
      }
    });
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('signcraft_theme', this.theme);
    }
    this.applyTheme();
    sounds.playClick();
  }

  applyTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');

    if (this.theme === 'dark') {
      html.classList.add('dark');
      if (themeIcon) {
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />`;
      }
    } else {
      html.classList.remove('dark');
      if (themeIcon) {
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`;
      }
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    sounds.enabled = this.soundEnabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('signcraft_sound', this.soundEnabled.toString());
    }
    this.updateSoundIcon();
    if (this.soundEnabled) sounds.playClick();
  }

  initSounds() {
    sounds.enabled = this.soundEnabled;
    this.updateSoundIcon();
  }

  updateSoundIcon() {
    const soundIcon = document.getElementById('sound-icon');
    if (!soundIcon) return;
    if (this.soundEnabled) {
      soundIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />`;
    } else {
      soundIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />`;
    }
  }
}

// Global App Instance
window.App = App;
const app = new App();
window.app = app;
window.openPracticeForSign = (id) => app.switchToPractice(id);
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
