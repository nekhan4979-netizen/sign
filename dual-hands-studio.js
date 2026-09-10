/**
 * SignCraft - Authentic Human Sign Media Engine
 * Replaces synthetic 3D blocks with authentic human video & animation footage.
 * Powers the central stage and interactive inspection modals.
 */

// Universal Helper: Resolve Real Human Sign Media (GIF, MP4, or High-Res Image)
function getHumanSignMedia(signKey) {
  const key = (signKey || 'HELLO').toString().toUpperCase().trim();

  // 0. Check authoritative signRegistry first if available
  const registry = (typeof window !== 'undefined' && (window.signRegistry || window.fullBilingualSigns)) || null;
  if (registry && registry[key] && registry[key].img) {
    const isMp4 = registry[key].img.endsWith('.mp4');
    const isGif = registry[key].img.endsWith('.gif');
    return {
      type: isMp4 ? 'video' : (isGif ? 'gif' : 'img'),
      src: registry[key].img
    };
  }

  // Handle '0' explicitly if registry not yet mounted
  if (key === '0') {
    return {
      type: 'img',
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Sign_language_O.svg'
    };
  }

  // 1. Common Phrases & Greetings with Complete Movement Trajectory
  const phraseMedia = {
    'HELLO': {
      type: 'video',
      src: 'https://www.lifeprint.com/asl101/videos/hi.mp4',
      fallback: 'https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/h.gif'
    },
    'THANK YOU': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/t/thank-you.gif'
    },
    'THANKYOU': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/t/thank-you.gif'
    },
    'HELP': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/h/help.gif'
    },
    'WATER': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/w/water.gif'
    },
    'YES': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/y/yes.gif'
    },
    'NO': {
      type: 'img',
      src: 'https://www.lifeprint.com/asl101/signjpegs/n/no1.jpg'
    },
    'MORE': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/m/more.gif'
    },
    'FRIEND': {
      type: 'gif',
      src: 'https://www.lifeprint.com/asl101/gifs/f/friend.gif'
    },
    'PLEASE': {
      type: 'img',
      src: 'https://www.lifeprint.com/asl101/signjpegs/p/please.jpg'
    },
    'FOOD': {
      type: 'img',
      src: 'https://www.lifeprint.com/asl101/signjpegs/f/food1.jpg'
    }
  };

  if (phraseMedia[key]) {
    return phraseMedia[key];
  }

  // 2. Numbers 0 to 10
  if (/^[0-9]+$/.test(key)) {
    const num = parseInt(key, 10);
    return {
      type: 'img',
      src: `https://www.lifeprint.com/asl101/signjpegs/numbers/${num}.jpg`
    };
  }

  // 3. Letters A-Z (Authentic Human ASL Fingerspelling GIFs)
  if (/^[A-Z]$/.test(key)) {
    return {
      type: 'gif',
      src: `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${key.toLowerCase()}.gif`
    };
  }

  // Fallback: extract first letter
  const first = key.charAt(0) || 'A';
  return {
    type: 'gif',
    src: `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${first.toLowerCase()}.gif`
  };
}

class AuthenticHumanMediaStudio {
  constructor(containerId = 'speller-stage-content') {
    this.containerId = containerId;
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.currentSign = 'HELLO';

    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('relative', 'overflow-hidden');
    this.playSign('HELLO');
  }

  playSign(signId) {
    if (!this.container) return;
    const cleanId = (signId || 'HELLO').toString().toUpperCase().trim();
    this.currentSign = cleanId;

    const media = getHumanSignMedia(cleanId);
    const registry = window.signRegistry || window.fullBilingualSigns;
    const signData = registry ? registry[cleanId] : null;

    const titleEn = signData ? signData.en : cleanId;
    const titleUr = signData ? signData.ur : '';
    const descUr = signData ? (signData.descUr || signData.stepsUr || '') : '';

    this.container.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-between p-4 bg-white shadow-xl border border-slate-200 rounded-3xl overflow-hidden group">
        <!-- Top Status Bar -->
        <div class="flex items-center justify-between w-full z-10">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${media.type === 'video' ? '0.65x SLOW MOTION' : 'HUMAN SIGN STUDIO'}</span>
          </div>
          <span class="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
            ${cleanId}
          </span>
        </div>

        <!-- Central Authentic Human Footage Viewport -->
        <div class="relative w-full flex-1 flex items-center justify-center overflow-hidden my-2 bg-slate-50/80 rounded-2xl p-2">
          ${
            media.type === 'video'
              ? `<video src="${media.src}" autoplay loop muted playsinline class="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md"></video>`
              : `<img src="${media.src}" class="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md" alt="Human Sign ${cleanId}" onerror="this.onerror=null; this.src='https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${(cleanId[0]||'a').toLowerCase()}.gif';">`
          }
        </div>

        <!-- Lower Subtitle & Urdu Description Bar -->
        <div class="w-full z-10 flex flex-col items-center text-center bg-slate-50 border border-slate-200/80 rounded-2xl py-2 px-3 shadow-sm">
          <div class="flex items-center justify-center gap-2">
            <span class="font-black text-slate-800 text-sm font-mono">${titleEn}</span>
            <span class="text-emerald-700 font-bold text-sm font-urdu dir-rtl">${titleUr}</span>
          </div>
          ${descUr ? `<p class="text-[11px] text-slate-600 font-urdu dir-rtl truncate mt-0.5 max-w-xs">${descUr}</p>` : ''}
        </div>
      </div>
    `;

    const videoEl = this.container.querySelector('video');
    if (videoEl) {
      videoEl.playbackRate = 0.65;
      videoEl.onplay = () => { videoEl.playbackRate = 0.65; };
      videoEl.onloadeddata = () => { videoEl.playbackRate = 0.65; };
    }
  }

  animateToSign(signId) {
    this.playSign(signId);
  }

  applySign(signId) {
    this.playSign(signId);
  }
}

// Global Factory and Exports
window.getHumanSignMedia = getHumanSignMedia;
window.AuthenticHumanMediaStudio = AuthenticHumanMediaStudio;
window.DualHumanHandsStudio = AuthenticHumanMediaStudio;
window.FrontFacingHumanHandsStudio = AuthenticHumanMediaStudio;
window.AuthenticHumanHandStudio = AuthenticHumanMediaStudio;

window.initDualHandsStudio = function(containerId = 'speller-stage-content') {
  window.dualHandsStudio = new AuthenticHumanMediaStudio(containerId);
  window.studio3D = window.dualHandsStudio;
  return window.dualHandsStudio;
};

document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('speller-stage-content');
  if (stage && !window.dualHandsStudio) {
    window.initDualHandsStudio('speller-stage-content');
  }
});
