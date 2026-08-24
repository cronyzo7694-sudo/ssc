/**
 * ============================================================================
 * REALISTIC PALM FIRE AR ENGINE
 * Single-Hand Live Camera Combustion Simulation & 3D Hand Tracking
 * ============================================================================
 * 
 * Pipeline:
 *  1. MediaPipe 3D Hand Landmarker (numHands = 1, 21 Landmarks, Video Tracking)
 *  2. Anatomical Palm Anchor & 3D Normal Orientation Estimation
 *  3. Adaptive 1-Euro Temporal Filtering (Zero Jitter + Low Latency)
 *  4. Dynamic Hand Velocity, Acceleration & Momentum Modeling
 *  5. WebGL 2.0 / 1.0 Shader Engine:
 *     - Multi-Octave 3D Simplex & Curl Noise Procedural Combustion
 *     - Blackbody Radiation Gradient (White-Hot Core, Gold Body, Crimson Tongues, Blue Root)
 *     - Localized Heat Haze Refraction & Air Density Distortion
 *     - Dynamic Hand Point-Light Illumination with High-Frequency Flicker
 *     - Depth-Aware Foreground Finger Occlusion (CAMERA -> HAND -> FIRE)
 *  6. Physical Incandescent Embers & Soft Smoke Plume Simulation
 *  7. Procedural Real-time Audio Synthesizer (Web Audio API combustion roar & crackle)
 */

// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================

const arCanvas = document.getElementById('ar-canvas');
const webcamVideo = document.getElementById('webcam-video');

const state = {
  isCameraActive: false,
  isFireActive: false,
  flameIntensity: 1.0,     // 0.4 to 2.2
  heatDistortion: true,
  soundEnabled: true,
  isFlipped: true,         // Mirror selfie view
  isRecording: false,
  time: 0,
  lastFrameTime: performance.now(),
  fps: 60,

  // Single Hand Tracking State
  hand: {
    detected: false,
    confidence: 0.0,
    fadeAlpha: 0.0,        // Smooth fade in/out on detection change
    
    // Position (Screen Pixels)
    x: 640,
    y: 420,
    z: 0,
    
    // Geometry & Scale
    radius: 70,            // Palm radius in pixels
    angle: 0.0,            // 2D rotation angle in radians
    
    // 3D Palm Orientation
    normal: { x: 0, y: 0, z: -1 }, // Vector pointing outwards from palm
    facingCamera: 1.0,     // 1.0: palm facing camera, -1.0: back of hand facing camera
    
    // Motion Physics
    vx: 0,
    vy: 0,
    speed: 0,
    inertiaX: 0,
    inertiaY: 0,

    // 21 Landmarks in Screen Coordinates
    landmarks: [],

    // Foreground Finger Segments for Occlusion
    foregroundSegments: []
  }
};

// ==========================================
// 2. 1-EURO FILTER (JITTER REDUCTION + ZERO-LAG)
// ==========================================

class OneEuroFilter {
  constructor(minCutoff = 1.0, beta = 0.015, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x, t) {
    if (this.tPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = t;
      return x;
    }

    const dt = Math.max((t - this.tPrev) / 1000.0, 0.001);
    this.tPrev = t;

    // Filter derivative
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1.0 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    // Filter value with adaptive cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1.0 - a) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

// Filter instances for hand tracking channels
const filterX = new OneEuroFilter(1.2, 0.02, 1.0);
const filterY = new OneEuroFilter(1.2, 0.02, 1.0);
const filterZ = new OneEuroFilter(1.0, 0.01, 1.0);
const filterRadius = new OneEuroFilter(0.8, 0.01, 1.0);
const filterAngle = new OneEuroFilter(1.5, 0.02, 1.0);

// ==========================================
// 3. PHYSICAL EMBER & SMOKE SIMULATION
// ==========================================

const MAX_EMBERS = 35;
const embers = [];

for (let i = 0; i < MAX_EMBERS; i++) {
  embers.push({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 3,
    life: 0,
    maxLife: 1.0,
    temp: 1.0,
    wobbleFreq: 5 + Math.random() * 8,
    wobblePhase: Math.random() * Math.PI * 2
  });
}

function spawnEmber(originX, originY, palmRadius, palmVx, palmVy) {
  for (let i = 0; i < MAX_EMBERS; i++) {
    const e = embers[i];
    if (!e.active) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * palmRadius * 0.5;
      e.active = true;
      e.x = originX + Math.cos(angle) * dist;
      e.y = originY + Math.sin(angle) * dist;
      
      // Thermal upward updraft + palm velocity momentum + random pop
      e.vx = (Math.random() - 0.5) * 45 + palmVx * 0.25;
      e.vy = -(80 + Math.random() * 120) * state.flameIntensity + palmVy * 0.2;
      e.size = (2.5 + Math.random() * 4.0) * state.flameIntensity;
      e.life = 0;
      e.maxLife = 0.6 + Math.random() * 0.9;
      e.temp = 1.0;
      e.wobbleFreq = 4 + Math.random() * 10;
      e.wobblePhase = Math.random() * Math.PI * 2;
      break;
    }
  }
}

function updateEmbers(dt) {
  for (let i = 0; i < MAX_EMBERS; i++) {
    const e = embers[i];
    if (!e.active) continue;

    e.life += dt;
    if (e.life >= e.maxLife) {
      e.active = false;
      continue;
    }

    const progress = e.life / e.maxLife;
    e.temp = Math.max(0.0, 1.0 - progress);

    // Forces: thermal lift, air resistance, curl turbulence
    e.vy -= 40 * dt; // Upward thermal buoyancy
    e.vx *= Math.pow(0.85, dt * 60);
    e.vy *= Math.pow(0.92, dt * 60);

    const turbulence = Math.sin(state.time * e.wobbleFreq + e.wobblePhase) * 60;
    e.x += (e.vx + turbulence) * dt;
    e.y += e.vy * dt;
  }
}

// Soft Smoke Plume Simulation
const MAX_SMOKE = 20;
const smokePuffs = [];
for (let i = 0; i < MAX_SMOKE; i++) {
  smokePuffs.push({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 20,
    life: 0,
    maxLife: 1.5,
    opacity: 0.1
  });
}

function spawnSmoke(x, y, radius, palmVx) {
  for (let i = 0; i < MAX_SMOKE; i++) {
    const s = smokePuffs[i];
    if (!s.active) {
      s.active = true;
      s.x = x + (Math.random() - 0.5) * radius * 0.6;
      s.y = y;
      s.vx = (Math.random() - 0.5) * 30 + palmVx * 0.15;
      s.vy = -(60 + Math.random() * 50);
      s.size = radius * 0.4;
      s.life = 0;
      s.maxLife = 1.2 + Math.random() * 0.8;
      s.opacity = 0.08 + Math.random() * 0.05;
      break;
    }
  }
}

function updateSmoke(dt) {
  for (let i = 0; i < MAX_SMOKE; i++) {
    const s = smokePuffs[i];
    if (!s.active) continue;

    s.life += dt;
    if (s.life >= s.maxLife) {
      s.active = false;
      continue;
    }

    s.size += 40 * dt; // Expansion
    s.x += s.vx * dt;
    s.y += s.vy * dt;
  }
}

// ==========================================
// 4. WEBGL 2.0 / 1.0 SHADER RENDERING PIPELINE
// ==========================================

let gl = null;
let glProgram = null;
let videoTexture = null;
let quadVBO = null;

// Uniform Locations
let uLoc = {};

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    // Flip Y for WebGL texture coordinates
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  varying vec2 v_uv;

  uniform sampler2D u_videoTex;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform bool u_isFlipped;

  // Hand & Fire Parameters
  uniform bool u_fireActive;
  uniform float u_flameAlpha;       // Smooth fade alpha [0, 1]
  uniform vec2 u_palmPos;           // Screen coords in pixels (0..width, 0..height)
  uniform float u_palmRadius;       // In pixels
  uniform float u_palmAngle;        // Rotation angle (radians)
  uniform vec2 u_velocity;          // Hand velocity vector
  uniform vec3 u_palmNormal;        // 3D palm normal
  uniform float u_facingCamera;     // 1.0 = palm towards camera
  uniform float u_intensity;        // 0.4 .. 2.2
  uniform bool u_heatDistortion;

  // Foreground Finger Occlusion Segments (Up to 12 capsules: [p1.x, p1.y, p2.x, p2.y])
  uniform int u_numOccluders;
  uniform vec4 u_occluders[12];
  uniform float u_occluderRadii[12];

  // -------------------------------------------------------------
  // Fast 3D Simplex & Gradient Noise in GLSL
  // -------------------------------------------------------------
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix contributions
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // -------------------------------------------------------------
  // Multi-Octave Turbulent Combustion Noise
  // -------------------------------------------------------------
  float fireNoise(vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    
    // Octave 1: Macro Body
    sum += amp * snoise(p * freq);
    
    // Domain warp for curling tongues (Vorticity)
    vec3 warp = vec3(
      snoise(p * 2.0 + vec3(0.0, 0.0, u_time * 0.6)),
      snoise(p * 2.0 + vec3(5.2, 1.3, u_time * 0.6)),
      0.0
    );
    
    // Octave 2: Mid tongues
    amp *= 0.5;
    freq *= 2.1;
    sum += amp * snoise((p + warp * 0.45) * freq);
    
    // Octave 3: Micro turbulence
    amp *= 0.25;
    freq *= 2.3;
    sum += amp * snoise(p * freq + warp * 0.2);

    return sum;
  }

  // -------------------------------------------------------------
  // Blackbody Radiation Combustion Color Gradient
  // -------------------------------------------------------------
  vec4 getFireColor(float temp, float distToPalmNormalized, float yLocal) {
    // True Physical Blackbody & Hydrocarbon Combustion Curve:
    // Core (>0.85): Incandescent White-Hot
    // Mid (>0.60): Golden Yellow
    // Body (>0.35): Intense Fire Orange
    // Outer (>0.12): Rich Crimson Red
    // Boundary (>0.02): Dark Sooty Ember Red
    // Base interface: Subtle Blue ignition radical glow
    
    vec3 cWhite  = vec3(1.0, 0.98, 0.92);
    vec3 cYellow = vec3(1.0, 0.82, 0.15);
    vec3 cOrange = vec3(1.0, 0.40, 0.02);
    vec3 cRed    = vec3(0.85, 0.08, 0.01);
    vec3 cSoot   = vec3(0.28, 0.02, 0.0);
    vec3 cBlue   = vec3(0.12, 0.48, 1.0); // Blue radical ignition rim

    vec3 rgb = vec3(0.0);
    float alpha = 0.0;

    if (temp > 0.82) {
      float f = (temp - 0.82) / 0.18;
      rgb = mix(cYellow, cWhite, f * f);
      alpha = 1.0;
    } else if (temp > 0.58) {
      float f = (temp - 0.58) / 0.24;
      rgb = mix(cOrange, cYellow, f);
      alpha = 0.95 + 0.05 * f;
    } else if (temp > 0.32) {
      float f = (temp - 0.32) / 0.26;
      rgb = mix(cRed, cOrange, f);
      alpha = 0.85 + 0.10 * f;
    } else if (temp > 0.10) {
      float f = (temp - 0.10) / 0.22;
      rgb = mix(cSoot, cRed, f);
      alpha = 0.45 + 0.40 * f;
    } else if (temp > 0.02) {
      float f = (temp - 0.02) / 0.08;
      rgb = mix(vec3(0.0), cSoot, f);
      alpha = 0.45 * f;
    }

    // Radical Blue ignition base near palm hollow
    if (yLocal > -0.2 && yLocal < 0.35 && temp > 0.15 && temp < 0.75) {
      float blueFactor = (1.0 - smoothstep(0.0, 0.35, yLocal)) * (1.0 - smoothstep(0.3, 0.75, temp)) * 0.45;
      rgb = mix(rgb, cBlue, blueFactor);
    }

    return vec4(rgb, alpha);
  }

  // -------------------------------------------------------------
  // Distance to Line Segment (Capsule Distance for Finger Occlusion)
  // -------------------------------------------------------------
  float distToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    // Current pixel coordinate in screen space (pixels)
    vec2 fragCoord = v_uv * u_resolution;
    
    // 1. DYNAMIC HAND LIGHTING ILLUMINATION PASS
    // Flame casts flickering warm light onto hand skin and palm
    float distToPalm = length(fragCoord - u_palmPos);
    float lightRadius = u_palmRadius * 4.2 * u_intensity;
    
    // High-frequency natural flame flicker
    float flicker = 1.0 
      + 0.14 * sin(u_time * 19.3) 
      + 0.10 * sin(u_time * 31.7) 
      + 0.06 * cos(u_time * 47.1);
    
    float lightIntensity = 0.0;
    if (u_fireActive && u_flameAlpha > 0.01 && distToPalm < lightRadius) {
      float normDist = distToPalm / lightRadius;
      // Inverse-square physical attenuation
      lightIntensity = (1.0 / (1.0 + 3.0 * normDist + 8.0 * normDist * normDist)) 
                       * flicker * u_flameAlpha * u_intensity;
    }

    // 2. HEAT HAZE DISTORTION PASS
    // Refract background video texture subtly around flame column
    vec2 sampleUV = v_uv;
    if (u_heatDistortion && u_fireActive && u_flameAlpha > 0.05 && distToPalm < lightRadius * 1.2) {
      vec2 heatCoord = (fragCoord - u_palmPos) / (u_palmRadius * 2.0);
      
      // Rising thermal updraft noise
      vec3 heatNoiseP = vec3(heatCoord.x * 2.5, heatCoord.y * 2.0 - u_time * 4.5, u_time * 0.8);
      float hNoise = snoise(heatNoiseP);
      float hNoise2 = snoise(heatNoiseP + vec3(1.7, 4.3, 0.5));
      
      vec2 heatOffset = vec2(hNoise, hNoise2) * (0.006 * u_intensity * u_flameAlpha);
      
      // Restrict distortion strictly to the flame plume
      float heatMask = smoothstep(lightRadius * 1.1, u_palmRadius * 0.3, distToPalm);
      sampleUV += heatOffset * heatMask;
    }

    // Sample Base Camera Video Frame
    vec4 baseColor = texture2D(u_videoTex, sampleUV);

    // Apply Dynamic Warm Light Modulation to Video Frame
    if (lightIntensity > 0.005) {
      vec3 warmLight = vec3(1.0, 0.48, 0.12) * lightIntensity * 1.35;
      // Boost red and amber highlights, lift shadow tones
      baseColor.rgb += warmLight * (0.4 + 0.6 * baseColor.rgb);
    }

    // If fire is not active or completely faded, output illuminated camera frame
    if (!u_fireActive || u_flameAlpha < 0.005) {
      gl_FragColor = baseColor;
      return;
    }

    // 3. LOCAL FLAME COORDINATE SPACE
    // Calculate composite flame rise vector: Buoyancy (0, -1) + Palm vector + Inertia
    vec2 riseDir = vec2(0.0, -1.0); // Screen UP is -Y
    
    // Add hand velocity inertia (flame bends opposite to fast hand motion)
    vec2 velOffset = -u_velocity * 0.0025;
    riseDir += velOffset;
    
    // Palm orientation influence
    vec2 palmDir = vec2(sin(u_palmAngle), -cos(u_palmAngle));
    riseDir += palmDir * 0.35;
    riseDir = normalize(riseDir);

    vec2 perpDir = vec2(-riseDir.y, riseDir.x);

    // Vector from palm center to current pixel
    vec2 delta = fragCoord - u_palmPos;
    
    // Project into local coordinates (u = lateral, v = longitudinal along rise vector)
    float u = dot(delta, perpDir);
    float v = -dot(delta, riseDir); // Positive v = rising above palm

    // Normalize coordinates relative to palm radius
    float flameHeight = u_palmRadius * (2.8 + length(u_velocity) * 0.002) * u_intensity;
    float flameWidth = u_palmRadius * (1.15 + 0.15 * sin(u_time * 12.0)) * u_intensity;

    float normU = u / (flameWidth * 0.5);
    float normV = v / flameHeight;

    // Bounding check for flame evaluation
    if (normV < -0.35 || normV > 1.45 || abs(normU) > 1.5) {
      gl_FragColor = baseColor;
      return;
    }

    // 4. PROCEDURAL VOLUMETRIC FLAME SHAPE & NOISE ADVECTION
    // Physical flame envelope (Elliptical hollow base + narrowing parabolic neck + turbulent tip)
    float baseHollow = 1.0 - smoothstep(-0.35, 0.2, normV);
    float bodyWidth = (1.0 - 0.7 * normV) * (1.0 + 0.25 * sin(normV * 6.0 - u_time * 8.0));
    bodyWidth = max(bodyWidth, 0.15);

    float shapeEnvelope = 1.0 - (normU * normU) / (bodyWidth * bodyWidth);
    shapeEnvelope *= (1.0 - smoothstep(0.1, 1.0, normV));
    shapeEnvelope = clamp(shapeEnvelope, 0.0, 1.0);

    if (shapeEnvelope <= 0.001) {
      gl_FragColor = baseColor;
      return;
    }

    // 3D Simplex Noise Field Advecting Upwards
    vec3 noisePos = vec3(
      normU * 1.8,
      normV * 2.2 - u_time * 4.2 * (1.0 + 0.3 * u_intensity),
      u_time * 0.9
    );

    float noiseVal = fireNoise(noisePos);
    
    // Non-linear combustion density field
    float flameDensity = shapeEnvelope * (0.65 + 0.55 * noiseVal);
    
    // Core combustion boost near center hollow
    float coreDist = length(vec2(normU * 1.2, normV * 1.5));
    float coreBoost = exp(-coreDist * coreDist * 3.5) * 0.45;
    flameDensity += coreBoost;

    // Density threshold & temperature decay
    float temp = clamp((flameDensity - 0.12 * normV) / 0.85, 0.0, 1.0);

    if (temp <= 0.01) {
      gl_FragColor = baseColor;
      return;
    }

    // Compute Physical Blackbody Combustion Color
    vec4 fireColor = getFireColor(temp, distToPalm / (u_palmRadius * 2.0), normV);
    fireColor.a *= u_flameAlpha;

    // 5. DEPTH-AWARE FOREGROUND FINGER OCCLUSION
    // If a finger is closer to the camera than the palm base (z_finger < z_palm),
    // it MUST occlude the flame burning behind it!
    float fingerOcclusion = 0.0;
    for (int i = 0; i < 12; i++) {
      if (i >= u_numOccluders) break;
      vec4 seg = u_occluders[i];
      float segDist = distToSegment(fragCoord, seg.xy, seg.zw);
      float segRadius = u_occluderRadii[i];
      if (segDist < segRadius) {
        // Soft edge antialiasing for the finger silhouette
        float edge = 1.0 - smoothstep(segRadius - 3.5, segRadius, segDist);
        fingerOcclusion = max(fingerOcclusion, edge);
      }
    }

    // Flame is occluded where foreground fingers pass in front
    // (with subtle edge flame bleeding around finger rims for realism)
    fireColor.a *= (1.0 - fingerOcclusion * 0.94);

    // 6. COMPOSITING: CAMERA FEED + PHOTOREALISTIC FIRE
    // Additive + Alpha Blend for HDR Combustion Look
    vec3 compositeRGB = mix(baseColor.rgb, baseColor.rgb + fireColor.rgb * 1.25, fireColor.a);
    
    // Boost hot core brightness
    if (temp > 0.75) {
      compositeRGB += vec3(1.0, 0.9, 0.7) * (temp - 0.75) * 1.5 * fireColor.a;
    }

    gl_FragColor = vec4(compositeRGB, 1.0);
  }
`;

function initWebGL() {
  gl = arCanvas.getContext('webgl2', { alpha: false, depth: false, antialias: true }) ||
       arCanvas.getContext('webgl', { alpha: false, depth: false, antialias: true }) ||
       arCanvas.getContext('experimental-webgl');

  if (!gl) {
    console.error('WebGL not supported on this browser!');
    return false;
  }

  // Compile Shaders
  const vShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  glProgram = createProgram(gl, vShader, fShader);

  if (!glProgram) return false;

  gl.useProgram(glProgram);

  // Fullscreen Quad Buffer
  const quadVertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);

  quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(glProgram, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Create Video Texture
  videoTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Cache Uniform Locations
  uLoc = {
    u_videoTex: gl.getUniformLocation(glProgram, 'u_videoTex'),
    u_resolution: gl.getUniformLocation(glProgram, 'u_resolution'),
    u_time: gl.getUniformLocation(glProgram, 'u_time'),
    u_isFlipped: gl.getUniformLocation(glProgram, 'u_isFlipped'),
    u_fireActive: gl.getUniformLocation(glProgram, 'u_fireActive'),
    u_flameAlpha: gl.getUniformLocation(glProgram, 'u_flameAlpha'),
    u_palmPos: gl.getUniformLocation(glProgram, 'u_palmPos'),
    u_palmRadius: gl.getUniformLocation(glProgram, 'u_palmRadius'),
    u_palmAngle: gl.getUniformLocation(glProgram, 'u_palmAngle'),
    u_velocity: gl.getUniformLocation(glProgram, 'u_velocity'),
    u_palmNormal: gl.getUniformLocation(glProgram, 'u_palmNormal'),
    u_facingCamera: gl.getUniformLocation(glProgram, 'u_facingCamera'),
    u_intensity: gl.getUniformLocation(glProgram, 'u_intensity'),
    u_heatDistortion: gl.getUniformLocation(glProgram, 'u_heatDistortion'),
    u_numOccluders: gl.getUniformLocation(glProgram, 'u_numOccluders'),
    u_occluders: gl.getUniformLocation(glProgram, 'u_occluders'),
    u_occluderRadii: gl.getUniformLocation(glProgram, 'u_occluderRadii')
  };

  gl.uniform1i(uLoc.u_videoTex, 0);

  return true;
}

function createShader(glCtx, type, source) {
  const shader = glCtx.createShader(type);
  glCtx.shaderSource(shader, source);
  glCtx.compileShader(shader);
  if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
    console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
    glCtx.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(glCtx, vShader, fShader) {
  const prog = glCtx.createProgram();
  glCtx.attachShader(prog, vShader);
  glCtx.attachShader(prog, fShader);
  glCtx.linkProgram(prog);
  if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) {
    console.error('Program link error:', glCtx.getProgramInfoLog(prog));
    glCtx.deleteProgram(prog);
    return null;
  }
  return prog;
}

// ==========================================
// 5. MEDIAPIPE 3D SINGLE-HAND TRACKING
// ==========================================

let mpHands = null;
let mpCamera = null;
let isMediaPipeReady = false;

function initMediaPipe() {
  const badgeDot = document.getElementById('tracker-dot');
  const badgeText = document.getElementById('tracker-text');

  try {
    if (typeof Hands === 'undefined') {
      console.warn('MediaPipe Hands script not loaded from CDN yet. Activating high-speed fallback tracking.');
      badgeText.textContent = 'OPTICAL AI TRACKER';
      badgeDot.className = 'w-2 h-2 rounded-full bg-orange-400 animate-pulse';
      return;
    }

    mpHands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    mpHands.setOptions({
      maxNumHands: 1,           // ONLY ONE HAND
      modelComplexity: 1,       // 0: Light, 1: Full Precision
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    mpHands.onResults(onMediaPipeResults);
    isMediaPipeReady = true;

    badgeText.textContent = '3D HAND TRACKER ACTIVE';
    badgeDot.className = 'w-2 h-2 rounded-full bg-emerald-400';

  } catch (err) {
    console.warn('Error initializing MediaPipe Hands:', err);
    badgeText.textContent = 'OPTICAL AI TRACKER';
    badgeDot.className = 'w-2 h-2 rounded-full bg-orange-400 animate-pulse';
  }
}

// MediaPipe Results Callback
function onMediaPipeResults(results) {
  const now = performance.now();

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const rawLm = results.multiHandLandmarks[0]; // Exactly ONE hand
    
    // Scale landmarks to Canvas Pixel Coordinates
    const width = arCanvas.width;
    const height = arCanvas.height;

    const lm = rawLm.map(pt => {
      // If mirrored (selfie view), flip X
      const screenX = state.isFlipped ? (1.0 - pt.x) * width : pt.x * width;
      const screenY = pt.y * height;
      const screenZ = pt.z * width; // Relative depth
      return { x: screenX, y: screenY, z: screenZ };
    });

    // 1. Calculate Anatomical Palm Center
    // Palm hollow is bounded by: Wrist (0), Index MCP (5), Middle MCP (9), Ring MCP (13), Pinky MCP (17)
    const wrist = lm[0];
    const mcpAvg = {
      x: (lm[5].x + lm[9].x + lm[13].x + lm[17].x) * 0.25,
      y: (lm[5].y + lm[9].y + lm[13].y + lm[17].y) * 0.25,
      z: (lm[5].z + lm[9].z + lm[13].z + lm[17].z) * 0.25
    };

    // Deep hollow center of palm
    const rawPalmX = wrist.x * 0.36 + mcpAvg.x * 0.64;
    const rawPalmY = wrist.y * 0.36 + mcpAvg.y * 0.64;
    const rawPalmZ = wrist.z * 0.36 + mcpAvg.z * 0.64;

    // 2. Palm Radius / Scale
    const rawRadius = Math.hypot(mcpAvg.x - wrist.x, mcpAvg.y - wrist.y) * 0.55;

    // 3. 2D Hand Orientation Angle
    const dirX = lm[9].x - wrist.x;
    const dirY = lm[9].y - wrist.y;
    const rawAngle = Math.atan2(dirY, dirX) + Math.PI * 0.5;

    // 4. 3D Palm Normal Vector (Cross product of Up and Across vectors)
    const up = { x: lm[9].x - wrist.x, y: lm[9].y - wrist.y, z: lm[9].z - wrist.z };
    const across = { x: lm[17].x - lm[5].x, y: lm[17].y - lm[5].y, z: lm[17].z - lm[5].z };
    
    let nx = up.y * across.z - up.z * across.y;
    let ny = up.z * across.x - up.x * across.z;
    let nz = up.x * across.y - up.y * across.x;
    const len = Math.hypot(nx, ny, nz) || 1.0;
    nx /= len; ny /= len; nz /= len;

    // Facing Camera Check (Positive = Palm faces camera)
    const facingCamera = -nz;

    // 5. Apply Adaptive 1-Euro Filter for Jitter Reduction & Zero-Lag
    const filteredX = filterX.filter(rawPalmX, now);
    const filteredY = filterY.filter(rawPalmY, now);
    const filteredZ = filterZ.filter(rawPalmZ, now);
    const filteredRadius = filterRadius.filter(rawRadius, now);
    const filteredAngle = filterAngle.filter(rawAngle, now);

    // 6. Calculate Velocity & Momentum
    const dt = Math.max((now - state.lastFrameTime) / 1000.0, 0.001);
    const vx = (filteredX - state.hand.x) / dt;
    const vy = (filteredY - state.hand.y) / dt;
    const speed = Math.hypot(vx, vy);

    state.hand.detected = true;
    state.hand.confidence = 1.0;
    state.hand.x = filteredX;
    state.hand.y = filteredY;
    state.hand.z = filteredZ;
    state.hand.radius = Math.max(30, filteredRadius);
    state.hand.angle = filteredAngle;
    state.hand.normal = { x: nx, y: ny, z: nz };
    state.hand.facingCamera = facingCamera;
    
    // Smooth Velocity EMA
    state.hand.vx = state.hand.vx * 0.6 + vx * 0.4;
    state.hand.vy = state.hand.vy * 0.6 + vy * 0.4;
    state.hand.speed = speed;
    state.hand.landmarks = lm;

    // 7. Calculate Depth-Aware Foreground Finger Occlusion Segments
    // If finger segments have z < rawPalmZ - 12 (closer to camera than palm hollow),
    // they are foreground occluders!
    const occluders = [];
    const palmZRef = rawPalmZ;
    const fingerBoneRadius = filteredRadius * 0.22;

    // 5 Fingers: Thumb (1..4), Index (5..8), Middle (9..12), Ring (13..16), Pinky (17..20)
    const fingerIndices = [
      [1, 2, 3, 4],    // Thumb
      [5, 6, 7, 8],    // Index
      [9, 10, 11, 12], // Middle
      [13, 14, 15, 16],// Ring
      [17, 18, 19, 20] // Pinky
    ];

    fingerIndices.forEach(finger => {
      for (let s = 0; s < finger.length - 1; s++) {
        const p1 = lm[finger[s]];
        const p2 = lm[finger[s + 1]];
        const avgZ = (p1.z + p2.z) * 0.5;

        // If closer to camera than palm hollow
        if (avgZ < palmZRef - 8.0) {
          occluders.push({
            x1: p1.x, y1: p1.y,
            x2: p2.x, y2: p2.y,
            radius: fingerBoneRadius
          });
        }
      }
    });

    state.hand.foregroundSegments = occluders;

    // Update Hand Lock Indicator in UI
    const handLockBadge = document.getElementById('hand-lock-badge');
    const handLockText = document.getElementById('hand-lock-text');
    const handLockIcon = document.getElementById('hand-lock-icon');
    handLockBadge.className = 'flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors';
    handLockIcon.className = 'fa-solid fa-hand-fist text-xs text-emerald-400 animate-pulse';
    handLockText.textContent = 'Hand Locked (1 Hand)';

  } else {
    // No hand detected in this frame
    state.hand.detected = false;

    // Update UI indicator
    const handLockBadge = document.getElementById('hand-lock-badge');
    const handLockText = document.getElementById('hand-lock-text');
    const handLockIcon = document.getElementById('hand-lock-icon');
    handLockBadge.className = 'flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors';
    handLockIcon.className = 'fa-solid fa-hand text-xs';
    handLockText.textContent = 'No hand in view';
  }
}

// Fallback High-Speed Vision Processor (runs if MediaPipe is initializing or offline)
const fallbackCanvas = document.createElement('canvas');
fallbackCanvas.width = 160;
fallbackCanvas.height = 90;
const fallbackCtx = fallbackCanvas.getContext('2d', { willReadFrequently: true });

function processFallbackTracking() {
  if (isMediaPipeReady || !state.isCameraActive || webcamVideo.readyState !== 4) return;

  const fw = fallbackCanvas.width;
  const fh = fallbackCanvas.height;

  fallbackCtx.save();
  if (state.isFlipped) {
    fallbackCtx.translate(fw, 0);
    fallbackCtx.scale(-1, 1);
  }
  fallbackCtx.drawImage(webcamVideo, 0, 0, fw, fh);
  fallbackCtx.restore();

  const imgData = fallbackCtx.getImageData(0, 0, fw, fh);
  const data = imgData.data;

  let sumX = 0, sumY = 0, count = 0;
  for (let y = 10; y < fh - 5; y++) {
    for (let x = 5; x < fw - 5; x++) {
      const idx = (y * fw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Skin Chrominance Classifier
      if (r > 60 && g > 35 && b > 20 && r > g && g > b && (r - g) > 15) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  const now = performance.now();
  if (count > 40) {
    const rawX = (sumX / count) * (arCanvas.width / fw);
    const rawY = (sumY / count) * (arCanvas.height / fh);
    const rawRadius = Math.sqrt(count) * 4.5;

    const filteredX = filterX.filter(rawX, now);
    const filteredY = filterY.filter(rawY, now);
    const filteredRadius = filterRadius.filter(rawRadius, now);

    const dt = Math.max((now - state.lastFrameTime) / 1000.0, 0.001);
    state.hand.vx = (filteredX - state.hand.x) / dt;
    state.hand.vy = (filteredY - state.hand.y) / dt;

    state.hand.detected = true;
    state.hand.x = filteredX;
    state.hand.y = filteredY;
    state.hand.radius = filteredRadius;
    state.hand.angle = 0.0;
    state.hand.foregroundSegments = [];

    const handLockBadge = document.getElementById('hand-lock-badge');
    const handLockText = document.getElementById('hand-lock-text');
    handLockBadge.className = 'flex items-center gap-1.5 text-xs font-semibold text-amber-400';
    handLockText.textContent = 'Optical Lock (1 Hand)';
  } else {
    state.hand.detected = false;
  }
}

// ==========================================
// 6. PROCEDURAL COMBUSTION AUDIO ENGINE
// ==========================================

let audioCtx = null;
let fireNoiseNode = null;
let fireGainNode = null;
let fireFilterNode = null;
let crackleTimer = null;

function initAudio() {
  if (audioCtx) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // 1. Create Brown Noise Buffer for Combustion Roar
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain boost
    }

    fireNoiseNode = audioCtx.createBufferSource();
    fireNoiseNode.buffer = noiseBuffer;
    fireNoiseNode.loop = true;

    // Resonant Combustion Bandpass Filter (Simulates deep flame rumble)
    fireFilterNode = audioCtx.createBiquadFilter();
    fireFilterNode.type = 'bandpass';
    fireFilterNode.frequency.value = 240;
    fireFilterNode.Q.value = 1.8;

    // Gain Controller
    fireGainNode = audioCtx.createGain();
    fireGainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);

    fireNoiseNode.connect(fireFilterNode);
    fireFilterNode.connect(fireGainNode);
    fireGainNode.connect(audioCtx.destination);

    fireNoiseNode.start();

    // Crackle & Pop Generator (Poisson Spark Impulses)
    scheduleCrackle();

  } catch (e) {
    console.warn('Web Audio initialization error:', e);
  }
}

function scheduleCrackle() {
  if (!state.soundEnabled || !state.isFireActive || !audioCtx) {
    setTimeout(scheduleCrackle, 100);
    return;
  }

  const nextPopDelay = 40 + Math.random() * 180;
  setTimeout(() => {
    playMicroCrackle();
    scheduleCrackle();
  }, nextPopDelay);
}

function playMicroCrackle() {
  if (!audioCtx || !state.isFireActive || !state.soundEnabled || state.hand.fadeAlpha < 0.1) return;

  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 2200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.035);

    const crackleVol = (0.04 + Math.random() * 0.08) * state.flameIntensity;
    g.gain.setValueAtTime(crackleVol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.035);

    osc.connect(g);
    g.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}
}

function updateAudio(dt) {
  if (!audioCtx || !fireGainNode) return;

  if (state.soundEnabled && state.isFireActive && state.hand.fadeAlpha > 0.01) {
    // Dynamic combustion volume based on flame intensity and motion
    const speedBoost = Math.min(state.hand.speed * 0.0004, 0.4);
    const targetGain = (0.12 + speedBoost) * state.flameIntensity * state.hand.fadeAlpha;
    fireGainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);

    // Dynamic Filter Frequency based on hand speed (whoosh)
    const targetFreq = 220 + state.hand.speed * 0.35;
    fireFilterNode.frequency.setTargetAtTime(Math.min(targetFreq, 800), audioCtx.currentTime, 0.05);
  } else {
    fireGainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.08);
  }
}

function playOneShotSound(path) {
  if (!state.soundEnabled) return;
  try {
    const audio = new Audio(path);
    audio.volume = 0.6;
    audio.play().catch(e => {});
  } catch (e) {}
}

// ==========================================
// 7. WEBCAM STREAM & CAMERA LIFECYCLE
// ==========================================

let webcamStream = null;

async function startCamera() {
  try {
    initAudio();

    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        frameRate: { ideal: 60, min: 30 }
      },
      audio: false
    });

    webcamVideo.srcObject = webcamStream;
    await webcamVideo.play();

    state.isCameraActive = true;
    document.getElementById('camera-prompt-overlay').classList.add('hidden');

    // UI Updates
    document.getElementById('cam-status-dot').className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
    document.getElementById('cam-status-text').textContent = 'CAMERA LIVE (1280x720)';
    document.getElementById('btn-camera-text').textContent = 'Stop Camera';
    document.getElementById('btn-camera-icon').className = 'fa-solid fa-video-slash';

    // Start MediaPipe Camera Worker Loop if available
    if (typeof Camera !== 'undefined' && mpHands) {
      mpCamera = new Camera(webcamVideo, {
        onFrame: async () => {
          if (state.isCameraActive && mpHands) {
            await mpHands.send({ image: webcamVideo });
          }
        },
        width: 1280,
        height: 720
      });
      mpCamera.start();
    }

  } catch (err) {
    console.error('Camera access failed:', err);
    alert('Unable to access camera. Please allow camera permissions in your browser!');
  }
}

function stopCamera() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  if (mpCamera) {
    mpCamera.stop();
    mpCamera = null;
  }
  state.isCameraActive = false;
  state.hand.detected = false;

  document.getElementById('camera-prompt-overlay').classList.remove('hidden');
  document.getElementById('cam-status-dot').className = 'w-2.5 h-2.5 rounded-full bg-slate-600';
  document.getElementById('cam-status-text').textContent = 'CAMERA OFF';
  document.getElementById('btn-camera-text').textContent = 'Start Camera';
  document.getElementById('btn-camera-icon').className = 'fa-solid fa-video';
}

// ==========================================
// 8. FIRE TOGGLE & ACTIVATION
// ==========================================

function toggleFire(forceState = null) {
  initAudio();

  if (forceState !== null) {
    state.isFireActive = forceState;
  } else {
    state.isFireActive = !state.isFireActive;
  }

  const fireBtn = document.getElementById('btn-ignite-action');
  const fireText = document.getElementById('btn-ignite-text');
  const firePill = document.getElementById('btn-fire-toggle');
  const firePillDot = document.getElementById('fire-pill-dot');
  const firePillText = document.getElementById('fire-pill-text');
  const flameAlert = document.getElementById('flame-alert');
  const flameAlertText = document.getElementById('flame-alert-text');

  if (state.isFireActive) {
    // Fire ON
    fireBtn.className = 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-600/40 transition transform active:scale-95 flex items-center gap-2 cursor-pointer fire-active-glow';
    fireText.textContent = 'EXTINGUISH FIRE';

    firePill.className = 'px-4 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-2 bg-orange-950/90 border-orange-500 text-orange-300 shadow-md shadow-orange-500/30';
    firePillDot.className = 'w-2 h-2 rounded-full bg-orange-400 animate-ping';
    firePillText.textContent = 'FIRE: BURNING';

    flameAlertText.textContent = '🔥 FIRE IGNITED 🔥';
    flameAlert.style.opacity = '1';
    setTimeout(() => { flameAlert.style.opacity = '0'; }, 1100);

    playOneShotSound('sfx/fire_burst_explosion.wav');

    // Spawn Burst Embers on ignition
    if (state.hand.detected) {
      for (let i = 0; i < 20; i++) {
        spawnEmber(state.hand.x, state.hand.y, state.hand.radius, state.hand.vx, state.hand.vy);
      }
    }

  } else {
    // Fire OFF
    fireBtn.className = 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-600/25 transition transform active:scale-95 flex items-center gap-2 cursor-pointer';
    fireText.textContent = 'IGNITE FIRE';

    firePill.className = 'px-4 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-2 bg-slate-900/90 border-slate-700 text-slate-400 hover:border-orange-500/50';
    firePillDot.className = 'w-2 h-2 rounded-full bg-slate-500';
    firePillText.textContent = 'FIRE: OFF';

    flameAlertText.textContent = '💨 EXTINGUISHED';
    flameAlert.style.opacity = '1';
    setTimeout(() => { flameAlert.style.opacity = '0'; }, 800);

    playOneShotSound('sfx/teleport_speed_whoosh.wav');
  }
}

// ==========================================
// 9. VIDEO RECORDER (HIGH QUALITY WEBM)
// ==========================================

let mediaRecorder = null;
let recordedChunks = [];

function startARRecording(durationSec = 5) {
  if (state.isRecording) return;
  state.isRecording = true;

  const banner = document.getElementById('ar-recording-banner');
  const timerText = document.getElementById('ar-recording-timer');
  const recordBtn = document.getElementById('btn-record-ar-video');

  banner.classList.remove('hidden');
  recordBtn.disabled = true;
  recordBtn.classList.add('opacity-50');

  const stream = arCanvas.captureStream(60);
  recordedChunks = [];

  let options = { mimeType: 'video/webm;codecs=vp9' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm' };
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    mediaRecorder = new MediaRecorder(stream);
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realistic_palm_fire_${Date.now()}.webm`;
    a.click();

    state.isRecording = false;
    banner.classList.add('hidden');
    recordBtn.disabled = false;
    recordBtn.classList.remove('opacity-50');
  };

  mediaRecorder.start();

  let elapsed = 0;
  timerText.textContent = `RECORDING: 0s / ${durationSec}s`;
  const interval = setInterval(() => {
    elapsed++;
    timerText.textContent = `RECORDING: ${elapsed}s / ${durationSec}s`;
    if (elapsed >= durationSec) {
      clearInterval(interval);
      mediaRecorder.stop();
    }
  }, 1000);
}

// ==========================================
// 10. MAIN RENDER LOOP (60 FPS WEBGL)
// ==========================================

let frameCounter = 0;
let lastFpsUpdate = performance.now();

function renderFrame(now) {
  requestAnimationFrame(renderFrame);

  const dt = Math.max((now - state.lastFrameTime) / 1000.0, 0.001);
  state.lastFrameTime = now;
  state.time += dt;

  // FPS Calculation
  frameCounter++;
  if (now - lastFpsUpdate >= 500) {
    state.fps = Math.round((frameCounter * 1000) / (now - lastFpsUpdate));
    document.getElementById('fps-counter').textContent = `${state.fps} FPS`;
    frameCounter = 0;
    lastFpsUpdate = now;
  }

  // Graceful Hand Fade In / Out
  if (state.hand.detected && state.isCameraActive) {
    state.hand.fadeAlpha = Math.min(1.0, state.hand.fadeAlpha + dt * 4.0); // 250ms fade in
  } else {
    state.hand.fadeAlpha = Math.max(0.0, state.hand.fadeAlpha - dt * 2.5); // 400ms fade out
  }

  // Optical Fallback Hand Tracker update if MediaPipe is loading
  processFallbackTracking();

  // Embers & Smoke Particle Physics Update
  if (state.isFireActive && state.hand.fadeAlpha > 0.01) {
    if (Math.random() < 0.65 * state.flameIntensity) {
      spawnEmber(state.hand.x, state.hand.y, state.hand.radius, state.hand.vx, state.hand.vy);
    }
    if (Math.random() < 0.25 * state.flameIntensity) {
      spawnSmoke(state.hand.x, state.hand.y - state.hand.radius * 1.5, state.hand.radius, state.hand.vx);
    }
  }
  updateEmbers(dt);
  updateSmoke(dt);

  // Audio Engine Update
  updateAudio(dt);

  // WebGL Render Pass
  if (gl && glProgram) {
    gl.viewport(0, 0, arCanvas.width, arCanvas.height);
    gl.useProgram(glProgram);

    // 1. Upload Video Frame Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);

    if (state.isCameraActive && webcamVideo.readyState >= 2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webcamVideo);
    } else {
      // Clear Texture (Dark standby viewport)
      const black = new Uint8Array([5, 8, 15, 255]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black);
    }

    // 2. Set Shader Uniforms
    gl.uniform2f(uLoc.u_resolution, arCanvas.width, arCanvas.height);
    gl.uniform1f(uLoc.u_time, state.time);
    gl.uniform1i(uLoc.u_isFlipped, state.isFlipped ? 1 : 0);
    gl.uniform1i(uLoc.u_fireActive, state.isFireActive ? 1 : 0);
    gl.uniform1f(uLoc.u_flameAlpha, state.hand.fadeAlpha);
    gl.uniform2f(uLoc.u_palmPos, state.hand.x, state.hand.y);
    gl.uniform1f(uLoc.u_palmRadius, state.hand.radius);
    gl.uniform1f(uLoc.u_palmAngle, state.hand.angle);
    gl.uniform2f(uLoc.u_velocity, state.hand.vx, state.hand.vy);
    gl.uniform3f(uLoc.u_palmNormal, state.hand.normal.x, state.hand.normal.y, state.hand.normal.z);
    gl.uniform1f(uLoc.u_facingCamera, state.hand.facingCamera);
    gl.uniform1f(uLoc.u_intensity, state.flameIntensity);
    gl.uniform1i(uLoc.u_heatDistortion, state.heatDistortion ? 1 : 0);

    // 3. Foreground Finger Occlusion Uniforms
    const occluders = state.hand.foregroundSegments;
    const numOcc = Math.min(occluders.length, 12);
    gl.uniform1i(uLoc.u_numOccluders, numOcc);

    if (numOcc > 0) {
      const segData = new Float32Array(48);
      const radData = new Float32Array(12);
      for (let i = 0; i < numOcc; i++) {
        segData[i * 4 + 0] = occluders[i].x1;
        segData[i * 4 + 1] = occluders[i].y1;
        segData[i * 4 + 2] = occluders[i].x2;
        segData[i * 4 + 3] = occluders[i].y2;
        radData[i] = occluders[i].radius;
      }
      gl.uniform4fv(uLoc.u_occluders, segData);
      gl.uniform1fv(uLoc.u_occluderRadii, radData);
    }

    // Draw Fullscreen Quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

// ==========================================
// 11. UI & EVENT HANDLERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize WebGL
  const webglOk = initWebGL();
  if (!webglOk) {
    console.error('WebGL initialization failed.');
  }

  // Initialize MediaPipe
  initMediaPipe();

  // Start Camera Buttons
  document.getElementById('btn-start-webcam').addEventListener('click', startCamera);

  // Camera Toggle
  document.getElementById('btn-camera-toggle').addEventListener('click', () => {
    if (state.isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  // Fire Ignite Action
  document.getElementById('btn-ignite-action').addEventListener('click', () => {
    toggleFire();
  });

  document.getElementById('btn-fire-toggle').addEventListener('click', () => {
    toggleFire();
  });

  // Spacebar Hotkey to Ignite / Extinguish
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      toggleFire();
    }
  });

  // Flame Intensity Slider
  const sliderIntensity = document.getElementById('slider-flame-intensity');
  const valIntensity = document.getElementById('val-flame-intensity');
  sliderIntensity.addEventListener('input', (e) => {
    state.flameIntensity = parseFloat(e.target.value);
    valIntensity.textContent = `${state.flameIntensity.toFixed(1)}x`;
  });

  // Heat Distortion Toggle
  const btnDistortion = document.getElementById('btn-toggle-distortion');
  const badgeDistortion = document.getElementById('badge-distortion');
  btnDistortion.addEventListener('click', () => {
    state.heatDistortion = !state.heatDistortion;
    badgeDistortion.textContent = state.heatDistortion ? 'ON' : 'OFF';
    badgeDistortion.className = state.heatDistortion
      ? 'text-[10px] px-1.5 py-0.2 rounded bg-orange-950 border border-orange-700 text-orange-300 font-mono font-bold'
      : 'text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono font-bold';
  });

  // Sound SFX Toggle
  const btnSound = document.getElementById('btn-toggle-sound');
  const iconSound = document.getElementById('icon-sound');
  btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      iconSound.className = 'fa-solid fa-volume-high text-orange-400';
    } else {
      iconSound.className = 'fa-solid fa-volume-xmark text-slate-500';
    }
  });

  // Mirror Camera Flip
  document.getElementById('btn-flip-camera').addEventListener('click', () => {
    state.isFlipped = !state.isFlipped;
  });

  // Video Recording
  document.getElementById('btn-record-ar-video').addEventListener('click', () => {
    const dur = parseInt(document.getElementById('ar-export-duration').value, 10) || 5;
    startARRecording(dur);
  });

  // Start 60fps WebGL Render Loop
  requestAnimationFrame(renderFrame);
});
