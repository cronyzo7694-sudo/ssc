# 🗡️ One-Hand Knife Cutting Game

A live-camera arcade game: your **one hand** controls a **virtual knife**. Slash through **flying balls** to split them, chain cuts for combos, and don't let three balls drop.

**Play:** https://cronyzo7694-sudo.github.io/ssc/

## 🎮 Gameplay Loop

```
CAMERA → ONE HAND TRACKING → HAND MOVEMENT → VIRTUAL KNIFE
       → KNIFE TRAIL → FLYING BALLS → SWEPT SEGMENT COLLISION
       → BALL SPLITS → SCORE / COMBO / LIVES → RESTART
```

## 🕹️ How to Play

1. **START CAMERA** — allow the browser camera permission.
2. Show **one hand** (single-hand tracking, `numHands = 1`). The knife locks onto your **index fingertip**.
3. **START GAME** — balls launch from the bottom with projectile physics (gravity arcs).
4. Slash through balls to **split** them. Points per cut scale with your **combo** (consecutive cuts within 1.25 s).
5. Every ball that falls off-screen uncut costs a life. **3 misses = game over.** Restart instantly with the button or `R`.
6. No camera? A **mouse/touch pointer knife** fallback is active until a real hand is detected.

## ⚙️ Technical Notes

- **Hand tracking:** MediaPipe Hands (21 3D landmarks) via CDN, configured with `maxNumHands: 1` — strictly one hand.
- **Knife:** anchored to the index fingertip, oriented along the index knuckle→fingertip axis, with adaptive smoothing (steady = smooth, slashing = 1:1 responsive).
- **Slash trail:** time-decayed tapered polyline rendered with additive compositing.
- **Physics:** balls are projectiles with gravity, launch speed derived from a target peak height (55–85 % of the screen).
- **Anti-tunneling collision:** swept line-segment vs line-segment test (knife-tip sweep segment against the ball's per-frame motion segment, plus the full blade segment) — fast swings cannot pass through a ball between frames.
- **Rendering:** single 2D canvas (1280×720) over the mirrored camera feed; HUD is DOM.
- **Audio:** procedural Web Audio synthesis (slice/miss/game-over) — zero audio asset files.
- No service worker, no build step: static `index.html` + `app.js` + `style.css` served from the repository root by GitHub Pages.
