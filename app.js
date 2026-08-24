// ==========================================
// SUPERHERO AR CAMERA & VFX STUDIO ENGINE
// ==========================================

const arCanvas = document.getElementById('ar-canvas');
const arCtx = arCanvas.getContext('2d');
const webcamVideo = document.getElementById('webcam-video');

// Studio elements
const studioCanvas = document.getElementById('vfx-canvas');
const studioCtx = studioCanvas ? studioCanvas.getContext('2d') : null;

// Processing Offscreen Canvas for Fast Computer Vision
const procCanvas = document.createElement('canvas');
procCanvas.width = 160;
procCanvas.height = 90;
const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });

// AR State
const arState = {
  isCameraActive: false,
  isFireActive: false,
  element: 'inferno', // 'inferno', 'bluefire', 'purplevoid', 'lightninghands'
  flameSize: 1.2,
  sparkDensity: 1.0,
  sensitivity: 2, // 1: Low, 2: Medium, 3: High
  sfxEnabled: true,
  isRecording: false,
  isFlipped: true,
  cooldown: 0,
  rubCounter: 0,
  time: 0,
  fps: 0,

  // Hand Tracking Data
  handL: { x: 440, y: 460, vx: 0, vy: 0, active: false, rawCount: 0 },
  handR: { x: 840, y: 460, vx: 0, vy: 0, active: false, rawCount: 0 },
  lastDist: 400
};

// Previous frame data for motion analysis
let prevFrameData = null;

// AR Particles
let fireParticles = [];
let emberSparks = [];
let lightningArcs = [];

// Audio Context & SFX
let audioCtx = null;
let currentAudio = null;

// Color maps for elements
const ELEMENT_COLORS = {
  inferno: {
    core: '#ffffff',
    mid: '#ff7700',
    outer: '#ff1a00',
    spark: '#ffcc00',
    glow: 'rgba(255, 100, 0, 0.4)'
  },
  bluefire: {
    core: '#ffffff',
    mid: '#00d4ff',
    outer: '#0044ff',
    spark: '#77ffff',
    glow: 'rgba(0, 180, 255, 0.4)'
  },
  purplevoid: {
    core: '#ffffff',
    mid: '#c026d3',
    outer: '#6b21a8',
    spark: '#f472b6',
    glow: 'rgba(192, 38, 211, 0.4)'
  },
  lightninghands: {
    core: '#ffffff',
    mid: '#38bdf8',
    outer: '#2563eb',
    spark: '#facc15',
    glow: 'rgba(56, 189, 248, 0.4)'
  }
};

// ==========================================
// 1. WEBCAM & AR CAMERA ENGINE
// ==========================================

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    webcamVideo.srcObject = stream;
    await webcamVideo.play();

    arState.isCameraActive = true;
    document.getElementById('camera-prompt-overlay').classList.add('hidden');
    
    const dot = document.getElementById('cam-status-dot');
    const text = document.getElementById('cam-status-text');
    dot.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
    text.textContent = 'CAMERA ACTIVE (MIRRORED)';

  } catch (err) {
    console.error('Camera access denied or error:', err);
    alert('कैमरा शुरू करने के लिए Browser में Camera Permission Allow करें!');
  }
}

// ==========================================
// 2. COMPUTER VISION: HAND & RUBBING DETECTION
// ==========================================

function processHandTracking() {
  if (!arState.isCameraActive || webcamVideo.readyState !== 4) return;

  const pw = procCanvas.width;
  const ph = procCanvas.height;

  // Draw current webcam frame to small offscreen canvas (mirrored if needed)
  procCtx.save();
  if (arState.isFlipped) {
    procCtx.translate(pw, 0);
    procCtx.scale(-1, 1);
  }
  procCtx.drawImage(webcamVideo, 0, 0, pw, ph);
  procCtx.restore();

  const imgData = procCtx.getImageData(0, 0, pw, ph);
  const data = imgData.data;

  // Left & Right Hand clusters (Left screen half = Left Hand, Right screen half = Right Hand)
  let sumLx = 0, sumLy = 0, countL = 0;
  let sumRx = 0, sumRy = 0, countR = 0;
  const midDivider = pw / 2;

  // Sensitivity multiplier
  const sensThreshold = arState.sensitivity === 3 ? 12 : arState.sensitivity === 2 ? 16 : 22;

  for (let y = 15; y < ph - 5; y++) {
    for (let x = 5; x < pw - 5; x++) {
      const idx = (y * pw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Human Skin Color Classifier (RGB & Chrominance check)
      const isSkin = (r > 65) && (g > 40) && (b > 20) &&
                     (r > g) && (g > b) &&
                     ((r - g) >= sensThreshold) &&
                     (Math.abs(r - g) > 10);

      if (isSkin) {
        if (x < midDivider) {
          sumLx += x;
          sumLy += y;
          countL++;
        } else {
          sumRx += x;
          sumRy += y;
          countR++;
        }
      }
    }
  }

  const scaleX = arCanvas.width / pw;
  const scaleY = arCanvas.height / ph;

  // Update Left Hand Position with smoothing
  if (countL > 30) {
    const targetLx = (sumLx / countL) * scaleX;
    const targetLy = (sumLy / countL) * scaleY;
    arState.handL.vx = targetLx - arState.handL.x;
    arState.handL.vy = targetLy - arState.handL.y;
    arState.handL.x += (targetLx - arState.handL.x) * 0.35;
    arState.handL.y += (targetLy - arState.handL.y) * 0.35;
    arState.handL.active = true;
  } else {
    arState.handL.active = false;
  }

  // Update Right Hand Position with smoothing
  if (countR > 30) {
    const targetRx = (sumRx / countR) * scaleX;
    const targetRy = (sumRy / countR) * scaleY;
    arState.handR.vx = targetRx - arState.handR.x;
    arState.handR.vy = targetRy - arState.handR.y;
    arState.handR.x += (targetRx - arState.handR.x) * 0.35;
    arState.handR.y += (targetRy - arState.handR.y) * 0.35;
    arState.handR.active = true;
  } else {
    arState.handR.active = false;
  }

  // --- RUBBING GESTURE DETECTOR ---
  if (arState.handL.active && arState.handR.active) {
    const dist = Math.hypot(arState.handL.x - arState.handR.x, arState.handL.y - arState.handR.y);
    const rubDistThreshold = 220; // Hands touching proximity

    if (dist < rubDistThreshold) {
      arState.rubCounter++;
      // If hands are touching/rubbing for ~4 consecutive frames and cooldown expired
      if (arState.rubCounter >= 4 && arState.cooldown <= 0) {
        toggleFireState();
        arState.cooldown = 45; // 1.5s cooldown
        arState.rubCounter = 0;
      }
    } else {
      arState.rubCounter = Math.max(0, arState.rubCounter - 1);
    }
    arState.lastDist = dist;
  }

  if (arState.cooldown > 0) arState.cooldown--;
}

// ==========================================
// 3. TOGGLE FIRE STATE (ON / OFF)
// ==========================================

function toggleFireState(forceState = null) {
  if (forceState !== null) {
    arState.isFireActive = forceState;
  } else {
    arState.isFireActive = !arState.isFireActive;
  }

  const badge = document.getElementById('fire-state-badge');
  const badgeText = document.getElementById('fire-badge-text');
  const alertBox = document.getElementById('gesture-alert');
  const alertText = document.getElementById('gesture-alert-text');

  if (arState.isFireActive) {
    // Fire Turned ON!
    badge.className = 'px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-2 bg-orange-950/90 border-orange-500 text-orange-300 shadow-lg shadow-orange-500/30';
    badgeText.textContent = '🔥 FIRE BURNING (आग जल रही है)';

    alertText.textContent = '🔥 FIRE IGNITED! 🔥';
    alertBox.style.opacity = '1';
    setTimeout(() => { alertBox.style.opacity = '0'; }, 1200);

    if (arState.sfxEnabled) {
      playAudioClip('sfx/fire_burst_explosion.wav');
    }

    // Burst ignition sparks
    triggerIgnitionBurst();

  } else {
    // Fire Turned OFF!
    badge.className = 'px-3 py-1 rounded-full text-xs font-bold border transition flex items-center gap-2 bg-slate-900/90 border-slate-700 text-slate-400';
    badgeText.textContent = 'हाथ रगड़ें (Rub Hands to Ignite Fire)';

    alertText.textContent = '💨 FIRE EXTINGUISHED!';
    alertBox.style.opacity = '1';
    setTimeout(() => { alertBox.style.opacity = '0'; }, 1000);

    if (arState.sfxEnabled) {
      playAudioClip('sfx/teleport_speed_whoosh.wav');
    }
  }
}

function triggerIgnitionBurst() {
  const points = [arState.handL, arState.handR];
  points.forEach(h => {
    for (let i = 0; i < 35; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 6 + Math.random() * 14;
      emberSparks.push({
        x: h.x,
        y: h.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3,
        size: (3 + Math.random() * 6) * arState.flameSize,
        life: 1.0,
        decay: 0.03
      });
    }
  });
}

// ==========================================
// 4. PARTICLE PHYSICS & RENDERING ON AR CANVAS
// ==========================================

function emitHandFlames(hand) {
  const colors = ELEMENT_COLORS[arState.element] || ELEMENT_COLORS.inferno;
  const count = (7 * arState.flameSize) | 0;

  for (let i = 0; i < count; i++) {
    const spread = (35 + Math.random() * 25) * arState.flameSize;
    fireParticles.push({
      x: hand.x + (Math.random() - 0.5) * spread,
      y: hand.y + (Math.random() - 0.5) * spread,
      vx: (Math.random() - 0.5) * 3 - hand.vx * 0.25,
      vy: -(5 + Math.random() * 10) * arState.flameSize - hand.vy * 0.15,
      size: (25 + Math.random() * 35) * arState.flameSize,
      life: 1.0,
      decay: 0.03 + Math.random() * 0.03,
      wobble: Math.random() * Math.PI * 2
    });
  }

  // Floating embers
  if (Math.random() < 0.7 * arState.sparkDensity) {
    emberSparks.push({
      x: hand.x + (Math.random() - 0.5) * 40,
      y: hand.y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 4,
      vy: -(6 + Math.random() * 8),
      size: (2.5 + Math.random() * 4) * arState.flameSize,
      life: 1.0,
      decay: 0.025
    });
  }

  // Lightning mode extra arcs
  if (arState.element === 'lightninghands' && Math.random() < 0.4) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    lightningArcs.push({
      x1: hand.x,
      y1: hand.y,
      x2: hand.x + Math.cos(angle) * dist,
      y2: hand.y + Math.sin(angle) * dist,
      life: 1.0
    });
  }
}

function renderARFrame() {
  requestAnimationFrame(renderARFrame);
  arState.time += 1;

  // 1. Render WebCam Video to Canvas
  if (arState.isCameraActive && webcamVideo.readyState === 4) {
    arCtx.save();
    if (arState.isFlipped) {
      arCtx.translate(arCanvas.width, 0);
      arCtx.scale(-1, 1);
    }
    arCtx.drawImage(webcamVideo, 0, 0, arCanvas.width, arCanvas.height);
    arCtx.restore();

    // Process Hand Tracking
    processHandTracking();

  } else {
    // Standby Dark Background with subtle grid
    arCtx.fillStyle = '#090d16';
    arCtx.fillRect(0, 0, arCanvas.width, arCanvas.height);

    // Subtle helper text
    arCtx.fillStyle = '#334155';
    arCtx.font = '16px Orbitron, sans-serif';
    arCtx.textAlign = 'center';
    arCtx.fillText('CLICK "START LIVE AR CAMERA" TO ACTIVATE WEBCAM', arCanvas.width / 2, arCanvas.height / 2 + 70);
  }

  // 2. If Fire is Active: Emit & Draw Flames on Both Hands
  if (arState.isFireActive) {
    const colors = ELEMENT_COLORS[arState.element] || ELEMENT_COLORS.inferno;

    // Emit from hands
    if (arState.handL.active || !arState.isCameraActive) emitHandFlames(arState.handL);
    if (arState.handR.active || !arState.isCameraActive) emitHandFlames(arState.handR);

    arCtx.save();
    arCtx.globalCompositeOperation = 'lighter';

    // Palm Hot Core Glow
    [arState.handL, arState.handR].forEach(h => {
      const glowGrad = arCtx.createRadialGradient(h.x, h.y, 5, h.x, h.y, 110 * arState.flameSize);
      glowGrad.addColorStop(0, colors.core);
      glowGrad.addColorStop(0.35, colors.mid);
      glowGrad.addColorStop(0.7, colors.outer);
      glowGrad.addColorStop(1, 'transparent');
      arCtx.fillStyle = glowGrad;
      arCtx.beginPath();
      arCtx.arc(h.x, h.y, 110 * arState.flameSize, 0, Math.PI * 2);
      arCtx.fill();
    });

    // Draw Flame Particles
    for (let i = fireParticles.length - 1; i >= 0; i--) {
      const p = fireParticles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        fireParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx + Math.sin(arState.time * 0.15 + p.wobble) * 2;
      p.y += p.vy;
      p.size *= 0.96;

      const grad = arCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, colors.core);
      grad.addColorStop(0.3, colors.mid);
      grad.addColorStop(0.7, colors.outer);
      grad.addColorStop(1, 'transparent');

      arCtx.fillStyle = grad;
      arCtx.beginPath();
      arCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      arCtx.fill();
    }

    // Draw Ember Sparks
    for (let i = emberSparks.length - 1; i >= 0; i--) {
      const s = emberSparks[i];
      s.life -= s.decay;
      if (s.life <= 0) {
        emberSparks.splice(i, 1);
        continue;
      }
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08;

      arCtx.fillStyle = colors.spark;
      arCtx.shadowColor = colors.spark;
      arCtx.shadowBlur = 8;
      arCtx.beginPath();
      arCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      arCtx.fill();
    }

    // Draw Lightning Arcs
    for (let i = lightningArcs.length - 1; i >= 0; i--) {
      const a = lightningArcs[i];
      a.life -= 0.15;
      if (a.life <= 0) {
        lightningArcs.splice(i, 1);
        continue;
      }
      arCtx.strokeStyle = '#38bdf8';
      arCtx.lineWidth = 3;
      arCtx.shadowColor = '#38bdf8';
      arCtx.shadowBlur = 15;
      arCtx.beginPath();
      arCtx.moveTo(a.x1, a.y1);
      const mx = (a.x1 + a.x2) / 2 + (Math.random() - 0.5) * 30;
      const my = (a.y1 + a.y2) / 2 + (Math.random() - 0.5) * 30;
      arCtx.lineTo(mx, my);
      arCtx.lineTo(a.x2, a.y2);
      arCtx.stroke();
    }

    arCtx.restore();
  }
}

// ==========================================
// 5. AUDIO PLAYBACK HELPER
// ==========================================

function playAudioClip(path) {
  try {
    const a = new Audio(path);
    a.play().catch(e => console.log('Audio autoplay prevented:', e));
  } catch (e) {}
}

// ==========================================
// 6. VIDEO RECORDER (FOR LIVE AR VIDEO)
// ==========================================

let arMediaRecorder = null;
let arRecordedChunks = [];

function startARRecording(durationSec = 5) {
  if (arState.isRecording) return;
  arState.isRecording = true;

  const banner = document.getElementById('ar-recording-banner');
  const timerText = document.getElementById('ar-recording-timer');
  const recordBtn = document.getElementById('btn-record-ar-video');

  banner.classList.remove('hidden');
  recordBtn.disabled = true;
  recordBtn.classList.add('opacity-50');

  const stream = arCanvas.captureStream(60);
  arRecordedChunks = [];

  let options = { mimeType: 'video/webm;codecs=vp9' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm' };
  }

  try {
    arMediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    arMediaRecorder = new MediaRecorder(stream);
  }

  arMediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) arRecordedChunks.push(event.data);
  };

  arMediaRecorder.onstop = () => {
    const blob = new Blob(arRecordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superhero_live_fire_${Date.now()}.webm`;
    a.click();

    arState.isRecording = false;
    banner.classList.add('hidden');
    recordBtn.disabled = false;
    recordBtn.classList.remove('opacity-50');
  };

  arMediaRecorder.start();

  let elapsed = 0;
  timerText.textContent = `RECORDING: 0s / ${durationSec}s`;
  const interval = setInterval(() => {
    elapsed++;
    timerText.textContent = `RECORDING: ${elapsed}s / ${durationSec}s`;
    if (elapsed >= durationSec) {
      clearInterval(interval);
      arMediaRecorder.stop();
    }
  }, 1000);
}

// ==========================================
// 7. EVENT LISTENERS & UI SETUP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Start Camera Button
  document.getElementById('btn-start-webcam').addEventListener('click', startWebcam);

  // Manual Trigger Button
  document.getElementById('btn-toggle-fire-manual').addEventListener('click', () => {
    toggleFireState();
  });

  // Spacebar Hotkey to Trigger Fire
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      toggleFireState();
    }
  });

  // Flip Camera Mirror
  document.getElementById('btn-flip-camera').addEventListener('click', () => {
    arState.isFlipped = !arState.isFlipped;
  });

  // Record Button
  document.getElementById('btn-record-ar-video').addEventListener('click', () => {
    const dur = parseInt(document.getElementById('ar-export-duration').value, 10) || 5;
    startARRecording(dur);
  });

  // Fire Element Choice
  document.querySelectorAll('.fire-elem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fire-elem-btn').forEach(b => {
        b.classList.remove('active-elem-btn', 'border-orange-500/80', 'bg-orange-950/40');
        b.classList.add('border-slate-700', 'bg-slate-900/60');
      });
      btn.classList.add('active-elem-btn', 'border-orange-500/80', 'bg-orange-950/40');
      btn.classList.remove('border-slate-700', 'bg-slate-900/60');
      arState.element = btn.dataset.element;
    });
  });

  // Sliders
  document.getElementById('slider-flame-size').addEventListener('input', (e) => {
    arState.flameSize = parseFloat(e.target.value);
    document.getElementById('val-flame-size').textContent = `${arState.flameSize.toFixed(1)}x`;
  });

  document.getElementById('slider-sparks').addEventListener('input', (e) => {
    arState.sparkDensity = parseFloat(e.target.value);
    document.getElementById('val-sparks').textContent = `${arState.sparkDensity.toFixed(1)}x`;
  });

  document.getElementById('slider-sensitivity').addEventListener('input', (e) => {
    arState.sensitivity = parseInt(e.target.value, 10);
    const label = arState.sensitivity === 3 ? 'High' : arState.sensitivity === 2 ? 'Medium' : 'Low';
    document.getElementById('val-sensitivity').textContent = label;
  });

  // SFX Toggle
  document.getElementById('toggle-sfx-sound').addEventListener('change', (e) => {
    arState.sfxEnabled = e.target.checked;
  });

  // Tab Switching (AR Camera vs Studio)
  const tabCamera = document.getElementById('tab-btn-camera');
  const tabStudio = document.getElementById('tab-btn-studio');
  const viewCamera = document.getElementById('view-ar-camera');
  const viewStudio = document.getElementById('view-vfx-studio');

  tabCamera.addEventListener('click', () => {
    tabCamera.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20';
    tabStudio.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5';
    viewCamera.classList.remove('hidden');
    viewStudio.classList.add('hidden');
  });

  tabStudio.addEventListener('click', () => {
    tabStudio.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20';
    tabCamera.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5';
    viewStudio.classList.remove('hidden');
    viewCamera.classList.add('hidden');
  });

  // Guide Modal
  const modal = document.getElementById('modal-guide');
  document.getElementById('btn-guide-modal').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('btn-modal-gotit').addEventListener('click', () => modal.classList.add('hidden'));

  // Start AR Rendering Loop
  requestAnimationFrame(renderARFrame);
});
