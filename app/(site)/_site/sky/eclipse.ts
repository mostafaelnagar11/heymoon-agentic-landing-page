/* The Eclipse Glass hero renderer: a bevelled glass four-point star raymarched in front of an eclipse
   (disc, rim, corona, diamond-ring bead, glints). Reached only through `import("./eclipse")`.
   No React and no site imports except the shared contract (./eclipse-api): the caller owns the poster,
   the handover and reduced motion.
   The canvas covers the whole hero; the stage element's rect sets where and how big the star is drawn.

   Wave 1 (HERO-V2 V13 to V15, "no flat star, ever"):
   - The first frame is REST (eclipse-api.ts) at time zero, the same frame scripts/hero-poster.cjs commits as
     the poster. After it is drawn, onReady fires one rAF later and the frame is HELD (no clock, no draws, no
     pointer) until release(), or RELEASE_FALLBACK_MS after onReady. From release the sway clock eases in over
     SWAY_IN_S, so the pose leaves REST with zero velocity.
   - Exact night: the light is tone-mapped alone and screened over NIGHT1, so an unlit pixel is exactly the
     hero background, and all light fades out between LIGHT_FADE[0] and LIGHT_FADE[1] S from the centre
     (nothing is lit beyond 0.98 S: the 2 S poster box holds every lit pixel).
   - Screen-space marks (bead spikes, the silhouette halo, the rim) are in CSS px (E.z = device px per CSS px),
     so a 2x capture and a 1x or 1.5x live frame differ only by resampling.
   - The program links without blocking (KHR_parallel_shader_compile, else checked a frame later).
   - opts.capture: one REST frame at capture.dpr, read back in the same task, for the poster script. */

import {
  BEAD_REST_RAD, DPR_CAP, LIGHT_FADE, NIGHT1, PHONE_MQ, RELEASE_FALLBACK_MS, REST, SWAY_IN_S, swayAt,
} from "./eclipse-api";
import type { Audience, EclipseHandle, EclipseOptions } from "./eclipse-api";

export type { Audience, EclipseHandle, EclipseOptions };

/** A JS number as a GLSL float literal. */
const fl = (x: number) => { const s = String(Math.round(x * 1e6) / 1e6); return /[.e]/.test(s) ? s : `${s}.`; };

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

/* Uniforms: St = star centre (px) and radius (px); M = star rotation; T = scene time (s);
   A = soft, aud, bead, focus; B = pulse, pulseR, intro, flash; C = glints, sweep, rimW, energy;
   E = trail, glare sweep, device px per CSS px. uv: 1 = S/2. */
const FS = `precision highp float;
uniform vec3 St;uniform float T;uniform mat3 M;
uniform vec4 A;uniform vec4 B;uniform vec4 C;uniform vec4 E;
#define S 1.12
#define CZ 7.0
#define DZ 3.2
#define RM 1.08
#define BR 1.07
#define IOR 1.5
#define CC 1.4
#define RR 1.456
#define NIGHT (vec3(${NIGHT1.map(fl).join(",")})/255.)
#define LF0 ${fl(LIGHT_FADE[0] * 2)}
#define LF1 ${fl(LIGHT_FADE[1] * 2)}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float smax(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return max(a,b)+h*h*k*.25;}
float star2(vec2 p,float k){
 vec2 v=p-CC;
 if(-CC*v.y-(1.-CC)*v.x>=0.&&-CC*v.x-(1.-CC)*v.y>=0.){
  float a=RR-length(v),b=RR-length(p-vec2(CC,-CC)),c=RR-length(p-vec2(-CC,CC));
  return smax(a,smax(b,c,k),k);}
 return min(length(p-vec2(0.,1.)),length(p-vec2(1.,0.)))+k*.25;}
float map(vec3 p){
 p=M*p;float sf=A.x;
 float d2=star2(abs(p.xy),.02+sf*.12);
 float rb=mix(.2,.46,sf),h=mix(.16,.26,sf)+mix(.13,.04,sf)*smoothstep(.62,0.,length(p.xy));
 vec2 q=vec2(max(d2+rb,0.)/rb,abs(p.z)/h);
 return (length(q)-1.)*min(rb,h)*.85;}
vec3 nor(vec3 p){const vec2 e=vec2(.001,-.001);
 return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
float box(vec3 d,vec3 c,vec2 sz,float s){float k=dot(d,c);if(k<=0.)return 0.;
 vec3 u=normalize(cross(c,vec3(0.,1.,0.)));vec3 v=cross(u,c);
 vec2 w=abs(vec2(dot(d,u),dot(d,v))/k);vec2 m=smoothstep(sz+s,sz-s,w);return m.x*m.y*(1.-.5*w.y/(sz.y+s));}
float glare(vec3 d){if(d.z<=0.)return 0.;vec2 w=d.xy/d.z-vec2(-.25,-.2)-E.y*vec2(-.6,.8);
 float a=dot(w,vec2(.8,.6)),b=dot(w,vec2(-.6,.8));
 return smoothstep(.045,.0,abs(b))*smoothstep(.9,.1,abs(a))+.5*smoothstep(.016,.0,abs(b-.075))*smoothstep(.7,.1,abs(a))+.06*exp(-abs(b)*6.);}
vec3 studio(vec3 d){
 vec3 lc=mix(vec3(.55,.38,1.),vec3(1.,.38,.66),A.y);
 vec3 c=vec3(.0004,.0006,.003)+vec3(.006,.004,.02)*smoothstep(0.,1.,d.y)+lc*.05*exp(-abs(d.y+.35)*7.)*smoothstep(-.2,.6,d.z);
 c+=vec3(1.,.97,1.)*18.*box(d,normalize(vec3(-.7,.55,.45)),vec2(.07,.85),.05);
 c+=lc*11.*box(d,normalize(vec3(.95,-.18,.25)),vec2(.06,.8),.05);
 c+=vec3(.85,.8,1.)*7.*box(d,normalize(vec3(.6,-.62,.5)),vec2(.22,.05),.05);
 c+=vec3(.62,.52,1.)*6.*box(d,normalize(vec3(.12,.9,.42)),vec2(.85,.045),.04);
 c+=vec3(.92,.9,1.)*5.5*glare(d);
 return c;}
vec3 corona(vec2 q,bool hq){
 float l=length(q),r=l/RM;vec2 dir=q/max(l,1e-4);
 vec2 bd=vec2(cos(A.z),sin(A.z));float side=dot(dir,bd)*.5+.5;
 float en=C.w;
 vec3 tint=mix(vec3(.62,.50,1.),vec3(1.,.45,.72),A.y*smoothstep(.1,1.,side));
 vec3 deep=mix(vec3(.20,.10,.74),vec3(.60,.10,.50),A.y*side);
 float k=.2+.8*side*side*side;
 vec3 col;
 if(r<1.){float n=vn(q*1.7+7.)*.55+vn(q*4.3)*.3+vn(q*11.)*.15;
  col=vec3(.0012,.001,.0035)*(.6+n)+tint*.015*pow(r,14.)*k;}
 else{float x=r-1.;
  float st=vn(dir*3.2+vec2(T*.03,0.))*.6+vn(dir*9.1-vec2(0.,T*.02))*.4;
  col=(tint*exp(-x*16.)*(.45+.8*st)*1.7+deep*exp(-x*4.5)*(.4+.5*st)*.6+deep*exp(-x*1.3)*.04)*k*smoothstep(5.,2.,r);}
 float w=C.z;
 col+=mix(tint,vec3(1.),.75)*exp(-(r-1.)*(r-1.)/(w*w))*(.22+1.7*pow(side,5.));
 float db=length(q-bd*RM)/RM;
 col+=vec3(1.,.97,1.)*.0014/(db*db+.0004)*(1.+en);
 col+=tint*exp(-db*14.)*1.1;
 if(hq){
 for(int i=1;i<7;i++){float ai=A.z-float(i)*.8975979;
  float dg=length(q-vec2(cos(ai),sin(ai))*RM)/RM;
  float on=clamp(C.x-float(i)+1.,0.,1.);
  col+=mix(tint,vec3(1.),.5)*(.00004+.0002*on)/(dg*dg+.0001);}
 if(E.x>.002){float ad=mod(atan(q.y,q.x)-A.z,6.2831853);
  col+=mix(tint,vec3(1.),.6)*exp(-ad*1.3)*exp(-(r-1.)*(r-1.)/(w*w*5.))*E.x*2.6;}
 if(C.y>0.&&C.y<1.){float ca=A.z-C.y*6.2831853;
  float ad=mod(atan(q.y,q.x)-ca,6.2831853);
  float sv=sin(3.14159*C.y);
  col+=vec3(1.,.95,1.)*exp(-ad*1.8)*exp(-(r-1.)*(r-1.)/(w*w*9.))*sv*2.8;
  float dc=length(q-vec2(cos(ca),sin(ca))*RM)/RM;col+=mix(tint,vec3(1.),.6)*(.0009/(dc*dc+.0004))*sv;}}
 return col*B.z;}
vec3 env(vec3 p,vec3 d){vec3 c=studio(d);
 if(d.z<-.02){float t=(-DZ-p.z)/d.z;c+=corona(p.xy+d.xy*t,false);}return c;}
vec3 ex(vec3 d,vec3 pe,vec3 ne,float eta){
 vec3 o=refract(d,-ne,eta);
 if(dot(o,o)<.01)return env(pe,reflect(d,-ne))*.2+env(pe,d)*.35;
 return env(pe,o);}
vec3 glass(vec3 p,vec3 rd){
 vec3 n=nor(p);
 float ci=max(dot(-rd,n),0.);
 float fr=.05+.95*pow(1.-ci,5.);
 vec3 rfl=env(p,reflect(rd,n));
 vec3 d=refract(rd,n,1./IOR);
 vec3 o=p-n*.002;float L=0.,dm=9.,cs=0.;vec3 pe=o,ne=n;
 for(int k=0;k<2;k++){
  float tt=.002;
  for(int i=0;i<36;i++){float h=-map(o+d*tt);if(h<.0004)break;tt+=max(h*.9,.003);}
  float s=clamp(-dot(o,d),0.,tt);dm=min(dm,length(o+d*s));
  vec3 oo=M*o,dd=M*d;float tz=-oo.z/dd.z;
  if(tz>0.&&tz<tt){vec2 m=abs((oo+dd*tz).xy);
   cs+=exp(-length(m)*26.)*1.4+(exp(-m.x*70.)*exp(-m.y*9.)+exp(-m.y*70.)*exp(-m.x*9.))*.9+(exp(-m.x*45.)*exp(-m.y*2.)+exp(-m.y*45.)*exp(-m.x*2.))*.22;}
  pe=o+d*tt;ne=nor(pe);L+=tt;
  vec3 x=refract(d,-ne,IOR);
  if(dot(x,x)>.01)break;
  if(k==0){d=reflect(d,-ne);o=pe-ne*.002;}}
 float ds=.024+.035*B.w;
 vec3 rr=ex(d,pe,ne,IOR-2.*ds)*vec3(.46,.04,.20)+ex(d,pe,ne,IOR-ds)*vec3(.34,.16,.12)
  +ex(d,pe,ne,IOR)*vec3(.10,.62,.16)+ex(d,pe,ne,IOR+ds)*vec3(.06,.13,.26)+ex(d,pe,ne,IOR+2.*ds)*vec3(.04,.05,.26);
 vec3 tint=exp(-L*vec3(.35,.5,.08));
 vec3 cc=mix(vec3(.55,.35,1.),vec3(1.,.35,.7),A.y);
 vec3 po=M*p;
 float gx=clamp(.5+.35*(po.y-po.x),0.,1.);
 vec3 body=mix(mix(vec3(.10,.05,.42),vec3(.42,.30,1.),gx),mix(vec3(.35,.04,.25),vec3(1.,.38,.66),gx),A.y);
 float en=.4+.6*A.w+1.2*B.x+C.w*.8;
 vec2 bd=vec2(cos(A.z),sin(A.z));float sc=pow(clamp(dot(normalize(po.xy+1e-4),bd)*.5+.5,0.,1.),3.)*smoothstep(.0,.9,length(po.xy));
 vec3 glow=body*(1.-exp(-L*2.2))*(.05+.5*sc)*(.7+.3*en)+cc*(cs*1.2+exp(-dm*dm*14.)*.12)*en+vec3(1.)*cs*cs*.25*en;
 float q=(length(po.xy)-B.y)*7.;float rip=exp(-q*q)*B.x;
 vec3 rc=mix(vec3(.75,.65,1.),vec3(1.,.6,.85),A.y);
 return mix(rr*tint+glow,rfl,fr)+rc*rip*.8+mix(vec3(1.),cc,.4)*pow(1.-ci,7.)*.9;}
void main(){
 vec2 fc=gl_FragCoord.xy;
 vec2 uv=(fc-St.xy)/St.z;
 float lu=length(uv);
 if(lu>LF1){gl_FragColor=vec4(NIGHT,1.);return;}
 vec3 ro=vec3(0.,0.,CZ);
 vec3 rd=normalize(vec3(uv*S/CZ,-1.));
 vec2 q=uv*S*(CZ+DZ)/CZ;
 vec3 Lg=corona(q,true);
 vec2 bu=vec2(cos(A.z),sin(A.z))*RM*CZ/(S*(CZ+DZ));
 vec2 dv=(uv-bu)*St.z/E.z;float kl=E.z/(.12*St.z);
 float sp=exp(-abs(dv.x)*1.3)*exp(-abs(dv.y)*kl)+exp(-abs(dv.y)*1.3)*exp(-abs(dv.x)*kl);
 Lg+=vec3(.85,.8,1.)*sp*.38*B.z*(1.+C.w);
 float b=dot(ro,rd),c=dot(ro,ro)-BR*BR,h=b*b-c;
 if(h>0.){h=sqrt(h);float t=-b-h,tm=-b+h;bool hit=false;float md=9.,pf=S*E.z/St.z;
  for(int i=0;i<72;i++){float d=map(ro+rd*t);md=min(md,d/pf);if(d<.0006){hit=true;break;}t+=d*.9;if(t>tm)break;}
  if(hit)Lg=glass(ro+rd*t,rd);
  else Lg+=mix(vec3(.55,.45,1.),vec3(1.,.5,.8),A.y)*(1.-smoothstep(0.,1.4,md))*.35*B.z;}
 Lg*=1.-smoothstep(LF0,LF1,lu);
 vec3 lit=pow(max(1.-exp(-Lg*(1.15+.5*B.w)),0.),vec3(.4545));
 vec3 col=1.-(1.-NIGHT)*(1.-lit);
 col+=(h21(fc+fract(T))-.5)/255.*step(1./512.,max(lit.r,max(lit.g,lit.b)));
 gl_FragColor=vec4(col,1.);}`;

type Ease = (x: number) => number;
type Key = "soft" | "aud" | "bead" | "flip" | "spin" | "sweep";
type Tween = { k: Key; to: number; dur: number; st: number; ease: Ease; from: number | null };
type M3 = number[];

const eio: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eo: Ease = (x) => 1 - Math.pow(1 - x, 3);
const eo4: Ease = (x) => 1 - Math.pow(1 - x, 4);
const lin: Ease = (x) => x;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function rotAxis(ax: number, ay: number, az: number, a: number): M3 {
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [
    t * ax * ax + c, t * ax * ay - s * az, t * ax * az + s * ay,
    t * ax * ay + s * az, t * ay * ay + c, t * ay * az - s * ax,
    t * ax * az - s * ay, t * ay * az + s * ax, t * az * az + c,
  ];
}
function mul(a: M3, b: M3): M3 {
  const o: M3 = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return o;
}

const D = Math.SQRT1_2;
const UNIFORMS = ["St", "T", "M", "A", "B", "C", "E"] as const;
/* swayAt's constant offsets: focus damps only the oscillation around them (as the prototype). */
const YAW0 = -0.12, PITCH0 = 0.1;

export function mountEclipse(canvas: HTMLCanvasElement, stage: HTMLElement, opts: EclipseOptions): EclipseHandle | null {
  const cap = opts.capture;
  const ctxOpts: WebGLContextAttributes = {
    antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", premultipliedAlpha: false,
  };
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl2", ctxOpts) as WebGLRenderingContext | null)
      || canvas.getContext("webgl", ctxOpts)
      || (canvas.getContext("experimental-webgl", ctxOpts) as WebGLRenderingContext | null);
  } catch { gl = null; }
  if (!gl) { opts.onFail?.(); return null; }
  const g = gl;

  /* Compile and link without reading any status: that would block until the driver is done (review M6). */
  const shader = (type: number, src: string) => {
    const s = g.createShader(type);
    if (s) { g.shaderSource(s, src); g.compileShader(s); }
    return s;
  };
  const vs = shader(g.VERTEX_SHADER, VS), fs = shader(g.FRAGMENT_SHADER, FS), pr = g.createProgram();
  if (vs && fs && pr) { g.attachShader(pr, vs); g.attachShader(pr, fs); g.bindAttribLocation(pr, 0, "p"); g.linkProgram(pr); }
  const par = cap ? null : (g.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null);
  let buf: WebGLBuffer | null = null, ready = false;
  const U = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  /* Once the link is complete: read its status, then set up the program. */
  function link(): boolean {
    if (!vs || !fs || !pr || !g.getProgramParameter(pr, g.LINK_STATUS)) {
      if (!g.isContextLost()) console.warn((fs && g.getShaderInfoLog(fs)) || (pr && g.getProgramInfoLog(pr)) || "eclipse: no program");
      return false;
    }
    g.useProgram(pr);
    buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    for (const k of UNIFORMS) U[k] = g.getUniformLocation(pr, k);
    return (ready = true);
  }

  const dbg = cap ? null : g.getExtension("WEBGL_debug_renderer_info");
  let renderer = "";
  try { renderer = String(dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""); } catch { renderer = ""; }
  const soft = /swiftshader|llvmpipe|software/i.test(renderer);
  const phone = !cap && typeof window.matchMedia === "function" ? window.matchMedia(PHONE_MQ) : null;

  /* Geometry: cached rects, re-read on resize and every 20 frames. kpx = device px per CSS px (uPx). */
  let scale = 1, kpx = 1, rimW = 0.005, lastKey = "";
  const geo = { cx: 0, cy: 0, r: 1 };
  /** Returns true when the buffer size or the star's place in it changed. */
  function measure(): boolean {
    const cr = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const dpr = cap ? cap.dpr : soft ? 1 : Math.min(window.devicePixelRatio || 1, phone?.matches ? DPR_CAP.phone : DPR_CAP.desktop);
    const k = dpr * scale;
    const key = [sr.left - cr.left, sr.top - cr.top, cr.width, cr.height, sr.width, sr.height, k].join();
    if (key === lastKey) return false;
    lastKey = key;
    const w = Math.max(1, Math.round(cr.width * k)), h = Math.max(1, Math.round(cr.height * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    geo.cx = (sr.left - cr.left + sr.width / 2) * k;
    geo.cy = (cr.height - (sr.top - cr.top + sr.height / 2)) * k;
    geo.r = Math.max(1, (sr.width / 2) * k);
    kpx = k;
    /* the rim's width, 1.1 CSS px, in ring radii (the prototype's formula, from the CSS radius) */
    rimW = Math.max(0.003, (1.1 * 1.12 * (10.2 / 7)) / 1.08 / Math.max(1, sr.width / 2));
    g.viewport(0, 0, w, h);
    return true;
  }

  /* Animation state. At mount it is REST: no flip or spin, focus, pointer, pulse, glints, sweep, trail 0. */
  const clk = () => performance.now();
  const V = {
    soft: 0, aud: 0, bead: BEAD_REST_RAD[opts.audience], kick: 0, focus: 0, flip: 0, spin: 0, pulse: 0, pr: 1.5,
    glints: 0, glT: 0, sweep: 0, fT: 0, px: 0, py: 0, tx: 0, ty: 0,
  };
  const tw: Tween[] = [];
  function tween(k: Key, to: number, dur: number, delay = 0, ease: Ease = eio) {
    for (let i = tw.length - 1; i >= 0; i--) if (tw[i].k === k) tw.splice(i, 1);
    tw.push({ k, to, dur: dur * 1000, st: clk() + delay * 1000, ease, from: null });
  }
  function runTw(now: number) {
    for (let i = tw.length - 1; i >= 0; i--) {
      const w = tw[i];
      if (now < w.st) continue;
      if (w.from === null) w.from = V[w.k];
      const p = clamp((now - w.st) / w.dur);
      V[w.k] = w.from + (w.to - w.from) * w.ease(p);
      if (p >= 1) tw.splice(i, 1);
    }
  }
  /* tr: the released clock (s of running time since release). sc: the sway clock, which eases in with tr. */
  let tr = 0, sc = 0, bPrev = V.bead, trail = 0;
  let aud: Audience = opts.audience;
  let flashT = -1e9, launchT = -1e9, typed = 0;
  let launchTimer: ReturnType<typeof setTimeout> | undefined, relT: ReturnType<typeof setTimeout> | undefined;
  /** jump: material, tint and bead at once (a running flip lands on its target, none starts). */
  const setAud = (a: Audience, jump: boolean) => {
    const v = a === "creators" ? 1 : 0;
    if (jump) {
      for (let i = tw.length - 1; i >= 0; i--) {
        const w = tw[i];
        if (w.k === "flip") V.flip = w.to;
        if (w.k === "flip" || w.k === "soft" || w.k === "aud" || w.k === "bead") tw.splice(i, 1);
      }
      V.soft = v; V.aud = v; V.bead = BEAD_REST_RAD[a]; bPrev = V.bead - V.kick; aud = a;
      return;
    }
    if (a === aud) return;
    aud = a;
    tween("flip", V.flip + Math.PI, 1.7, 0, eo4);
    tween("soft", v, 1.0, 0.08, eio);
    tween("aud", v, 1.2, 0, eo);
    tween("bead", V.bead - Math.PI, 1.8, 0, eo4);
    flashT = clk();
  };
  setAud(aud, true);

  /* Uniforms from the current state, then one draw. Never advances anything. */
  const mat = new Float32Array(9);
  function draw(now: number) {
    const amp = 1 - 0.72 * V.focus, si = sstep(0, SWAY_IN_S, tr), sw = swayAt(sc);
    const yaw = YAW0 + (sw.yaw - YAW0) * amp + V.px * 0.22 * si + V.spin;
    const pitch = PITCH0 + (sw.pitch - PITCH0) * amp - V.py * 0.14 * si;
    const Rm = mul(rotAxis(0, 1, 0, yaw), mul(rotAxis(1, 0, 0, pitch), rotAxis(0, 0, 1, sw.roll * amp)));
    mat.set(mul(rotAxis(D, D, 0, V.flip), Rm));
    const fsec = (now - flashT) / 1000, flash = fsec > 0 && fsec < 1.1 ? Math.pow(Math.sin(Math.PI * Math.pow(fsec / 1.1, 0.7)), 2) : 0;
    const ls = (now - launchT) / 1000, lfl = ls > 0 && ls < 2.2 ? Math.pow(Math.sin((Math.PI * ls) / 2.2), 2) : 0;
    /* the intro flare and the breathing run on the released clock: both 0 at REST */
    const introFl = tr > 0 ? Math.exp(-Math.pow((tr - 1.7) / 0.35, 2)) * 0.9 : 0;
    const gs = clamp((tr - 0.35) / 2.2), ls2 = clamp((ls - 0.2) / 1.6);
    g.uniform3f(U.St, geo.cx, geo.cy, geo.r);
    g.uniform1f(U.T, REST.time + sc);
    g.uniformMatrix3fv(U.M, false, mat);
    g.uniform4f(U.A, V.soft, V.aud, V.bead - V.kick, V.focus);
    g.uniform4f(U.B, V.pulse, V.pr, REST.intro, flash + lfl * 0.8);
    g.uniform4f(U.C, V.glints, V.sweep, rimW, V.focus * 0.5 + flash * 0.8 + lfl + introFl + 0.12 * Math.sin(tr * 1.1) * Math.sin(tr * 0.37));
    g.uniform4f(U.E, trail, gs < 1 ? REST.glare * (1 - eio(gs)) : ls2 > 0 && ls2 < 1 ? 1.1 - 2.4 * eio(ls2) : 0, kpx, 0);
    g.drawArrays(g.TRIANGLES, 0, 3);
  }
  /* One running frame's advance. */
  function step(now: number, dt: number) {
    runTw(now);
    tr += dt;
    sc += dt * sstep(0, SWAY_IN_S, tr);
    V.focus += (V.fT - V.focus) * (1 - Math.exp(-dt * 3));
    V.glints += (V.glT - V.glints) * (1 - Math.exp(-dt * 5));
    V.px += (V.tx - V.px) * (1 - Math.exp(-dt * 2)); V.py += (V.ty - V.py) * (1 - Math.exp(-dt * 2));
    V.pulse *= Math.exp(-dt * 1.8); V.pr += dt * 1.25;
    V.kick *= Math.exp(-dt * 0.35);
    const bNow = V.bead - V.kick, bv = dt > 0 ? (bPrev - bNow) / dt : 0;
    bPrev = bNow;
    trail += (clamp(bv / 2.6) - trail) * (1 - Math.exp(-dt * 6));
  }

  /* Lifecycle. held: the resting frame stays on screen until release(). */
  let raf = 0, poll = 0, destroyed = false, lost = false, paused = false, visible = true, onScreen = true;
  let drawn = false, held = true, last = 0, slow = 0, frames = 0;
  const running = () => ready && drawn && !held && !destroyed && !lost && !paused && visible && onScreen;
  function tick(now: number) {
    raf = 0;
    if (!running()) return;
    raf = requestAnimationFrame(tick);
    if (++frames % 20 === 0) measure();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    step(now, dt);
    draw(now);
    /* frame-time watchdog: shed resolution if a device cannot hold ~55fps */
    if (!soft && frames > 20) {
      slow = dt > 0.019 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 24 && scale > 0.55) { scale = Math.max(0.55, scale * 0.85); slow = 0; measure(); }
    }
  }
  function sync() {
    if (running()) {
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  /** A redraw of the current state while the loop is stopped or held (a resized buffer is blank). */
  const redraw = () => { if (drawn && ready && !lost && !destroyed && !running()) draw(clk()); };
  const resize = () => { if (measure()) redraw(); };
  function release() {
    if (destroyed || !held) return;
    held = false;
    clearTimeout(relT);
    sync();
  }
  /* The resting frame: drawn once the program is ready, whatever the pause (it is the poster's frame). */
  function first() {
    measure();
    draw(clk());
    drawn = true;
    requestAnimationFrame(() => {
      if (destroyed || lost) return;
      opts.onReady?.();
      if (held) relT = setTimeout(release, RELEASE_FALLBACK_MS);
    });
    sync();
  }
  function waitLink() {
    poll = 0;
    if (destroyed || lost) return;
    if (par && pr && !g.getProgramParameter(pr, par.COMPLETION_STATUS_KHR)) { poll = requestAnimationFrame(waitLink); return; }
    if (!link()) { opts.onFail?.(); handle.destroy(); return; }
    first();
  }

  const offs: (() => void)[] = [];
  const handle: EclipseHandle = {
    setAudience(a, instant = false) {
      if (destroyed) return;
      if (!instant && a !== aud) release();
      const jump = instant || !running();
      setAud(a, jump);
      if (jump) redraw();
    },
    setFocus(on) {
      if (on) release();
      V.fT = on ? 1 : 0;
    },
    pulse() {
      release();
      V.pulse = Math.min(1.2, V.pulse * 0.5 + 0.9);
      if (V.pr > 0.35) V.pr = 0;
      V.kick += 0.045;
      typed++;
      V.glT = Math.min(7, typed / 2);
    },
    launch() {
      if (destroyed) return;
      release();
      launchT = clk();
      tween("spin", V.spin + Math.PI * 2, 2.0, 0, eio);
      V.glT = 7;
      tween("sweep", 1, 1.9, 0.05, lin);
      clearTimeout(launchTimer);
      launchTimer = setTimeout(() => { launchTimer = undefined; V.sweep = 0; V.glT = Math.min(7, typed / 2); }, 2600);
    },
    setPaused(p) { paused = p; sync(); },
    resize,
    release,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf); cancelAnimationFrame(poll);
      raf = poll = 0;
      clearTimeout(launchTimer); clearTimeout(relT);
      offs.forEach((off) => off());
      if (!lost) {
        try {
          g.deleteBuffer(buf); g.deleteProgram(pr); g.deleteShader(vs); g.deleteShader(fs);
          g.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { /* context already gone */ }
      }
    },
  };

  /* Capture (scripts/hero-poster.cjs): one REST frame, read back in this task. No listeners, no loop. */
  if (cap) {
    measure();
    if (!link()) { opts.onFail?.(); handle.destroy(); return handle; }
    draw(clk());
    drawn = true;
    const w = canvas.width, h = canvas.height, row = w * 4;
    const raw = new Uint8Array(w * h * 4), rgba = new Uint8Array(w * h * 4);
    g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, raw);
    for (let y = 0; y < h; y++) rgba.set(raw.subarray((h - 1 - y) * row, (h - y) * row), y * row);
    cap.onFrame({ audience: aud, width: w, height: h, dpr: cap.dpr, stage: stage.getBoundingClientRect().width, rgba });
    return handle;
  }

  const listen = (t: EventTarget, type: string, fn: EventListener, o?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, o);
    offs.push(() => t.removeEventListener(type, fn));
  };
  listen(window, "pointermove", (e) => {
    if (held) return;
    const p = e as PointerEvent;
    V.tx = (p.clientX / window.innerWidth) * 2 - 1;
    V.ty = (p.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  visible = !document.hidden;
  listen(document, "visibilitychange", () => { visible = !document.hidden; sync(); });
  listen(window, "resize", resize);
  listen(canvas, "webglcontextlost", (e) => {
    e.preventDefault();
    if (destroyed || lost) return;
    lost = true; sync();
    cancelAnimationFrame(poll); poll = 0;
    opts.onFail?.();
  });
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver((e) => { onScreen = e[e.length - 1].isIntersecting; sync(); });
    io.observe(canvas);
    offs.push(() => io.disconnect());
  }
  if (typeof ResizeObserver === "function") {
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas); ro.observe(stage);
    offs.push(() => ro.disconnect());
  }

  measure();
  poll = requestAnimationFrame(waitLink);
  return handle;
}
