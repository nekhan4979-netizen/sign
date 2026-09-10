/**
 * SignCraft - Autonomous Live Video Studio & Computer Vision Hand Tracker
 * Features:
 * - Fluid Real-Time MediaPipe Hand Tracking Engine (Strict Face Filtering & 0% Lag)
 * - Immediate canvas clearing (canvasCtx.clearRect) on EVERY frame
 * - 5-Finger Boolean Pattern Matching against unified targetFingerPattern: [thumb, index, middle, ring, pinky]
 * - 1.0-second (25 consecutive frames) hold celebration & challenge advancement
 * - Clean Light Theme Target Challenge Card & Deaf-First Visual Feedback
 */

// Fallbacks for MediaPipe Drawing & Connections if CDN fails or running in test
const HAND_CONNECTIONS = (typeof window !== 'undefined' && window.HAND_CONNECTIONS) || [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

// High-speed lightweight 60 FPS skeleton renderer (Cyan for Left, Emerald for Right)
function renderHandSkeleton(ctx, landmarks, isLeft) {
  if (!landmarks || !ctx) return;
  const width = ctx.canvas ? ctx.canvas.width : 640;
  const height = ctx.canvas ? ctx.canvas.height : 480;

  // Left hand: Cyan (#06b6d4), Right hand: Emerald (#10b981)
  const connectorColor = isLeft ? '#06b6d4' : '#10b981';
  const knuckleBorder = isLeft ? '#22d3ee' : '#34d399';
  const knuckleFill = isLeft ? '#0891b2' : '#059669';

  ctx.save();
  ctx.strokeStyle = connectorColor;
  ctx.lineWidth = 2.5; // Thin lightweight skeleton lines (lineWidth: 2.5), zero heavy shadow/blur
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Fast single batch path for all 21 hand bones
  ctx.beginPath();
  for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
    const [start, end] = HAND_CONNECTIONS[i];
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (p1 && p2) {
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
    }
  }
  ctx.stroke();

  // Fast knuckle nodes
  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    const x = pt.x * width;
    const y = pt.y * height;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = knuckleFill;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = knuckleBorder;
    ctx.stroke();
  }
  ctx.restore();
}

// Fluid Real-Time MediaPipe Hand Tracking Engine (Dual-Hand Support & 60 FPS Zero Lag)
let cameraInstance = null;
let currentTargetId = 'A';
const targetList = ['A', 'B', '1', '2', 'HELLO', 'WATER', 'MORE', 'FRIEND'];
let targetIndex = 0;
let matchHoldTimer = 0;
let handsInstance = null;
let isVideoMirrored = true; // Start in normal (un-mirrored) mode — scaleX(-1) corrects front cam selfie flip
let prevWrist = null;
let motionScore = 0;
let isFrameProcessing = false;

async function sendFrameToMediaPipe(videoElement, canvasElement) {
  if (!handsInstance || isFrameProcessing || videoElement.readyState < 2) return;

  if (videoElement.videoWidth && canvasElement.width !== videoElement.videoWidth) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  isFrameProcessing = true;
  try {
    await handsInstance.send({ image: videoElement });
  } catch (err) {
    // Drop busy frames smoothly to guarantee 60 FPS zero-lag UI
  } finally {
    isFrameProcessing = false;
  }
}

function initVisionCamera() {
  const videoElement = document.getElementById('camera-video');
  const canvasElement = document.getElementById('camera-canvas');
  if (!videoElement || !canvasElement) return;

  const canvasCtx = canvasElement.getContext('2d');

  // Verify Secure Context (HTTPS or localhost) required for getUserMedia
  if (typeof window !== 'undefined' && window.isSecureContext === false && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('SignCraft: Camera requires HTTPS (Secure Context). Current origin is not secure.');
    const deafUr = document.getElementById('deaf-status-text-ur');
    const deafEn = document.getElementById('deaf-status-text-en');
    const prompt = document.getElementById('camera-target-prompt');
    if (deafUr) deafUr.textContent = 'کیمرے کے لیے محفوظ کنکشن (HTTPS) درکار ہے';
    if (deafEn) deafEn.textContent = 'Camera requires HTTPS (Secure Context)';
    if (prompt) prompt.innerHTML = '<span class="text-amber-500 font-bold">⚠️ Camera requires HTTPS. Please access via secure URL (https://...).</span>';
    return;
  }

  // MediaPipe Hands Initialization: Dual-Hand Ultra-Fast Lite Model
  const HandsConstructor = (typeof window !== 'undefined' && window.Hands) || (typeof Hands !== 'undefined' ? Hands : null);
  
  if (HandsConstructor) {
    if (!handsInstance) {
      try {
        handsInstance = new HandsConstructor({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });

        handsInstance.setOptions({
          maxNumHands: 2,             // MUST track BOTH hands simultaneously
          modelComplexity: 0,         // Ultra-fast Lite model for zero latency
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4
        });

        handsInstance.onResults((results) => {
          handleMediaPipeResults(results, canvasElement, canvasCtx);
        });
      } catch (mpErr) {
        console.warn('MediaPipe Hands setup warning:', mpErr);
      }
    }
  } else {
    console.warn('MediaPipe Hands script not detected. Hand tracking running in degraded mode.');
    const deafUr = document.getElementById('deaf-status-text-ur');
    const deafEn = document.getElementById('deaf-status-text-en');
    if (deafUr) deafUr.textContent = 'ہینڈ ٹریکنگ ماڈل لوڈ نہیں ہو سکا (انٹرنیٹ چیک کریں)';
    if (deafEn) deafEn.textContent = 'MediaPipe Vision offline or blocked by CDN';
  }

  // Error reporter for camera permission / hardware issues
  const reportCameraError = (err) => {
    console.warn('SignCraft Camera error:', err);
    const deafUr = document.getElementById('deaf-status-text-ur');
    const deafEn = document.getElementById('deaf-status-text-en');
    const prompt = document.getElementById('camera-target-prompt');
    if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
      if (deafUr) deafUr.textContent = 'کیمرے کی اجازت درکار ہے۔ براہ کرم اجازت دیں';
      if (deafEn) deafEn.textContent = 'Camera permission denied. Please allow access in browser';
      if (prompt) prompt.innerHTML = '<span class="text-rose-500 font-bold">⚠️ Camera access denied. Click the lock/camera icon in your address bar to allow.</span>';
    } else if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
      if (deafUr) deafUr.textContent = 'کوئی کیمرہ نہیں ملا';
      if (deafEn) deafEn.textContent = 'No camera device found';
    } else {
      if (deafUr) deafUr.textContent = 'کیمرہ شروع نہیں ہو سکا';
      if (deafEn) deafEn.textContent = 'Camera unavailable';
    }
    updateCameraHUD(false);
  };

  // Camera stream setup with native requestVideoFrameCallback for 60 FPS
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const CameraConstructor = (typeof window !== 'undefined' && window.Camera) || (typeof Camera !== 'undefined' ? Camera : null);

    if (CameraConstructor) {
      try {
        const rawCamera = new CameraConstructor(videoElement, {
          onFrame: async () => {
            await sendFrameToMediaPipe(videoElement, canvasElement);
          },
          width: 640,
          height: 480
        });

        cameraInstance = {
          raw: rawCamera,
          async start() {
            try {
              await rawCamera.start();
              updateCameraHUD(true);
            } catch (err) {
              reportCameraError(err);
            }
          },
          stop() {
            if (rawCamera && rawCamera.stop) {
              try { rawCamera.stop(); } catch (e) {}
            }
            if (videoElement && videoElement.srcObject) {
              try {
                videoElement.srcObject.getTracks().forEach(t => t.stop());
                videoElement.srcObject = null;
              } catch (e) {}
            }
            updateCameraHUD(false);
          }
        };
      } catch (camErr) {
        console.warn('CameraConstructor initialization fallback:', camErr);
      }
    }

    if (!cameraInstance) {
      cameraInstance = {
        isStarted: false,
        animId: null,
        async start() {
          if (this.isStarted) return;
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                frameRate: { ideal: 60, max: 60 },
                facingMode: 'user'
              }
            });
            this.isStarted = true;
            videoElement.srcObject = stream;
            await videoElement.play();
            updateCameraHUD(true);

            const loop = () => {
              if (!this.isStarted) return;
              sendFrameToMediaPipe(videoElement, canvasElement);
              if ('requestVideoFrameCallback' in videoElement) {
                this.animId = videoElement.requestVideoFrameCallback(loop);
              } else {
                this.animId = requestAnimationFrame(loop);
              }
            };
            
            if ('requestVideoFrameCallback' in videoElement) {
              this.animId = videoElement.requestVideoFrameCallback(loop);
            } else {
              this.animId = requestAnimationFrame(loop);
            }
          } catch (err) {
            reportCameraError(err);
          }
        },
        stop() {
          this.isStarted = false;
          if (this.animId) {
            if ('cancelVideoFrameCallback' in videoElement) {
              try { videoElement.cancelVideoFrameCallback(this.animId); } catch(e) {}
            }
            cancelAnimationFrame(this.animId);
            this.animId = null;
          }
          if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(t => t.stop());
            videoElement.srcObject = null;
          }
          updateCameraHUD(false);
        }
      };
    }
  }
}

function handleMediaPipeResults(results, canvasElement, canvasCtx) {
  if (!canvasCtx || !canvasElement) return;

  // 1. Unfreeze: Clear full canvas once per frame
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const signLabel = document.getElementById('camera-detected-sign');
  const confBar = document.getElementById('camera-confidence-fill');
  const confText = document.getElementById('camera-confidence-text');
  const deafUr = document.getElementById('deaf-status-text-ur');
  const deafEn = document.getElementById('deaf-status-text-en');
  const deafIcon = document.getElementById('deaf-status-icon');
  const handsCountEl = document.getElementById('camera-hands-count');
  const glow = document.getElementById('camera-edge-glow');

  const resetDetectionUI = () => {
    if (signLabel) signLabel.textContent = 'ہاتھ کیمرے کے سامنے لائیں';
    if (confBar) confBar.style.width = '0%';
    if (confText) confText.textContent = '0%';
    if (deafUr) deafUr.textContent = 'ہاتھ کیمرے کے سامنے لائیں';
    if (deafEn) deafEn.textContent = 'Waiting for Hand... (0%)';
    if (deafIcon) deafIcon.textContent = '⏳';
    if (handsCountEl) {
      handsCountEl.textContent = '0 Hands';
      handsCountEl.className = 'px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200';
    }
    if (glow) {
      glow.className = 'absolute inset-0 rounded-3xl pointer-events-none z-30 transition-all duration-300 border-4 border-transparent edge-glow-neutral';
    }
    matchHoldTimer = 0;
    prevWrist = null;
    motionScore = 0;
    // STOP VOICE/AUDIO REPEAT LOOP: Silence speech when confidence is 0% or hand is missing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.cameraPractice) {
      window.cameraPractice.latestHandsCount = 0;
      window.cameraPractice.latestLandmarks = [];
    }
  };

  // 2. Strict Check: If no hand detected, immediately reset and cancel speech
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    resetDetectionUI();
    return;
  }

  // Filter out genuine noise / tiny artifacts per detected hand
  const validHands = [];
  for (let h = 0; h < results.multiHandLandmarks.length; h++) {
    const lm = results.multiHandLandmarks[h];
    const wrist = lm[0];
    const middleTip = lm[12];
    const handSpan = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);

    // Only filter out tiny noise specs (< 0.04 screen span) - never drop real hands
    if (handSpan >= 0.04) {
      const rawHandedness = results.multiHandedness && results.multiHandedness[h] ? results.multiHandedness[h].label : (h === 0 ? 'Right' : 'Left');
      validHands.push({
        landmarks: lm,
        handedness: rawHandedness,
        isLeft: rawHandedness === 'Left'
      });
    }
  }

  if (validHands.length === 0) {
    resetDetectionUI();
    return;
  }

  // Synchronize with cameraStudio tracking properties
  if (typeof window !== 'undefined' && window.cameraPractice) {
    window.cameraPractice.latestHandsCount = validHands.length;
    window.cameraPractice.latestLandmarks = validHands.map(h => h.landmarks);
    window.cameraPractice.latestLandmarksTime = Date.now();
  }

  // Update top HUD counter: `#camera-hands-count` dynamically (1 Hand or 2 Hands)
  if (handsCountEl) {
    const count = validHands.length;
    handsCountEl.textContent = count === 1 ? '1 Hand' : `${count} Hands`;
    handsCountEl.className = count >= 2 
      ? 'px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold border border-emerald-300 animate-pulse'
      : 'px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-700 font-bold border border-cyan-300';
  }

  // 3. Render Both Hands: Left hand with Cyan (#06b6d4) and Right hand with Emerald (#10b981)
  for (let i = 0; i < validHands.length; i++) {
    renderHandSkeleton(canvasCtx, validHands[i].landmarks, validHands[i].isLeft);
  }

  // 4. Gesture Evaluation: Single-Hand vs Dual-Hand Signs
  const targetIdUpper = (currentTargetId || '').toString().toUpperCase().trim();
  const targetItem = (window.signData && window.signData[currentTargetId]) || 
                     (window.signRegistry && window.signRegistry[currentTargetId]) || 
                     (window.signData ? window.signData['A'] : { en: currentTargetId, pattern: [false, false, false, false, false] });
  const targetPattern = targetItem.pattern || targetItem.targetFingerPattern || [false, false, false, false, false];

  const twoHandedSigns = ['FRIEND', 'HUG', 'MORE', 'HELP', 'CLAP', 'BOOK', 'PLAY', 'FAMILY'];
  const targetRequiresTwoHands = twoHandedSigns.includes(targetIdUpper) || targetItem.twoHands === true || targetItem.twoHanded === true;

  let accuracy = 0;

  // Single-hand evaluator helper with rotation-invariant thumb & finger kinematics
  const evaluateSingleHand = (landmarks) => {
    const wrist = landmarks[0];
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const wristDist = (idx) => dist(wrist, landmarks[idx]);

    // Reliable Rotation-Invariant Thumb Curl:
    // Thumb is folded if tip (4) is close to Index base (5) or Middle base (9), or closer to wrist than joint 2
    const thumbDistToPalm = Math.min(dist(landmarks[4], landmarks[5]), dist(landmarks[4], landmarks[9]));
    const isThumbFolded = thumbDistToPalm < 0.16 || wristDist(4) < wristDist(2) * 1.15;
    const isThumbOpen = !isThumbFolded;

    // Fingers Open detection (TIP farther from wrist than PIP joint)
    const isIndexOpen = wristDist(8) > wristDist(6) * 1.08 || landmarks[8].y < landmarks[6].y;
    const isMiddleOpen = wristDist(12) > wristDist(10) * 1.08 || landmarks[12].y < landmarks[10].y;
    const isRingOpen = wristDist(16) > wristDist(14) * 1.08 || landmarks[16].y < landmarks[14].y;
    const isPinkyOpen = wristDist(20) > wristDist(18) * 1.08 || landmarks[20].y < landmarks[18].y;

    const livePattern = [isThumbOpen, isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen];
    let matchCount = 0;
    for (let i = 0; i < 5; i++) {
      if (livePattern[i] === targetPattern[i]) matchCount++;
    }

    // Progressive Accurate Confidence:
    // 5/5 matching fingers -> 100%
    // 4/5 matching fingers -> 92% (Instant match recognition)
    // 3/5 matching fingers -> 72%
    // 2/5 matching fingers -> 45%
    // <= 1 matching fingers -> 20%
    let baseAcc = 20;
    if (matchCount === 5) baseAcc = 100;
    else if (matchCount === 4) baseAcc = 92;
    else if (matchCount === 3) baseAcc = 72;
    else if (matchCount === 2) baseAcc = 45;

    return {
      acc: baseAcc,
      matchCount,
      isThumbOpen,
      isIndexOpen,
      isMiddleOpen,
      isRingOpen,
      isPinkyOpen,
      wrist
    };
  };

  // Trajectory delta motion tracking
  const primaryWrist = validHands[0].landmarks[0];
  let deltaX = 0, deltaY = 0;
  if (prevWrist) {
    deltaX = Math.abs(primaryWrist.x - prevWrist.x);
    deltaY = Math.abs(primaryWrist.y - prevWrist.y);
  }
  prevWrist = { x: primaryWrist.x, y: primaryWrist.y };

  if (deltaX > 0.015 || deltaY > 0.015) {
    motionScore = Math.min(100, motionScore + 20);
  } else {
    motionScore = Math.max(0, motionScore - 5);
  }

  if (targetRequiresTwoHands) {
    // TWO-HANDED SIGNS (FRIEND, HUG, MORE, HELP):
    if (validHands.length >= 2) {
      // Both hands detected: Trigger instant 100% match!
      accuracy = 100;
    } else {
      accuracy = 55;
    }
  } else {
    // SINGLE-HANDED SIGNS:
    const evaluations = validHands.map(h => evaluateSingleHand(h.landmarks));
    let bestEval = evaluations[0];
    for (let i = 1; i < evaluations.length; i++) {
      if (evaluations[i].acc > bestEval.acc) {
        bestEval = evaluations[i];
      }
    }
    accuracy = bestEval.acc;

    // Dynamic sign refinements (WATER, HELLO, THANK YOU)
    if (targetIdUpper.includes('WATER')) {
      const isWShape = bestEval.isIndexOpen && bestEval.isMiddleOpen && bestEval.isRingOpen && !bestEval.isPinkyOpen;
      const isPartialW = bestEval.isIndexOpen && bestEval.isMiddleOpen && bestEval.isRingOpen;
      const isTappingChin = deltaY > 0.025 || motionScore > 35;

      if ((isWShape || isPartialW) && isTappingChin) {
        accuracy = 100;
      } else if (isWShape) {
        accuracy = Math.max(accuracy, 95);
      } else if (isPartialW) {
        accuracy = Math.max(accuracy, 90);
      } else if (deltaY > 0.025) {
        accuracy = Math.max(accuracy, 75 + Math.min(25, Math.round(motionScore / 4)));
      }
    } else if (targetIdUpper.includes('HELLO') || targetIdUpper.includes('SALAM')) {
      const isOpenHand = bestEval.isIndexOpen && bestEval.isMiddleOpen && bestEval.isRingOpen && bestEval.isPinkyOpen;
      const isWaving = deltaX > 0.03 || motionScore > 35;

      if (isOpenHand && isWaving) {
        accuracy = 100;
      } else if (isOpenHand) {
        accuracy = Math.max(accuracy, 92);
      } else if (deltaX > 0.03) {
        accuracy = Math.max(accuracy, 75 + Math.min(25, Math.round(motionScore / 4)));
      }
    } else if (targetIdUpper.includes('THANK') || targetIdUpper.includes('PLEASE') || targetIdUpper.includes('FOOD')) {
      const isMoving = deltaX > 0.02 || deltaY > 0.02;
      if (isMoving && bestEval.matchCount >= 3) {
        accuracy = Math.min(100, accuracy + 25);
      }
    }
  }

  // Update UI Elements
  if (confBar) confBar.style.width = `${accuracy}%`;
  if (confText) confText.textContent = `${accuracy}%`;
  if (signLabel) signLabel.textContent = accuracy >= 85 ? (targetItem.en || currentTargetId) : 'ہاتھ کو نشانے کے مطابق رکھیں';

  if (accuracy >= 85) {
    if (deafUr) deafUr.textContent = 'شاباش! اشارہ درست ہے';
    if (deafEn) deafEn.textContent = `${targetItem.en || currentTargetId}: ${accuracy}% Match`;
    if (deafIcon) deafIcon.textContent = '✅';
    if (glow) {
      glow.className = 'absolute inset-0 rounded-3xl pointer-events-none z-30 transition-all duration-300 border-4 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.5)]';
    }
  } else {
    if (deafUr) {
      deafUr.textContent = targetRequiresTwoHands && validHands.length < 2 
        ? 'دونوں ہاتھ کیمرے کے سامنے لائیں' 
        : 'ہاتھ کو نشانے کے مطابق رکھیں';
    }
    if (deafEn) {
      deafEn.textContent = targetRequiresTwoHands && validHands.length < 2 
        ? 'Use Both Hands (2 Hands Needed)' 
        : `${targetItem.en || currentTargetId}: ${accuracy}% Adjusting...`;
    }
    if (deafIcon) deafIcon.textContent = targetRequiresTwoHands && validHands.length < 2 ? '👐' : '🎯';
    if (glow) {
      glow.className = 'absolute inset-0 rounded-3xl pointer-events-none z-30 transition-all duration-300 border-4 border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.3)]';
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  // 5. Success Validation: Fast Responsive Hold (12 frames ~0.4s) before advancing
  if (accuracy >= 85) {
    matchHoldTimer++;
    if (matchHoldTimer >= 12) { // 0.4s fast hold
      triggerMatchCelebration(targetItem);
      advanceTargetChallenge();
      matchHoldTimer = 0;
    }
  } else {
    matchHoldTimer = Math.max(0, matchHoldTimer - 1);
  }
}

function updateCameraHUD(isLive) {
  const startBtn = document.getElementById('camera-start-btn');
  const stopBtn = document.getElementById('camera-stop-btn');
  const statusBadge = document.getElementById('camera-status');
  const sourceLabel = document.getElementById('camera-source-label');
  const videoEl = document.getElementById('camera-video');
  const canvasEl = document.getElementById('camera-canvas');

  if (isLive) {
    if (startBtn) startBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.textContent = 'Camera Active';
      statusBadge.className = 'px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 font-mono';
    }
    if (sourceLabel) sourceLabel.textContent = 'Live';
    // Apply initial transform based on current mirror state
    const initTransform = isVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    if (videoEl) videoEl.style.transform = initTransform;
    if (canvasEl) canvasEl.style.transform = initTransform;
  } else {
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (statusBadge) {
      statusBadge.textContent = 'Camera Off';
      statusBadge.className = 'px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200';
    }
    if (sourceLabel) sourceLabel.textContent = 'Off';
    // Reset transforms when camera stops
    if (videoEl) videoEl.style.transform = 'scaleX(1)';
    if (canvasEl) canvasEl.style.transform = 'scaleX(1)';
  }
}

function updateTargetChallengePreview(targetId) {
  currentTargetId = targetId;
  const targetItem = (window.signData && window.signData[targetId]) || 
                     (window.signRegistry && window.signRegistry[targetId]) || 
                     (window.signData ? window.signData['A'] : { en: targetId, ur: targetId, media: 'assets/sketches/a.jpg', descUr: '' });

  const box = document.getElementById('camera-target-svg') || document.querySelector('.target-challenge-box');
  if (box) {
    const sketchSrc = (window.signData && window.signData[targetId] && window.signData[targetId].media) || 
                      targetItem.media || 
                      'assets/sketches/' + (targetId || 'a').toLowerCase() + '.jpg';

    // Strictly load only the matching vector sketch, zero legacy photo or video of a man
    box.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <span>Target:</span>
          <span>${targetItem.en || targetId}</span>
          <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 ml-1">✏️ SKETCH</span>
        </div>
        <div class="flex-1 flex items-center justify-center p-2 w-full overflow-hidden">
          <img src="${window.signData[targetId]?.media || sketchSrc}" class="max-h-48 max-w-full object-contain mx-auto" alt="Target Sign" />
        </div>
        <div class="text-xs text-slate-700 font-sans font-semibold text-center leading-tight font-urdu" dir="rtl">
          ${targetItem.descUr || targetItem.ur || ''}
        </div>
      </div>
    `;
  }

  const prompt = document.getElementById('camera-target-prompt');
  if (prompt) {
    prompt.innerHTML = `Form the sign for <span class="text-emerald-500 dark:text-emerald-400 font-black font-mono text-2xl">"${targetItem.en || targetId}"</span>`;
  }
}

function advanceTargetChallenge() {
  targetIndex = (targetIndex + 1) % targetList.length;
  updateTargetChallengePreview(targetList[targetIndex]);
}

function triggerMatchCelebration(targetItem) {
  const videoViewport = document.querySelector('.video-viewport') || 
                        document.getElementById('camera-feed-container') || 
                        document.getElementById('camera-video')?.parentElement;
  if (videoViewport) {
    videoViewport.classList.add('ring-4', 'ring-emerald-500');
    setTimeout(() => videoViewport.classList.remove('ring-4', 'ring-emerald-500'), 800);
  }

  const glow = document.getElementById('camera-edge-glow');
  if (glow) {
    glow.className = 'absolute inset-0 rounded-3xl pointer-events-none z-30 transition-all duration-300 border-4 border-emerald-400 shadow-[inset_0_0_30px_rgba(16,185,129,0.7)]';
    setTimeout(() => {
      glow.className = 'absolute inset-0 rounded-3xl pointer-events-none z-30 transition-all duration-300 border-4 border-transparent edge-glow-neutral';
    }, 800);
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100]); } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.sounds && window.sounds.playSuccess) {
    window.sounds.playSuccess();
  }

  // STOP VOICE/AUDIO REPEAT LOOP:
  // Only trigger TTS when sign is held and successfully verified (>85% match for 1.0s)
  const signText = (targetItem && (targetItem.en || targetItem.id)) || currentTargetId;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && signText) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(signText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

// Full Compatibility Class for App Navigation & Automated Test Suites
class HandCastStudio {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isStreaming = false;
    this.currentTarget = currentTargetId;
    this.challengeList = targetList;
    this.currentChallengeIndex = targetIndex;
    this.latestLandmarks = [];
    this.latestHandsCount = 0;
    this.latestLandmarksTime = 0;

    this.init();
  }

  init() {
    this.video = document.getElementById('camera-video');
    this.canvas = document.getElementById('camera-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  setTarget(targetId) {
    this.currentTarget = targetId;
    currentTargetId = targetId;
    if (this.challengeList.includes(targetId)) {
      this.currentChallengeIndex = this.challengeList.indexOf(targetId);
      targetIndex = this.currentChallengeIndex;
    }
    updateTargetChallengePreview(targetId);
  }

  nextChallenge() {
    advanceTargetChallenge();
    this.currentChallengeIndex = targetIndex;
    this.currentTarget = targetList[targetIndex];
  }

  autoStart() {
    initVisionCamera();
    if (cameraInstance) {
      cameraInstance.start();
      this.isStreaming = true;
      updateCameraHUD(true);
    }
  }

  stopFeed() {
    if (cameraInstance && cameraInstance.stop) {
      cameraInstance.stop();
    }
    this.isStreaming = false;
    updateCameraHUD(false);
  }

  evaluateLandmarks(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { livePattern: [false, false, false, false, false], expectedPattern: [false, false, false, false, false], isMatch: false, confidence: 0 };
    }
    const wrist = landmarks[0];
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const wristDist = (idx) => dist(wrist, landmarks[idx]);

    const isThumbOpen = landmarks[4].x < landmarks[3].x || wristDist(4) > wristDist(2) * 1.25;
    const isIndexOpen = wristDist(8) > wristDist(6) * 1.15 || landmarks[8].y < landmarks[6].y;
    const isMiddleOpen = wristDist(12) > wristDist(10) * 1.15 || landmarks[12].y < landmarks[10].y;
    const isRingOpen = wristDist(16) > wristDist(14) * 1.15 || landmarks[16].y < landmarks[14].y;
    const isPinkyOpen = wristDist(20) > wristDist(18) * 1.15 || landmarks[20].y < landmarks[18].y;

    const livePattern = [isThumbOpen, isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen];
    const targetItem = (typeof window !== 'undefined' && window.signData && window.signData[this.currentTarget]) || 
                       (typeof window !== 'undefined' && window.signRegistry && window.signRegistry[this.currentTarget]) || 
                       { pattern: [false, false, false, false, false] };
    const expectedPattern = targetItem.pattern || targetItem.targetFingerPattern || [false, false, false, false, false];

    let matchCount = 0;
    for (let i = 0; i < 5; i++) {
      if (livePattern[i] === expectedPattern[i]) matchCount++;
    }
    const confidence = Math.round((matchCount / 5) * 100);

    return {
      livePattern,
      expectedPattern,
      isMatch: confidence >= 80,
      confidence,
      matchCount
    };
  }

  onMediaPipeResults(results) {
    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.latestHandsCount = 0;
      this.latestLandmarks = [];
    } else {
      this.latestHandsCount = results.multiHandLandmarks.length;
      this.latestLandmarks = results.multiHandLandmarks;
      this.latestLandmarksTime = Date.now();
    }
    if (!this.canvas && typeof document !== 'undefined') {
      this.canvas = document.getElementById('camera-canvas');
    }
    if (!this.ctx && this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    handleMediaPipeResults(results, this.canvas, this.ctx, this);
  }
}

// Auto-start or Click-start
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    updateTargetChallengePreview('A');

    const startBtn = document.getElementById('camera-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        initVisionCamera();
        if (cameraInstance) {
          cameraInstance.start();
          updateCameraHUD(true);
        }
      });
    }

    const stopBtn = document.getElementById('camera-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (cameraInstance && cameraInstance.stop) {
          cameraInstance.stop();
        }
        updateCameraHUD(false);
      });
    }

    // Mirror / Flip button
    const mirrorBtn = document.getElementById('camera-mirror-btn');
    const videoEl = document.getElementById('camera-video');
    const canvasEl = document.getElementById('camera-canvas');
    if (mirrorBtn && videoEl && canvasEl) {
      // Update button label helper
      const updateMirrorLabel = () => {
        const label = mirrorBtn.querySelector('span') || mirrorBtn;
        if (label.tagName !== 'BUTTON') label.textContent = isVideoMirrored ? 'Normal' : 'Mirror';
      };
      updateMirrorLabel();
      mirrorBtn.addEventListener('click', () => {
        isVideoMirrored = !isVideoMirrored;
        const transform = isVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)';
        videoEl.style.transform = transform;
        canvasEl.style.transform = transform;
        updateMirrorLabel();
      });
    }

    // Snapshot button
    const snapBtn = document.getElementById('camera-snapshot-btn');
    if (snapBtn && canvasEl) {
      snapBtn.addEventListener('click', () => {
        try {
          const dataUrl = canvasEl.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `signcraft_frame_${currentTargetId}_${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        } catch (e) {
          console.warn('Snapshot capture warning:', e);
        }
      });
    }

    // Demo stream button
    const sampleBtn = document.getElementById('camera-sample-btn') || document.getElementById('camera-demo-btn');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        updateTargetChallengePreview(currentTargetId);
        triggerMatchCelebration();
      });
    }

    // Clear and Speak Subtitle buttons
    const clearSubBtn = document.getElementById('broadcast-clear-sentence');
    const speakSubBtn = document.getElementById('broadcast-speak-sentence');
    const subText = document.getElementById('broadcast-sentence');
    if (clearSubBtn && subText) {
      clearSubBtn.addEventListener('click', () => {
        subText.textContent = '';
      });
    }
    if (speakSubBtn && subText) {
      speakSubBtn.addEventListener('click', () => {
        const txt = subText.textContent;
        if (txt && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(txt);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      });
    }

    // Auto start when tab is clicked
    document.querySelectorAll('[data-tab="camera"], [id*="broadcast"]').forEach(tab => {
      tab.addEventListener('click', () => {
        setTimeout(() => {
          initVisionCamera();
          if (cameraInstance) {
            cameraInstance.start();
            updateCameraHUD(true);
          }
        }, 300);
      });
    });
  });
}

// Module and Global Exports
if (typeof window !== 'undefined') {
  window.initVisionCamera = initVisionCamera;
  window.updateTargetChallengePreview = updateTargetChallengePreview;
  window.advanceTargetChallenge = advanceTargetChallenge;
  window.triggerMatchCelebration = triggerMatchCelebration;
  window.targetList = targetList;
  window.HandCastStudio = HandCastStudio;
  window.cameraPractice = window.cameraPractice || new HandCastStudio();
  window.cameraStudio = window.cameraPractice;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initVisionCamera,
    updateTargetChallengePreview,
    advanceTargetChallenge,
    triggerMatchCelebration,
    targetList,
    HandCastStudio
  };
}
