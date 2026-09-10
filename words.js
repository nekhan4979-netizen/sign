/**
 * SignCraft - ASL Words & Video Clips Studio (الفاظ ویڈیو اسٹوڈیو)
 * Features:
 * - Dedicated ASL Words Theater showcasing authentic video clips
 * - Multi-source fallback: User's requested Wikimedia WebM -> Local Lifeprint MP4/GIF -> Pencil Sketch
 * - Slow-motion speed controls (0.5x, 0.75x, 1.0x) and seamless auto-loop
 * - Bilingual Urdu & English text-to-speech audio pronunciation
 * - Category filter tabs & instant live search
 * - Interactive sentence / phrase sequencing
 */

class WordsStudio {
  constructor() {
    this.words = (typeof window !== 'undefined' && window.aslWordsList) || [];
    this.activeWordId = 'HELLO';
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.playbackRate = 0.75;
    this.isLooping = true;
    this.currentView = 'video'; // 'video' or 'sketch'
    this.sequenceQueue = [];
    this.isSequencePlaying = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderWordsGrid();
    this.selectWord('HELLO');
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('words-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderWordsGrid();
      });
    }

    // Category filter buttons
    const filterBtns = document.querySelectorAll('.words-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category || 'all';
        this.setCategory(cat);
      });
    });

    // Speed buttons
    const speedBtns = document.querySelectorAll('.words-speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed || '1.0');
        this.setSpeed(speed);
      });
    });

    // Loop checkbox
    const loopToggle = document.getElementById('words-loop-toggle');
    if (loopToggle) {
      loopToggle.addEventListener('change', (e) => {
        this.isLooping = e.target.checked;
        const video = document.getElementById('words-theater-video');
        if (video) video.loop = this.isLooping;
      });
    }

    // View toggle buttons (Video vs Sketch)
    const viewVideoBtn = document.getElementById('words-view-video-btn');
    const viewSketchBtn = document.getElementById('words-view-sketch-btn');
    if (viewVideoBtn && viewSketchBtn) {
      viewVideoBtn.addEventListener('click', () => this.switchView('video'));
      viewSketchBtn.addEventListener('click', () => this.switchView('sketch'));
    }

    // Audio pronounce button
    const speakBtn = document.getElementById('words-speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        this.speakActiveWord();
      });
    }
  }

  setCategory(category) {
    this.currentCategory = category;
    const filterBtns = document.querySelectorAll('.words-filter-btn');
    filterBtns.forEach(btn => {
      const match = (btn.dataset.category || 'all') === category;
      if (match) {
        btn.className = 'words-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/20';
      } else {
        btn.className = 'words-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200';
      }
    });
    this.renderWordsGrid();
  }

  setSpeed(speed) {
    this.playbackRate = speed;
    const speedBtns = document.querySelectorAll('.words-speed-btn');
    speedBtns.forEach(btn => {
      const btnSpeed = parseFloat(btn.dataset.speed || '1.0');
      if (btnSpeed === speed) {
        btn.className = 'words-speed-btn px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm';
      } else {
        btn.className = 'words-speed-btn px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    });

    const video = document.getElementById('words-theater-video');
    if (video) {
      video.playbackRate = speed;
    }
  }

  switchView(view) {
    this.currentView = view;
    const videoBtn = document.getElementById('words-view-video-btn');
    const sketchBtn = document.getElementById('words-view-sketch-btn');

    if (view === 'video') {
      if (videoBtn) videoBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm';
      if (sketchBtn) sketchBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
    } else {
      if (sketchBtn) sketchBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm';
      if (videoBtn) videoBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
    }

    this.updateTheaterMedia();
  }

  getWordData(id) {
    if (window.signData && window.signData[id]) {
      return window.signData[id];
    }
    return this.words.find(w => w.id === id) || this.words[0];
  }

  selectWord(id) {
    this.activeWordId = id;
    const word = this.getWordData(id);
    if (!word) return;

    // Update active word titles & descriptions
    const enLabel = document.getElementById('words-theater-title-en');
    const urLabel = document.getElementById('words-theater-title-ur');
    const descLabel = document.getElementById('words-theater-desc-ur');
    const catBadge = document.getElementById('words-theater-category');

    if (enLabel) enLabel.textContent = word.en || word.id;
    if (urLabel) urLabel.textContent = word.ur || '';
    if (descLabel) descLabel.textContent = word.descUr || 'اس لفظ کا معیاری اشارہ دیکھیں۔';
    if (catBadge) catBadge.textContent = word.category || 'Core Word';

    this.updateTheaterMedia();

    // Highlight selected card in grid
    const cards = document.querySelectorAll('.word-card-item');
    cards.forEach(card => {
      if (card.dataset.wordId === id) {
        card.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-400/30', 'bg-emerald-50/20');
        card.classList.remove('border-slate-200');
      } else {
        card.classList.remove('border-emerald-500', 'ring-2', 'ring-emerald-400/30', 'bg-emerald-50/20');
        card.classList.add('border-slate-200');
      }
    });

    if (window.sounds && window.sounds.playClick) {
      window.sounds.playClick();
    }
  }

  updateTheaterMedia() {
    const stage = document.getElementById('words-theater-stage');
    if (!stage) return;

    const word = this.getWordData(this.activeWordId);
    if (!word) return;

    const webmUrl = word.webmUrl || '';
    const videoDemo = word.videoDemo || word.videoUrl || '';
    const sketchUrl = word.media || word.fallback || 'assets/sketches/b.jpg';
    const isGif = videoDemo.endsWith('.gif');
    const isMp4 = videoDemo.endsWith('.mp4');

    if (this.currentView === 'sketch') {
      stage.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-4">
          <img src="${sketchUrl}" 
               alt="${word.en}" 
               class="max-h-72 max-w-full object-contain filter grayscale contrast-125 drop-shadow-md rounded-2xl" />
          <span class="mt-2 text-xs font-mono text-slate-400">✏️ Anatomical Pen Sketch by Roz MacLean</span>
        </div>
      `;
      return;
    }

    if (isGif) {
      stage.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-2 relative">
          <img src="${videoDemo}" 
               onerror="this.onerror=null; this.src='${sketchUrl}';"
               alt="${word.en}" 
               class="max-h-80 max-w-full object-contain rounded-2xl shadow-sm" />
          <span class="absolute bottom-3 right-3 text-[10px] font-mono bg-emerald-700 text-white px-2.5 py-1 rounded-full shadow-md">
            🎥 Lifeprint Demonstration
          </span>
        </div>
      `;
      return;
    }

    // Direct MP4 Video Player with immediate source binding & play
    const primarySrc = videoDemo || webmUrl;
    stage.innerHTML = `
      <div class="w-full h-full flex items-center justify-center relative group">
        <video id="words-theater-video"
               src="${primarySrc}"
               autoplay
               ${this.isLooping ? 'loop' : ''}
               muted
               playsinline
               controls
               preload="auto"
               class="max-h-80 max-w-full object-contain rounded-2xl shadow-lg bg-black">
          Your browser does not support video playback.
        </video>
        <span class="absolute top-3 left-3 text-[10px] font-mono font-bold bg-slate-900/85 text-emerald-400 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
          🎥 ASL Video Clip
        </span>
      </div>
    `;

    const video = document.getElementById('words-theater-video');
    if (video) {
      video.playbackRate = this.playbackRate;
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser policy; user can click native controls
        });
      }

      video.onerror = () => {
        console.warn('Video failed to load:', video.src);
        if (webmUrl && video.src !== webmUrl) {
          video.src = webmUrl;
          video.load();
          video.play().catch(() => {});
        } else {
          stage.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center p-4">
              <img src="${sketchUrl}" alt="${word.en}" class="max-h-72 max-w-full object-contain filter grayscale contrast-125 drop-shadow-md rounded-2xl" />
              <span class="mt-2 text-xs font-mono text-slate-400">✏️ Anatomical Pen Sketch</span>
            </div>
          `;
        }
      };
    }
  }

  speakActiveWord() {
    const word = this.getWordData(this.activeWordId);
    if (!word) return;

    if (window.sounds && window.sounds.speak) {
      window.sounds.speak(word.en || word.id);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.en || word.id);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  renderWordsGrid() {
    const grid = document.getElementById('words-grid-container');
    if (!grid) return;

    const list = this.words.filter(w => {
      if (this.currentCategory !== 'all' && (w.category || '').toLowerCase() !== this.currentCategory.toLowerCase()) {
        return false;
      }
      if (this.searchQuery) {
        const titleEn = (w.en || '').toLowerCase();
        const titleUr = (w.ur || '').toLowerCase();
        const id = (w.id || '').toLowerCase();
        return titleEn.includes(this.searchQuery) || titleUr.includes(this.searchQuery) || id.includes(this.searchQuery);
      }
      return true;
    });

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <p class="text-sm font-bold">کوئی لفظ نہیں ملا (No words found)</p>
        </div>
      `;
      return;
    }

    const priorityWords = ['HELLO', 'SALAM', 'THANK YOU', 'PLEASE', 'HELP', 'WATER'];

    grid.innerHTML = list.map(item => {
      const isSelected = item.id === this.activeWordId;
      const isPriority = priorityWords.includes(item.id);
      const videoSrc = item.videoDemo || item.videoUrl || '';
      const isVideo = videoSrc.endsWith('.mp4');
      const isGif = videoSrc.endsWith('.gif');
      const sketchSrc = item.media || item.fallback || 'assets/sketches/b.jpg';

      return `
        <div class="word-card-item relative p-3 rounded-2xl bg-white border-2 ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-400/30 bg-emerald-50/20' : 'border-slate-200'} hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
             data-word-id="${item.id}"
             onclick="wordsStudio.selectWord('${item.id}')">
          
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isPriority ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
              ${isPriority ? '⭐ USER CLIP' : (item.category || 'Word')}
            </span>
            <span class="text-[11px] font-mono text-slate-400 group-hover:text-emerald-600 font-bold">▶ Play</span>
          </div>

          <div class="w-full h-32 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative pointer-events-none">
            <img src="${sketchSrc}" 
                 loading="lazy" 
                 decoding="async" 
                 onerror="this.onerror=null; this.src='assets/sketches/b.jpg';" 
                 class="max-h-full max-w-full object-contain filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-200" 
                 alt="${item.en}">
            <div class="absolute inset-0 bg-slate-900/10 flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
              <span class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-110 transition-transform">
                ▶
              </span>
            </div>
          </div>

          <div class="mt-3 pt-2 border-t border-slate-100">
            <h4 class="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              <span>${item.en}</span>
              <button type="button" 
                      onclick="event.stopPropagation(); wordsStudio.speakWordCustom('${item.en}');" 
                      title="Listen"
                      class="text-slate-400 hover:text-emerald-600 p-1">
                🔊
              </button>
            </h4>
            <p class="text-xs font-bold text-emerald-700 font-urdu dir-rtl mt-0.5">
              ${item.ur}
            </p>
          </div>
        </div>
      `;
    }).join('');
  }

  speakWordCustom(text) {
    if (window.sounds && window.sounds.speak) {
      window.sounds.speak(text);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  loadPresetSequence(sentence) {
    const parts = sentence.toUpperCase().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;

    this.sequenceQueue = [...parts];
    this.playNextInSequence();
  }

  playNextInSequence() {
    if (this.sequenceQueue.length === 0) {
      this.isSequencePlaying = false;
      return;
    }

    this.isSequencePlaying = true;
    const nextWord = this.sequenceQueue.shift();
    const found = this.words.find(w => w.id === nextWord || (w.en && w.en.toUpperCase().includes(nextWord)));

    if (found) {
      this.selectWord(found.id);
      this.speakWordCustom(found.en || found.id);
    }

    setTimeout(() => {
      if (this.isSequencePlaying) {
        this.playNextInSequence();
      }
    }, 2200);
  }
}

if (typeof window !== 'undefined') {
  window.WordsStudio = WordsStudio;
  const initWords = () => {
    if (!window.wordsStudio) {
      window.wordsStudio = new WordsStudio();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWords);
  } else {
    initWords();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordsStudio };
}
