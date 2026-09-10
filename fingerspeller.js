/**
 * SignCraft - Clean White Theme Slow-Motion Human Video Player & Text Translator
 * Features:
 * - Direct whole-word gesture interceptor (e.g. HUG, LOVE, FRIEND, FOOD, WATER, HELP, HELLO, THANK YOU)
 * - NEVER decomposes recognized vocabulary words into individual letters
 * - Multi-word phrase sequencing support (e.g. "HELLO FRIEND")
 * - 0.65x slow-motion playback rate for human demonstration videos
 * - Letter-by-letter fallback only for unrecognized names or arbitrary text
 * - Pure white card UI container (slate-50 background, white studio cards, charcoal text)
 */

let playbackTimer = null;
let currentPlaybackQueue = [];
let queueIndex = 0;

// High-frequency word dictionary mapping Roman Urdu, Urdu, and English aliases
const phraseDictionary = {
  // HUG
  'HUG': 'HUG',
  'HUGS': 'HUG',
  'EMBRACE': 'HUG',
  'GALE MILNA': 'HUG',
  'GALEY MILNA': 'HUG',
  'گلے ملنا': 'HUG',

  // LOVE / I LOVE YOU
  'LOVE': 'LOVE',
  'I LOVE YOU': 'LOVE',
  'ILY': 'LOVE',
  'PYAR': 'LOVE',
  'MOHABBAT': 'LOVE',
  'MUHABBAT': 'LOVE',
  'محبت': 'LOVE',
  'پیار': 'LOVE',

  // FRIEND
  'FRIEND': 'FRIEND',
  'FRIENDS': 'FRIEND',
  'DOST': 'FRIEND',
  'DOSTI': 'FRIEND',
  'دوست': 'FRIEND',
  'دوستی': 'FRIEND',

  // EAT / FOOD
  'EAT': 'FOOD',
  'FOOD': 'FOOD',
  'EATING': 'FOOD',
  'KHANA': 'FOOD',
  'KHURAK': 'FOOD',
  'KHAN KHAN HA': 'FOOD',
  'کھانا': 'FOOD',
  'خوراک': 'FOOD',

  // WATER
  'WATER': 'WATER',
  'DRINK': 'WATER',
  'PANI': 'WATER',
  'PAANI': 'WATER',
  'پانی': 'WATER',

  // HELP
  'HELP': 'HELP',
  'ASSISTANCE': 'HELP',
  'MADAD': 'HELP',
  'مدد': 'HELP',

  // HELLO / SALAM
  'HELLO': 'HELLO',
  'HI': 'HELLO',
  'HEY': 'HELLO',
  'SALAM': 'HELLO',
  'ASSALAM': 'HELLO',
  'ASSALAMUALAIKUM': 'HELLO',
  'سلام': 'HELLO',
  'السلام علیکم': 'HELLO',

  // THANK YOU
  'THANK YOU': 'THANK YOU',
  'THANKS': 'THANK YOU',
  'SHUKRIYA': 'THANK YOU',
  'شکریہ': 'THANK YOU',

  // PLEASE
  'PLEASE': 'PLEASE',
  'MEHRBANI': 'PLEASE',
  'BARAE MEHRBANI': 'PLEASE',
  'براہِ مہربانی': 'PLEASE',

  // YES
  'YES': 'YES',
  'HAAN': 'YES',
  'JI HAAN': 'YES',
  'ہاں': 'YES',
  'جی ہاں': 'YES',

  // NO
  'NO': 'NO',
  'NAHI': 'NO',
  'NAHEEN': 'NO',
  'JI NAHI': 'NO',
  'نہیں': 'NO',
  'جی نہیں': 'NO',

  // GOODBYE
  'GOODBYE': 'GOODBYE',
  'BYE': 'GOODBYE',
  'ALVIDA': 'GOODBYE',
  'KHUDA HAFIZ': 'GOODBYE',
  'الوداع': 'GOODBYE',
  'خدا حافظ': 'GOODBYE',

  // MORE
  'MORE': 'MORE',
  'AUR': 'MORE',
  'ZIYADA': 'MORE',
  'مزید': 'MORE',
  'اور': 'MORE'
};

function normalizeSignInput(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[.,/#!$%^&*;:{}=_~()؟۔،"'-]/g, '')
    .replace(/s+/g, ' ');
}

function triggerSignTranslation(textInput) {
  if (!textInput) return;
  const raw = normalizeSignInput(textInput);
  if (!raw) return;

  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }

  const registry = (typeof window !== 'undefined' && (window.signData || window.signRegistry)) || {};

  // 1. FIRST, check if the full input matches a known whole-word gesture or phrase
  const matchedKey = phraseDictionary[raw] || raw;
  if (registry[matchedKey]) {
    currentPlaybackQueue = [matchedKey];
    queueIndex = 0;
    renderSignVisual(matchedKey);
    updateLetterStripUI([matchedKey], 0, true);
    return;
  }

  // 2. SECOND, check multi-word sentence/phrase breakdown
  const words = raw.split(' ').filter(Boolean);
  if (words.length > 1) {
    const queue = [];
    let hasOnlyRecognizedWords = true;

    for (const w of words) {
      const key = phraseDictionary[w] || w;
      if (registry[key]) {
        queue.push({ key: key, isWord: true });
      } else {
        hasOnlyRecognizedWords = false;
        // Unrecognized word -> spell out letter by letter
        for (const char of w.split('')) {
          queue.push({ key: char, isWord: false });
        }
      }
    }

    if (queue.length > 0) {
      currentPlaybackQueue = queue.map(q => q.key);
      queueIndex = 0;
      renderSignVisual(currentPlaybackQueue[queueIndex]);
      updateLetterStripUI(currentPlaybackQueue, queueIndex, hasOnlyRecognizedWords && queue.length === 1);

      playbackTimer = setInterval(() => {
        queueIndex++;
        if (queueIndex >= currentPlaybackQueue.length) {
          clearInterval(playbackTimer);
          playbackTimer = null;
          return;
        }
        renderSignVisual(currentPlaybackQueue[queueIndex]);
        updateLetterStripUI(currentPlaybackQueue, queueIndex, false);
      }, 1300);
      return;
    }
  }

  // 3. THIRD, fall back to letter-by-letter spelling ONLY for arbitrary codes or unknown names
  currentPlaybackQueue = raw.replace(/\s+/g, '').split('');
  queueIndex = 0;
  if (currentPlaybackQueue.length === 0) return;

  renderSignVisual(currentPlaybackQueue[queueIndex]);
  updateLetterStripUI(currentPlaybackQueue, queueIndex, false);

  playbackTimer = setInterval(() => {
    queueIndex++;
    if (queueIndex >= currentPlaybackQueue.length) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      return;
    }
    renderSignVisual(currentPlaybackQueue[queueIndex]);
    updateLetterStripUI(currentPlaybackQueue, queueIndex, false);
  }, 1300); // Steady 1.3s pace (~1.2s to 1.4s)
}

function updateLetterStripUI(queue, activeIdx, isWholeWord) {
  if (typeof document === 'undefined') return;
  const strip = document.getElementById('speller-letter-strip');
  if (!strip) return;

  const registry = (typeof window !== 'undefined' && (window.signData || window.signRegistry)) || {};

  if (isWholeWord && queue.length === 1) {
    const key = queue[0];
    const item = registry[key] || { en: key, ur: '' };
    strip.innerHTML = `
      <div class="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-mono font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center gap-2">
        <span class="text-base">✨</span>
        <span>${item.en}</span>
        <span class="text-xs text-emerald-200 font-sans" dir="rtl">(${item.ur})</span>
        <span class="text-[10px] uppercase tracking-wider bg-emerald-700/90 px-2 py-0.5 rounded-full font-mono">Whole Gesture</span>
      </div>
    `;
    return;
  }

  strip.innerHTML = queue.map((token, idx) => {
    const isActive = idx === activeIdx;
    const item = registry[token];
    const isWord = item && item.category === 'Phrases';
    return `
      <button onclick="renderSignVisual('${token}')" class="px-3 h-10 rounded-xl font-mono font-bold text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
        isActive 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105 ring-2 ring-emerald-400' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
      }">
        <span>${token}</span>
        ${isWord ? '<span class="text-[9px] text-emerald-200 bg-emerald-800/80 px-1 py-0.2 rounded font-sans">GESTURE</span>' : ''}
      </button>
    `;
  }).join('');
}

function renderSignVisual(key) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('speller-stage-content') || document.querySelector('.stage-viewport');
  const activeLabel = document.getElementById('active-character-label') || document.querySelector('[id*="active-character"]');
  const symbolDisplay = document.getElementById('speller-current-symbol');
  const registry = (typeof window !== 'undefined' && (window.signData || window.signRegistry)) || {};
  const item = (registry && registry[key]) || (registry && registry['HELLO']) || (registry && registry['A']) || {
    id: key || 'HELLO',
    en: key || 'Hello',
    ur: 'السلام علیکم / ہیلو',
    media: 'assets/sketches/i.jpg',
    videoDemo: 'assets/videos/hello.mp4',
    descUr: ''
  };

  if (activeLabel) {
    activeLabel.textContent = `${item.en} (${item.ur})`;
  }
  if (symbolDisplay) {
    symbolDisplay.textContent = item.id;
  }
  if (!container) return;

  const displayMedia = item.videoDemo || item.media || 'assets/sketches/i.jpg';
  const isMp4 = displayMedia.endsWith('.mp4') || displayMedia.endsWith('.webm');
  const isGif = displayMedia.endsWith('.gif');
  const isMotion = isMp4 || isGif;

  container.innerHTML = `
    <div class="w-full h-full flex flex-col items-center justify-between p-4 bg-white rounded-3xl border border-slate-200 shadow-md">
      <div class="w-full flex justify-between items-center mb-2">
        <span class="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
          ${isMotion ? '🎥 HUMAN VIDEO DEMO' : 'ANATOMICAL HAND'}
        </span>
        <span class="text-xs font-black text-slate-700">${item.id}</span>
      </div>

      <div class="flex-1 w-full flex items-center justify-center p-2 min-h-[220px]">
        ${
          isMp4
            ? `<video src="${displayMedia}" autoplay loop muted playsinline class="max-h-52 max-w-full object-contain filter drop-shadow-sm rounded-xl" onerror="this.onerror=null; this.outerHTML='<img src=\\'${item.fallback || 'assets/sketches/' + (item.id || 'i').toLowerCase() + '.jpg'}\\' class=\\'max-h-52 max-w-full object-contain filter drop-shadow-sm rounded-xl\\' alt=\\'${item.en}\\'>';"></video>`
            : `<img src="${displayMedia}" 
                    class="max-h-52 max-w-full object-contain filter drop-shadow-sm rounded-xl" 
                    alt="${item.en}"
                    onerror="this.onerror=null; this.src='${item.fallback || 'assets/sketches/' + (item.id || 'i').toLowerCase() + '.jpg'}';" />`
        }
      </div>

      <div class="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
        <div class="text-slate-900 font-bold text-xs" dir="rtl">${item.descUr || item.ur}</div>
      </div>
    </div>
  `;

  // Apply Slow-Motion to video tag if present
  const vid = container.querySelector('video');
  if (vid) {
    vid.playbackRate = 0.65;
    vid.onplay = () => { vid.playbackRate = 0.65; };
    vid.onloadeddata = () => { vid.playbackRate = 0.65; };
  }
}

// Fingerspeller Class for OO controller compatibility
class Fingerspeller {
  constructor() {
    this.speedMs = 1000;
    this.tokens = [];
    this.currentIndex = 0;
  }

  processInput(text) {
    triggerSignTranslation(text);
    const raw = normalizeSignInput(text);
    const registry = (typeof window !== 'undefined' && (window.signData || window.signRegistry)) || {};
    const matchedKey = phraseDictionary[raw] || raw;

    if (registry && registry[matchedKey]) {
      const s = registry[matchedKey];
      this.tokens = [{
        type: s.type || 'word',
        char: s.id,
        en: s.en,
        ur: s.ur,
        img: s.media || s.img,
        media: s.media || s.img
      }];
    } else {
      this.tokens = raw.split('').filter(c => c !== ' ').map(ch => {
        const sign = (registry && registry[ch]) || { id: ch, en: ch, ur: ch, img: '', media: '' };
        return {
          type: 'letter',
          char: ch,
          en: sign.en,
          ur: sign.ur,
          img: sign.media || sign.img,
          media: sign.media || sign.img
        };
      });
    }
  }

  loadPreset(text) {
    if (typeof document !== 'undefined') {
      const input = document.getElementById('speller-input');
      if (input) input.value = text;
      const sentInput = document.getElementById('sentence-input');
      if (sentInput) sentInput.value = text;
    }
    triggerSignTranslation(text);
  }

  play() {
    if (typeof document !== 'undefined') {
      const input = document.getElementById('speller-input');
      if (input) triggerSignTranslation(input.value);
    }
  }
}

// Bind Buttons & Inputs
function initFingerspellerDOM() {
  const centerInput = document.getElementById('speller-input') || document.querySelector('input[placeholder*="LETTERS"]');
  const playBtn = document.getElementById('speller-play-btn') || document.querySelector('button.bg-emerald-500');
  const translatePlayBtn = document.getElementById('translate-play-btn');
  const sentenceInput = document.getElementById('sentence-input');

  const executeCenterTranslation = () => {
    if (centerInput && centerInput.value) {
      if (typeof window !== 'undefined' && window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('speller');
      }
      triggerSignTranslation(centerInput.value);
    }
  };

  const executeTopTranslation = () => {
    if (sentenceInput && sentenceInput.value) {
      if (typeof window !== 'undefined' && window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('speller');
      }
      triggerSignTranslation(sentenceInput.value);
    }
  };

  if (playBtn) {
    playBtn.onclick = executeCenterTranslation;
  }
  if (centerInput) {
    centerInput.onkeypress = (e) => {
      if (e.key === 'Enter') executeCenterTranslation();
    };
  }

  if (translatePlayBtn) {
    translatePlayBtn.onclick = executeTopTranslation;
  }
  if (sentenceInput) {
    sentenceInput.onkeypress = (e) => {
      if (e.key === 'Enter') executeTopTranslation();
    };
  }

  // Quick word pills
  if (typeof document !== 'undefined' && document.querySelectorAll) {
    document.querySelectorAll('[data-quick-word]').forEach(el => {
      el.addEventListener('click', () => {
        const w = el.getAttribute('data-quick-word');
        if (centerInput) centerInput.value = w;
        if (sentenceInput) sentenceInput.value = w;
        triggerSignTranslation(w);
      });
    });
  }

  // Default demonstration
  renderSignVisual('HELLO');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFingerspellerDOM);
  } else {
    initFingerspellerDOM();
  }
}

// Global Exports
if (typeof window !== 'undefined') {
  window.phraseDictionary = phraseDictionary;
  window.triggerSignTranslation = triggerSignTranslation;
  window.renderSignVisual = renderSignVisual;
  window.Fingerspeller = Fingerspeller;
  window.fingerspeller = new Fingerspeller();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { phraseDictionary, triggerSignTranslation, renderSignVisual, Fingerspeller };
}
