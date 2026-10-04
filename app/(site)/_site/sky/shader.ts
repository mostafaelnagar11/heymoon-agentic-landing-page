/* The sky's GLSL (SPEC §5.1.6). These strings live in the lazy sky chunk only: gl.ts is reached through
   Sky.tsx's import(), never statically, so no first-load chunk carries a shader (measure checks).

   The shader paints the CSS horizon's own layers with the CSS's own maths, composited the way the browser
   composites them (premultiplied source-over, in sRGB), so the canvas crossfades in over the CSS sky with
   nothing moving. Then it adds what CSS cannot: the light's swing and lean, a breathing halo, a luminous
   atmosphere on the limb, twinkling stars, and dither.

   CSS layer (globals.css .hz-*)   here
   sky      linear, apex up         base: NIGHT1 → DEEP over .62 × --apex-pref, DEEP below the apex
   halo     38% × 50% ellipse        haloTint(): A·(1 − t²)², t = r / 75%, the same function the CSS stops sample
   sun      ellipse, blur(44px)      sunTint(): three gaussians fitted to the gradient; the blur is exact for a
                                     gaussian (each axis width² + 2σ², amplitude × w/w')
   ground   night-0 disc             coverage over 1.5px at the limb
   earth    violet, 36px inside      linear ramp to .10 at the limb
   rim      1.5px ring, ignition     mask ramps, colour stops .15/.45/.85/.45/.15, clip from the centre
   hair     1.5px ring 3px out       white .20 at the centre, gone at 10%/90%

   Never pow() a base that can be negative (ANGLE/D3D and Metal return NaN). */

export const VERT2 = "#version 300 es\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}";
export const VERT1 = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}";
export const HEAD2 = "#version 300 es\nprecision highp float;\nout vec4 FRAG;\n";
export const HEAD1 = "precision highp float;\n#define FRAG gl_FragColor\n";

/* The GLSL ships without comments: each section is its own literal, joined at build time (terser folds the
   concatenation), and the notes live here as JS comments, which the minifier drops. */
export const FRAG =
  /* Uniforms. uRes: drawing buffer (device px); uCss: the same box in CSS px; uDpr: buffer px per CSS px;
     uTime: ACTIVE seconds (frozen while paused); uApex: the field row's centre, CSS px from the canvas top
     (measured, snapped like the CSS layer); uRadius: 1.1 × 100vw (--limb-r); uVw: 100vw, the width of every
     .hz layer; uSkyLen: .62 × --apex-pref; uHalo / uSun: the .hz-halo and .hz-sun boxes; uWorld: 0 brands ..
     1 creators; uDir: ±1 toward the side the switch went; uIgnite: the CSS ignition clock, eased; uScroll:
     heroExit; uSink: CSS px at heroExit 1; uFocus: field focus lean; uDawn: the submit; uPointer: −1..1. */
  `uniform vec2 uRes, uCss, uHalo, uSun, uPointer;
uniform float uDpr, uTime, uApex, uRadius, uVw, uSkyLen, uWorld, uDir, uIgnite, uScroll, uSink, uFocus, uDawn;
const vec3 NIGHT1 = vec3(1.0, 3.0, 23.0) / 255.0;
const vec3 DEEP = vec3(20.0, 18.0, 41.0) / 255.0;
const vec3 NIGHT0 = vec3(0.0, 2.0, 17.0) / 255.0;
const vec3 DAWN = vec3(246.0, 244.0, 252.0) / 255.0;
const vec3 V500 = vec3(124.0, 92.0, 224.0) / 255.0;
const vec3 V700 = vec3(77.0, 47.0, 176.0) / 255.0;
const vec3 PINK = vec3(240.0, 85.0, 157.0) / 255.0;
const vec3 WHITE = vec3(1.0);
` +
  /* CSS blur(44px) is a gaussian of σ = 44, so a gaussian's width² grows by 2σ². The sun's gradient (white .55,
     core .55 at 22%, inner .32 at 45%, clear at 70%), blurred, is three gaussians in premultiplied RGBA,
     fitted (non-negative least squares) to the blurred CSS layer at four sun boxes (1100×280, 507×280,
     1100×240, 800×280): mean error under 0.5/255, worst 11/255, behind the field. */
  `const float SIGMA2 = 3872.0;
const float SUN_S1 = 0.327, SUN_S2 = 0.433, SUN_S3 = 0.538;
const vec4 SUN_B1 = vec4(0.191, 0.2659, 0.0, 0.0), SUN_B2 = vec4(0.3284, 0.2002, 0.6935, 0.7109), SUN_B3 = vec4(0.0, 0.0, 0.0, 0.0202);
const vec4 SUN_C1 = vec4(0.0, 0.3969, 0.2104, 0.0), SUN_C2 = vec4(0.6861, 0.1397, 0.4131, 0.7185), SUN_C3 = vec4(0.0);
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
` +
  /* over(): source-over of a premultiplied layer at the outer element's opacity. tints(): Horizon.tsx stacks the
     creators tint over the brands tint, at world and 1 − world. haloTint(): A·(1 − t²)², t = r / 75%, the
     function the CSS stops sample. sunG(): one blurred gaussian on the sun box. rimTint(): the rim's colour
     across the 100vw box, .15 / .45 / white .85 / .45 / .15 at 0, 20, 50, 80, 100%. */
  `vec3 over(vec3 col, vec4 L, float op) { return col * (1.0 - op * L.a) + op * L.rgb; }
vec4 tints(vec4 b, vec4 c, float w) { b *= 1.0 - w; c *= w; return c + b * (1.0 - c.a); }
vec4 haloTint(float r, vec3 c0, vec3 c1, float a0) {
  float t = min(r / 0.75, 1.0);
  float k = 1.0 - t * t;
  float a = a0 * k * k;
  return vec4(mix(c0, c1, min(t / 0.6, 1.0)) * a, a);
}
float sunG(vec2 q, float s) {
  vec2 w = s * 0.5 * uSun;
  vec2 w2 = w * w + SIGMA2;
  return sqrt(w.x * w.x * w.y * w.y / (w2.x * w2.y)) * exp(-(q.x * q.x / w2.x + q.y * q.y / w2.y));
}
vec4 rimTint(float v, vec3 hue) {
  vec4 a = vec4(hue * 0.45, 0.45), c = vec4(WHITE * 0.85, 0.85), e = vec4(hue * 0.15, 0.15);
  return v < 0.3 ? mix(c, a, v / 0.3) : mix(a, e, clamp((v - 0.3) / 0.2, 0.0, 1.0));
}
` +
  /* p: CSS px, top-left origin. px: one buffer pixel in CSS px. d > 0 is sky, < 0 ground. The light swings 6%
     of the width toward the side the thumb moved, then back, and leans toward the pointer; the limb itself
     never moves, so it stays on the CSS field. Then the CSS layers in order: sky, halo (breathing ±4% over 8 s),
     sun (+15% on focus), ground, earth (violet, 36px inside the limb). */
  `void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * uCss / uRes;
  float px = 1.0 / uDpr;
  float apex = uApex + uScroll * uSink;
  float cx = 0.5 * uCss.x;
  float d = length(p - vec2(cx, apex + uRadius)) - uRadius;
  float w = uWorld;
  float lx = cx + uVw * 0.06 * sin(3.14159265 * w) * uDir + uPointer.x * 12.0;
  float ly = apex + uPointer.y * 6.0;
  float dim = 1.0 - 0.4 * uScroll;
  float e = uIgnite;
  vec3 col = mix(NIGHT1, DEEP, clamp((p.y - (apex - uSkyLen)) / uSkyLen, 0.0, 1.0));
  float breathe = 1.0 + 0.04 * sin(uTime * 6.2831853 / 8.0);
  float hr = length(vec2((p.x - lx) / (0.38 * uHalo.x), (p.y - ly) / (0.5 * uHalo.y)));
  vec4 halo = tints(haloTint(hr, V500, V700, 0.42), haloTint(hr, PINK, V500, 0.38), w);
  col = over(col, halo, mix(0.6, 1.0, e) * breathe * dim);
  vec2 q = vec2(p.x - lx, p.y - ly);
  float g1 = sunG(q, SUN_S1), g2 = sunG(q, SUN_S2), g3 = sunG(q, SUN_S3);
  vec4 sun = tints(SUN_B1 * g1 + SUN_B2 * g2 + SUN_B3 * g3, SUN_C1 * g1 + SUN_C2 * g2 + SUN_C3 * g3, w);
  col = over(col, sun, mix(0.45, 0.7, e) * (1.0 + 0.15 * uFocus) * dim);
  col = mix(col, NIGHT0, 1.0 - clamp((d + 0.75) / 1.5, 0.0, 1.0));
  float ea = d < 0.0 ? 0.10 * (d > -1.0 ? -d : clamp((d + 36.0) / 35.0, 0.0, 1.0)) : 0.0;
  col = over(col, vec4(V500 * ea, ea), 1.0);
` +
  /* The atmosphere (canvas only): a soft luminous band above the limb, brightest under the light, inside the
     ignition clip (spread). The rim: the CSS mask's trapezoid (0 at −1, 1 from −.25 to .5, 0 at 1.5px), its
     ramps eased and never narrower than about a buffer pixel, so the DPR-capped canvas keeps one crisp,
     unbroken line; then its colour stops and the ignition (opacity .3 → 1, the clip). The hair: the ring 3px
     outside the limb, a 1.5px triangle at .20, as in the CSS (never narrower than a buffer pixel). */
  `  float v = abs(p.x - lx) / uVw;
  float spread = 1.0 - smoothstep(-px, px, abs(p.x - cx) - e * 0.5 * uVw);
  float halo0 = 1.0 - smoothstep(0.0, 0.3, v);
  float dd = max(d, 0.0);
  float atm = (0.085 * exp(-dd / (4.0 - 1.5 * uFocus)) + 0.05 * exp(-dd / 18.0)) * (d > 0.0 ? 1.0 : exp(d / 0.8));
  vec3 atmC = mix(WHITE, mix(V500, PINK, w), smoothstep(0.0, 0.22, v));
  col += atmC * atm * (0.25 + 0.75 * halo0) * mix(1.0, 0.35, smoothstep(0.3, 0.5, v)) * spread * e * dim;
  float ex = max(0.0, 0.5 * px - 0.375);
  float m = smoothstep(-1.0 - ex, -0.25 + ex, d) * (1.0 - smoothstep(0.5 - ex, 1.5 + ex, d));
  col = over(col, tints(rimTint(v, V500), rimTint(v, PINK), w) * m, mix(0.3, 1.0, e) * spread * (1.0 + 0.25 * uFocus));
  float ha = 0.2 * max(0.0, 1.0 - abs(d - 3.0) / max(0.75, px)) * clamp(1.0 - abs(p.x - cx) / (0.4 * uVw), 0.0, 1.0);
  col = over(col, vec4(WHITE * ha, ha), 1.0);
` +
  /* Stars: hashed 3px cells (about 1 in 385), mostly faint with a few bright, twinkling on 6 to 10 s periods,
     fading toward the limb and into the light. Then the dawn, and ±1 LSB triangular dither (static when
     frozen, since it is seeded by uTime). */
  `  if (d > 18.0) {
    vec2 cell = floor(p / 3.0);
    float h = hash12(cell);
    if (h < 0.0026) {
      vec2 o = vec2(hash12(cell + 3.7), hash12(cell + 9.2)) * 1.2 + 0.9;
      float b = hash12(cell + 7.1);
      float tw = 0.62 + 0.38 * sin(6.2831853 * uTime / mix(6.0, 10.0, hash12(cell + 1.3)) + h * 4000.0);
      float disc = 1.0 - smoothstep(0.25, 0.75 + 0.35 * b, length(p - (cell * 3.0 + o)));
      float fade = smoothstep(18.0, 140.0, d) * (1.0 - min(1.0, (halo.a + sun.a) * 2.6));
      col += mix(vec3(0.84, 0.86, 1.0), WHITE, b) * mix(0.16, 0.85, b * b * b) * tw * disc * fade;
    }
  }
  col = mix(col, DAWN, uDawn);
  vec2 fc = gl_FragCoord.xy + fract(uTime * 0.37) * 97.0;
  col += (hash12(fc) + hash12(fc + 19.19) - 1.0) / 255.0;
  FRAG = vec4(col, 1.0);
}
`;
