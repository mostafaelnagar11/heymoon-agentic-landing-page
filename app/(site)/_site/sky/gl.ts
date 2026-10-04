/* The WebGL sky (SPEC §5.1.6): the lazy chunk's entry, reached only through `import("./gl")` in Sky.tsx.
   A fresh canvas per start (StrictMode and lost contexts never reuse one). It reads the shared
   MotionValues every frame on motion's one rAF (frame.render), measures its geometry from the CSS horizon
   itself (so layout and light never disagree), crossfades in over the CSS sky, and hands back to the CSS
   sky on context loss, on a give-up from the watchdog, and on teardown. */
import { cancelFrame, cubicBezier, frame, type FrameData, type MotionValue } from "motion/react";
import { EASE, MQ, SKY } from "../tokens";
import { getPaused, subscribePaused } from "../lib/playback";
import { FRAG, HEAD1, HEAD2, VERT1, VERT2 } from "./shader";
import { createWatchdog } from "./watchdog";

export interface SkyInputs {
  world: MotionValue<number>;
  dir: MotionValue<number>;
  focus: MotionValue<number>;
  dawn: MotionValue<number>;
  heroExit: MotionValue<number>;
  /** ?sky=gl: allow a software or slow GPU, and never give up (debugging only). */
  force: boolean;
  /** ?skydebug: log DPR level changes and GPU time. */
  debug: boolean;
}
export interface SkyHandle { destroy(): void }

const U = [
  "uRes", "uCss", "uDpr", "uTime", "uApex", "uRadius", "uVw", "uSkyLen", "uHalo", "uSun",
  "uWorld", "uDir", "uIgnite", "uScroll", "uSink", "uFocus", "uDawn", "uPointer",
] as const;
type Loc = Record<(typeof U)[number], WebGLUniformLocation | null>;

const igniteEase = cubicBezier(...EASE.outExpo);   // the CSS ignition's own curve (--ease-out-expo)
const DEV = process.env.NODE_ENV !== "production";

declare global { interface Window { __sky?: { running: boolean; level: number } } }

export function startSky(host: HTMLElement, hz: HTMLElement, inp: SkyInputs): SkyHandle | null {
  const q = (sel: string) => hz.querySelector<HTMLElement>(sel);
  const skyEl = q(".hz-sky"), haloEl = q(".hz-halo"), sunEl = q(".hz-sun");
  if (!skyEl || !haloEl || !sunEl) return null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity ${SKY.canvasFadeMs}ms var(--ease-out)`;
  const attrs: WebGLContextAttributes = {
    alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
    preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: !inp.force,
  };
  let v2 = true;
  let gl = canvas.getContext("webgl2", attrs) as unknown as WebGLRenderingContext | null;
  if (!gl) { v2 = false; gl = canvas.getContext("webgl", attrs); }
  if (!gl) return null;
  /* No mediump path: at fp16, length() − uRadius near 1,600px loses about 1.5px and the rim jitters. */
  if (!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  const ctx: WebGLRenderingContext = gl;

  /* --apex-pref is a clamp() on the hero; a zero-width probe resolves it to px. */
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;top:0;width:0;height:var(--apex-pref,60svh);visibility:hidden;pointer-events:none";
  host.appendChild(probe);
  host.appendChild(canvas);

  const log = (...a: unknown[]) => { if (inp.debug) console.info("[sky]", ...a); };
  const mqShort = window.matchMedia(MQ.short), mqPhone = window.matchMedia(MQ.phone), mqFine = window.matchMedia("(pointer: fine)");
  const dog = createWatchdog({ giveUp: !inp.force });

  let loc: Loc | null = null;
  let dead = false, lost = false, restores = 0;
  let time = 0, frames = 0, revealed = false;
  let animating = false;            // the continuous loop is registered
  let pending = false;              // a one-off redraw is queued (paused, or an input changed)
  let inView = true, covered = false;
  const geo = { cssW: 1, cssH: 1, dpr: 1, apex: 0, vw: 1, skyLen: 1, halo: [1, 1], sun: [1, 1] };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let rimAnim: Animation | null | undefined;

  function build(): boolean {
    const g = ctx;
    const shader = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || "compile");
      return s;
    };
    try {
      const prog = g.createProgram()!;
      g.attachShader(prog, shader(g.VERTEX_SHADER, v2 ? VERT2 : VERT1));
      g.attachShader(prog, shader(g.FRAGMENT_SHADER, (v2 ? HEAD2 : HEAD1) + FRAG));
      g.bindAttribLocation(prog, 0, "aPos");
      g.linkProgram(prog);
      if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog) || "link");
      g.useProgram(prog);
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);   // one full-screen triangle
      g.enableVertexAttribArray(0);
      g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
      const l = {} as Loc;
      for (const u of U) l[u] = g.getUniformLocation(prog, u);
      loc = l;
      return true;
    } catch (err) {
      if (!g.isContextLost()) console.warn("[sky] staying on the CSS sky:", err);
      return false;
    }
  }

  /* Geometry, all read from the CSS horizon in one pass (frame.read). */
  let exact: { w: number; h: number } | null = null;     // the host in device pixels, where the browser says
  function measure() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    const full = window.devicePixelRatio || 1;
    const dpr = Math.min(full, dog.level, Math.sqrt(SKY.maxPixels / (w * h)));
    /* Uncapped, the buffer takes the element's exact device-pixel box, so nothing is resampled. */
    const fit = dpr === full && exact;
    const bw = Math.max(1, fit ? exact!.w : Math.round(w * dpr)), bh = Math.max(1, fit ? exact!.h : Math.round(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    geo.cssW = w; geo.cssH = h; geo.dpr = bh / h;
    /* Where the browser actually draws the field and the CSS horizon. Both roots run a composited scroll
       animation, and Chrome puts such a layer on whole CSS pixels (measured at DPR 1 and 2: a field row at
       531.69 paints at 532..608). Snap the same way, or the rim sits up to half a pixel off the field. The
       sink transform (heroExit > 0 during a resize) comes off first: the shader adds it back. */
    const hr = hz.getBoundingClientRect(), sr = host.getBoundingClientRect();
    const t = getComputedStyle(hz).transform;
    const sink = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
    geo.apex = Math.round(hr.top - sink - sr.top) + hr.height / 2;
    geo.vw = skyEl!.offsetWidth;
    geo.skyLen = 0.62 * probe.offsetHeight;
    geo.halo = [haloEl!.offsetWidth, haloEl!.offsetHeight];
    geo.sun = [sunEl!.offsetWidth, sunEl!.offsetHeight];
    request();
  }
  const scheduleMeasure = () => frame.read(measure);

  /* The CSS ignition clock: the rim layer's animation, eased with the same curve. */
  function ignite(): number {
    if (rimAnim === undefined) rimAnim = hz.querySelector(".hz-rim")?.getAnimations()[0] ?? null;
    if (!rimAnim) return 1;
    const x = (Number(rimAnim.currentTime ?? 0) - SKY.igniteDelayMs) / SKY.igniteMs;
    if (x >= 1) { rimAnim = null; return 1; }
    return x <= 0 ? 0 : igniteEase(x);
  }

  function render() {
    if (!loc || lost) return;
    const g = ctx, l = loc;
    const exit = mqShort.matches ? 0 : Math.min(1, Math.max(0, inp.heroExit.get()));
    g.viewport(0, 0, canvas.width, canvas.height);
    g.uniform2f(l.uRes, canvas.width, canvas.height);
    g.uniform2f(l.uCss, geo.cssW, geo.cssH);
    g.uniform1f(l.uDpr, geo.dpr);
    g.uniform1f(l.uTime, time);
    g.uniform1f(l.uApex, geo.apex);
    g.uniform1f(l.uRadius, SKY.limbRadiusVw * geo.vw);
    g.uniform1f(l.uVw, geo.vw);
    g.uniform1f(l.uSkyLen, geo.skyLen);
    g.uniform2f(l.uHalo, geo.halo[0], geo.halo[1]);
    g.uniform2f(l.uSun, geo.sun[0], geo.sun[1]);
    g.uniform1f(l.uWorld, inp.world.get());
    g.uniform1f(l.uDir, inp.dir.get() * (document.documentElement.dir === "rtl" ? -1 : 1));   // toward the thumb, mirrored in RTL
    g.uniform1f(l.uIgnite, ignite());
    g.uniform1f(l.uScroll, exit);
    g.uniform1f(l.uSink, mqPhone.matches ? SKY.sinkPx.phone : SKY.sinkPx.desktop);
    g.uniform1f(l.uFocus, inp.focus.get());
    g.uniform1f(l.uDawn, inp.dawn.get());
    g.uniform2f(l.uPointer, ptr.x, ptr.y);
    gpu.begin();
    g.drawArrays(g.TRIANGLES, 0, 3);
    gpu.end();
    if (++frames === 2 && !revealed) reveal();
  }

  /* The continuous loop: time, pointer, watchdog. */
  const loop = ({ delta }: FrameData) => {
    const dt = Math.min(delta, 100);
    time += dt / 1000;
    const k = mqFine.matches ? SKY.pointerLerp : 0;
    ptr.x += ((k ? ptr.tx : 0) - ptr.x) * (k || 0.1);
    ptr.y += ((k ? ptr.ty : 0) - ptr.y) * (k || 0.1);
    render();
    const verdict = dog.sample(delta);
    if (verdict === "down" || verdict === "cap") { log("dpr level", dog.level, verdict); measure(); }
    else if (verdict === "give-up") { log("gave up at", dog.level); retire(); }
  };

  /* A one-off frame (paused, or an input changed while the loop is off): time stays frozen. */
  const once = () => { pending = false; render(); };
  function request() {
    if (dead || animating || pending || !inView || covered || document.hidden) return;
    pending = true;
    frame.render(once);
  }

  function sync() {
    if (dead) return;
    const paused = getPaused();
    const should = !lost && !!loc && inView && !covered && !document.hidden && !paused;
    if (should && !animating) {
      animating = true;
      dog.reset();
      frame.render(loop, true);
    } else if (!should && animating) {
      animating = false;
      cancelFrame(loop);
      if (paused) { ptr.x = ptr.y = 0; request(); }    // draw one frozen frame
    }
    if (DEV) window.__sky = { running: animating, level: dog.level };
  }

  function reveal() {
    revealed = true;
    frame.render(() => {
      canvas.style.opacity = "1";
      const done = () => { window.clearTimeout(t); if (!dead && !lost) hz.dataset.gl = "on"; };
      const t = window.setTimeout(done, SKY.canvasFadeMs + 200);
      canvas.addEventListener("transitionend", done, { once: true });
    });
  }

  /* The watchdog gave up: stop drawing, let the CSS layers show beneath, and fade the canvas (and its stars)
     out over 600ms before tearing down, so the hand-back is as quiet as the hand-over. */
  function retire() {
    hz.dataset.gl = "off";
    lost = true;
    sync();
    canvas.style.transition = "opacity 600ms var(--ease-out)";
    canvas.style.opacity = "0";
    window.setTimeout(destroy, 650);
  }

  /* Back to the CSS sky at once (a lost context has nothing left to show): the layers are the same picture. */
  function handBack() {
    hz.dataset.gl = "off";
    canvas.style.transition = "none";
    canvas.style.opacity = "0";
  }

  /* GPU time per frame, ?skydebug only (EXT_disjoint_timer_query_webgl2). */
  const gpu = (() => {
    const g2 = ctx as unknown as WebGL2RenderingContext;
    const ext = inp.debug && v2 ? g2.getExtension("EXT_disjoint_timer_query_webgl2") : null;
    if (!ext) return { begin() {}, end() {} };
    let query: WebGLQuery | null = null, n = 0, sum = 0, active = false;
    return {
      begin() {
        if (query && !active && g2.getQueryParameter(query, g2.QUERY_RESULT_AVAILABLE)) {
          if (!g2.getParameter(ext.GPU_DISJOINT_EXT)) { sum += g2.getQueryParameter(query, g2.QUERY_RESULT) / 1e6; n++; }
          g2.deleteQuery(query); query = null;
          if (n === 30) { log(`gpu ${(sum / n).toFixed(2)} ms/frame at dpr ${geo.dpr.toFixed(2)}`); n = 0; sum = 0; }
        }
        if (!query) { query = g2.createQuery(); g2.beginQuery(ext.TIME_ELAPSED_EXT, query!); active = true; }
      },
      end() { if (active) { g2.endQuery(ext.TIME_ELAPSED_EXT); active = false; } },
    };
  })();

  /* Inputs. */
  const onPointer = (e: PointerEvent) => {
    ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    loc = null;
    handBack();
    sync();
    log("context lost");
  };
  const onRestored = () => {
    if (++restores > SKY.maxRestores) { destroy(); return; }
    lost = false;
    if (!build()) { destroy(); return; }
    canvas.style.transition = `opacity ${SKY.canvasFadeMs}ms var(--ease-out)`;
    frames = 0; revealed = false;
    measure();
    sync();
    log("context restored");
  };
  const onVisibility = () => sync();
  const offPaused = subscribePaused(sync);
  const offDawn = inp.dawn.on("change", (v) => { host.style.opacity = String(1 - v); request(); });
  host.style.opacity = String(1 - inp.dawn.get());
  const offs = [inp.world, inp.dir, inp.focus].map((mv) => mv.on("change", request));
  const offExit = inp.heroExit.on("change", (v) => {
    const c = !mqShort.matches && v >= 0.999;
    if (c !== covered) { covered = c; sync(); }
    request();
  });
  covered = !mqShort.matches && inp.heroExit.get() >= 0.999;

  const ro = new ResizeObserver((entries) => {
    for (const en of entries) {
      const box = en.target === host ? en.devicePixelContentBoxSize?.[0] : undefined;
      if (box) exact = { w: box.inlineSize, h: box.blockSize };
    }
    scheduleMeasure();
  });
  try { ro.observe(host, { box: "device-pixel-content-box" }); } catch { ro.observe(host); }
  ro.observe(hz);
  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); });
  io.observe(host);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  function destroy() {
    if (dead) return;
    dead = true;
    animating = false;
    cancelFrame(loop);
    cancelFrame(once);
    ro.disconnect();
    io.disconnect();
    offPaused();
    offDawn();
    offExit();
    offs.forEach((off) => off());
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    if (hz.dataset.gl === "on") hz.dataset.gl = "off";
    ctx.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
    probe.remove();
    host.style.opacity = "";
    if (DEV) window.__sky = { running: false, level: dog.level };
  }

  if (!build()) { destroy(); return null; }
  measure();
  sync();
  log(`webgl${v2 ? "2" : "1"}, dpr level ${dog.level}`);
  if (DEV) (window as unknown as { __skyCanvas?: HTMLCanvasElement }).__skyCanvas = canvas;
  return { destroy };
}
