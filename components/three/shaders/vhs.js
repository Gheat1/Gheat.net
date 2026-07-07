// Custom GLSL for the CRT screen: tube curvature (geometry bulge + UV barrel
// distortion), VHS tracking band, per-scanline jitter, chromatic aberration,
// static noise, scanlines, phosphor mask, flicker and vignette.

export const vhsVertexShader = /* glsl */ `
  uniform float uBulge;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Push the center of the plane forward like curved CRT glass.
    vec2 c = uv - 0.5;
    pos.z += (1.0 - dot(c, c) * 2.4) * uBulge;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const vhsFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uPower;      // 0 = off, 1 = fully on (used for power-on ramp)
  uniform float uNoiseAmt;   // extra static (high while "no signal")
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Barrel distortion — bends the image around the tube. Lower divisors =
  // stronger bend at the edges.
  vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 off = abs(uv.yx) / vec2(3.6, 3.0);
    uv = uv + uv * off * off;
    return uv * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = curve(vUv);

    // --- VHS tracking band: a distorted stripe rolling up the screen ---
    float bandPos = 1.0 - fract(uTime * 0.11);
    float band = smoothstep(0.07, 0.0, abs(uv.y - bandPos));
    uv.x += band * (hash(vec2(uv.y * 90.0, floor(uTime * 30.0))) - 0.5) * 0.18;
    uv.y += band * 0.008;

    // --- per-scanline horizontal jitter ---
    float line = floor(uv.y * 240.0);
    uv.x += (hash(vec2(line, floor(uTime * 60.0))) - 0.5) * 0.0028;

    // occasional full-frame horizontal slip
    float slip = step(0.985, hash(vec2(floor(uTime * 4.0), 7.0)));
    uv.x += slip * (hash(vec2(line, 3.0)) - 0.5) * 0.06;

    // --- chromatic aberration, stronger inside the tracking band ---
    float ca = 0.0022 + band * 0.012;
    float r = texture2D(uTexture, uv + vec2(ca, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(ca, 0.0)).b;
    vec3 col = vec3(r, g, b);

    // --- static / snow ---
    float n = hash(uv * vec2(320.0, 240.0) + vec2(uTime * 87.0, uTime * 113.0));
    col += (n - 0.5) * 0.09;
    col = mix(col, vec3(n * 0.9), clamp(band * 0.6 + uNoiseAmt, 0.0, 1.0));

    // --- scanlines + phosphor mask ---
    float sl = sin(uv.y * 480.0 * 3.14159) * 0.5 + 0.5;
    col *= 0.80 + 0.20 * sl;
    col *= 0.93 + 0.07 * sin(uv.x * 1600.0);

    // --- 60hz-ish flicker ---
    col *= 0.96 + 0.04 * sin(uTime * 119.0);

    // --- black outside the curved image, vignette inside ---
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      col = vec3(0.0);
    }
    float vig = smoothstep(0.0, 0.09, uv.x) * smoothstep(1.0, 0.91, uv.x) *
                smoothstep(0.0, 0.07, uv.y) * smoothstep(1.0, 0.93, uv.y);
    col *= mix(0.3, 1.0, vig);

    // faint glass sheen following the bulge — sells the 3D curve
    vec2 gc = vUv - vec2(0.38, 0.72);
    col += vec3(0.035) * exp(-dot(gc, gc) * 14.0);

    // power-on: picture expands vertically from a white-hot center line.
    // All smoothstep edges are strictly increasing — reversed edges are
    // undefined in GLSL and NaN-poison the screen on real GPU drivers.
    float p = clamp(uPower, 0.0, 1.0);
    float dist = abs(vUv.y - 0.5);
    float halfOpen = mix(0.002, 0.52, p);
    float inside = 1.0 - smoothstep(halfOpen - 0.002, halfOpen, dist);
    col = col * inside * p + vec3(2.5) * (1.0 - p) * inside;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
