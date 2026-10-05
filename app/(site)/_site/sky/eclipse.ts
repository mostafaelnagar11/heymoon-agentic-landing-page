/* The Eclipse Glass hero renderer: a bevelled glass four-point star raymarched in front of an eclipse
   (disc, rim, corona, diamond-ring bead, the seven agent glints and, on brands, the creator rings). Reached only
   through `import("./eclipse")`. No React and no site imports except the shared contract (./eclipse-api): the
   caller owns the poster, the handover, the agent clock and reduced motion. The canvas may cover the whole hero
   or only the 2 S poster box (CANVAS_BOX): the stage element's rect sets where and how big the star is drawn.

   Wave 1 (HERO-V2 V13 to V15, "no flat star, ever"):
   - The first frame is REST (eclipse-api.ts) at time zero, the same frame scripts/hero-poster.cjs commits as
     the poster. After it is drawn, onReady fires one rAF later and the frame is HELD (no clock, no draws, no
     pointer; setters are stored) until release(), or RELEASE_FALLBACK_MS after onReady. From release the sway
     clock eases in over SWAY_IN_S, so the pose leaves REST with zero velocity.
   - Exact night: the light is tone-mapped alone and screened over NIGHT1, so an unlit pixel is exactly the
     hero background, and all light fades out between LIGHT_FADE[0] and LIGHT_FADE[1] S from the centre.
   - Screen-space marks (bead spikes, glints, the silhouette halo, the rim, the rings' edges) are in CSS px
     (E.z = device px per CSS px), so a 2x capture and a 1x or 1.5x live frame differ only by resampling.
   - opts.capture: one REST frame at capture.dpr, read back in the draw's task, for the poster script (on brands
     after the rings' atlas has loaded, so onFrame may come after mountEclipse returns).

   Wave 2 (HERO-V2 "Wave 2 plan"):
   - The switch is LOCKED (SWITCH): HEAD's setAud, verbatim, on a per-switch clock that advances by at most
     SWITCH_FRAME_CAP_MS per drawn frame, so a stall delays the tumble instead of skipping it.
   - Agents (item 1): seven glints fixed on the rim at GLINT_DEG, drawn after the glass, eased toward setAgents'
     levels; spikes on the working index only. launch(): the turn, all seven lit, the comet once round the ring.
   - The creator rings (item 9, brands only): two rings of faces on the eclipse plane, drawn from an atlas built
     here from AVATARS (never in the DOM), behind the disc and the glass. On high and mid the glass refracts them:
     sampled once per glass pixel along the central refracted ray (the dispersion samples share it; in all eight
     env() calls they cost 6x on SwiftShader).
   - Focus (item 2): FOCUS turns the star face-on. No light reaches toward the field.
   - Tiers (item 5): one source with per-tier #defines, compiled without blocking (KHR_parallel_shader_compile,
     else checked a frame later); REST at POSTER_TIER, the init tier swapped in after release; a watchdog over
     tierSteps(). uWorld (the tint) is measure.cjs's marker for this chunk.
   - Debug (SKY_DEBUG, ?skydebug or the dev server): window.__sky and window.__skyHandle; ?skyslow=N. */

import {
  AGENT_ORDER, ATLAS, atlasCell, AVATARS, BEAD_REST_RAD, CLUSTER_R, COMET_MS, DPR_CAP, FOCUS, GLINT_DEG, glintUv, initialTier,
  LAUNCH, LIGHT_FADE, NIGHT1, PHONE_MQ, PLANE_TO_S, POSTER_TIER, RELEASE_FALLBACK_MS, REST, REST_AGENTS, RING,
  RING_SLOTS, RINGS, RINGS_AUDIENCE, ringsPresence, SKY_DEBUG, SWAY_IN_S, swayAt, SWITCH, SWITCH_FRAME_CAP_MS,
  TIERS, tierSteps, WATCHDOG,
} from "./eclipse-api";
import type { Audience, EclipseDebug, EclipseHandle, EclipseOptions, FailReason, Tier, TierName } from "./eclipse-api";

export type { Audience, EclipseHandle, EclipseOptions };

/** A JS number as a GLSL float literal. A negative one is parenthesised, so `a-${fl(x)}` never reads `a--…`
    (GLSL's decrement: the compile error that killed WebGL on the stopped wave-2 tree). */
const fl = (x: number) => {
  const s = String(Math.round(Math.abs(x) * 1e6) / 1e6), v = /[.e]/.test(s) ? s : `${s}.`;
  return x < 0 ? `(-${v})` : v;
};
const TAU = Math.PI * 2;
const rad = (d: number) => (d * Math.PI) / 180;
/* The :3004 dev server keeps the debug globals on without ?skydebug (Next inlines NODE_ENV; the poster harness
   has no `process`, so it reads false there). */
const DEV = (() => { try { return process.env.NODE_ENV === "development"; } catch { return false; } })();

/* The seven glints (AGENT_ORDER), baked as screen-space marks drawn after the glass.
   Rim lift (wave-2 fixes, A-A7): on the bright half of the rim a waiting glint read only +7 to +13 L* over the rim
   (creators MoonLive +6.8, brands MoonLearning +12.7, at 2x on an M1). Each glint's core level is lifted toward 1 by
   m = min(GLINT_LIFT.max, GLINT_LIFT.k · p), p being the rim's own bright-side weight there (pow(side, 5), the rim
   term's), from the audience's RESTING bead (BEAD_REST_RAD), crossfaded by the tint: v' = v + (1 − v)·m, so the
   order idle < landed < working and waiting < idle holds everywhere, working is unchanged, and the moving bead never
   flares a glint during the locked switch. The rim, the bead and the corona are untouched. */
const GLINT_LIFT = { k: 8, max: 0.65 } as const;
const glintLift = (deg: number, a: Audience) =>
  Math.min(GLINT_LIFT.max, GLINT_LIFT.k * Math.pow(0.5 + 0.5 * Math.cos(rad(deg) - BEAD_REST_RAD[a]), 5));
const GLINTS = AGENT_ORDER.map((n, i) => {
  const [x, y] = glintUv(n), d = GLINT_DEG[n];
  return `Lg+=glt(uv,vec2(${fl(x)},${fl(y)}),G[${i}],${i}.,px,mix(${fl(glintLift(d, "brands"))},${fl(glintLift(d, "creators"))},uWorld));`;
}).join("");
const RI = RINGS.inner, RO = RINGS.outer, LOOK = RINGS.look;

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

/* Uniforms: St = star centre (px) and radius (px); M = star rotation; T = scene time (s); uWorld = the tint
   (0 brands, 1 creators); A = soft, aud, bead, focus; B = pulse, pulseR, intro, flash; C = -, comet, rimW, energy;
   E = trail, glare sweep, device px per CSS px, working index (−1 none); R = rings' presence, inner and outer drift
   (rad), the atlas cell's half texel; G = the seven glint levels; uAt = the rings' atlas. uv: 1 = S/2. */
const FS = `precision highp float;
uniform vec3 St;uniform float T;uniform mat3 M;uniform float uWorld;
uniform vec4 A;uniform vec4 B;uniform vec4 C;uniform vec4 E;uniform vec4 R;uniform float G[7];uniform sampler2D uAt;
#define S 1.12
#define CZ 7.0
#define DZ 3.2
#define RM 1.08
#define BR 1.07
#define IOR 1.5
#define CC 1.4
#define RR 1.456
#define TAU 6.2831853
#define NIGHT (vec3(${NIGHT1.map(fl).join(",")})/255.)
#define LF0 ${fl(LIGHT_FADE[0] * 2)}
#define LF1 ${fl(LIGHT_FADE[1] * 2)}
#define GR ${fl(2 * RING)}
#define PTS ${fl(PLANE_TO_S)}
#define CLR ${fl(CLUSTER_R)}
#define RSP ${fl((RI.r + RI.a + RO.r - RO.a) / 2)}
#define RF0 ${fl(RINGS.fade[0])}
#define RF1 ${fl(RINGS.fade[1])}
#define AC ${fl(ATLAS.cols)}
#define AR ${fl(ATLAS.rows)}
float AA;
vec3 tn(){return mix(vec3(.62,.5,1.),vec3(1.,.45,.72),uWorld);}
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
 float rb=mix(.2,.46,sf),h=mix(.16,.26,sf)
#ifndef CHEAP_BEVEL
 +mix(.13,.04,sf)*smoothstep(.62,0.,length(p.xy))
#endif
 ;vec2 q=vec2(max(d2+rb,0.)/rb,abs(p.z)/h);
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
 vec3 lc=mix(vec3(.55,.38,1.),vec3(1.,.38,.66),uWorld);
 vec3 c=vec3(.0004,.0006,.003)+vec3(.006,.004,.02)*smoothstep(0.,1.,d.y)+lc*.05*exp(-abs(d.y+.35)*7.)*smoothstep(-.2,.6,d.z);
 c+=vec3(1.,.97,1.)*18.*box(d,normalize(vec3(-.7,.55,.45)),vec2(.07,.85),.05);
 c+=lc*11.*box(d,normalize(vec3(.95,-.18,.25)),vec2(.06,.8),.05);
#if STUDIO>2
 c+=vec3(.85,.8,1.)*7.*box(d,normalize(vec3(.6,-.62,.5)),vec2(.22,.05),.05);
 c+=vec3(.62,.52,1.)*6.*box(d,normalize(vec3(.12,.9,.42)),vec2(.85,.045),.04);
#endif
 c+=vec3(.92,.9,1.)*5.5*glare(d);
 return c;}
vec3 corona(vec2 q,bool hq){
 float l=length(q),r=l/RM;vec2 dir=q/max(l,1e-4);
 vec2 bd=vec2(cos(A.z),sin(A.z));float side=dot(dir,bd)*.5+.5;
 float en=C.w;
 vec3 tint=mix(vec3(.62,.50,1.),vec3(1.,.45,.72),uWorld*smoothstep(.1,1.,side));
 vec3 deep=mix(vec3(.20,.10,.74),vec3(.60,.10,.50),uWorld*side);
 float k=.2+.8*side*side*side;
 vec3 col;
 if(r<1.){float n=vn(q*1.7+7.)*.55
#if OCT>1
 +vn(q*4.3)*.3+vn(q*11.)*.15
#else
 +.225
#endif
 ;col=vec3(.0012,.001,.0035)*(.6+n)+tint*.015*pow(r,14.)*k;}
 else{float x=r-1.;
  float st=vn(dir*3.2+vec2(T*.03,0.))
#if OCT>1
  *.6+vn(dir*9.1-vec2(0.,T*.02))*.4
#endif
  ;col=(tint*exp(-x*16.)*(.45+.8*st)*1.7+deep*exp(-x*4.5)*(.4+.5*st)*.6+deep*exp(-x*1.3)*.04)*k*smoothstep(5.,2.,r);}
 float w=C.z;
 col+=mix(tint,vec3(1.),.75)*exp(-(r-1.)*(r-1.)/(w*w))*(.22+1.7*pow(side,5.));
 float db=length(q-bd*RM)/RM;
 col+=vec3(1.,.97,1.)*.0014/(db*db+.0004)*(1.+en);
 col+=tint*exp(-db*14.)*1.1;
 if(hq){
 if(E.x>.002){float ad=mod(atan(q.y,q.x)-A.z,6.2831853);
  col+=mix(tint,vec3(1.),.6)*exp(-ad*1.3)*exp(-(r-1.)*(r-1.)/(w*w*5.))*E.x*2.6;}
 if(C.y>0.&&C.y<1.){float ca=A.z-C.y*6.2831853;
  float ad=mod(atan(q.y,q.x)-ca,6.2831853);
  float sv=sin(3.14159*C.y);
  col+=vec3(1.,.95,1.)*exp(-ad*1.8)*exp(-(r-1.)*(r-1.)/(w*w*9.))*sv*2.8;
  float dc=length(q-vec2(cos(ca),sin(ca))*RM)/RM;col+=mix(tint,vec3(1.),.6)*(.0009/(dc*dc+.0004))*sv;}}
 return col*B.z;}
vec3 look(vec3 c){c=min(c,vec3(${fl(LOOK.highlight)}))*${fl(LOOK.gain)};
 c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,${fl(LOOK.saturation)});
 return mix(c,vec3(${LOOK.tint.map((v) => fl(v / 255)).join(",")}),${fl(LOOK.tintMix)});}
vec3 rings(vec2 q){
 float l=length(q),rs=l*PTS;
 if(R.x<=0.||l<RM||rs>CLR)return vec3(0.);
 bool o=rs>RSP;
 float n=o?${fl(RO.count)}:${fl(RI.count)},rr=o?${fl(RO.r / PLANE_TO_S)}:${fl(RI.r / PLANE_TO_S)},ra=o?${fl(RO.a / PLANE_TO_S)}:${fl(RI.a / PLANE_TO_S)};
 float b=o?${fl(rad(RO.phaseDeg))}+R.z:${fl(rad(RI.phaseDeg))}+R.y,sp=TAU/n;
 float k=floor((atan(q.y,q.x)-b)/sp+.5),an=b+k*sp;
 vec2 dq=q-vec2(cos(an),sin(an))*rr;
 float cv=clamp((ra-length(dq))/AA+.5,0.,1.);
 if(cv<=0.)return vec3(0.);
 float i=mod(k+.5,n)-.5+(o?${fl(RI.count)}:0.);
 vec2 st=clamp(.5+vec2(dq.x,-dq.y)/(2.*ra),R.w,1.-R.w);
 vec3 x=(o?${fl(RO.alpha)}:${fl(RI.alpha)})*(1.-smoothstep(RF0,RF1,rs))*cv*R.x*look(texture2D(uAt,(vec2(floor(mod(i+.5,AC)),floor((i+.5)/AC))+st)/vec2(AC,AR)).rgb);
 return -log(max(1.-pow(x,vec3(2.2)),1e-4))/1.15;}
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
 for(int k=0;k<BOUNCES;k++){
  float tt=.002;
  for(int i=0;i<INNER;i++){float h=-map(o+d*tt);if(h<.0004)break;tt+=max(h*.9,.003);}
  float s=clamp(-dot(o,d),0.,tt);dm=min(dm,length(o+d*s));
  vec3 oo=M*o,dd=M*d;float tz=-oo.z/dd.z;
  if(tz>0.&&tz<tt){vec2 m=abs((oo+dd*tz).xy);
   cs+=exp(-length(m)*26.)*1.4+(exp(-m.x*70.)*exp(-m.y*9.)+exp(-m.y*70.)*exp(-m.x*9.))*.9+(exp(-m.x*45.)*exp(-m.y*2.)+exp(-m.y*45.)*exp(-m.x*2.))*.22;}
  pe=o+d*tt;ne=nor(pe);L+=tt;
  vec3 x=refract(d,-ne,IOR);
  if(dot(x,x)>.01)break;
  if(k==0){d=reflect(d,-ne);o=pe-ne*.002;}}
 float ds=.024+.035*B.w;
#if IOR_N==5
 vec3 rr=ex(d,pe,ne,IOR-2.*ds)*vec3(.46,.04,.20)+ex(d,pe,ne,IOR-ds)*vec3(.34,.16,.12)
  +ex(d,pe,ne,IOR)*vec3(.10,.62,.16)+ex(d,pe,ne,IOR+ds)*vec3(.06,.13,.26)+ex(d,pe,ne,IOR+2.*ds)*vec3(.04,.05,.26);
#elif IOR_N==3
 vec3 rr=ex(d,pe,ne,IOR-1.5*ds)*vec3(.62,.08,.22)+ex(d,pe,ne,IOR)*vec3(.28,.78,.30)+ex(d,pe,ne,IOR+1.5*ds)*vec3(.10,.14,.48);
#else
 vec3 rr=ex(d,pe,ne,IOR);
#endif
#ifdef RINGS_IN_GLASS
 vec3 xo=refract(d,-ne,IOR);
 if(dot(xo,xo)>.01&&xo.z<-.02)rr+=rings(pe.xy+xo.xy*((-DZ-pe.z)/xo.z));
#endif
 vec3 tint=exp(-L*vec3(.35,.5,.08));
 vec3 cc=mix(vec3(.55,.35,1.),vec3(1.,.35,.7),uWorld);
 vec3 po=M*p;
 float gx=clamp(.5+.35*(po.y-po.x),0.,1.);
 vec3 body=mix(mix(vec3(.10,.05,.42),vec3(.42,.30,1.),gx),mix(vec3(.35,.04,.25),vec3(1.,.38,.66),gx),uWorld);
 float en=.4+.6*A.w+1.2*B.x+C.w*.8;
 vec2 bd=vec2(cos(A.z),sin(A.z));float sc=pow(clamp(dot(normalize(po.xy+1e-4),bd)*.5+.5,0.,1.),3.)*smoothstep(.0,.9,length(po.xy));
 vec3 glow=body*(1.-exp(-L*2.2))*(.05+.5*sc)*(.7+.3*en)+cc*(cs*1.2+exp(-dm*dm*14.)*.12)*en+vec3(1.)*cs*cs*.25*en;
 float q=(length(po.xy)-B.y)*7.;float rip=exp(-q*q)*B.x;
 vec3 rc=mix(vec3(.75,.65,1.),vec3(1.,.6,.85),uWorld);
 return mix(rr*tint+glow,rfl,fr)+rc*rip*.8+mix(vec3(1.),cc,.4)*pow(1.-ci,7.)*.9;}
vec3 glt(vec2 uv,vec2 c,float v,float i,float px,float m){
 vec2 dv=abs(uv-c)*px;float d=length(dv);
 vec3 o=vec3(1.6*(.4+.6*(v+(1.-v)*m))*(1.-smoothstep(.6,2.2,d)))+tn()*v*v*.9*exp(-d/5.);
 if(abs(E.w-i)<.5){float kl=42.857/px;
  o+=vec3(.9,.88,1.)*(exp(-dv.x*1.3)*exp(-dv.y*kl)+exp(-dv.y*1.3)*exp(-dv.x*kl))*.7*(1.+.12*sin(T*7.54));}
 return o;}
void main(){
 vec2 fc=gl_FragCoord.xy;
 vec2 uv=(fc-St.xy)/St.z;
 float lu=length(uv),px=St.z/E.z;
 if(lu>LF1){gl_FragColor=vec4(NIGHT,1.);return;}
 AA=1./(2.*px*PTS);
 vec3 ro=vec3(0.,0.,CZ);
 vec3 rd=normalize(vec3(uv*S/CZ,-1.));
 vec2 q=uv*S*(CZ+DZ)/CZ;
 vec3 Lg=corona(q,true)+rings(q);
 vec2 bu=vec2(cos(A.z),sin(A.z))*RM*CZ/(S*(CZ+DZ));
 vec2 dv=(uv-bu)*px;float kl=E.z/(.12*St.z);
 float sp=exp(-abs(dv.x)*1.3)*exp(-abs(dv.y)*kl)+exp(-abs(dv.y)*1.3)*exp(-abs(dv.x)*kl);
 Lg+=vec3(.85,.8,1.)*sp*.38*B.z*(1.+C.w);
 float b=dot(ro,rd),c=dot(ro,ro)-BR*BR,h=b*b-c;
 if(h>0.){h=sqrt(h);float t=-b-h,tm=-b+h;bool hit=false;float md=9.,pf=S*E.z/St.z;
  for(int i=0;i<MARCH;i++){float d=map(ro+rd*t);md=min(md,d/pf);if(d<.0006){hit=true;break;}t+=d*.9;if(t>tm)break;}
  if(hit)Lg=glass(ro+rd*t,rd);
  else Lg+=mix(vec3(.55,.45,1.),vec3(1.,.5,.8),uWorld)*(1.-smoothstep(0.,1.4,md))*.35*B.z;}
 if(abs(lu-GR)*px<48.){${GLINTS}}
 Lg*=1.-smoothstep(LF0,LF1,lu);
 vec3 lit=pow(max(1.-exp(-Lg*(1.15+.5*B.w)),0.),vec3(.4545));
 vec3 col=1.-(1.-NIGHT)*(1.-lit);
 col+=(h21(fc+fract(T))-.5)/255.*step(1./512.,max(lit.r,max(lit.g,lit.b)));
 gl_FragColor=vec4(col,1.);}`;

/** The fragment source for a tier (§4.6): defines prepended (ES 1.00, no #version line, review M4). */
const fsFor = (t: Tier) => `#define IOR_N ${t.iorSamples}\n#define MARCH ${t.marchSteps}\n#define INNER ${t.innerSteps}\n#define BOUNCES ${t.bounces}\n#define STUDIO ${t.studioBoxes}\n#define OCT ${t.coronaOctaves}\n${t.bevel === "cheap" ? "#define CHEAP_BEVEL\n" : ""}${t.ringsInGlass ? "#define RINGS_IN_GLASS\n" : ""}${FS}`;

type Ease = (x: number) => number;
type Key = "soft" | "aud" | "bead" | "flip" | "spin";
/* sw: the tween runs on the switch clock (ms), else on wall time (performance.now()). */
type Tween = { k: Key; to: number; dur: number; st: number; ease: Ease; from: number | null; sw: boolean };
type M3 = number[];
const UNIFORMS = ["St", "T", "M", "uWorld", "A", "B", "C", "E", "R", "G", "uAt"] as const;
type Uni = (typeof UNIFORMS)[number];
type Prog = { pr: WebGLProgram; fs: WebGLShader; tier: TierName; at: number; ok?: boolean; U: Partial<Record<Uni, WebGLUniformLocation | null>> };

const eio: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eo: Ease = (x) => 1 - Math.pow(1 - x, 3);
const eo4: Ease = (x) => 1 - Math.pow(1 - x, 4);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const r3 = (x: number) => Math.round(x * 1000) / 1000;

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

/** One avatar, fetched at low priority with async decoding and never placed in the DOM; one retry. */
function avatar(i: number, retry = true): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.decoding = "async";
    im.setAttribute("fetchpriority", "low");
    im.onload = () => res(im);
    im.onerror = () => (retry ? avatar(i, false).then(res, rej) : rej(new Error(`eclipse: avatar ${i}`)));
    im.src = AVATARS.src(i);
  });
}
/** The rings' atlas (ATLAS): one cell per RING_SLOTS entry, mirrored and cropped, upright. RINGS.look is applied in
    the shader on each sample (look() in FS), not here: no getImageData and no per-pixel loop on the main thread (the
    loop was a 100 ms task at CPU x4, review). The canvas is uploaded as it is. */
function atlasCanvas(ims: HTMLImageElement[], cell: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = ATLAS.cols * cell; c.height = ATLAS.rows * cell;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  RING_SLOTS.forEach((sl, i) => {
    const im = ims[sl.img], w = im.naturalWidth, h = im.naturalHeight, side = Math.min(w, h) / sl.zoom;
    const sx = (w - side) / 2, sy = clamp((h - side) / 2 + sl.dy * h, 0, h - side);
    x.save();
    x.translate((i % ATLAS.cols) * cell + (sl.flip ? cell : 0), Math.floor(i / ATLAS.cols) * cell);
    if (sl.flip) x.scale(-1, 1);
    x.drawImage(im, sx, sy, side, side, 0, 0, cell, cell);
    x.restore();
  });
  return c;
}

const D = Math.SQRT1_2;
/** Creators: how long the idle build of the rings' atlas may wait after load (requestIdleCallback's timeout). */
const ATLAS_IDLE_MS = 2000;

export function mountEclipse(canvas: HTMLCanvasElement, stage: HTMLElement, opts: EclipseOptions): EclipseHandle | null {
  const cap = opts.capture;
  /* Debug (SKY_DEBUG): ?skydebug or the dev server. ?skyslow=N stretches the switch and the launch for frames. */
  const qs = cap ? null : new URLSearchParams(window.location.search);
  const LOG = !!qs?.has(SKY_DEBUG.param), DBG = !cap && (LOG || DEV);
  const SLOW = DBG ? Math.max(1, Number(qs?.get(SKY_DEBUG.slow)) || 1) : 1;
  const log = (s: string) => { if (LOG) console.info(`[sky] ${s}`); };
  const sky = qs?.get("sky");
  /* Software GL is refused (HERO-V2 §4.6, §4.7): the poster stays. Kept for verification: the capture, debug
     (?skydebug, the dev server), ?sky=gl and ?sky=soft (A-P5, which keeps the give-up). */
  const allowSoft = !!cap || DBG || sky === "gl" || sky === "soft";
  const ctxOpts: WebGLContextAttributes = {
    antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", premultipliedAlpha: false,
    failIfMajorPerformanceCaveat: !allowSoft,
  };
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl2", ctxOpts) as WebGLRenderingContext | null)
      || canvas.getContext("webgl", ctxOpts)
      || (canvas.getContext("experimental-webgl", ctxOpts) as WebGLRenderingContext | null);
  } catch { gl = null; }
  if (!gl) { opts.onFail?.("nogl"); return null; }
  const g = gl;
  const gl2 = typeof WebGL2RenderingContext !== "undefined" && g instanceof WebGL2RenderingContext;

  const dbgExt = cap ? null : g.getExtension("WEBGL_debug_renderer_info");
  let renderer = "";
  try { renderer = String(dbgExt ? g.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) : ""); } catch { renderer = ""; }
  const soft = /swiftshader|llvmpipe|software/i.test(renderer);
  /* A browser that ignores the caveat flag (or a flag-less software path): refuse by the renderer's name. */
  if (soft && !allowSoft) {
    try { g.getExtension("WEBGL_lose_context")?.loseContext(); } catch { /* already gone */ }
    opts.onFail?.("nogl");
    return null;
  }
  const phone = !cap && typeof window.matchMedia === "function" ? window.matchMedia(PHONE_MQ) : null;
  const isPhone = !!phone?.matches;

  /* Tiers (§4.6): REST is drawn by its band's poster program; the running tier compiles after release. */
  const restTier: TierName = opts.tier ?? POSTER_TIER[isPhone ? "phone" : "desktop"];
  const nav = cap ? null : (navigator as Navigator & { deviceMemory?: number });
  const initTier: TierName = opts.tier ?? initialTier({
    query: qs?.get("tier") ?? null, phone: isPhone, renderer, cores: nav?.hardwareConcurrency, memory: nav?.deviceMemory,
  });
  const steps = tierSteps(initTier, soft || cap ? 1 : window.devicePixelRatio || 1, isPhone);
  const canStep = !cap && (!soft || sky === "soft");

  /* Programs: compiled and linked without reading any status, which would block until the driver is done
     (review M6). One per tier, cached; they share the vertex shader, the triangle and the atlas. */
  const shader = (type: number, src: string) => {
    const s = g.createShader(type);
    if (s) { g.shaderSource(s, src); g.compileShader(s); }
    return s;
  };
  const vs = shader(g.VERTEX_SHADER, VS);
  const par = cap ? null : (g.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null);
  const progs: Partial<Record<TierName, Prog>> = {};
  let cur: Prog | null = null, want: TierName = restTier, forced: TierName | null = null, buf: WebGLBuffer | null = null, frames = 0;
  function build(t: TierName): Prog | null {
    const have = progs[t];
    if (have) return have;
    const fs = shader(g.FRAGMENT_SHADER, fsFor(TIERS[t])), pr = g.createProgram();
    if (!vs || !fs || !pr) return null;
    g.attachShader(pr, vs); g.attachShader(pr, fs); g.bindAttribLocation(pr, 0, "p"); g.linkProgram(pr);
    return (progs[t] = { pr, fs, tier: t, at: frames, U: {} });
  }
  /** Linked or failed (never blocks with the extension; without it, a frame after the link call). */
  const done = (p: Prog) => (par ? !!g.getProgramParameter(p.pr, par.COMPLETION_STATUS_KHR) : frames > p.at);
  function linked(p: Prog): boolean {
    if (p.ok === undefined) {
      p.ok = !!g.getProgramParameter(p.pr, g.LINK_STATUS);
      if (!p.ok && !g.isContextLost()) console.warn(g.getShaderInfoLog(p.fs) || g.getProgramInfoLog(p.pr) || "eclipse: no program");
    }
    return p.ok;
  }
  /* The atlas texture (unit 0). Until the faces are in it holds one black texel, so the sampler is complete. */
  const tex = g.createTexture();
  function upload(src: HTMLCanvasElement | null) {
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (src) g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
    else g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    for (const [k, v] of [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D, k, v);
  }
  upload(null);
  /** Make p current: uniform locations are per program, so they are queried again on every swap. */
  function use(p: Prog) {
    cur = p;
    g.useProgram(p.pr);
    if (!buf) {
      buf = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, buf);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    }
    for (const k of UNIFORMS) p.U[k] = g.getUniformLocation(p.pr, k);
    g.uniform1i(p.U.uAt!, 0);
  }

  /* Geometry: cached rects, re-read on resize and every 20 frames. kpx = device px per CSS px. The buffer is
     the canvas's layout box (clientWidth), so a transform on the canvas or the stage never changes its size. */
  let kpx = 1, rimW = 0.005, lastKey = "", stepDpr = Infinity, side = 0;
  const geo = { cx: 0, cy: 0, r: 1 };
  const dprNow = () => (cap ? cap.dpr
    : Math.min(soft ? 1 : window.devicePixelRatio || 1, isPhone ? DPR_CAP.phone : DPR_CAP.desktop, stepDpr));
  /** Returns true when the buffer size or the star's place in it changed. */
  function measure(): boolean {
    const cr = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const cw = canvas.clientWidth || cr.width, ch = canvas.clientHeight || cr.height, sx = cr.width / (cw || 1) || 1;
    const k = dprNow();
    const key = [sr.left - cr.left, sr.top - cr.top, cw, ch, sr.width, sx, k].join();
    if (key === lastKey) return false;
    lastKey = key;
    const w = Math.max(1, Math.round(cw * k)), h = Math.max(1, Math.round(ch * k)), sw = sr.width / sx;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    geo.cx = ((sr.left - cr.left) / sx + sw / 2) * k;
    geo.cy = (ch - ((sr.top - cr.top) / sx + sw / 2)) * k;
    geo.r = Math.max(1, (sw / 2) * k);
    kpx = k; side = sw;
    /* the rim's width, 1.1 CSS px, in ring radii (the prototype's formula, from the CSS radius) */
    rimW = Math.max(0.003, (1.1 * 1.12 * (10.2 / 7)) / 1.08 / Math.max(1, sw / 2));
    g.viewport(0, 0, w, h);
    /* The rings are brands only: creators builds the atlas in idle time after load, or on a switch to brands. */
    if (!cap && (aud === RINGS_AUDIENCE || atlasPx)) atlasFor(atlasCell(sw, k));
    report();
    return true;
  }
  let repT = "", repD = 0;
  /** onTier on start and on every change of the program or the DPR. */
  function report() {
    if (!cur || cap || (cur.tier === repT && kpx === repD)) return;
    repT = cur.tier; repD = kpx;
    opts.onTier?.({ tier: cur.tier, dpr: kpx });
  }

  /* The rings' atlas: built once the cell size is known, rebuilt when it changes by more than 1.5x. atlasP is
     its presence (eased 0 → 1 over 400 ms when it lands while the loop runs; at once otherwise). */
  let atlasPx = 0, atlasWant = 0, atlasBusy = false, atlasFailed = false, atlasP = 0, ims: Promise<HTMLImageElement[]> | null = null;
  function atlasFor(cell: number): Promise<void> {
    if (atlasFailed || (atlasPx && cell <= atlasPx * 1.5 && cell >= atlasPx / 1.5)) return Promise.resolve();
    atlasWant = cell;
    if (atlasBusy) return Promise.resolve();
    atlasBusy = true;
    ims ??= Promise.all(Array.from({ length: AVATARS.count }, (_, i) => avatar(i)));
    return ims.then((list) => {
      atlasBusy = false;
      if (destroyed || lost) return;
      const c = atlasWant, data = atlasCanvas(list, c);
      upload(data);
      atlasPx = c;
      if (!atlasP && (cap || held || !running())) atlasP = 1;
      if (atlasP >= 1) redrawIfStopped();
    }, (e: unknown) => {
      atlasBusy = false; atlasFailed = true;
      if (destroyed) return;
      console.warn(e instanceof Error ? e.message : e);
      /* On brands before the first frame, waitLink() reports "atlas"; later, or on creators, no rings. */
    });
  }

  /* Animation state. At mount it is REST: no flip or spin, focus, pointer, pulse, sweep, trail 0; the glints at
     REST_AGENTS. */
  const clk = () => performance.now();
  const V = { soft: 0, aud: 0, bead: BEAD_REST_RAD[opts.audience], kick: 0, focus: 0, flip: 0, spin: 0, pulse: 0, pr: 1.5, fT: 0, px: 0, py: 0, tx: 0, ty: 0 };
  /* The switch clock (ms; ?skyslow stretches the tweens on it, and switchMs reports it divided by the slow factor):
     from the switch's start it advances by the frame delta, at most SWITCH_FRAME_CAP_MS per drawn frame, so a stall
     delays the rest of the tumble instead of skipping it; swOn while a switch has started since the last jump. */
  let swc = 0, swLast = 0, swOn = false, flipFrom = 0, beadFrom = V.bead;
  const tw: Tween[] = [];
  function tween(k: Key, to: number, durMs: number, delayMs: number, ease: Ease, sw: boolean) {
    for (let i = tw.length - 1; i >= 0; i--) if (tw[i].k === k) tw.splice(i, 1);
    tw.push({ k, to, dur: durMs * SLOW, st: (sw ? swc : clk()) + delayMs * SLOW, ease, from: null, sw });
  }
  function runTw(now: number) {
    for (let i = tw.length - 1; i >= 0; i--) {
      const w = tw[i], t = w.sw ? swc : now;
      if (t < w.st) continue;
      if (w.from === null) w.from = V[w.k];
      const p = clamp((t - w.st) / w.dur);
      V[w.k] = w.from + (w.to - w.from) * w.ease(p);
      if (p >= 1) tw.splice(i, 1);
    }
  }
  /* tr: the released clock (s of running time since release). sc: the sway clock, which eases in with tr. */
  let tr = 0, sc = 0, bPrev = V.bead, trail = 0;
  let aud: Audience = opts.audience;
  let launchT = -1e9, launching = false, comet = 0;
  let launchTimer: ReturnType<typeof setTimeout> | undefined, relT: ReturnType<typeof setTimeout> | undefined;
  /* The glints: lv eased toward agT (setAgents), wk the working index (agW its target). */
  const lv = Float32Array.from(REST_AGENTS.levels), agT = Float32Array.from(REST_AGENTS.levels);
  let wk = -1, agW = REST_AGENTS.working;
  /** THE SWITCH, LOCKED (SWITCH; HEAD's setAud): jump sets material, tint and bead at once (a running flip lands
      on its target, none starts); otherwise flip +π about the diagonal, the material, the tint, the bead −π and
      the flash, all from this instant on the switch clock. */
  const setAud = (a: Audience, jump: boolean) => {
    const v = a === "creators" ? 1 : 0;
    if (jump) {
      for (let i = tw.length - 1; i >= 0; i--) {
        const w = tw[i];
        if (w.k === "flip") V.flip = w.to;
        if (w.k === "flip" || w.k === "soft" || w.k === "aud" || w.k === "bead") tw.splice(i, 1);
      }
      V.soft = v; V.aud = v; V.bead = BEAD_REST_RAD[a]; bPrev = V.bead - V.kick; aud = a; swOn = false;
      return;
    }
    if (a === aud) return;
    aud = a;
    swc = 0; swLast = clk(); swOn = true; flipFrom = V.flip; beadFrom = V.bead;
    tween("flip", V.flip + SWITCH.flipRad, SWITCH.flipMs, 0, eo4, true);
    tween("soft", v, SWITCH.softMs, SWITCH.softDelayMs, eio, true);
    tween("aud", v, SWITCH.audMs, 0, eo, true);
    tween("bead", V.bead + SWITCH.beadDeltaRad, SWITCH.beadMs, 0, eo4, true);
  };
  setAud(aud, true);

  /* Uniforms from the current state, then one draw. Never advances anything. */
  const mat = new Float32Array(9);
  let pres = 0, dIn = 0, dOut = 0;
  function draw(now: number) {
    const U = cur!.U;
    const f = V.focus, si = sstep(0, SWAY_IN_S, tr), sw = swayAt(sc), sd = 1 - FOCUS.swayDamp * f, pd = (1 - FOCUS.pointerDamp * f) * si;
    const yaw = FOCUS.yaw0 * (1 - f) + (sw.yaw - FOCUS.yaw0) * sd + V.px * 0.22 * pd + V.spin;
    const pitch = FOCUS.pitch0 * (1 - f) + (sw.pitch - FOCUS.pitch0) * sd - V.py * 0.14 * pd;
    const Rm = mul(rotAxis(0, 1, 0, yaw), mul(rotAxis(1, 0, 0, pitch), rotAxis(0, 0, 1, sw.roll * sd)));
    mat.set(mul(rotAxis(D, D, 0, V.flip), Rm));
    const fs = swOn ? swc / (SWITCH.flashMs * SLOW) : -1;
    const flash = fs > 0 && fs < 1 ? Math.pow(Math.sin(Math.PI * Math.pow(fs, SWITCH.flashPow)), 2) : 0;
    const ls = (now - launchT) / (1000 * SLOW), lfl = ls > 0 && ls < 2.2 ? Math.pow(Math.sin((Math.PI * ls) / 2.2), 2) : 0;
    const cm = (now - launchT) / (COMET_MS * SLOW);
    comet = launching ? eo(clamp(cm)) : 0;
    /* the intro flare and the breathing run on the released clock: both 0 at REST */
    const introFl = tr > 0 ? Math.exp(-Math.pow((tr - 1.7) / 0.35, 2)) * 0.9 : 0;
    const gs = clamp((tr - 0.35) / 2.2), ls2 = clamp((ls - 0.2) / 1.6);
    pres = cap?.rings === false ? 0 : ringsPresence(V.aud) * sstep(0, 1, atlasP);
    dIn = RINGS.inner.driftDegPerS * sc; dOut = RINGS.outer.driftDegPerS * sc;
    g.uniform3f(U.St!, geo.cx, geo.cy, geo.r);
    g.uniform1f(U.T!, REST.time + sc);
    g.uniformMatrix3fv(U.M!, false, mat);
    g.uniform1f(U.uWorld!, V.aud);
    g.uniform4f(U.A!, V.soft, V.aud, V.bead - V.kick, f);
    g.uniform4f(U.B!, V.pulse, V.pr, REST.intro, flash + lfl * 0.8);
    g.uniform4f(U.C!, 0, launching && cm > 0 && cm < 1 ? comet : 0, rimW, f * 0.5 + flash * 0.8 + lfl + introFl + 0.12 * Math.sin(tr * 1.1) * Math.sin(tr * 0.37));
    g.uniform4f(U.E!, trail, gs < 1 ? REST.glare * (1 - eio(gs)) : ls2 > 0 && ls2 < 1 ? 1.1 - 2.4 * eio(ls2) : 0, kpx, held ? -1 : wk);
    g.uniform4f(U.R!, pres, rad(dIn), rad(dOut), atlasPx ? 0.5 / atlasPx : 0.5);
    g.uniform1fv(U.G!, lv);
    if (DBG) dbg();
    g.drawArrays(g.TRIANGLES, 0, 3);
  }
  /* One running frame's advance. dt: seconds, capped at 50 ms (the switch clock reads the wall clock itself). */
  function step(now: number, dt: number) {
    if (swOn) { swc += Math.min(Math.max(0, now - swLast), SWITCH_FRAME_CAP_MS); swLast = Math.max(swLast, now); }
    runTw(now);
    tr += dt;
    sc += dt * sstep(0, SWAY_IN_S, tr);
    V.focus += (V.fT - V.focus) * (1 - Math.exp(-dt * FOCUS.rate));
    const e8 = 1 - Math.exp(-8 * dt);
    for (let i = 0; i < lv.length; i++) lv[i] += ((launching ? 1 : agT[i]) - lv[i]) * e8;
    wk = launching ? -1 : agW;
    if (atlasPx && atlasP < 1) atlasP = Math.min(1, atlasP + dt / 0.4);
    V.px += (V.tx - V.px) * (1 - Math.exp(-dt * 2)); V.py += (V.ty - V.py) * (1 - Math.exp(-dt * 2));
    V.pulse *= Math.exp(-dt * 1.8); V.pr += dt * 1.25;
    V.kick *= Math.exp(-dt * 0.35);
    const bNow = V.bead - V.kick, bv = dt > 0 ? (bPrev - bNow) / dt : 0;
    bPrev = bNow;
    trail += (clamp(bv / 2.6) - trail) * (1 - Math.exp(-dt * 6));
  }

  /* Lifecycle. held: the resting frame stays on screen until release(). */
  let raf = 0, poll = 0, destroyed = false, lost = false, paused = false, visible = true, onScreen = true;
  let drawn = false, held = true, last = 0;
  const running = () => !!cur && drawn && !held && !destroyed && !lost && !paused && visible && onScreen;

  /* The watchdog (§4.8): after any start, resume or step skip skipFrames, then judge windows of windowFrames.
     A capped-looking window (median inside cappedMs) is only a suspicion: a GPU-bound device on a 60 Hz screen lands
     on the same 33 ms quantum. It sheds one step (dpr 1, else the next ladder step) and judges one more window; it
     locks only if that window is still capped and its mean rose by at most capRiseFps (the display is the limit),
     otherwise the ladder goes on. The give-up holds whatever the lock; only a forced setTier() turns it off. */
  let skip: number = WATCHDOG.skipFrames, win: number[] = [], locked = false, stepI = 0, fps = 0, capFps = 0;
  /** The next ladder index that changes the effective tier or dpr (each dpr no higher than the current), or −1. */
  function nextStep(): number {
    for (let j = stepI + 1; j < steps.length; j++) if (steps[j].tier !== want || Math.min(stepDpr, steps[j].dpr) !== stepDpr) return j;
    return -1;
  }
  function stepTo(j: number) {
    stepI = j; want = steps[j].tier; stepDpr = Math.min(stepDpr, steps[j].dpr); skip = WATCHDOG.skipFrames; win = [];
    resize();
  }
  function watch(ms: number) {
    fps = fps ? fps + (1000 / Math.max(1, ms) - fps) * 0.1 : 1000 / Math.max(1, ms);
    if (!cur || want !== cur.tier) return;
    if (skip > 0) { skip--; return; }
    win.push(ms);
    if (win.length < WATCHDOG.windowFrames) return;
    const sorted = win.slice().sort((a, b) => a - b), med = sorted[sorted.length >> 1];
    /* Stalls and hitches are not the GPU's pace: the window's trimFrames longest deltas and any delta over
       max(4 x median, stallMs) stay out of the mean. One switch (two ~80 ms frames of React work on an M1) or one
       2x screenshot (a 1 s stall; five walked an M1 to the give-up) never steps a fast device down; a steady stutter
       still does. */
    const cut = Math.max(4 * med, WATCHDOG.stallMs), kept = sorted.slice(0, sorted.length - WATCHDOG.trimFrames).filter((d) => d <= cut);
    const wf = 1000 / (kept.reduce((a, b) => a + b, 0) / kept.length);
    win = [];
    const line = (v: string) => log(`window fps=${wf.toFixed(1)} median=${med.toFixed(1)}ms verdict=${v}`);
    if (!canStep) { line("keep"); return; }
    const capped = med >= WATCHDOG.cappedMs[0] && med <= WATCHDOG.cappedMs[1];
    if (!locked) {
      if (capFps) {
        const was = capFps;
        capFps = 0;
        if (capped && wf <= was + WATCHDOG.capRiseFps) {
          locked = true;
          line("capped");
          log(`capped tier=${cur.tier} dpr=${kpx.toFixed(2)} locked (mean ${was.toFixed(1)} -> ${wf.toFixed(1)} fps)`);
          return;
        }
        log(`not capped (mean ${was.toFixed(1)} -> ${wf.toFixed(1)} fps): GPU bound, the ladder goes on`);
      } else if (capped) {
        const j = kpx > 1 ? -2 : nextStep();
        if (j !== -1) {
          capFps = wf;
          line("capped?");
          if (j === -2) { stepDpr = 1; skip = WATCHDOG.skipFrames; win = []; resize(); }
          else stepTo(j);
          log(`capped? tier=${want} dpr=${dprNow().toFixed(2)}: one more window`);
          return;
        }
      }
      if (wf < WATCHDOG.fpsFloor) {
        const j = nextStep();
        if (j >= 0) {
          line("step");
          stepTo(j);
          log(`step tier=${want} dpr=${dprNow().toFixed(2)} (mean ${wf.toFixed(1)} fps)`);
          return;
        }
      }
    }
    if (!forced && wf < WATCHDOG.giveUpFps && nextStep() < 0 && sky !== "gl") {
      line("give-up");
      log(`gave up at tier=${cur.tier} dpr=${kpx.toFixed(2)} (${wf.toFixed(1)} fps)`);
      fail("gaveup");
      return;
    }
    line("keep");
  }
  /** Swap in the wanted tier once its program has linked (polled once per frame, never blocking). */
  function swap() {
    if (!cur || want === cur.tier) return;
    const p = build(want);
    if (!p) { want = cur.tier; return; }
    if (!done(p)) return;
    if (!linked(p)) { want = cur.tier; return; }
    use(p);
    skip = WATCHDOG.skipFrames; win = [];
    log(`start tier=${p.tier} dpr=${kpx.toFixed(2)} ${gl2 ? "webgl2" : "webgl1"}`);
    report();
  }
  function tick(now: number) {
    raf = 0;
    if (!running()) return;
    raf = requestAnimationFrame(tick);
    if (++frames % 20 === 0) measure();
    const ms = now - last;
    last = now;
    swap();
    step(now, Math.min(0.05, Math.max(0, ms / 1000)));
    draw(now);
    watch(ms);
  }
  function sync() {
    if (running()) {
      if (!raf) { last = performance.now(); skip = WATCHDOG.skipFrames; win = []; raf = requestAnimationFrame(tick); }
    } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (DBG && drawn) dbg();
  }
  /** A redraw of the current state while the loop is stopped or held (a resized buffer is blank). */
  const redraw = () => { if (drawn && cur && !lost && !destroyed && !running()) draw(clk()); };
  const resize = () => { if (measure()) redraw(); };
  /** A setter's value reaches a loop that is stopped but not held at once, with one redraw. */
  const stopped = () => !held && !running();
  const redrawIfStopped = () => { if (stopped()) redraw(); };
  function release() {
    if (destroyed || !held) return;
    held = false;
    clearTimeout(relT);
    want = forced ?? initTier; stepDpr = steps[0].dpr;
    if (drawn) resize();
    if (stopped()) { lv.set(agT); wk = agW; redraw(); }
    sync();
  }
  function fail(r: FailReason) {
    if (destroyed) return;
    opts.onFail?.(r);
    handle.destroy();
  }
  /* The resting frame: drawn once the program is ready (and, on brands, the rings' atlas), whatever the pause. */
  function first() {
    measure();
    draw(clk());
    drawn = true;
    log(`start tier=${cur!.tier} dpr=${kpx.toFixed(2)} ${gl2 ? "webgl2" : "webgl1"}`);
    report();
    requestAnimationFrame(() => {
      if (destroyed || lost) return;
      opts.onReady?.();
      if (held) relT = setTimeout(release, RELEASE_FALLBACK_MS);
    });
    sync();
  }
  const p0 = build(restTier);
  /** The program, then (on brands) the atlas, polled once per frame. */
  function waitLink() {
    poll = 0;
    if (destroyed || lost) return;
    frames++;
    if (p0 && !done(p0)) { poll = requestAnimationFrame(waitLink); return; }
    if (!p0 || !linked(p0)) { fail("link"); return; }
    if (!cur) use(p0);
    if (aud === RINGS_AUDIENCE && !atlasPx) {
      if (atlasFailed) { fail("atlas"); return; }
      poll = requestAnimationFrame(waitLink);
      return;
    }
    first();
  }

  /* window.__sky (EclipseDebug) and window.__skyHandle, only under ?skydebug or on the dev server. */
  const W = window as unknown as Record<string, unknown>;
  function dbg() {
    const d: EclipseDebug & { bead0: number } = {
      running: running(), held, tier: cur?.tier ?? restTier, dpr: kpx, fps: Math.round(fps * 10) / 10, step: stepI,
      facing: r3(Math.abs(mat[8])), flip: r3(V.flip - flipFrom), soft: r3(V.soft), aud: r3(V.aud), bead: r3(V.bead),
      switchMs: Math.round(swc / SLOW), comet: r3(comet), levels: Array.from(lv, r3), working: held ? -1 : wk,
      rings: [r3(pres), r3(dIn), r3(dOut)], bead0: r3(beadFrom),
    };
    W[SKY_DEBUG.state] = d;
  }

  const offs: (() => void)[] = [];
  const handle: EclipseHandle = {
    setAudience(a, instant = false) {
      if (destroyed) return;
      if (!instant && a !== aud) release();
      const jump = instant || !running();
      setAud(a, jump);
      if (jump) redraw();
      /* Not prefetched yet (a switch before the idle build): the rings fade in when it lands (atlasP). */
      if (a === RINGS_AUDIENCE && !lost) atlasFor(atlasCell(side, kpx));
    },
    setFocus(on) {
      if (on) release();
      V.fT = on ? 1 : 0;
    },
    pulse() {
      if (destroyed) return;
      release();
      V.pulse = Math.min(1.2, V.pulse * 0.5 + 0.9);
      if (V.pr > 0.35) V.pr = 0;
      V.kick += 0.045;
    },
    launch() {
      if (destroyed) return;
      release();
      launchT = clk();
      launching = true;
      lv.fill(1); wk = -1;
      tween("spin", V.spin + TAU, LAUNCH.spinMs, 0, eio, false);
      clearTimeout(launchTimer);
      launchTimer = setTimeout(() => {
        launchTimer = undefined; launching = false; comet = 0;
        if (stopped()) { lv.set(agT); wk = agW; redraw(); }
      }, LAUNCH.allLitMs * SLOW);
      if (DBG) dbg();
    },
    setPaused(p) { paused = p; sync(); },
    resize,
    release,
    setAgents(s) {
      if (destroyed) return;
      for (let i = 0; i < agT.length; i++) agT[i] = s.levels[i] ?? REST_AGENTS.levels[i];
      agW = s.working;
      if (stopped() && !launching) { lv.set(agT); wk = agW; redraw(); }
      if (DBG && drawn) dbg();
    },
    setTier(t) {
      if (destroyed) return;
      forced = t; locked = true;
      if (!held) { want = t; build(t); }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf); cancelAnimationFrame(poll);
      raf = poll = 0;
      clearTimeout(launchTimer); clearTimeout(relT);
      offs.forEach((off) => off());
      if (!cap && W[SKY_DEBUG.handle] === handle) { delete W[SKY_DEBUG.handle]; delete W[SKY_DEBUG.state]; }
      if (!lost) {
        try {
          g.deleteBuffer(buf); g.deleteTexture(tex);
          for (const p of Object.values(progs)) if (p) { g.deleteProgram(p.pr); g.deleteShader(p.fs); }
          g.deleteShader(vs);
          g.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { /* context already gone */ }
      }
    },
  };

  /* Capture (scripts/hero-poster.cjs): one REST frame, read back in the draw's task. No listeners, no loop. On
     brands (unless capture.rings is false) it waits for the atlas, so onFrame may come after this returns. */
  if (cap) {
    measure();
    if (!p0 || !linked(p0)) { fail("link"); return handle; }
    use(p0);
    const shoot = () => {
      if (destroyed || lost) return;
      draw(clk());
      drawn = true;
      const w = canvas.width, h = canvas.height, row = w * 4;
      const raw = new Uint8Array(w * h * 4), rgba = new Uint8Array(w * h * 4);
      g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, raw);
      for (let y = 0; y < h; y++) rgba.set(raw.subarray((h - 1 - y) * row, (h - y) * row), y * row);
      cap.onFrame({ audience: aud, width: w, height: h, dpr: cap.dpr, stage: stage.getBoundingClientRect().width, rgba });
    };
    if (aud === RINGS_AUDIENCE && cap.rings !== false) atlasFor(atlasCell(side, cap.dpr)).then(() => (atlasPx ? shoot() : fail("atlas")));
    else shoot();
    return handle;
  }

  if (DBG) W[SKY_DEBUG.handle] = handle;
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
    opts.onFail?.("lost");
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

  /* Creators: the rings' atlas in idle time after load, so a switch to brands finds it ready and the tumble never
     waits on it (review: building it at mount put a long task on /creators and its faces before the load event). */
  if (aud !== RINGS_AUDIENCE) {
    const prefetch = () => { if (!destroyed && !lost && !atlasPx) atlasFor(atlasCell(side, kpx)); };
    const idle = () => {
      if (destroyed) return;
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(prefetch, { timeout: ATLAS_IDLE_MS });
        offs.push(() => window.cancelIdleCallback(id));
      } else {
        const id = setTimeout(prefetch, ATLAS_IDLE_MS);
        offs.push(() => clearTimeout(id));
      }
    };
    if (document.readyState === "complete") idle();
    else listen(window, "load", idle, { once: true });
  }

  measure();
  poll = requestAnimationFrame(waitLink);
  return handle;
}
