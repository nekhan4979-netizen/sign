/**
 * SignCraft - Dictionary Visualizer & Unified Gesture Directory
 * Architecture:
 * DATA ARRAY -> FILTER (Category) -> SEARCH (Query) -> PAGINATE/BATCH (12 cards) -> RENDER BATCH -> LAZY LOAD IMAGES
 * 
 * Features:
 * - Desktop: 4 cards per row with 16-18px rounded borders and subtle shadows
 * - Controlled pagination: 12 cards initial batch + [ Load More Signs → ] button + IntersectionObserver infinite scroll
 * - Real lazy loading (loading="lazy", decoding="async", first row eager)
 * - Fixed aspect-ratio image containers with soft gray animated skeleton placeholder
 * - Graceful fallback: "Sign image unavailable" shown on error (zero broken-image icons)
 * - Full search over all sign records regardless of pagination state
 * - Clean category filtering with instant pagination reset
 * - Audio speech, camera practice navigation, and modal inspection preserved
 */

class Visualizer {
  constructor() {
    this.grid = document.getElementById('dictionary-grid');
    this.searchInput = document.getElementById('dictionary-search');
    this.filterButtons = document.querySelectorAll('.category-filter-btn');
    this.loadMoreBtn = document.getElementById('dictionary-load-more-btn');
    this.counterText = document.getElementById('dictionary-counter-text');
    this.sentinel = document.getElementById('dictionary-scroll-sentinel');
    this.modal = document.getElementById('sign-modal');
    this.modalContent = document.getElementById('sign-modal-content');

    this.activeCategory = 'all';
    this.searchQuery = '';
    this.pageSize = 12;
    this.renderedCount = 0;
    this.allCanonicalSigns = [];
    this.filteredSigns = [];
    this.observer = null;

    this.init();
  }

  init() {
    this.initDataset();
    this.bindEvents();
    this.applyFilters();
    this.setupInfiniteScroll();
  }

  // 1. Compile clean canonical dataset from window.signData (Zero duplicates, natural ordering)
  initDataset() {
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const aliases = new Set(['SALAM', 'EAT', 'LOVE']);
    const seen = new Set();
    const result = [];

    // Natural curriculum order: Alphabet (A-Z) -> Numbers (0-9) -> Core Words & Phrases
    const letterOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numberOrder = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const phraseOrder = [
      'HELLO', 'THANK YOU', 'PLEASE', 'HELP', 'WATER', 
      'FOOD', 'MORE', 'FRIEND', 'I LOVE YOU', 'HUG', 
      'YES', 'NO', 'GOODBYE'
    ];

    const addSign = (id) => {
      const s = registry[id];
      if (s && s.id && !seen.has(s.id) && !aliases.has(s.id)) {
        seen.add(s.id);
        result.push(s);
      }
    };

    letterOrder.forEach(addSign);
    numberOrder.forEach(addSign);
    phraseOrder.forEach(addSign);

    // Any remaining unique entries
    Object.values(registry).forEach(s => {
      if (s && s.id && !seen.has(s.id) && !aliases.has(s.id)) {
        seen.add(s.id);
        result.push(s);
      }
    });

    this.allCanonicalSigns = result;
  }

  bindEvents() {
    // 1. Search Bar Listener (Immediate filtering over entire dataset)
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.applyFilters();
      });
    }

    // 2. Category Filter Buttons
    if (this.filterButtons) {
      this.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterButtons.forEach(b => {
            b.className = 'category-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 whitespace-nowrap cursor-pointer';
          });
          btn.className = 'category-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/25 whitespace-nowrap cursor-pointer';

          this.activeCategory = btn.dataset.category || 'all';
          this.applyFilters();
        });
      });
    }

    // 3. Load More Button Listener
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.renderNextBatch();
      });
    }

    // 4. Modal Close on Backdrop Click & ESC Key
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
          this.closeModal();
        }
      });
    }
  }

  // 2. Filter dataset first, then reset pagination and render initial batch of 12
  applyFilters() {
    // Re-verify dataset if signData loaded dynamically
    if (this.allCanonicalSigns.length === 0) {
      this.initDataset();
    }

    let list = [...this.allCanonicalSigns];

    // Category Filtering
    if (this.activeCategory !== 'all') {
      const cat = this.activeCategory.toLowerCase();
      list = list.filter(s => {
        const itemCat = (s.category || '').toLowerCase();
        if (cat === 'alphabet') return itemCat === 'alphabet';
        if (cat === 'number' || cat === 'numbers') return itemCat === 'number' || itemCat === 'numbers';
        if (cat === 'phrase' || cat === 'phrases' || cat === 'greetings') {
          return ['phrase', 'phrases', 'greetings', 'polite', 'emotions', 'common'].includes(itemCat);
        }
        if (cat === 'essentials') {
          return itemCat === 'essentials';
        }
        return itemCat === cat;
      });
    }

    // Search Query Filtering
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(s => {
        const enMatch = (s.en || '').toLowerCase().includes(q);
        const urMatch = (s.ur || '').toLowerCase().includes(q);
        const idMatch = (s.id || '').toLowerCase().includes(q);
        const descMatch = (s.descUr || s.descEn || '').toLowerCase().includes(q);
        return enMatch || urMatch || idMatch || descMatch;
      });
    }

    this.filteredSigns = list;
    this.renderedCount = 0;
    if (this.grid) this.grid.innerHTML = '';

    // Render first batch (12 cards)
    this.renderNextBatch();
  }

  // 3. Batch Rendering: Appends the next 12 cards without duplicating existing cards
  renderNextBatch() {
    if (!this.grid) return;

    const total = this.filteredSigns.length;

    // Zero search results state
    if (total === 0) {
      this.grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <div class="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-3 shadow-sm">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-base font-bold text-slate-800 dark:text-slate-200">کوئی اشارہ نہیں ملا (No signs found)</p>
          <p class="text-xs text-slate-400 mt-1">Try searching for a different keyword or category.</p>
        </div>
      `;
      this.updatePaginationUI(0, 0);
      return;
    }

    const startIndex = this.renderedCount;
    if (startIndex >= total) {
      this.updatePaginationUI(total, total);
      return;
    }

    const endIndex = Math.min(startIndex + this.pageSize, total);
    const batch = this.filteredSigns.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();
    batch.forEach((sign, idx) => {
      const globalIdx = startIndex + idx;
      const isFirstRow = globalIdx < 4;
      const card = this.createCardElement(sign, isFirstRow);
      fragment.appendChild(card);
    });

    this.grid.appendChild(fragment);
    this.renderedCount = endIndex;

    this.updatePaginationUI(this.renderedCount, total);
  }

  // 4. Create Card Element: Fixed aspect-ratio, skeleton placeholder, smooth fade-in, graceful error fallback
  createCardElement(sign, isFirstRow) {
    const signEntry = (window.signData && window.signData[sign.id]) ? window.signData[sign.id] : sign;
    const mediaUrl = signEntry.media || signEntry.img || (window.sketchAssets && window.sketchAssets[sign.id]) || '';
    const safeFallbackUrl = (sign.id.length === 1 && /^[a-zA-Z0-9]$/.test(sign.id))
      ? `assets/sketches/${sign.id.toLowerCase()}.jpg`
      : 'assets/sketches/b.jpg';
    const imageSrc = mediaUrl || safeFallbackUrl;

    const descUr = signEntry.descUr || signEntry.descEn || 'اس اشارے کو کیمرے کے سامنے پریکٹس کریں۔';
    const hasVideo = !!(signEntry.videoDemo || signEntry.videoUrl);

    const card = document.createElement('div');
    card.className = 'dictionary-card h-[410px] flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group cursor-pointer';
    card.setAttribute('data-sign-id', sign.id);

    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      this.openModal(sign.id, hasVideo ? 'video' : 'sketch');
    };

    card.innerHTML = `
      <!-- Card Header: Category Badge & English Title -->
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
          ${signEntry.category || 'Sign'}
        </span>
        <span class="text-sm font-black text-slate-900 dark:text-white font-mono truncate max-w-[130px]" title="${signEntry.en}">
          ${signEntry.en}
        </span>
      </div>

      <!-- Image Wrapper with Fixed Aspect Ratio & Skeleton Placeholder -->
      <div class="image-wrapper relative w-full h-44 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden my-2">
        
        <!-- Animated Soft Gray Skeleton Placeholder -->
        <div class="skeleton-placeholder absolute inset-0 bg-slate-200/80 dark:bg-slate-700/60 animate-pulse flex items-center justify-center">
          <svg class="w-8 h-8 text-slate-400 dark:text-slate-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Real Image: Lazy loaded, async decoding, fades in smoothly on load -->
        <img src="${imageSrc}"
             alt="${signEntry.en}"
             loading="${isFirstRow ? 'eager' : 'lazy'}"
             decoding="async"
             onload="this.classList.remove('opacity-0'); this.previousElementSibling?.remove();"
             onerror="this.style.display='none'; this.previousElementSibling?.remove(); this.nextElementSibling?.classList.remove('hidden');"
             class="w-full h-full object-contain p-2 filter grayscale contrast-125 opacity-0 transition-opacity duration-300 relative z-10" />

        <!-- Graceful Fallback if image genuinely unavailable (Zero browser broken icons) -->
        <div class="hidden unavailable-placeholder absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-50 dark:bg-slate-800 text-slate-400">
          <span class="text-2xl mb-1">📷</span>
          <span class="text-[11px] font-semibold text-slate-500 font-mono">Sign image unavailable</span>
          <span class="text-[10px] text-slate-400 font-urdu dir-rtl">تصویر دستیاب نہیں ہے</span>
        </div>

        ${hasVideo ? `
          <div class="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-lg bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Video Demo</span>
          </div>
        ` : ''}
      </div>

      <!-- Urdu & English Text Labels -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-urdu dir-rtl truncate">
            ${signEntry.ur || signEntry.id}
          </span>
          <span class="text-xs font-mono font-bold text-slate-400">
            ${signEntry.id}
          </span>
        </div>
        <p class="text-xs font-sans text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-urdu dir-rtl min-h-[32px]">
          ${descUr}
        </p>
      </div>

      <!-- Action Buttons Strip: [ Practice ] [ Video ] [ Audio ] -->
      <div class="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        <button type="button"
                onclick="event.stopPropagation(); openPracticeForSign('${sign.id}')"
                class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-1">
          <span>مشق کریں</span>
          <span class="text-[10px] opacity-80">(Practice)</span>
        </button>
        ${hasVideo ? `
          <button type="button"
                  onclick="event.stopPropagation(); visualizer.openModal('${sign.id}', 'video')"
                  title="Watch Video Demonstration"
                  class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 text-xs font-bold transition-all flex items-center justify-center">
            <span>🎥</span>
          </button>
        ` : ''}
        <button type="button"
                onclick="event.stopPropagation(); visualizer.speakSign('${sign.id}')"
                title="Listen Audio Pronunciation"
                class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-700 transition-colors flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  // 5. Update Pagination Counter and Load More Button Visibility
  updatePaginationUI(current, total) {
    if (this.counterText) {
      if (total === 0) {
        this.counterText.textContent = 'No signs to display';
      } else {
        this.counterText.textContent = `Showing ${current} of ${total} signs`;
      }
    }

    if (this.loadMoreBtn) {
      if (current >= total || total === 0) {
        this.loadMoreBtn.classList.add('hidden');
      } else {
        this.loadMoreBtn.classList.remove('hidden');
        const remaining = total - current;
        this.loadMoreBtn.innerHTML = `<span>Load More Signs (${Math.min(remaining, this.pageSize)} more) →</span>`;
      }
    }
  }

  // 6. Optional Non-Intrusive Infinite Scroll (Loads next batch as user approaches bottom)
  setupInfiniteScroll() {
    if (typeof IntersectionObserver === 'undefined') return;
    if (this.observer) this.observer.disconnect();

    const sentinel = document.getElementById('dictionary-scroll-sentinel');
    if (!sentinel) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.renderedCount < this.filteredSigns.length) {
          this.renderNextBatch();
        }
      });
    }, {
      root: null,
      rootMargin: '250px',
      threshold: 0.1
    });

    this.observer.observe(sentinel);
  }

  speakSign(signId) {
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const sign = registry[signId];
    if (sign && window.sounds && window.sounds.speak) {
      window.sounds.speak(sign.en);
    }
  }

  // 7. Interactive Inspection Modal (Video vs Sketch)
  openModal(signId, defaultView = 'video') {
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const sign = registry[signId] || { id: signId, en: signId, ur: signId, media: '' };
    if (!this.modal || !this.modalContent) return;

    this.currentModalSignId = signId;
    this.currentModalView = defaultView;

    const descUr = sign.descUr || sign.descEn || '';
    const videoSrc = sign.videoDemo || sign.videoUrl || '';
    const safeFallbackUrl = (sign.id.length === 1 && /^[a-zA-Z0-9]$/.test(sign.id))
      ? `assets/sketches/${sign.id.toLowerCase()}.jpg`
      : 'assets/sketches/b.jpg';
    const sketchSrc = sign.media || sign.fallback || safeFallbackUrl;
    const hasVideo = !!videoSrc;
    const isMp4 = videoSrc.endsWith('.mp4') || videoSrc.endsWith('.webm');

    const renderViewportContent = (view) => {
      if (view === 'video' && hasVideo) {
        if (isMp4) {
          return `<video id="modal-video-player" src="${videoSrc}" autoplay loop muted playsinline controls class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md"></video>`;
        } else {
          return `<img id="modal-gif-player" src="${videoSrc}" class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md" alt="${sign.en}" />`;
        }
      } else {
        return `<img id="modal-sketch-image" src="${sketchSrc}" class="max-h-full max-w-full object-contain filter grayscale contrast-125 mx-auto drop-shadow-md rounded-xl" alt="${sign.en}" />`;
      }
    };

    this.modalContent.innerHTML = `
      <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        <!-- Close Button -->
        <button onclick="visualizer.closeModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div class="mb-3">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
              ${sign.category || 'Sign Language'}
            </span>
            ${hasVideo ? `
              <span class="text-[10px] font-bold text-rose-700 dark:text-rose-400 font-mono px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
                🎥 Video Demonstration
              </span>
            ` : ''}
          </div>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">${sign.en}</h3>
          <p class="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-urdu dir-rtl">${sign.ur}</p>
        </div>

        <!-- View Switcher Tabs (Video vs Sketch) -->
        <div class="flex items-center gap-2 mb-3">
          ${hasVideo ? `
            <button id="modal-view-tab-video" onclick="visualizer.switchModalView('video', '${sign.id}')"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${defaultView === 'video' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700'}">
              🎥 Human Video Demo
            </button>
          ` : ''}
          <button id="modal-view-tab-sketch" onclick="visualizer.switchModalView('sketch', '${sign.id}')"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${defaultView === 'sketch' || !hasVideo ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
            ✏️ Hand Sketch
          </button>
        </div>

        <!-- Demonstration Viewport -->
        <div id="modal-demonstration-viewport" class="w-full h-72 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-5 p-4">
          ${renderViewportContent(hasVideo ? defaultView : 'sketch')}
        </div>

        <!-- Details -->
        <div class="space-y-3 mb-5">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Gesture Instructions (اردو ہدایت)</span>
            <p class="text-sm text-slate-700 dark:text-slate-200 font-urdu dir-rtl leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">${descUr}</p>
          </div>
          ${sign.descEn ? `
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Kinematic Cue (English)</span>
              <p class="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">${sign.descEn}</p>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="app.switchToPractice('${sign.id}')"
                  class="flex-1 min-w-[130px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm whitespace-nowrap transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 active:scale-95">
            <span>کیمرہ پر مشق کریں</span>
            <span>📹</span>
          </button>
          ${sign.videoStart !== undefined || (window.aslVideoTimestamps && window.aslVideoTimestamps[sign.id]) ? `
            <button onclick="app.openVideoModal('${sign.id}')"
                    class="px-3.5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                    title="Watch 3-Angle Masterclass">
              <span>3-Angles Video</span>
              <span>🎬</span>
            </button>
          ` : ''}
          <button onclick="visualizer.speakSign('${sign.id}')"
                  class="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors flex items-center gap-1 active:scale-95">
            <span>آواز</span>
            <span>🔊</span>
          </button>
        </div>
      </div>
    `;

    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');

    const modalVideo = document.getElementById('modal-video-player');
    if (modalVideo) {
      modalVideo.playbackRate = 0.75;
      if (sign.videoStart !== undefined) {
        modalVideo.currentTime = sign.videoStart;
        modalVideo.ontimeupdate = () => {
          if (sign.videoEnd !== undefined && modalVideo.currentTime >= sign.videoEnd) {
            modalVideo.currentTime = sign.videoStart;
          }
        };
      }
      modalVideo.onplay = () => { modalVideo.playbackRate = 0.75; };
    }
  }

  switchModalView(viewType, signId) {
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const sign = registry[signId];
    if (!sign) return;

    const viewport = document.getElementById('modal-demonstration-viewport');
    const tabVideo = document.getElementById('modal-view-tab-video');
    const tabSketch = document.getElementById('modal-view-tab-sketch');
    if (!viewport) return;

    const videoSrc = sign.videoDemo || sign.videoUrl || '';
    const safeFallbackUrl = (sign.id.length === 1 && /^[a-zA-Z0-9]$/.test(sign.id))
      ? `assets/sketches/${sign.id.toLowerCase()}.jpg`
      : 'assets/sketches/b.jpg';
    const sketchSrc = sign.media || sign.fallback || safeFallbackUrl;
    const isMp4 = videoSrc.endsWith('.mp4') || videoSrc.endsWith('.webm');

    if (viewType === 'video' && videoSrc) {
      if (tabVideo) tabVideo.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-rose-600 text-white shadow-sm';
      if (tabSketch) tabSketch.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-slate-200';
      if (isMp4) {
        viewport.innerHTML = `<video id="modal-video-player" src="${videoSrc}" autoplay loop muted playsinline controls class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md"></video>`;
        const vid = document.getElementById('modal-video-player');
        if (vid) {
          vid.playbackRate = 0.75;
          if (sign.videoStart !== undefined) {
            vid.currentTime = sign.videoStart;
            vid.ontimeupdate = () => {
              if (sign.videoEnd !== undefined && vid.currentTime >= sign.videoEnd) {
                vid.currentTime = sign.videoStart;
              }
            };
          }
        }
      } else {
        viewport.innerHTML = `<img id="modal-gif-player" src="${videoSrc}" class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md" alt="${sign.en}" />`;
      }
    } else {
      if (tabSketch) tabSketch.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow-sm';
      if (tabVideo) tabVideo.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700';
      viewport.innerHTML = `<img id="modal-sketch-image" src="${sketchSrc}" class="max-h-full max-w-full object-contain filter grayscale contrast-125 mx-auto drop-shadow-md rounded-xl" alt="${sign.en}" />`;
    }
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
  }
}

// Global Registration & Practice Switch Handler
function openPracticeForSign(signId) {
  if (typeof window !== 'undefined') {
    if (window.app && typeof window.app.switchToPractice === 'function') {
      window.app.switchToPractice(signId);
    } else if (window.cameraPractice && typeof window.cameraPractice.setTarget === 'function') {
      window.cameraPractice.setTarget(signId);
    }
  }
}

if (typeof window !== 'undefined') {
  window.openPracticeForSign = openPracticeForSign;
  window.Visualizer = Visualizer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Visualizer, openPracticeForSign };
}
