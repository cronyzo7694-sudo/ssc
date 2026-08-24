'use strict';

/* =========================================================
 * ONE-HAND CAMERA KNIFE CUTTING GAME  ·  v3.0
 * =========================================================
 * PIPELINE:
 *   CAMERA -> ONE HAND TRACKING (numHands = 1)
 *          -> HAND MOVEMENT -> VIRTUAL KNIFE (index fingertip)
 *          -> KNIFE TRAIL (fading slash streak)
 *          -> FLYING BALLS (projectile physics w/ gravity)
 *          -> SWEPT LINE-SEGMENT COLLISION (no tunneling)
 *          -> BALL SPLITS into two halves
 *          -> SCORE / COMBO / LIVES (3 misses = game over)
 *          -> INSTANT RESTART
 * ========================================================= */

const GAME_VERSION = '3.0.0';
const CANVAS_W = 1280;
const CANVAS_H = 720;

// Physics tuning (canvas px / seconds)
const GRAVITY = 900;
const BALL_RADIUS_MIN = 26;
const BALL_RADIUS_MAX = 46;
const BLADE_HALF_WIDTH = 7;      // collision half-width of the blade
const TRAIL_AGE = 0.30;          // seconds a trail point survives
const COMBO_WINDOW = 1.25;       // seconds allowed between consecutive cuts
const SPAWN_START = 1500;        // ms between ball launches at game start
const SPAWN_MIN = 650;           // fastest launch interval
const MAX_MISSES = 3;

// ---------------- DOM ----------------
const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const ctx = canvas.getContext('2d');
const video = $('webcam-video');
const viewportBox = $('camera-viewport-box');

const el = {
  camDot: $('cam-status-dot'), camText: $('cam-status-text'),
  trackerDot: $('tracker-dot'), trackerText: $('tracker-text'),
  handLockText: $('hand-lock-text'), handLockIcon: $('hand-lock-icon'),
  fps: $('fps-counter'),
  hud: $('hud'), hudScore: $('hud-score'), hudCombo: $('hud-combo'), hudLives: $('hud-lives'),
  comboPop: $('combo-pop'), comboPopText: $('combo-pop-text'),
  missFlash: $('miss-flash'), handHint: $('hand-hint'),
  cameraOverlay: $('camera-prompt-overlay'), gameStartOverlay: $('game-start-overlay'),
  gameoverOverlay: $('gameover-overlay'), cameraErrorText: $('camera-error-text'),
  btnStartCamera: $('btn-start-camera'), btnStartGame: $('btn-start-game'), btnRestart: $('btn-restart'),
  finalScore: $('final-score'), bestScore: $('best-score'), gameoverSub: $('gameover-sub'),
  modeNote: $('mode-note'),
};

// ---------------- GAME STATE ----------------
const state = {
  phase: 'camera-off',        // camera-off | ready | playing | gameover
  cameraOn: false,
  score: 0,
  best: Number(localStorage.getItem('knife-best-score') || 0),
  combo: 0,
  lastCutAt: -1e9,
  lives: MAX_MISSES,
  misses: 0,
  spawnTimer: 0,
  spawnInterval: SPAWN_START,
  time: 0,                    // seconds, game clock
  shake: 0,
};

// ---------------- KNIFE ----------------
// The blade runs from `hilt` (index knuckle) through the fingertip and out to `tip`.
const knife = {
  tip: { x: CANVAS_W * 0.5, y: CANVAS_H * 0.85 },
  prevTip: { x: CANVAS_W * 0.5, y: CANVAS_H * 0.85 },
  hilt: { x: CANVAS_W * 0.5, y: CANVAS_H * 0.95 },
  angle: -Math.PI / 2,
  source: 'none',             // 'hand' | 'pointer' | 'none'
  handAt: -1e9,               // last time a real hand was tracked
  pointerAt: -1e9,            // last time pointer moved
};

const trail = [];              // {x, y, t}
const balls = [];              // {x, y, px, py, vx, vy, r, hue}
const halves = [];             // {x, y, vx, vy, r, hue, rot, vrot, alpha}
const particles = [];          // {x, y, vx, vy, life, maxLife, size, hue}

// ---------------- UTIL ----------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

/* Closest distance SQUARED between two 2D segments (p1->q1) and (p2->q2).
 * Used for SWEPT COLLISION: segment 1 = knife tip sweep this frame,
 * segment 2 = ball trajectory this frame. Comparing the two moving
 * segments guarantees fast hand swings can never tunnel through a ball. */
function segSegDistSq(p1, q1, p2, q2) {
  const d1x = q1.x - p1.x, d1y = q1.y - p1.y;
  const d2x = q2.x - p2.x, d2y = q2.y - p2.y;
  const rx = p1.x - p2.x, ry = p1.y - p2.y;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  let s, t;
  if (a <= 1e-9 && e <= 1e-9) { s = 0; t = 0; }
  else if (a <= 1e-9) { s = 0; t = clamp(f / e, 0, 1); }
  else {
    const c = d1x * rx + d1y * ry;
    if (e <= 1e-9) { t = 0; s = clamp(-c / a, 0, 1); }
    else {
      const b = d1x * d2x + d1y * d2y;
      const den = a * e - b * b;
      s = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
      else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const cx = (p1.x + d1x * s) - (p2.x + d2x * t);
  const cy = (p1.y + d1y * s) - (p2.y + d2y * t);
  return cx * cx + cy * cy;
}

// ---------------- AUDIO (procedural WebAudio, no asset files) ----------------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}
function playSlice(comboN) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  // noise burst through a sweeping bandpass = "shing"
  const dur = 0.16;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(3400, t0);
  bp.frequency.exponentialRampToValueAtTime(520, t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.5, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(bp).connect(g).connect(audioCtx.destination);
  src.start(t0); src.stop(t0 + dur);
  // rising combo ping
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520 + Math.min(comboN, 9) * 70, t0);
  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.18, t0);
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
  osc.connect(g2).connect(audioCtx.destination);
  osc.start(t0); osc.stop(t0 + 0.13);
}
function playMiss() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(170, t0);
  osc.frequency.exponentialRampToValueAtTime(58, t0 + 0.3);
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.22, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  osc.connect(lp).connect(g).connect(audioCtx.destination);
  osc.start(t0); osc.stop(t0 + 0.32);
}
function playGameOver() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  [392, 311, 233, 155].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    const ts = t0 + i * 0.16;
    g.gain.setValueAtTime(0.001, ts);
    g.gain.linearRampToValueAtTime(0.2, ts + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ts + 0.3);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(ts); osc.stop(ts + 0.32);
  });
}

// ---------------- MEDIAPIPE SINGLE-HAND TRACKING ----------------
let mpHands = null;
let mpCamera = null;
let mpReady = false;

function initMediaPipe() {
  if (mpReady || typeof Hands === 'undefined') return mpReady;
  try {
    mpHands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    mpHands.setOptions({
      maxNumHands: 1,            // ONE HAND ONLY — numHands = 1
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });
    mpHands.onResults(onHandResults);
    mpReady = true;
    setTracker('3D HAND TRACKER ACTIVE', 'emerald');
  } catch (err) {
    console.warn('MediaPipe init failed:', err);
    setTracker('POINTER MODE (tracker offline)', 'amber');
  }
  return mpReady;
}

// ONE HAND results -> knife position
function onHandResults(results) {
  const now = state.time;
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const lm = results.multiHandLandmarks[0];   // exactly one hand

    // Mirror X for selfie view, scale to canvas px
    const tip = { x: (1 - lm[8].x) * CANVAS_W, y: lm[8].y * CANVAS_H };      // index fingertip
    const mcp = { x: (1 - lm[5].x) * CANVAS_W, y: lm[5].y * CANVAS_H };      // index knuckle

    // blade direction: knuckle -> fingertip, extended outward past the fingertip
    let ux = tip.x - mcp.x, uy = tip.y - mcp.y;
    const len = Math.hypot(ux, uy) || 1;
    ux /= len; uy /= len;

    const targetHilt = { x: mcp.x - ux * 26, y: mcp.y - uy * 26 };
    const targetTip = { x: tip.x + ux * 150, y: tip.y + uy * 150 };

    // adaptive smoothing: soft when steady, tight when slashing fast
    const d = Math.hypot(targetTip.x - knife.tip.x, targetTip.y - knife.tip.y);
    const a = clamp(0.35 + d / 55, 0.35, 1);

    knife.tip.x += (targetTip.x - knife.tip.x) * a;
    knife.tip.y += (targetTip.y - knife.tip.y) * a;
    knife.hilt.x += (targetHilt.x - knife.hilt.x) * a;
    knife.hilt.y += (targetHilt.y - knife.hilt.y) * a;
    knife.angle = Math.atan2(knife.tip.y - knife.hilt.y, knife.tip.x - knife.hilt.x);

    knife.source = 'hand';
    knife.handAt = now;
    setHandLock(true);
  } else {
    setHandLock(false);
  }
}

function setTracker(text, color) {
  el.trackerText.textContent = text;
  const cls = {
    emerald: 'w-2 h-2 rounded-full bg-emerald-400',
    amber: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse',
    slate: 'w-2 h-2 rounded-full bg-slate-500',
  }[color] || 'w-2 h-2 rounded-full bg-slate-500';
  el.trackerDot.className = cls;
}
function setHandLock(present) {
  if (present) {
    el.handLockText.textContent = 'Hand locked — knife active';
    el.handLockText.className = 'text-xs font-medium text-emerald-400 transition-colors';
    el.handLockIcon.className = 'fa-solid fa-hand text-xs text-emerald-400';
  } else {
    el.handLockText.textContent = 'No hand in view';
    el.handLockText.className = 'text-xs font-medium text-slate-500 transition-colors';
    el.handLockIcon.className = 'fa-solid fa-hand text-xs text-slate-500';
  }
}

// ---------------- CAMERA ----------------
async function startCamera() {
  el.btnStartCamera.disabled = true;
  el.btnStartCamera.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> STARTING CAMERA…';
  el.cameraErrorText.textContent = '';
  setCamStatus('starting');

  const mpOk = initMediaPipe();
  if (!mpOk) setTracker('POINTER MODE (tracker offline)', 'amber');

  try {
    if (typeof Camera === 'undefined') throw new Error('camera_utils failed to load');
    mpCamera = new Camera(video, {
      onFrame: async () => {
        if (mpHands) { try { await mpHands.send({ image: video }); } catch (e) { /* frame skip */ } }
      },
      width: 1280,
      height: 720
    });
    await mpCamera.start();
    state.cameraOn = true;
    setCamStatus('on');
    el.cameraOverlay.classList.add('hidden');
    el.gameStartOverlay.classList.remove('hidden');
    el.gameStartOverlay.classList.add('flex');
    el.modeNote.textContent = 'MODE: CAMERA READY — HAND / POINTER KNIFE';
    if (!mpOk) {
      el.cameraErrorText.textContent = 'Hand tracker unavailable — pointer knife active.';
    }
  } catch (err) {
    console.warn('Camera failed:', err);
    setCamStatus('blocked');
    el.cameraErrorText.textContent = 'Camera blocked — click START GAME to play with mouse / touch.';
    el.cameraOverlay.classList.add('hidden');
    el.gameStartOverlay.classList.remove('hidden');
    el.gameStartOverlay.classList.add('flex');
    el.modeNote.textContent = 'MODE: POINTER KNIFE (camera unavailable)';
  } finally {
    el.btnStartCamera.disabled = false;
    el.btnStartCamera.innerHTML = '<i class="fa-solid fa-camera"></i> START CAMERA';
  }
}

function setCamStatus(s) {
  if (s === 'on') {
    el.camDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
    el.camText.textContent = 'CAMERA LIVE';
  } else if (s === 'starting') {
    el.camDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
    el.camText.textContent = 'STARTING CAMERA…';
  } else if (s === 'blocked') {
    el.camDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
    el.camText.textContent = 'CAMERA BLOCKED';
  } else {
    el.camDot.className = 'w-2.5 h-2.5 rounded-full bg-slate-600';
    el.camText.textContent = 'CAMERA OFF';
  }
}

// ---------------- POINTER FALLBACK KNIFE ----------------
// Active only when no real hand has been seen recently — lets you test
// instantly on any desktop; a tracked hand always takes priority.
function onPointerMove(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width * CANVAS_W;
  const y = (ev.clientY - rect.top) / rect.height * CANVAS_H;
  if (state.time - knife.handAt < 0.5) return;      // real hand in control
  const d = Math.hypot(x - knife.tip.x, y - knife.tip.y);
  const a = clamp(0.45 + d / 55, 0.45, 1);
  knife.tip.x += (x - knife.tip.x) * a;
  knife.tip.y += (y - knife.tip.y) * a;
  knife.angle += ((-Math.PI / 2) - knife.angle) * 0.15;
  knife.hilt.x = knife.tip.x - Math.cos(knife.angle) * 175;
  knife.hilt.y = knife.tip.y - Math.sin(knife.angle) * 175;
  knife.source = 'pointer';
  knife.pointerAt = state.time;
}
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerdown', (ev) => { onPointerMove(ev); ensureAudio(); });

// ---------------- GAME FLOW ----------------
function startGame() {
  ensureAudio();
  resetRound();
  state.phase = 'playing';
  el.cameraOverlay.classList.add('hidden');
  el.gameStartOverlay.classList.add('hidden');
  el.gameoverOverlay.classList.add('hidden');
  el.hud.classList.remove('hidden');
  el.modeNote.textContent = 'MODE: PLAYING — SLASH THE BALLS';
  updateHUD();
}

function resetRound() {
  state.score = 0;
  state.combo = 0;
  state.misses = 0;
  state.lives = MAX_MISSES;
  state.lastCutAt = -1e9;
  state.spawnTimer = 700;   // first ball arrives quickly
  state.spawnInterval = SPAWN_START;
  state.shake = 0;
  balls.length = 0;
  halves.length = 0;
  particles.length = 0;
  trail.length = 0;
}

function gameOver() {
  state.phase = 'gameover';
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('knife-best-score', String(state.best));
  }
  el.finalScore.textContent = String(state.score);
  el.bestScore.textContent = String(state.best);
  el.gameoverSub.textContent = state.misses + ' balls escaped the blade';
  el.gameoverOverlay.classList.remove('hidden');
  el.gameoverOverlay.classList.add('flex');
  el.handHint.style.opacity = '0';
  el.modeNote.textContent = 'MODE: GAME OVER — RESTART TO PLAY AGAIN';
  playGameOver();
}

el.btnStartCamera.addEventListener('click', () => { ensureAudio(); startCamera(); });
el.btnStartGame.addEventListener('click', startGame);
el.btnRestart.addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.phase === 'camera-off') startCamera();
    else if (state.phase === 'ready' || state.phase === 'gameover') startGame();
  } else if (e.code === 'KeyR' && state.phase === 'gameover') {
    startGame();
  }
});

// ---------------- BALLS ----------------
function spawnBall() {
  const r = rand(BALL_RADIUS_MIN, BALL_RADIUS_MAX);
  const x = rand(CANVAS_W * 0.15, CANVAS_W * 0.85);
  const peak = rand(CANVAS_H * 0.55, CANVAS_H * 0.85);       // how high it flies
  const vy = -Math.sqrt(2 * GRAVITY * peak);                 // projectile launch speed
  const vx = rand(-1, 1) * CANVAS_W * 0.055;
  balls.push({
    x, y: CANVAS_H + r + 12, px: x, py: CANVAS_H + r + 12,
    vx, vy, r,
    hue: Math.floor(rand(0, 360)),
  });
}

function cutBall(b, idx) {
  balls.splice(idx, 1);

  // combo: fast consecutive cuts
  const now = state.time;
  if (now - state.lastCutAt <= COMBO_WINDOW) state.combo += 1;
  else state.combo = 1;
  state.lastCutAt = now;
  const mult = Math.min(state.combo, 8);
  state.score += 10 * mult;

  // cut direction: knife sweep (fallback: blade axis)
  let dx = knife.tip.x - knife.prevTip.x, dy = knife.tip.y - knife.prevTip.y;
  const dl = Math.hypot(dx, dy);
  if (dl < 4) { dx = Math.cos(knife.angle); dy = Math.sin(knife.angle); }
  else { dx /= dl; dy /= dl; }
  const px = -dy, py = dx;   // perpendicular = split direction

  // BALL SPLITS into two spinning halves flying apart
  for (const s of [-1, 1]) {
    halves.push({
      x: b.x + px * s * b.r * 0.45,
      y: b.y + py * s * b.r * 0.45,
      vx: b.vx * 0.35 + px * s * rand(180, 260) + dx * 70,
      vy: b.vy * 0.35 + py * s * rand(180, 260) - 120,
      r: b.r * 0.62,
      hue: b.hue,
      rot: Math.atan2(dy, dx) + (s > 0 ? 0 : Math.PI),
      vrot: s * rand(3, 7),
      alpha: 1,
    });
  }

  // spark particles along the cut
  for (let i = 0; i < 16; i++) {
    const sp = rand(60, 380);
    const an = Math.atan2(dy, dx) + rand(-0.9, 0.9);
    particles.push({
      x: b.x, y: b.y,
      vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60,
      life: rand(0.25, 0.6), maxLife: 0.6,
      size: rand(1.5, 4), hue: b.hue,
    });
  }

  state.shake = Math.min(state.shake + 5, 12);
  playSlice(state.combo);
  if (state.combo >= 2) popCombo(state.combo);
  updateHUD();
}

function registerMiss(b) {
  state.misses += 1;
  state.lives = MAX_MISSES - state.misses;
  state.combo = 0;
  state.shake = Math.min(state.shake + 7, 14);
  playMiss();
  flashMiss();
  updateHUD();
  if (state.lives <= 0) gameOver();
}

// ---------------- UPDATE ----------------
function update(dt) {
  const now = state.time;

  // spawn flying balls
  if (state.phase === 'playing') {
    state.spawnTimer -= dt * 1000;
    if (state.spawnTimer <= 0) {
      spawnBall();
      if (state.score >= 150 && Math.random() < 0.35) spawnBall();
      state.spawnInterval = Math.max(SPAWN_MIN, SPAWN_START - state.score * 3.2);
      state.spawnTimer = state.spawnInterval * rand(0.8, 1.25);
    }
  }

  // balls: projectile physics + swept collision vs knife
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    b.px = b.x; b.py = b.y;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (state.phase === 'playing') {
      const prev = { x: b.px, y: b.py };
      const cur = { x: b.x, y: b.y };
      const thr = b.r + BLADE_HALF_WIDTH;

      // SWEPT LINE-SEGMENT COLLISION:
      // knife tip sweep (prevTip -> tip) vs ball path (prev -> cur)
      let hit = segSegDistSq(knife.prevTip, knife.tip, prev, cur) <= thr * thr;
      // plus the full blade at its current position (covers a held-still blade)
      if (!hit) hit = segSegDistSq(knife.hilt, knife.tip, prev, cur) <= thr * thr;

      if (hit) { cutBall(b, i); continue; }

      // missed: fell off the bottom or flew out the sides
      if ((b.y - b.r > CANVAS_H + 40 && b.vy > 0) ||
          b.x < -160 || b.x > CANVAS_W + 160) {
        balls.splice(i, 1);
        registerMiss(b);
      }
    } else if (b.y - b.r > CANVAS_H + 60) {
      balls.splice(i, 1);
    }
  }

  // halves
  for (let i = halves.length - 1; i >= 0; i--) {
    const h = halves[i];
    h.vy += GRAVITY * 0.9 * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rot += h.vrot * dt;
    h.alpha -= dt * 0.55;
    if (h.alpha <= 0 || h.y - h.r > CANVAS_H + 60) halves.splice(i, 1);
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += GRAVITY * 0.35 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  // combo expiry
  if (state.combo > 0 && now - state.lastCutAt > COMBO_WINDOW) {
    state.combo = 0;
    updateHUD();
  }

  // trail bookkeeping
  trail.push({ x: knife.tip.x, y: knife.tip.y, t: now });
  while (trail.length && now - trail[0].t > TRAIL_AGE) trail.shift();
  if (trail.length > 90) trail.shift();

  // hand hint during play (only if neither hand nor pointer recently)
  const idleKnife = (now - knife.handAt > 1.5) && (now - knife.pointerAt > 1.5);
  if (state.phase === 'playing') {
    el.handHint.style.opacity = idleKnife ? '1' : '0';
  }

  state.shake = Math.max(0, state.shake - dt * 26);
}

// ---------------- RENDER ----------------
function drawVideoCover() {
  if (!state.cameraOn || video.readyState < 2) {
    // standby backdrop
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(1, '#0a0f1c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = 'rgba(56,189,248,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
    for (let y = 0; y < CANVAS_H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }
    return;
  }
  // draw camera frame mirrored, cover-fit
  const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
  const scale = Math.max(CANVAS_W / vw, CANVAS_H / vh);
  const dw = vw * scale, dh = vh * scale;
  const dx = (CANVAS_W - dw) / 2, dy = (CANVAS_H - dh) / 2;
  ctx.save();
  ctx.translate(CANVAS_W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, CANVAS_W - dx - dw, dy, dw, dh);
  ctx.restore();
}

function drawBall(b) {
  const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
  g.addColorStop(0, `hsl(${b.hue}, 95%, 74%)`);
  g.addColorStop(0.55, `hsl(${b.hue}, 85%, 55%)`);
  g.addColorStop(1, `hsl(${(b.hue + 25) % 360}, 82%, 32%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `hsla(${b.hue}, 100%, 86%, 0.85)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 1.22, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHalf(h) {
  ctx.save();
  ctx.globalAlpha = clamp(h.alpha, 0, 1);
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);
  const g = ctx.createRadialGradient(-h.r * 0.2, -h.r * 0.2, h.r * 0.1, 0, 0, h.r);
  g.addColorStop(0, `hsl(${h.hue}, 92%, 66%)`);
  g.addColorStop(1, `hsl(${(h.hue + 25) % 360}, 82%, 34%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, h.r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `hsla(${h.hue}, 100%, 88%, 0.8)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, ${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawTrail() {
  if (trail.length < 2) return;
  const now = state.time;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 1; i < trail.length; i++) {
    const age = 1 - (now - trail[i].t) / TRAIL_AGE;      // 1 = fresh
    if (age <= 0) continue;
    // soft glow pass
    ctx.strokeStyle = `rgba(56, 200, 255, ${0.22 * age})`;
    ctx.lineWidth = 4 + 14 * age;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
    // bright core pass
    ctx.strokeStyle = `rgba(230, 252, 255, ${0.75 * age})`;
    ctx.lineWidth = 1 + 3.5 * age;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawKnife() {
  const hx = knife.hilt.x, hy = knife.hilt.y;
  const tx = knife.tip.x, ty = knife.tip.y;
  const ang = Math.atan2(ty - hy, tx - hx);
  const L = Math.hypot(tx - hx, ty - hy);
  if (L < 20) return;

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang);

  // grip (0 -> 0.16L)
  ctx.fillStyle = '#1e293b';
  roundRect(0, -7, L * 0.16, 14, 6); ctx.fill();
  ctx.fillStyle = '#334155';
  roundRect(L * 0.02, -5, L * 0.12, 10, 4); ctx.fill();
  // pommel
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(2, 0, 8, 0, Math.PI * 2); ctx.fill();

  // crossguard
  ctx.fillStyle = '#94a3b8';
  roundRect(L * 0.16, -16, 10, 32, 4); ctx.fill();

  // blade (0.20L -> L) with metallic gradient
  const bg = ctx.createLinearGradient(L * 0.2, 0, L, 0);
  bg.addColorStop(0, '#7d95a8');
  bg.addColorStop(0.35, '#dbeaf5');
  bg.addColorStop(0.75, '#f4fbff');
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(L * 0.20, -9);
  ctx.lineTo(L * 0.86, -8);
  ctx.quadraticCurveTo(L * 0.96, -5, L, 0);        // tip
  ctx.lineTo(L * 0.86, 4);
  ctx.lineTo(L * 0.20, 6);
  ctx.closePath();
  ctx.fill();
  // center ridge
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(L * 0.24, -2);
  ctx.lineTo(L * 0.9, -1);
  ctx.stroke();
  // edge glint
  ctx.strokeStyle = 'rgba(56,189,248,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(L * 0.24, 5);
  ctx.lineTo(L * 0.85, 3);
  ctx.stroke();

  ctx.restore();

  // soft glow at the tip
  const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 46);
  glow.addColorStop(0, 'rgba(125, 211, 252, 0.28)');
  glow.addColorStop(1, 'rgba(125, 211, 252, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(tx, ty, 46, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVignette() {
  const g = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.45, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function render() {
  ctx.save();
  if (state.shake > 0.3) {
    ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
  }
  drawVideoCover();
  drawVignette();
  for (const h of halves) drawHalf(h);
  for (const b of balls) drawBall(b);
  drawParticles();
  drawTrail();
  if (state.phase !== 'camera-off') drawKnife();
  ctx.restore();
}

// ---------------- HUD ----------------
let hudCache = '';
function updateHUD() {
  const key = state.score + '|' + state.combo + '|' + state.lives;
  if (key === hudCache) return;
  hudCache = key;
  el.hudScore.textContent = String(state.score);
  el.hudCombo.textContent = state.combo > 1 ? 'x' + Math.min(state.combo, 8) : 'x1';
  el.hudCombo.className = 'hud-value ' + (state.combo > 1 ? 'text-amber-300' : 'text-slate-400');
  const hearts = el.hudLives.children;
  for (let i = 0; i < hearts.length; i++) {
    hearts[i].className = i < state.lives ? 'fa-solid fa-heart life-on' : 'fa-solid fa-heart life-off';
  }
}

function popCombo(n) {
  el.comboPopText.textContent = 'COMBO x' + Math.min(n, 8) + '!';
  el.comboPop.classList.remove('combo-pop-anim');
  void el.comboPop.offsetWidth;   // reflow to restart animation
  el.comboPop.classList.add('combo-pop-anim');
}

function flashMiss() {
  el.missFlash.classList.remove('miss-flash-anim');
  void el.missFlash.offsetWidth;
  el.missFlash.classList.add('miss-flash-anim');
}

// ---------------- MAIN LOOP ----------------
let lastFrame = performance.now();
let fpsFrames = 0;
let fpsLast = performance.now();

function loop(nowMs) {
  const dt = clamp((nowMs - lastFrame) / 1000, 0, 0.033);
  lastFrame = nowMs;
  state.time += dt;

  // snapshot previous tip BEFORE update -> sweep segment for this frame
  knife.prevTip.x = knife.tip.x;
  knife.prevTip.y = knife.tip.y;

  update(dt);
  render();

  // fps
  fpsFrames++;
  if (nowMs - fpsLast >= 500) {
    el.fps.textContent = Math.round(fpsFrames * 1000 / (nowMs - fpsLast)) + ' FPS';
    fpsFrames = 0;
    fpsLast = nowMs;
  }

  requestAnimationFrame(loop);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) lastFrame = performance.now();
});

// boot
setTracker(typeof Hands === 'undefined' ? 'POINTER MODE (tracker offline)' : 'TRACKER READY', typeof Hands === 'undefined' ? 'amber' : 'slate');
requestAnimationFrame(loop);
