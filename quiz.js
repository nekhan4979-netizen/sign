/**
 * SignCraft - Practice & Quiz Assessment Module
 * Clean Modern Light Theme:
 * - 4 interactive choice cards in clean white with crisp borders and soft drop-shadows
 * - Exclusively reads from window.signData (Zero legacy hardcoded photo URLs)
 * - Slow-motion 0.65x videos and unified anatomical sketch thumbnails
 * - Green/Red flash feedback, score tracking, and persistent question counter
 * - Final assessment results screen with restart capability
 * - Flashcard self-study mode
 */

class QuizEngine {
  constructor() {
    this.quizContainer = document.getElementById('quiz-active-area');
    this.quizResults = document.getElementById('quiz-results-area');
    this.flashcardsArea = document.getElementById('flashcards-area');
    this.quizTabBtn = document.getElementById('tab-quiz-mc');
    this.flashcardsTabBtn = document.getElementById('tab-flashcards');

    // Stats HUD Elements
    this.scoreDisplay = document.getElementById('quiz-score');
    this.streakDisplay = document.getElementById('quiz-streak');
    this.progressFill = document.getElementById('quiz-progress-bar');
    this.questionNumDisplay = document.getElementById('quiz-question-number');

    this.currentMode = 'mc'; // 'mc' or 'flashcard'
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.totalQuestions = 10;
    this.flashcardIndex = 0;
    this.isCardFlipped = false;
    this.flashcardPool = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.generateQuiz();
    this.initFlashcards();
  }

  bindEvents() {
    if (this.quizTabBtn && this.flashcardsTabBtn) {
      this.quizTabBtn.addEventListener('click', () => this.switchMode('mc'));
      this.flashcardsTabBtn.addEventListener('click', () => this.switchMode('flashcard'));
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    if (window.sounds && window.sounds.playClick) window.sounds.playClick();

    if (mode === 'mc') {
      this.quizTabBtn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/25';
      this.flashcardsTabBtn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-slate-100 text-slate-600 hover:bg-slate-200';
      if (this.quizContainer) this.quizContainer.classList.remove('hidden');
      if (this.flashcardsArea) this.flashcardsArea.classList.add('hidden');
      if (this.quizResults) this.quizResults.classList.add('hidden');
    } else {
      this.flashcardsTabBtn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/25';
      this.quizTabBtn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-slate-100 text-slate-600 hover:bg-slate-200';
      if (this.quizContainer) this.quizContainer.classList.add('hidden');
      if (this.quizResults) this.quizResults.classList.add('hidden');
      if (this.flashcardsArea) this.flashcardsArea.classList.remove('hidden');
      this.renderFlashcard();
    }
  }

  generateQuiz() {
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.updateStatsUI();

    if (this.quizResults) this.quizResults.classList.add('hidden');
    if (this.quizContainer) this.quizContainer.classList.remove('hidden');

    // Read exclusively from window.signData
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const allSigns = Object.values(registry);

    if (allSigns.length === 0) return;

    // Deduplicate by id so choices are clean and distinct
    const seen = new Set();
    const uniqueSigns = allSigns.filter(s => {
      if (!s || !s.id || !(s.media || s.img)) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    // Pick 10 random targets from registry
    const shuffled = [...uniqueSigns].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, Math.min(this.totalQuestions, shuffled.length));

    this.questions = selectedTargets.map(target => {
      // Pick 3 random distractors
      const availableDistractors = uniqueSigns.filter(s => s.id !== target.id);
      const distractors = [...availableDistractors]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [...distractors, target].sort(() => 0.5 - Math.random());

      // Guarantee exactly 4 options
      while (options.length < 4 && uniqueSigns.length > 0) {
        const filler = uniqueSigns[Math.floor(Math.random() * uniqueSigns.length)];
        if (!options.some(o => o.id === filler.id)) {
          options.push(filler);
        } else if (uniqueSigns.length < 4) {
          options.push(filler);
        }
      }

      return {
        target: target,
        options: options
      };
    });

    this.renderQuestion();
  }

  renderQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.questions[this.currentIndex];
    this.currentTarget = q.target;
    this.updateStatsUI();

    if (!this.quizContainer) return;

    this.quizContainer.innerHTML = `
      <!-- Question Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold mb-3">
          <span>QUESTION ${this.currentIndex + 1} OF ${this.totalQuestions}</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-black text-slate-900">
          Which sign represents <span class="text-emerald-600 font-mono font-black text-2xl sm:text-3xl px-1">"${q.target.en}"</span>?
        </h3>
        <p class="text-sm font-bold text-emerald-700 mt-1 font-urdu dir-rtl">
          ${q.target.ur} — درست اشارے والی تصویر منتخب کریں
        </p>
      </div>

      <!-- 4 Clickable Human Hand Gesture Option Cards (Clean Light Theme) -->
      <div class="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        ${q.options.map(opt => {
          const mediaUrl = opt.media || opt.img || '';
          const fallbackUrl = opt.fallback || opt.fallbackMedia || (window.sketchAssets && window.sketchAssets[opt.id]) || 'assets/sketches/' + (opt.id || 'a').toLowerCase() + '.jpg';
          const isVideo = opt.type === 'video' || (mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')));
          return `
            <button type="button"
                    data-sign-id="${opt.id}"
                    onclick="quizEngine.selectAnswer('${opt.id}', this)"
                    class="quiz-option-card p-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-between active:scale-95 cursor-pointer group">
              
              <!-- Real Human Hand Thumbnail / Video (No Hardcoded URLs) -->
              <div class="w-full h-32 sm:h-36 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2 pointer-events-none">
                ${
                  isVideo
                    ? `<video src="${mediaUrl}" onerror="this.onerror=null; this.outerHTML='<img src=\\'${fallbackUrl}\\' class=\\'max-h-full max-w-full object-contain filter grayscale contrast-125 drop-shadow-sm rounded-lg\\' alt=\\'${opt.en}\\'>';" autoplay loop muted playsinline class="max-h-full max-w-full object-contain rounded-lg"></video>`
                    : `<img src="${mediaUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}';" class="max-h-full max-w-full object-contain filter grayscale contrast-125 drop-shadow-sm rounded-lg" alt="${opt.en}" />`
                }
              </div>

              <!-- Footer Badge -->
              <div class="w-full text-center mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between px-2 pointer-events-none">
                <span class="text-[10px] font-mono text-slate-400 group-hover:text-emerald-600">CHOICE</span>
                <span class="text-xs font-black text-slate-700 font-mono group-hover:text-emerald-700">Anatomical Sign</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Force slow motion on option videos
    const videos = this.quizContainer.querySelectorAll('video');
    videos.forEach(v => {
      v.playbackRate = 0.65;
      v.onplay = () => { v.playbackRate = 0.65; };
    });
  }

  selectAnswer(chosenId, buttonElement) {
    const q = this.questions[this.currentIndex];
    const isCorrect = (chosenId === q.target.id);

    // Disable all option buttons immediately to prevent duplicate scoring
    const allButtons = this.quizContainer.querySelectorAll('.quiz-option-card');
    allButtons.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('cursor-not-allowed', 'opacity-85');
    });

    if (isCorrect) {
      if (window.sounds && window.sounds.playSuccess) window.sounds.playSuccess();
      this.score += 10;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;

      buttonElement.classList.remove('border-slate-200');
      buttonElement.classList.add('border-emerald-500', 'bg-emerald-50', 'ring-4', 'ring-emerald-400/30', 'scale-105');

      this.updateStatsUI();

      setTimeout(() => {
        this.currentIndex++;
        this.renderQuestion();
      }, 800);
    } else {
      if (window.sounds && window.sounds.playError) window.sounds.playError();
      this.streak = 0;

      buttonElement.classList.remove('border-slate-200');
      buttonElement.classList.add('border-rose-500', 'bg-rose-50', 'ring-4', 'ring-rose-400/30');

      // Highlight the correct answer with emerald green outline
      allButtons.forEach(btn => {
        if (btn.dataset.signId === q.target.id) {
          btn.classList.remove('border-slate-200');
          btn.classList.add('border-emerald-500', 'bg-emerald-50/50');
        }
      });

      this.updateStatsUI();

      setTimeout(() => {
        this.currentIndex++;
        this.renderQuestion();
      }, 1400);
    }
  }

  updateStatsUI() {
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
    if (this.streakDisplay) this.streakDisplay.textContent = this.streak;
    if (this.questionNumDisplay) {
      this.questionNumDisplay.textContent = `${Math.min(this.currentIndex + 1, this.totalQuestions)} / ${this.totalQuestions}`;
    }
    if (this.progressFill) {
      const pct = (this.currentIndex / this.totalQuestions) * 100;
      this.progressFill.style.width = `${pct}%`;
    }
  }

  finishQuiz() {
    if (!this.quizContainer || !this.quizResults) return;

    this.quizContainer.classList.add('hidden');
    this.quizResults.classList.remove('hidden');

    const pct = Math.round((this.score / (this.totalQuestions * 10)) * 100);
    const passed = pct >= 70;

    this.quizResults.innerHTML = `
      <div class="text-center py-8">
        <div class="inline-flex p-5 rounded-3xl ${passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'} mb-4 shadow-sm">
          <span class="text-5xl">${passed ? '🏆' : '🎯'}</span>
        </div>

        <h3 class="text-3xl font-black text-slate-900 mb-2">
          ${passed ? 'Quiz Completed! شاباش!' : 'Keep Practicing! مزید مشق کریں'}
        </h3>
        
        <p class="text-base text-slate-600 max-w-md mx-auto mb-6">
          You scored <strong class="text-emerald-700">${this.score} points</strong> (${pct}% Accuracy) with a best streak of <strong>${this.bestStreak}</strong>.
        </p>

        <div class="flex items-center justify-center gap-4">
          <button onclick="quizEngine.generateQuiz()"
                  class="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95">
            دوبارہ کھیلیں (Play Again)
          </button>
          <button onclick="app.switchTab('dictionary')"
                  class="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all border border-slate-200">
            ڈکشنری دیکھیں
          </button>
        </div>
      </div>
    `;
  }

  // Flashcards Module with Human Sign Visuals (Strictly reads from window.signData)
  initFlashcards() {
    const registry = (typeof window !== 'undefined' && window.signData) || {};
    const seen = new Set();
    this.flashcardPool = Object.values(registry).filter(s => {
      if (!s || !s.id) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    this.flashcardIndex = 0;
    this.isCardFlipped = false;
  }

  renderFlashcard() {
    if (!this.flashcardsArea) return;
    const current = this.flashcardPool[this.flashcardIndex] || { id: 'A', en: 'Letter A', ur: 'الف', media: '' };
    const mediaUrl = current.media || current.img || '';
    const fallbackUrl = current.fallbackMedia || (window.sketchAssets && window.sketchAssets[current.id]) || 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Sign_language_V.svg';
    const isVideo = current.type === 'video' || (mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm')));

    this.flashcardsArea.innerHTML = `
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 px-2">
          <span>FLASHCARD ${this.flashcardIndex + 1} OF ${this.flashcardPool.length}</span>
          <span class="text-emerald-700 font-bold">HUMAN GESTURE PRACTICE</span>
        </div>

        <!-- Flip Card Viewport (Clean Light Theme) -->
        <div onclick="quizEngine.flipCard()"
             class="cursor-pointer select-none relative w-full h-[380px] rounded-3xl bg-white border border-slate-200 hover:border-emerald-500/50 p-6 flex flex-col justify-between items-center shadow-xl transition-all group">
          
          <!-- Front State (Human Sign Media) -->
          <div id="flashcard-front" class="${this.isCardFlipped ? 'hidden' : 'flex'} flex-col items-center justify-between w-full h-full">
            <div class="flex items-center justify-between w-full">
              <span class="text-[10px] font-mono font-bold text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                WHAT SIGN IS THIS?
              </span>
              <span class="text-xs text-slate-400">Click to flip 🔄</span>
            </div>

            <div class="w-52 h-52 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 my-auto shadow-inner overflow-hidden">
              ${
                isVideo
                  ? `<video src="${mediaUrl}" onerror="this.onerror=null; this.outerHTML='<img src=\\'${fallbackUrl}\\' class=\\'max-h-full max-w-full object-contain drop-shadow-sm rounded-xl\\' alt=\\'${current.en}\\'>';" autoplay loop muted playsinline class="max-h-full max-w-full object-contain drop-shadow-sm rounded-xl"></video>`
                  : `<img src="${mediaUrl}" onerror="this.onerror=null; this.src='${fallbackUrl}';" class="max-h-full max-w-full object-contain filter grayscale contrast-125 drop-shadow-sm" alt="${current.en}" />`
              }
            </div>

            <span class="text-xs font-urdu text-emerald-700 font-medium">اشارہ پہچان کر کارڈ پر کلک کریں</span>
          </div>

          <!-- Back State (Revealed Answer) -->
          <div id="flashcard-back" class="${this.isCardFlipped ? 'flex' : 'hidden'} flex-col items-center justify-between w-full h-full">
            <div class="flex items-center justify-between w-full">
              <span class="text-[10px] font-mono font-bold text-teal-700 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                ANSWER REVEALED
              </span>
              <span class="text-xs text-slate-400">Click to flip 🔄</span>
            </div>

            <div class="flex flex-col items-center justify-center my-auto text-center">
              <span class="font-mono text-4xl font-black text-slate-900 drop-shadow-sm mb-2">${current.en}</span>
              <span class="text-2xl font-bold text-emerald-700 font-urdu dir-rtl mb-2">${current.ur}</span>
              ${current.descUr ? `<p class="text-xs text-slate-600 font-urdu dir-rtl max-w-xs mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">${current.descUr}</p>` : ''}
            </div>

            <span class="text-xs text-slate-400 font-sans">Click to flip back</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between gap-3 mt-6">
          <button onclick="quizEngine.prevFlashcard()" class="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>

          <button onclick="quizEngine.nextFlashcard()" class="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2">
            <span>اگلا اشارہ (Next Sign)</span>
            <span>→</span>
          </button>

          <button onclick="quizEngine.nextFlashcard()" class="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;

    const v = this.flashcardsArea.querySelector('video');
    if (v) {
      v.playbackRate = 0.65;
      v.onplay = () => { v.playbackRate = 0.65; };
    }
  }

  flipCard() {
    this.isCardFlipped = !this.isCardFlipped;
    if (window.sounds && window.sounds.playClick) window.sounds.playClick();
    this.renderFlashcard();
  }

  nextFlashcard() {
    this.flashcardIndex = (this.flashcardIndex + 1) % this.flashcardPool.length;
    this.isCardFlipped = false;
    if (window.sounds && window.sounds.playClick) window.sounds.playClick();
    this.renderFlashcard();
  }

  prevFlashcard() {
    this.flashcardIndex = (this.flashcardIndex - 1 + this.flashcardPool.length) % this.flashcardPool.length;
    this.isCardFlipped = false;
    if (window.sounds && window.sounds.playClick) window.sounds.playClick();
    this.renderFlashcard();
  }
}

// Global Registration
if (typeof window !== 'undefined') {
  window.QuizEngine = QuizEngine;
  const initQuiz = () => {
    if (!window.quizEngine) {
      window.quizEngine = new QuizEngine();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
  } else {
    initQuiz();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizEngine };
}
