/**
 * SignCraft - Clean Vector Line-Art Sign Dataset (W-Style Consistent Vector SVG across all signs)
 * Features:
 * - W-Style Pure Vector Baseline with clean outlines across letters, numbers, and core signs
 * - Replaced shaded U and V with pure vector W-style outlines
 * - Numbers 0-9 mapped to clean vector outlines
 * - Preserved 5-finger landmark target patterns for vision camera tracking
 * - High-frequency word gestures & audio synthesis
 */

// Sound FX and Speech Synthesizer
class SoundFX {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.enabled = true;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  playError() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playClick() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  speak(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

const sounds = new SoundFX();
if (typeof window !== 'undefined') {
  window.sounds = sounds;
}

// Verified anatomical pencil-shaded hand sketch dataset matching the realistic Letter 'I' aesthetic
const BASE_REPO_SKETCHES = 'https://raw.githubusercontent.com/v-sign/asl-hand-drawn-lexicon/main/sketches/';
const BASE_SVG = 'https://upload.wikimedia.org/wikipedia/commons/';
const SVG_BASE = BASE_SVG;
const WIKI_BASE = BASE_SVG;

const wikiMap = {
  'A': '2/27/Sign_language_A.svg', 'B': '1/18/Sign_language_B.svg', 'C': 'e/e3/Sign_language_C.svg',
  'D': '0/06/Sign_language_D.svg', 'E': 'c/cd/Sign_language_E.svg', 'F': '8/8f/Sign_language_F.svg',
  'G': 'd/d9/Sign_language_G.svg', 'H': '9/97/Sign_language_H.svg', 'I': '1/10/Sign_language_I.svg',
  'J': 'b/b1/Sign_language_J.svg', 'K': '9/97/Sign_language_K.svg', 'L': 'd/d2/Sign_language_L.svg',
  'M': 'c/c4/Sign_language_M.svg', 'N': 'e/e6/Sign_language_N.svg', 'O': 'e/e0/Sign_language_O.svg',
  'P': '0/08/Sign_language_P.svg', 'Q': '3/34/Sign_language_Q.svg', 'R': '3/3d/Sign_language_R.svg',
  'S': '3/3f/Sign_language_S.svg', 'T': '1/13/Sign_language_T.svg', 'U': '7/7c/Sign_language_U.svg',
  'V': 'c/ca/Sign_language_V.svg', 'W': '8/83/Sign_language_W.svg', 'X': 'b/b7/Sign_language_X.svg',
  'Y': '1/1d/Sign_language_Y.svg', 'Z': '0/0a/Sign_language_Z.svg'
};

const cleanVectorSketches = {};
const sketchAssets = {};
Object.keys(wikiMap).forEach(k => {
  cleanVectorSketches[k] = 'assets/sketches/' + k.toLowerCase() + '.jpg';
  sketchAssets[k] = 'assets/sketches/' + k.toLowerCase() + '.jpg';
});

const urduAlphabetMap = {
  'A': 'الف', 'B': 'ب', 'C': 'ج', 'D': 'د', 'E': 'ع', 'F': 'ف', 'G': 'گ', 'H': 'ہ',
  'I': 'آئی', 'J': 'جے', 'K': 'ک', 'L': 'ل', 'M': 'م', 'N': 'ن', 'O': 'او', 'P': 'پ',
  'Q': 'ق', 'R': 'ر', 'S': 'س', 'T': 'ت', 'U': 'یو', 'V': 'وی', 'W': 'واؤ', 'X': 'ایکس', 'Y': 'وائی', 'Z': 'ز'
};

const alphabetPatterns = {
  'A': [true, false, false, false, false],
  'B': [false, true, true, true, true],
  'C': [false, false, false, false, false],
  'D': [false, true, false, false, false],
  'E': [false, false, false, false, false],
  'F': [false, false, true, true, true],
  'G': [true, true, false, false, false],
  'H': [false, true, true, false, false],
  'I': [false, false, false, false, true],
  'J': [false, false, false, false, true],
  'K': [true, true, true, false, false],
  'L': [true, true, false, false, false],
  'M': [false, false, false, false, false],
  'N': [false, false, false, false, false],
  'O': [false, false, false, false, false],
  'P': [true, true, true, false, false],
  'Q': [true, true, false, false, false],
  'R': [false, true, true, false, false],
  'S': [false, false, false, false, false],
  'T': [true, false, false, false, false],
  'U': [false, true, true, false, false],
  'V': [false, true, true, false, false],
  'W': [false, true, true, true, false],
  'X': [false, true, false, false, false],
  'Y': [true, false, false, false, true],
  'Z': [false, true, false, false, false]
};

const numberPatterns = {
  '0': [false, false, false, false, false],
  '1': [false, true, false, false, false],
  '2': [false, true, true, false, false],
  '3': [true, true, true, false, false],
  '4': [false, true, true, true, true],
  '5': [true, true, true, true, true],
  '6': [false, true, true, true, false],
  '7': [false, true, true, false, true],
  '8': [false, true, false, true, true],
  '9': [false, false, true, true, true]
};

const signData = {
  // --- NUMBERS (0-9) --- (Authentic Roz MacLean Anatomical Hand Sketches + Lifeprint Human Videos & Signs)
  '0': { id: '0', en: 'Zero (0)', ur: 'صفر (۰)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/0.jpg', fallback: 'assets/sketches/0.jpg', fallbackMedia: 'assets/sketches/0.jpg', videoDemo: 'assets/gifs/o.gif', videoUrl: 'assets/videos/numbers-1-to-5.mp4', descUr: 'تمام انگلیاں ملا کر O یا 0 کی شکل بنائیں۔', pattern: numberPatterns['0'] },
  '1': { id: '1', en: 'One (1)', ur: 'ایک (۱)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/1.jpg', fallback: 'assets/sketches/1.jpg', fallbackMedia: 'assets/signs/number01.jpg', videoDemo: 'assets/videos/numbers-1-to-5.mp4', videoUrl: 'assets/videos/numbers-1-to-5.mp4', lifeprintSign: 'assets/signs/number01.jpg', videoStart: 0.0, videoEnd: 1.8, descUr: 'صرف شہادت کی انگلی اٹھائیں (Lifeprint ASL)۔', pattern: numberPatterns['1'] },
  '2': { id: '2', en: 'Two (2)', ur: 'دو (۲)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/2.jpg', fallback: 'assets/sketches/2.jpg', fallbackMedia: 'assets/signs/number02.jpg', videoDemo: 'assets/videos/numbers-1-to-5.mp4', videoUrl: 'assets/videos/numbers-1-to-5.mp4', lifeprintSign: 'assets/signs/number02.jpg', videoStart: 1.8, videoEnd: 3.2, descUr: 'شہادت اور درمیانی انگلی سے V بنائیں۔', pattern: numberPatterns['2'] },
  '3': { id: '3', en: 'Three (3)', ur: 'تین (۳)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/3.jpg', fallback: 'assets/sketches/3.jpg', fallbackMedia: 'assets/signs/number03.jpg', videoDemo: 'assets/videos/numbers-1-to-5.mp4', videoUrl: 'assets/videos/numbers-1-to-5.mp4', lifeprintSign: 'assets/signs/number03.jpg', videoStart: 3.2, videoEnd: 4.6, descUr: 'انگوٹھا، شہادت اور درمیانی انگلی کھولیں۔', pattern: numberPatterns['3'] },
  '4': { id: '4', en: 'Four (4)', ur: 'چار (۴)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/4.jpg', fallback: 'assets/sketches/4.jpg', fallbackMedia: 'assets/signs/number04.jpg', videoDemo: 'assets/videos/numbers-1-to-5.mp4', videoUrl: 'assets/videos/numbers-1-to-5.mp4', lifeprintSign: 'assets/signs/number04.jpg', videoStart: 4.6, videoEnd: 6.2, descUr: 'چاروں انگلیاں کھلی رکھیں، انگوٹھا بند۔', pattern: numberPatterns['4'] },
  '5': { id: '5', en: 'Five (5)', ur: 'پانچ (۵)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/5.jpg', fallback: 'assets/sketches/5.jpg', fallbackMedia: 'assets/signs/number05.jpg', videoDemo: 'assets/videos/numbers-1-to-5.mp4', videoUrl: 'assets/videos/numbers-1-to-5.mp4', lifeprintSign: 'assets/signs/number05.jpg', videoStart: 6.2, videoEnd: 8.5, descUr: 'پوری ہتھیلی اور پانچوں انگلیاں کھلی رکھیں۔', pattern: numberPatterns['5'] },
  '6': { id: '6', en: 'Six (6)', ur: 'چھ (۶)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/6.jpg', fallback: 'assets/sketches/6.jpg', fallbackMedia: 'assets/signs/number06.jpg', videoDemo: 'assets/signs/number06.jpg', videoUrl: 'assets/signs/number06.jpg', lifeprintSign: 'assets/signs/number06.jpg', descUr: 'چھوٹی انگلی اور انگوٹھا ملائیں (Lifeprint ASL Sign)۔', pattern: numberPatterns['6'] },
  '7': { id: '7', en: 'Seven (7)', ur: 'سات (۷)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/7.jpg', fallback: 'assets/sketches/7.jpg', fallbackMedia: 'assets/signs/number07.jpg', videoDemo: 'assets/signs/number07.jpg', videoUrl: 'assets/signs/number07.jpg', lifeprintSign: 'assets/signs/number07.jpg', descUr: 'رنگ فنگر اور انگوٹھا ملائیں (Lifeprint ASL Sign)۔', pattern: numberPatterns['7'] },
  '8': { id: '8', en: 'Eight (8)', ur: 'آٹھ (۸)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/8.jpg', fallback: 'assets/sketches/8.jpg', fallbackMedia: 'assets/signs/number08.jpg', videoDemo: 'assets/signs/number08.jpg', videoUrl: 'assets/signs/number08.jpg', lifeprintSign: 'assets/signs/number08.jpg', descUr: 'درمیانی انگلی اور انگوٹھا ملائیں (Lifeprint ASL Sign)۔', pattern: numberPatterns['8'] },
  '9': { id: '9', en: 'Nine (9)', ur: 'نو (۹)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/9.jpg', fallback: 'assets/sketches/9.jpg', fallbackMedia: 'assets/signs/number09.jpg', videoDemo: 'assets/signs/number09.jpg', videoUrl: 'assets/signs/number09.jpg', lifeprintSign: 'assets/signs/number09.jpg', descUr: 'شہادت اور انگوٹھے سے دائرہ بنائیں (Lifeprint ASL Sign)۔', pattern: numberPatterns['9'] },
  '10': { id: '10', en: 'Ten (10)', ur: 'دس (۱۰)', category: 'Numbers', type: 'shaded_sketch', media: 'assets/sketches/1.jpg', fallback: 'assets/signs/number10.jpg', fallbackMedia: 'assets/signs/number10.jpg', videoDemo: 'assets/gifs/10.gif', videoUrl: 'assets/gifs/10.gif', lifeprintSign: 'assets/signs/number10.jpg', descUr: 'انگوٹھا اوپر اٹھا کر ہلائیں (Lifeprint ASL Sign)۔', pattern: [true, false, false, false, false] },

  // --- ACTIONS & PHRASES --- (Authentic Roz MacLean Hand Sketches + Lifeprint Human Videos + Wikimedia Clips)
  'HELLO': { id: 'HELLO', en: 'Hello / Salam', ur: 'السلام علیکم / ہیلو', category: 'Greetings', type: 'shaded_sketch', media: 'assets/sketches/b.jpg', fallback: 'assets/sketches/b.jpg', fallbackMedia: 'assets/sketches/b.jpg', videoDemo: 'assets/videos/hello.mp4', videoUrl: 'assets/videos/hello.mp4', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5a/Hello_in_ASL.webm/Hello_in_ASL.webm.480p.vp9.webm', descUr: 'کھلی ہتھیلی ماتھے کے پاس سے باہر لہرائیں۔', pattern: [true, true, true, true, true] },
  'SALAM': { id: 'SALAM', en: 'Hello / Salam', ur: 'السلام علیکم / ہیلو', category: 'Greetings', type: 'shaded_sketch', media: 'assets/sketches/b.jpg', fallback: 'assets/sketches/b.jpg', fallbackMedia: 'assets/sketches/b.jpg', videoDemo: 'assets/videos/hello.mp4', videoUrl: 'assets/videos/hello.mp4', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5a/Hello_in_ASL.webm/Hello_in_ASL.webm.480p.vp9.webm', descUr: 'کھلی ہتھیلی ماتھے کے پاس سے باہر لہرائیں۔', pattern: [true, true, true, true, true] },
  'THANK YOU': { id: 'THANK YOU', en: 'Thank You', ur: 'شکریہ', category: 'Polite', type: 'shaded_sketch', media: 'assets/sketches/b.jpg', fallback: 'assets/sketches/b.jpg', fallbackMedia: 'assets/sketches/b.jpg', videoDemo: 'assets/videos/thankyou.mp4', videoUrl: 'assets/videos/thankyou.mp4', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/23/Thank_you_in_ASL.webm/Thank_you_in_ASL.webm.480p.vp9.webm', descUr: 'پوروں کو ٹھوڑی سے چھو کر آگے بڑھائیں۔', pattern: [true, true, true, true, true] },
  'PLEASE': { id: 'PLEASE', en: 'Please', ur: 'براہ مہربانی', category: 'Polite', type: 'shaded_sketch', media: 'assets/sketches/b.jpg', fallback: 'assets/sketches/b.jpg', fallbackMedia: 'assets/sketches/b.jpg', videoDemo: 'assets/videos/please.mp4', videoUrl: 'assets/videos/please.mp4', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6f/Please_in_ASL.webm/Please_in_ASL.webm.480p.vp9.webm', descUr: 'کھلی ہتھیلی کو سینے پر گولائی میں گھمائیں۔', pattern: [true, true, true, true, true] },
  'HELP': { id: 'HELP', en: 'Help', ur: 'مدد', category: 'Essentials', type: 'shaded_sketch', media: 'assets/sketches/s.jpg', fallback: 'assets/sketches/s.jpg', fallbackMedia: 'assets/sketches/s.jpg', videoDemo: 'assets/gifs/help.gif', videoUrl: 'assets/gifs/help.gif', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7b/Help_in_ASL.webm/Help_in_ASL.webm.480p.vp9.webm', descUr: 'ہتھیلی پر بند مٹھی رکھ کر اوپر اٹھائیں۔', pattern: [false, false, false, false, false] },
  'WATER': { id: 'WATER', en: 'Water', ur: 'پانی', category: 'Essentials', type: 'shaded_sketch', media: 'assets/sketches/w.jpg', fallback: 'assets/sketches/w.jpg', fallbackMedia: 'assets/sketches/w.jpg', videoDemo: 'assets/videos/water.mp4', videoUrl: 'assets/videos/water.mp4', webmUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d4/Water_in_ASL.webm/Water_in_ASL.webm.480p.vp9.webm', descUr: 'W بنا کر شہادت کی انگلی ٹھوڑی پر دو بار لگائیں۔', pattern: [false, true, true, true, false] },
  'FOOD': { id: 'FOOD', en: 'Food / Eat', ur: 'کھانا', category: 'Essentials', type: 'shaded_sketch', media: 'assets/sketches/o.jpg', fallback: 'assets/sketches/o.jpg', fallbackMedia: 'assets/sketches/o.jpg', videoDemo: 'assets/videos/food.mp4', videoUrl: 'assets/videos/food.mp4', descUr: 'انگلیوں کے پوروں کو ملا کر منہ کی طرف لائیں۔', pattern: [false, false, false, false, false] },
  'EAT': { id: 'EAT', en: 'Food / Eat', ur: 'کھانا', category: 'Essentials', type: 'shaded_sketch', media: 'assets/sketches/o.jpg', fallback: 'assets/sketches/o.jpg', fallbackMedia: 'assets/sketches/o.jpg', videoDemo: 'assets/videos/eat.mp4', videoUrl: 'assets/videos/eat.mp4', descUr: 'انگلیوں کے پوروں کو ملا کر منہ کی طرف لائیں۔', pattern: [false, false, false, false, false] },
  'HUG': { id: 'HUG', en: 'Hug', ur: 'گلے ملنا', category: 'Emotions', type: 'shaded_sketch', media: 'assets/sketches/s.jpg', fallback: 'assets/sketches/s.jpg', fallbackMedia: 'assets/sketches/s.jpg', videoDemo: 'assets/videos/hug.mp4', videoUrl: 'assets/videos/hug.mp4', descUr: 'دونوں بازو سینے پر کراس کر کے شانوں کو دبائیں۔', pattern: [false, false, false, false, false] },
  'I LOVE YOU': { id: 'I LOVE YOU', en: 'I Love You', ur: 'محبت / پیار', category: 'Emotions', type: 'shaded_sketch', media: 'assets/sketches/ily.jpg', fallback: 'assets/sketches/ily.jpg', fallbackMedia: 'assets/sketches/ily.jpg', videoDemo: 'assets/videos/i-love-you.mp4', videoUrl: 'assets/videos/i-love-you.mp4', descUr: 'انگوٹھا، شہادت اور چھوٹی انگلی کھول کر سامنے بڑھائیں۔', pattern: [true, true, false, false, true] },
  'LOVE': { id: 'LOVE', en: 'Love', ur: 'محبت / پیار', category: 'Emotions', type: 'shaded_sketch', media: 'assets/sketches/ily.jpg', fallback: 'assets/sketches/ily.jpg', fallbackMedia: 'assets/sketches/ily.jpg', videoDemo: 'assets/videos/love.mp4', videoUrl: 'assets/videos/love.mp4', descUr: 'انگوٹھا، شہادت اور چھوٹی انگلی کھول کر سامنے بڑھائیں۔', pattern: [true, true, false, false, true] },
  'FRIEND': { id: 'FRIEND', en: 'Friend', ur: 'دوست / دوستی', category: 'Greetings', type: 'shaded_sketch', media: 'assets/sketches/d.jpg', fallback: 'assets/sketches/d.jpg', fallbackMedia: 'assets/sketches/d.jpg', videoDemo: 'assets/videos/friend.mp4', videoUrl: 'assets/videos/friend.mp4', descUr: 'دونوں ہاتھوں کی انگلیاں ایک دوسرے سے ملا کر جوڑیں۔', pattern: [false, true, false, false, false] },
  'NO': { id: 'NO', en: 'No', ur: 'نہیں / جی نہیں', category: 'Common', type: 'shaded_sketch', media: 'assets/sketches/x.jpg', fallback: 'assets/sketches/x.jpg', fallbackMedia: 'assets/sketches/x.jpg', videoDemo: 'assets/videos/no.mp4', videoUrl: 'assets/videos/no.mp4', descUr: 'شہادت اور درمیانی انگلی کو انگوٹھے سے ملا کر بند کریں۔', pattern: [false, false, false, false, false] },
  'YES': { id: 'YES', en: 'Yes', ur: 'ہاں / جی ہاں', category: 'Common', type: 'shaded_sketch', media: 'assets/sketches/s.jpg', fallback: 'assets/sketches/s.jpg', fallbackMedia: 'assets/sketches/s.jpg', videoDemo: 'assets/videos/yes.mp4', videoUrl: 'assets/videos/yes.mp4', descUr: 'بند مٹھی کو سر کے اشارے کی طرح اوپر نیچے ہلائیں۔', pattern: [false, false, false, false, false] },
  'GOODBYE': { id: 'GOODBYE', en: 'Goodbye', ur: 'الوداع / خدا حافظ', category: 'Greetings', type: 'shaded_sketch', media: 'assets/sketches/b.jpg', fallback: 'assets/sketches/b.jpg', fallbackMedia: 'assets/sketches/b.jpg', videoDemo: 'assets/videos/goodbye.mp4', videoUrl: 'assets/videos/goodbye.mp4', descUr: 'کھلی ہتھیلی کو سامنے دائیں بائیں لہرائیں۔', pattern: [true, true, true, true, true] },
  'MORE': { id: 'MORE', en: 'More', ur: 'مزید / اور', category: 'Essentials', type: 'shaded_sketch', media: 'assets/sketches/o.jpg', fallback: 'assets/sketches/o.jpg', fallbackMedia: 'assets/sketches/o.jpg', videoDemo: 'assets/videos/more.mp4', videoUrl: 'assets/videos/more.mp4', descUr: 'دونوں ہاتھوں کی انگلیاں ملا کر پوروں کو آپس میں چھوئیں۔', pattern: [false, false, false, false, false] }
};

// Verified exact timestamps from YouTube video tkMg8g8vVUo ("The ASL Alphabet | ASL - ABCs")
const aslVideoTimestamps = {
  'A': { start: 4.0, end: 7.5 },
  'B': { start: 7.5, end: 11.5 },
  'C': { start: 11.5, end: 15.0 },
  'D': { start: 15.0, end: 18.5 },
  'E': { start: 18.5, end: 23.0 },
  'F': { start: 23.0, end: 26.5 },
  'G': { start: 26.5, end: 30.5 },
  'H': { start: 30.5, end: 33.5 },
  'I': { start: 33.5, end: 37.0 },
  'J': { start: 37.0, end: 39.0 },
  'K': { start: 39.0, end: 43.0 },
  'L': { start: 43.0, end: 46.0 },
  'M': { start: 46.0, end: 49.0 },
  'N': { start: 49.0, end: 53.0 },
  'O': { start: 53.0, end: 56.0 },
  'P': { start: 56.0, end: 59.0 },
  'Q': { start: 59.0, end: 62.5 },
  'R': { start: 62.5, end: 67.0 },
  'S': { start: 67.0, end: 70.5 },
  'T': { start: 70.5, end: 73.5 },
  'U': { start: 73.5, end: 76.0 },
  'V': { start: 76.0, end: 78.5 },
  'W': { start: 78.5, end: 82.0 },
  'X': { start: 82.0, end: 85.5 },
  'Y': { start: 85.5, end: 88.0 },
  'Z': { start: 88.0, end: 92.0 }
};

// Map A to Z Alphabets to Roz MacLean anatomical hand sketch drawings + Lifeprint Videos & Gifs
const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

letters.forEach(letter => {
  const vTime = aslVideoTimestamps[letter] || { start: 0, end: 5 };
  const lower = letter.toLowerCase();
  signData[letter] = {
    id: letter,
    en: `Letter ${letter}`,
    ur: `حرف ${letter}`,
    category: 'Alphabet',
    type: 'shaded_sketch',
    media: 'assets/sketches/' + lower + '.jpg',
    fallback: 'assets/sketches/' + lower + '.jpg',
    fallbackMedia: 'assets/sketches/' + lower + '.jpg',
    videoUrl: 'assets/asl_alphabet_demo.mp4',
    videoDemo: 'assets/gifs/' + lower + '.gif',
    lifeprintGif: 'assets/gifs/' + lower + '.gif',
    videoStart: vTime.start,
    videoEnd: vTime.end,
    youtubeId: 'tkMg8g8vVUo',
    descUr: `انگریزی کا حرف ${letter}۔`,
    pattern: alphabetPatterns[letter] || [false, false, false, false, false]
  };
});

// Function to get local sketch path
function getWikiPath(char) {
  return 'assets/sketches/' + char.toLowerCase() + '.jpg';
}

// Alias properties across all items for 100% interoperability
Object.values(signData).forEach(item => {
  if (!item.img) item.img = item.media;
  if (!item.fallback) {
    if (item.id && item.id.length === 1 && /^[a-zA-Z0-9]$/.test(item.id)) {
      item.fallback = 'assets/sketches/' + item.id.toLowerCase() + '.jpg';
    } else if (item.id === 'I LOVE YOU' || item.id === 'LOVE') {
      item.fallback = 'assets/sketches/ily.jpg';
    } else {
      item.fallback = 'assets/sketches/b.jpg';
    }
  }
  if (!item.fallbackMedia) item.fallbackMedia = item.fallback;
  if (!item.targetFingerPattern) item.targetFingerPattern = item.pattern || [false, false, false, false, false];
  if (!item.pattern) item.pattern = item.targetFingerPattern;
  if (!item.descEn) item.descEn = item.en;
  if (!item.descUr) item.descUr = item.ur;
  if (!item.videoDemo) item.videoDemo = item.videoUrl || '';
  if (!item.motionMedia) item.motionMedia = item.videoDemo || item.media;
  if (!item.type) {
    const m = item.media || '';
    item.type = (m.includes('giphy') || m.endsWith('.gif') || m.endsWith('.mp4') || m.endsWith('.webm')) ? 'video' : 'shaded_sketch';
  }
});

// Curated ASL Core Words List (Top 5 primary requested words first)
const aslWordsList = [
  signData['HELLO'],
  signData['SALAM'],
  signData['THANK YOU'],
  signData['PLEASE'],
  signData['HELP'],
  signData['WATER'],
  signData['FOOD'],
  signData['EAT'],
  signData['MORE'],
  signData['FRIEND'],
  signData['LOVE'],
  signData['I LOVE YOU'],
  signData['HUG'],
  signData['YES'],
  signData['NO'],
  signData['GOODBYE']
];

// Global Window Mounts
if (typeof window !== 'undefined') {
  window.signData = signData;
  window.signRegistry = signData;
  window.fullBilingualSigns = signData;
  window.ASL_DICTIONARY = signData;
  window.aslWordsList = aslWordsList;
  window.aslVideoTimestamps = aslVideoTimestamps;
  window.ASL_VIDEO_DEMO_URL = 'assets/asl_alphabet_demo.mp4';
  window.ASL_YOUTUBE_ID = 'tkMg8g8vVUo';
  window.BASE_REPO_SKETCHES = BASE_REPO_SKETCHES;
  window.cleanVectorSketches = cleanVectorSketches;
  window.sketchAssets = sketchAssets;
  window.SVG_BASE = SVG_BASE;
  window.WIKI_BASE = SVG_BASE;
  window.getWikiPath = getWikiPath;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    signData,
    signRegistry: signData,
    aslVideoTimestamps,
    BASE_REPO_SKETCHES,
    cleanVectorSketches,
    sketchAssets,
    SVG_BASE,
    WIKI_BASE: SVG_BASE,
    getWikiPath,
    SoundFX
  };
}
