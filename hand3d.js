/**
 * SignCraft - Authentic Human Sign Instructor
 * Renders real human sign demonstration footage inside the Target Challenge box.
 * Enables deaf and hearing learners to visually mirror authentic hand kinematics.
 */

class FemaleHand3DInstructor {
  constructor(containerId = 'camera-target-svg') {
    this.containerId = containerId;
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.currentSign = 'L';
    this.challengeIndex = 6;
    this.challengeList = ['A', 'B', 'C', 'D', 'E', 'F', 'L', 'V', 'W', 'Y', 'HELLO', 'THANK YOU', 'HELP', 'WATER'];

    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('relative', 'overflow-hidden');
    this.setPose('L');
  }

  setPose(signId) {
    const cleanId = (signId || 'L').toString().toUpperCase().trim();
    this.currentSign = cleanId;

    if (!this.container) {
      this.container = document.getElementById(this.containerId);
      if (!this.container) return;
    }

    const registry = (typeof window !== 'undefined' && (window.signRegistry || window.fullBilingualSigns)) || {};
    const sign = registry[cleanId] || null;

    let media;
    if (sign && sign.img) {
      media = {
        type: sign.img.endsWith('.mp4') ? 'video' : (sign.img.endsWith('.gif') ? 'gif' : 'img'),
        src: sign.img
      };
    } else if (typeof window.getHumanSignMedia === 'function') {
      media = window.getHumanSignMedia(cleanId);
    } else {
      media = { type: 'gif', src: `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${(cleanId[0]||'a').toLowerCase()}.gif` };
    }

    const urduName = sign ? sign.ur : cleanId;
    const urduDesc = sign ? (sign.descUr || sign.stepsUr || '') : 'اشارہ دہرائیں۔';

    // Update prompt text above the box
    const promptContainer = document.getElementById('camera-target-prompt');
    if (promptContainer) {
      promptContainer.innerHTML = `Form the sign for <span class="text-emerald-600 font-mono font-black text-2xl">"${cleanId}"</span> <span class="text-emerald-700 text-base font-urdu font-bold">(${urduName})</span>`;
    }

    // Render Authentic Human Demonstration Loop (Clean Light Studio Card)
    this.container.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between p-3.5 bg-white shadow-xl border border-slate-200 rounded-2xl overflow-hidden group">
        
        <!-- Header: Target Badge + Human Instructor Label -->
        <div class="flex items-center justify-between z-10">
          <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>HUMAN INSTRUCTOR</span>
          </div>
          <span class="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
            "${cleanId}" (${urduName})
          </span>
        </div>

        <!-- Human Demonstration Video/GIF Loop -->
        <div class="relative w-full flex-1 flex items-center justify-center overflow-hidden my-1 bg-slate-50/80 rounded-xl p-2">
          ${
            media.type === 'video'
              ? `<video src="${media.src}" autoplay loop muted playsinline class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md"></video>`
              : `<img src="${media.src}" class="max-h-full max-w-full object-contain rounded-xl drop-shadow-md" alt="Sign ${cleanId}" onerror="this.onerror=null; this.src='https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${(cleanId[0]||'a').toLowerCase()}.gif';">`
          }
        </div>

        <!-- Urdu Gesture Instruction Cues -->
        <div class="z-10 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-center shadow-sm">
          <p class="text-xs text-emerald-800 font-urdu dir-rtl truncate font-medium">
            ${urduDesc}
          </p>
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

  nextChallenge() {
    this.challengeIndex = (this.challengeIndex + 1) % this.challengeList.length;
    const nextSign = this.challengeList[this.challengeIndex];
    this.setPose(nextSign);
    return nextSign;
  }
}

// Global Registration
window.FemaleHand3DInstructor = FemaleHand3DInstructor;
window.hand3dInstructor = new FemaleHand3DInstructor('camera-target-svg');

document.addEventListener('DOMContentLoaded', () => {
  const targetHost = document.getElementById('camera-target-svg');
  if (targetHost && !window.hand3dInstructor) {
    window.hand3dInstructor = new FemaleHand3DInstructor(targetHost);
  }
});
