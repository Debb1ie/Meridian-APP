/**
 * MERIDIAN TELEMETRICS
 * Full React + TypeScript application
 *
 * Component tree:
 *   <App>
 *     <GrainOverlay />
 *     <Nav />               ← working smooth-scroll nav
 *     <HeroSection>
 *       <ReactiveHeadline />
 *       <AnalogDial />
 *       <SignalReadout />
 *     </HeroSection>
 *     <RuleDivider />
 *     <MissionSection>
 *       <ReactiveHeadline />
 *       <TypeSpecimen />
 *     </MissionSection>
 *     <WaveformSection>
 *       <WaveformCanvas />
 *       <StatGrid />
 *     </WaveformSection>
 *     <SignalSection>
 *       <ReactiveHeadline />
 *       <SignalGrid />
 *     </SignalSection>
 *     <TransmissionLog />
 *     <Footer />
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FC,
  type RefObject,
} from "react";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
interface GlyphState {
  vx: number; vy: number; vr: number;
  x: number;  y: number;  r: number;
  sx: number; sy: number; op: number;
  hot: boolean; rest: number;
}

interface TransmissionEntry {
  date: string;
  name: string;
  detail: string;
  status: "NOMINAL" | "PARTIAL" | "SEALED" | "UNDER REVIEW";
}

interface StatItem { value: string; label: string; }
interface SignalCard { freq: string; title: string; body: string; num: string; }
interface SpecRow   { id: string;   value: string; }

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const TRANSMISSIONS: TransmissionEntry[] = [
  { date:"OCT 14 1962", name:"First Contact — Event Alpha",    detail:"Duration 00:00:03 — Bearing 047° — Strength 8.2 dB above noise floor",                status:"NOMINAL"      },
  { date:"FEB 02 1963", name:"Structured Burst — Event Delta", detail:"Duration 00:02:17 — Prime interval confirmed. First linguistic flag raised.",            status:"NOMINAL"      },
  { date:"NOV 30 1965", name:"Long Transmission — Event Sigma",detail:"Duration 01:44:09 — Longest recorded. Encoding density 11.2×. Pages 4–17 sealed.",      status:"PARTIAL"      },
  { date:"AUG 15 1967", name:"Repeating Signal — Event Lambda",detail:"Duration 00:08:42 — Identical to Event Alpha, twelve repetitions. Phase-shifted 7°.",   status:"NOMINAL"      },
  { date:"JUN 01 1972", name:"The Anomaly — Event Omega",      detail:"Duration UNKNOWN — Recording equipment failed. Engineers reported 6hr gap. Classified.", status:"SEALED"       },
  { date:"NOV 11 1974", name:"Final Transmission — Event Terminus", detail:"Duration 00:00:01 — Single pulse. Project terminated 72 hours later.",             status:"UNDER REVIEW" },
];

const STATS: StatItem[] = [
  { value:"847",  label:"Transmissions logged"  },
  { value:"12",   label:"Years of operation"    },
  { value:"94m",  label:"Dish diameter"         },
  { value:"11×",  label:"Encoding density excess"},
];

const SIGNAL_CARDS: SignalCard[] = [
  {
    freq:"Freq — 1420.405 MHz", num:"01",
    title:"Hydrogen Line Anomaly",
    body:"Every transmission arrived precisely on the hydrogen line — the frequency every physicist agrees an intelligent signal would use. Not adjacent. Not approximate. Exact. On 847 separate occasions.",
  },
  {
    freq:"Interval — Prime Sequence", num:"02",
    title:"Non-Random Cadence",
    body:"Gaps between transmissions followed prime number spacing: 2, 3, 5, 7, 11... seconds. Dr. Yuen calculated the probability of this occurring by chance at less than one in 10 to the 47th power.",
  },
  {
    freq:"Density — 11× Baseline", num:"03",
    title:"Structural Linguistics",
    body:"The signals contained embedded redundancy — error-correcting structure. This is not a property of natural phenomena. It is the property of a designed communication system built to survive a noisy channel.",
  },
];

const SPEC_ROWS: SpecRow[] = [
  { id:"LAT",    value:"23°51′S — Atacama, Chile"              },
  { id:"ARRAY",  value:"MERIDIAN-7 — 94m parabolic dish"       },
  { id:"RANGE",  value:"1420.405 MHz — Hydrogen line"          },
  { id:"LOGS",   value:"847 transmissions intercepted, 1962–74" },
  { id:"STATUS", value:"PARTIALLY DECLASSIFIED — 1991"         },
];

const NAV_LINKS = [
  { label:"Mission",       href:"mission"       },
  { label:"Signals",       href:"signal"        },
  { label:"Archive",       href:"transmissions" },
  { label:"Contact",       href:"contact"       },
];

const STATUS_MSGS = ["LISTENING...","SCANNING...","SIGNAL LOCK","PROCESSING...","NOMINAL..."];

/* ══════════════════════════════════════════════
   CSS-IN-JS  (injected once into <head>)
══════════════════════════════════════════════ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Special+Elite&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
:root {
  --paper:   #e8dfc8;
  --aged:    #d4c9a8;
  --amber:   #c8720a;
  --ink:     #1a1208;
  --phosphor:#d4850a;
  --ghost:   #b8a882;
  --red:     #8b1a1a;
  --dim:     #4a3f2a;
}
body {
  background: var(--ink);
  color: var(--ink);
  font-family: 'Courier Prime', monospace;
  overflow-x: hidden;
  cursor: crosshair;
}
/* grain */
body::before {
  content:'';position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  background-size:200px 200px;
  pointer-events:none;z-index:9000;opacity:0.5;mix-blend-mode:multiply;
}
/* scanlines */
body::after {
  content:'';position:fixed;inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
  pointer-events:none;z-index:8999;
}
/* vignette */
#vignette {
  position:fixed;inset:0;pointer-events:none;z-index:8998;
  background:
    radial-gradient(ellipse 120% 10% at 50% 0%,rgba(10,6,0,.4) 0%,transparent 100%),
    radial-gradient(ellipse 120% 10% at 50% 100%,rgba(10,6,0,.4) 0%,transparent 100%),
    radial-gradient(ellipse 6% 120% at 0% 50%,rgba(10,6,0,.35) 0%,transparent 100%),
    radial-gradient(ellipse 6% 120% at 100% 50%,rgba(10,6,0,.35) 0%,transparent 100%);
}
.page { background: var(--paper); min-height: 100vh; }
/* dot grid */
.dot-grid {
  background-image: radial-gradient(circle, rgba(26,18,8,.15) 1px, transparent 1px);
  background-size: 24px 24px;
}
@keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.6)} }
@keyframes reveal-up  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes blink-cur  { 0%,100%{opacity:1} 50%{opacity:0} }
.reveal { opacity:0; transform:translateY(20px); transition:opacity .7s ease,transform .7s ease; }
.reveal.in { opacity:1; transform:translateY(0); }
`;

/* ══════════════════════════════════════════════
   HOOK — smooth scroll to section id
══════════════════════════════════════════════ */
function useSmoothNav() {
  const navigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return navigate;
}

/* ══════════════════════════════════════════════
   HOOK — live clock string
══════════════════════════════════════════════ */
function useLiveClock(): string {
  const [ts, setTs] = useState("");
  useEffect(() => {
    const fmt = () => {
      const n = new Date();
      const p = (v: number) => String(v).padStart(2, "0");
      return `${n.getFullYear()}.${p(n.getMonth()+1)}.${p(n.getDate())} — ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())} UTC`;
    };
    setTs(fmt());
    const id = setInterval(() => setTs(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return ts;
}

/* ══════════════════════════════════════════════
   HOOK — cycling readout message
══════════════════════════════════════════════ */
function useReadout(): string {
  const [msg, setMsg] = useState(STATUS_MSGS[0]);
  useEffect(() => {
    const id = setInterval(() => {
      setMsg(STATUS_MSGS[Math.floor(Date.now() / 12000) % STATUS_MSGS.length]);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return msg;
}

/* ══════════════════════════════════════════════
   HOOK — IntersectionObserver reveal
══════════════════════════════════════════════ */
function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

/* ══════════════════════════════════════════════
   HOOK — per-glyph physics engine
══════════════════════════════════════════════ */
function useGlyphPhysics(containerRef: RefObject<HTMLElement | null>) {
  const states = useRef(new Map<HTMLElement, GlyphState>());
  const rafRef = useRef<number>(0);

  const getState = (el: HTMLElement): GlyphState => {
    if (!states.current.has(el)) {
      states.current.set(el, { vx:0,vy:0,vr:0,x:0,y:0,r:0,sx:1,sy:1,op:1,hot:false,rest:0 });
    }
    return states.current.get(el)!;
  };

  const applyState = (el: HTMLElement, s: GlyphState) => {
    const blur = s.hot ? Math.min((Math.abs(s.vx) + Math.abs(s.vy)) * 0.35, 3) : 0;
    el.style.transform = `translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px) rotate(${s.r.toFixed(2)}deg) scaleX(${s.sx.toFixed(3)}) scaleY(${s.sy.toFixed(3)})`;
    el.style.opacity   = s.op.toFixed(3);
    el.style.filter    = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "none";
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const glyphs = () => Array.from(container.querySelectorAll<HTMLElement>(".glyph"));

    const onMouseMove = (e: MouseEvent) => {
      glyphs().forEach(g => {
        const rect = g.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const R = 110;
        if (dist > R) return;
        const s = getState(g);
        const force = Math.pow(1 - dist / R, 2.2);
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        s.vx += -nx * force * 34;
        s.vy += -ny * force * 26;
        s.vr += nx  * force * 24;
        s.sx  = Math.max(0.22, s.sx - force * 0.15);
        s.sy  = Math.min(2.4,  s.sy + force * 0.17);
        s.op  = Math.max(0.25, s.op - force * 0.10);
        s.hot = force > 0.4;
        s.rest = 0;
      });
    };

    const tick = () => {
      glyphs().forEach(g => {
        const s = getState(g);
        s.rest++;
        s.x += s.vx; s.y += s.vy; s.r += s.vr;
        const d = s.hot ? 0.77 : 0.71;
        s.vx *= d; s.vy *= d; s.vr *= d;
        const k = 0.11;
        s.x *= 1-k; s.y *= 1-k; s.r *= 1-k*0.8;
        s.sx = s.sx + (1 - s.sx) * 0.09;
        s.sy = s.sy + (1 - s.sy) * 0.09;
        s.op = s.op + (1 - s.op) * 0.07;
        if (s.rest > 30 && Math.abs(s.vx) + Math.abs(s.vy) < 0.015) s.hot = false;
        applyState(g, s);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);
}

/* ══════════════════════════════════════════════
   COMPONENT — GrainOverlay (fixed, behind everything)
══════════════════════════════════════════════ */
const GrainOverlay: FC = () => <div id="vignette" />;

/* ══════════════════════════════════════════════
   COMPONENT — ReactiveHeadline
   Splits text into .glyph spans for physics engine
══════════════════════════════════════════════ */
interface ReactiveHeadlineProps {
  lines: string[];
  style?: React.CSSProperties;
  className?: string;
}
const ReactiveHeadline: FC<ReactiveHeadlineProps> = ({ lines, style, className }) => (
  <div className={className} style={style}>
    {lines.map((line, li) => (
      <span key={li} style={{ display:"block" }}>
        {[...line].map((ch, ci) => (
          <span
            key={ci}
            className="glyph"
            style={{
              display: "inline-block",
              transformOrigin: "50% 100%",
              willChange: "transform, opacity, filter",
              cursor: "default",
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    ))}
  </div>
);

/* ══════════════════════════════════════════════
   COMPONENT — AnalogDial (Canvas)
══════════════════════════════════════════════ */
interface AnalogDialProps { size: number; accentColor: string; ticks: number; label: string; }
const AnalogDial: FC<AnalogDialProps> = ({ size, accentColor, ticks, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef(0);

  const draw = useCallback((value: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, R = W / 2, cx = R, cy = R, r = R - 5;
    ctx.clearRect(0, 0, W, W);

    // Face
    const face = ctx.createRadialGradient(cx-r*.2,cy-r*.2,0,cx,cy,r);
    face.addColorStop(0, "#ddd3b2"); face.addColorStop(1, "#c4b990");
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle = face; ctx.fill();
    ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 2.5; ctx.stroke();

    // Inner ring
    ctx.beginPath(); ctx.arc(cx,cy,r-5,0,Math.PI*2);
    ctx.strokeStyle = "rgba(26,18,8,0.18)"; ctx.lineWidth = 1; ctx.stroke();

    // Ticks
    const sa = Math.PI * 0.75, range = Math.PI * 1.5;
    for (let i = 0; i <= ticks; i++) {
      const a = sa + (i/ticks)*range;
      const major = i % 5 === 0;
      const len = major ? 9 : 5, ri = r - 7;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*(ri-len), cy+Math.sin(a)*(ri-len));
      ctx.lineTo(cx+Math.cos(a)*ri,       cy+Math.sin(a)*ri);
      ctx.strokeStyle = "#1a1208";
      ctx.lineWidth = major ? 1.5 : 0.8; ctx.stroke();
    }

    // Needle
    const na = sa + value * range;
    const grad = ctx.createLinearGradient(
      cx+Math.cos(na+Math.PI)*4, cy+Math.sin(na+Math.PI)*4,
      cx+Math.cos(na)*(r-16),    cy+Math.sin(na)*(r-16)
    );
    grad.addColorStop(0, accentColor); grad.addColorStop(1, "#1a1208");
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(na+Math.PI)*5, cy+Math.sin(na+Math.PI)*5);
    ctx.lineTo(cx+Math.cos(na)*(r-16),    cy+Math.sin(na)*(r-16));
    ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();

    // Pin
    ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2);
    ctx.fillStyle = "#1a1208"; ctx.fill();
  }, [accentColor, ticks]);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      angleRef.current += 0.008;
      const v = 0.55 + Math.sin(angleRef.current)*0.12 + Math.sin(angleRef.current*2.2)*0.05;
      draw(v);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <canvas ref={canvasRef} width={size} height={size}
        style={{ borderRadius:"50%", border:"2px solid #1a1208", background:"#d4c9a8", display:"block" }} />
      <div style={{ fontFamily:"VT323,monospace", fontSize:"0.68rem", letterSpacing:"0.2em",
        textTransform:"uppercase", color:"#4a3f2a", textAlign:"center", lineHeight:1.4 }}>
        {label}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — SignalReadout
══════════════════════════════════════════════ */
const SignalReadout: FC = () => {
  const readout = useReadout();
  const rows = ["ARRAY ONLINE", "BEARING 047.22°", "DURATION 00:14:38"];
  return (
    <div style={{ border:"1px solid #c8720a", padding:"0.8rem",
      background:"rgba(200,114,10,0.05)",
      fontFamily:"VT323,monospace", fontSize:"0.82rem",
      color:"#d4850a", lineHeight:1.65, letterSpacing:"0.05em" }}>
      {rows.map(r => <div key={r}>&gt; {r}</div>)}
      <div>&gt; {readout}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — WaveformCanvas
══════════════════════════════════════════════ */
const WaveformCanvas: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noise = useRef(Array.from({length:3000}, ()=>(Math.random()-0.5)*2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0, raf: number;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight || 120;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.7;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = "#080502"; ctx.fillRect(0,0,W,H);

      // Grid
      ctx.strokeStyle = "rgba(212,133,10,0.07)"; ctx.lineWidth = 0.5;
      for (let x=0;x<W;x+=40){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
      for (let y=0;y<H;y+=20){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

      const mid = H/2;
      const layers = [
        {f:0.038,a:0.28,p:0,   col:"rgba(212,133,10,0.9)", w:1.5},
        {f:0.10, a:0.11,p:1.2, col:"rgba(212,133,10,0.35)",w:0.8},
        {f:0.022,a:0.19,p:2.5, col:"rgba(212,133,10,0.55)",w:1.0},
      ];
      layers.forEach(s => {
        ctx.beginPath(); ctx.strokeStyle = s.col; ctx.lineWidth = s.w;
        for (let x=0;x<W;x++){
          const ni = Math.floor(t + x*2) % noise.current.length;
          const y = mid + Math.sin(x/W*W*s.f + t*0.05 + s.p)*s.a*H + noise.current[ni]*0.05*H;
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.stroke();
      });

      // Blip
      const bp = (t*0.4) % W;
      const g2 = ctx.createLinearGradient(bp-30,0,bp+30,0);
      g2.addColorStop(0,"transparent"); g2.addColorStop(0.5,"rgba(212,133,10,0.65)"); g2.addColorStop(1,"transparent");
      ctx.beginPath(); ctx.moveTo(bp,mid-H*0.3); ctx.lineTo(bp,mid+H*0.3);
      ctx.strokeStyle = g2; ctx.lineWidth = 2; ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { window.removeEventListener("resize",resize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ display:"block", width:"100%", height:120 }} />
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — RuleDivider
══════════════════════════════════════════════ */
interface RuleDividerProps { label: string; file: string; }
const RuleDivider: FC<RuleDividerProps> = ({ label, file }) => (
  <div style={{
    borderTop:"2px solid #1a1208", borderBottom:"1px solid rgba(26,18,8,.18)",
    padding:"0.5rem 4rem", background:"#d4c9a8",
    display:"flex", alignItems:"center", gap:"3rem",
    maxWidth:1400, margin:"0 auto",
  }}>
    <span style={{ fontFamily:"VT323,monospace", fontSize:"0.78rem", letterSpacing:"0.25em",
      textTransform:"uppercase", color:"#4a3f2a", flexShrink:0 }}>{label}</span>
    <div style={{ flex:1, height:1,
      background:"repeating-linear-gradient(90deg,#4a3f2a 0,#4a3f2a 6px,transparent 6px,transparent 14px)",
      opacity:0.3 }} />
    <span style={{ fontFamily:"VT323,monospace", fontSize:"0.78rem", color:"#c8720a",
      letterSpacing:"0.1em", flexShrink:0 }}>{file}</span>
  </div>
);

/* ══════════════════════════════════════════════
   COMPONENT — Nav  (THE FIX — uses useSmoothNav hook)
══════════════════════════════════════════════ */
const Nav: FC = () => {
  const navigate = useSmoothNav();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      borderBottom:"2px solid #1a1208",
      position:"sticky", top:0,
      background:"#e8dfc8",
      zIndex:100,
      boxShadow: scrolled
        ? "0 2px 0 #c8720a, 0 4px 0 #1a1208, 0 8px 24px rgba(0,0,0,0.18)"
        : "0 2px 0 #c8720a, 0 4px 0 #1a1208",
      transition:"box-shadow 0.3s",
    }}>
      <div style={{ display:"flex", alignItems:"stretch", maxWidth:1400, margin:"0 auto" }}>

        {/* Logo */}
        <button onClick={() => navigate("hero")}
          style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.05rem",
            letterSpacing:"0.15em", padding:"0.85rem 2rem",
            borderRight:"2px solid #1a1208",
            display:"flex", alignItems:"center", gap:"0.8rem",
            background:"none", border:"none",
            borderRight:"2px solid #1a1208",
            cursor:"crosshair", color:"#1a1208", flexShrink:0,
          }}>
          {/* Logo mark */}
          <div style={{
            width:26, height:26, border:"2px solid #1a1208", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"0.46rem", letterSpacing:0, lineHeight:1, textAlign:"center",
            position:"relative", flexShrink:0,
          }}>
            <div style={{
              position:"absolute", width:13, height:13,
              border:"1.5px solid #c8720a", borderRadius:"50%",
            }}/>
            MT
          </div>
          MERIDIAN TELEMETRICS
        </button>

        {/* Nav links */}
        <div style={{ display:"flex", marginLeft:"auto" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <button key={href} onClick={() => navigate(href)}
              style={{
                fontFamily:"'Courier Prime',monospace", fontSize:"0.7rem",
                letterSpacing:"0.12em", textTransform:"uppercase",
                color:"#4a3f2a", padding:"0 1.3rem", height:"100%",
                background:"none", border:"none",
                borderLeft:"1px solid rgba(26,18,8,0.12)",
                cursor:"crosshair",
                transition:"color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = "#c8720a";
                (e.target as HTMLElement).style.background = "rgba(200,114,10,0.05)";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = "#4a3f2a";
                (e.target as HTMLElement).style.background = "none";
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"0 1.4rem", borderLeft:"2px solid #1a1208",
          fontFamily:"VT323,monospace", fontSize:"0.88rem",
          color:"#d4850a", letterSpacing:"0.08em", flexShrink:0,
        }}>
          <div style={{
            width:7, height:7, background:"#d4850a", borderRadius:"50%",
            animation:"pulse-dot 2.4s ease-in-out infinite",
          }}/>
          SIGNAL ACTIVE
        </div>
      </div>
    </nav>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — HeroSection
══════════════════════════════════════════════ */
const HeroSection: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  useGlyphPhysics(containerRef);

  return (
    <section id="hero" ref={containerRef}
      style={{
        borderBottom:"2px solid #1a1208",
        position:"relative", overflow:"hidden",
        padding:"5rem 4rem 4rem",
        maxWidth:1400, margin:"0 auto",
      }}>
      {/* Dot grid */}
      <div className="dot-grid" style={{ position:"absolute", inset:0, pointerEvents:"none" }}/>

      <div style={{
        fontFamily:"VT323,monospace", fontSize:"0.8rem", letterSpacing:"0.25em",
        color:"#8b1a1a", border:"2px solid #8b1a1a",
        display:"inline-block", padding:"0.12rem 0.55rem",
        marginBottom:"2.5rem", transform:"rotate(-1.3deg)",
        position:"relative", textTransform:"uppercase", opacity:0.8,
      }}>
        ARCHIVE REF — MRDNT-1974-Ω
        <div style={{ position:"absolute", inset:-4, border:"1px solid #8b1a1a", opacity:0.35 }}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"4rem", alignItems:"start" }}>
        {/* Left */}
        <div>
          <ReactiveHeadline lines={["WE","HEARD","THEM."]}
            style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:"clamp(5rem,10vw,11rem)",
              lineHeight:0.88, letterSpacing:"0.01em",
              color:"#1a1208", userSelect:"none", marginBottom:"2rem",
            }}/>
          <p style={{
            fontFamily:"'Special Elite',cursive", fontSize:"0.93rem",
            lineHeight:1.9, color:"#4a3f2a", maxWidth:520, marginBottom:"2.5rem",
          }}>
            Since 1962, MERIDIAN TELEMETRICS has operated the world's most sensitive
            deep-space signal array.{" "}
            <em style={{ fontStyle:"normal", color:"#c8720a", borderBottom:"1px solid #c8720a" }}>
              We did not go looking.
            </em>{" "}
            The transmissions found us. Twelve years. 847 intercepts. All classified. Until now.
          </p>
          <div style={{ display:"flex" }}>
            {["Access Archive","View Signals"].map((label,i) => (
              <button key={label}
                onClick={() => document.getElementById(i===0?"mission":"signal")?.scrollIntoView({behavior:"smooth"})}
                style={{
                  fontFamily:"'Bebas Neue',sans-serif", fontSize:"1rem",
                  letterSpacing:"0.2em", padding:"0.75rem 2.2rem",
                  background: i===0 ? "#1a1208" : "transparent",
                  color:       i===0 ? "#e8dfc8" : "#1a1208",
                  border:`2px solid #1a1208`,
                  borderLeft: i===1 ? "none" : "2px solid #1a1208",
                  cursor:"crosshair",
                  transition:"background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "#c8720a";
                  el.style.borderColor = "#c8720a";
                  el.style.color = "#1a1208";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = i===0 ? "#1a1208" : "transparent";
                  el.style.borderColor = "#1a1208";
                  el.style.color = i===0 ? "#e8dfc8" : "#1a1208";
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          borderLeft:"2px solid #1a1208", paddingLeft:"2.5rem",
          display:"flex", flexDirection:"column", gap:"2rem", marginTop:"1rem",
        }}>
          <AnalogDial size={120} accentColor="#c8720a" ticks={20} label={"SIGNAL FREQ\nMHz 1420.405"} />
          <AnalogDial size={80}  accentColor="#8b3a00" ticks={10} label="STRENGTH" />
          <SignalReadout />
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — MissionSection
══════════════════════════════════════════════ */
const MissionSection: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef    = useRef<HTMLDivElement>(null);
  useGlyphPhysics(containerRef);
  useReveal(revealRef);

  return (
    <section id="mission" ref={containerRef}
      style={{ maxWidth:1400, margin:"0 auto", padding:"5rem 4rem",
        display:"grid", gridTemplateColumns:"260px 1fr", gap:"5rem",
        borderBottom:"2px solid #1a1208" }}>

      {/* Index */}
      <div style={{ position:"sticky", top:80, alignSelf:"start" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"8rem",
          lineHeight:0.85, color:"rgba(26,18,8,0.07)", letterSpacing:"-0.02em", marginBottom:"1rem" }}>01</div>
        <span style={{ fontFamily:"VT323,monospace", fontSize:"0.76rem", letterSpacing:"0.25em",
          textTransform:"uppercase", color:"#c8720a", display:"block", marginBottom:"0.3rem" }}>// ORIGIN BRIEF</span>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.5rem",
          letterSpacing:"0.05em", color:"#1a1208", lineHeight:1.1 }}>Project<br/>Meridian</div>
      </div>

      {/* Body */}
      <div ref={revealRef} className="reveal">
        <ReactiveHeadline lines={["THE QUIET","YEARS"]}
          style={{ fontFamily:"'Bebas Neue',sans-serif",
            fontSize:"clamp(2.8rem,5vw,5.5rem)", lineHeight:0.9,
            letterSpacing:"0.02em", color:"#1a1208",
            marginBottom:"2rem", userSelect:"none" }}/>

        {[
          <>From 1962 to 1974, a team of <strong>fourteen engineers and two linguists</strong> operated a signal-receiving apparatus buried 300 metres beneath the Atacama plateau. The project had no official name. Budget lines read "atmospheric calibration." The team called it the Ear.</>,
          <>What they received over twelve years has never been fully declassified. The frequencies were non-random. The intervals, prime-spaced. The information density — per the linguists — <strong>exceeded any known human encoding by a factor of eleven.</strong></>,
        ].map((content, i) => (
          <p key={i} style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.87rem",
            lineHeight:2, color:"#4a3f2a", maxWidth:580, marginBottom:"1.5rem" }}>
            {content}
          </p>
        ))}

        {/* Specimen */}
        <div style={{ margin:"3rem 0", padding:"2rem", border:"2px solid #1a1208",
          position:"relative", background:"#d4c9a8" }}>
          <div style={{ position:"absolute", top:"-0.6rem", left:"1rem",
            background:"#d4c9a8", padding:"0 0.5rem",
            fontFamily:"VT323,monospace", fontSize:"0.66rem",
            letterSpacing:"0.2em", color:"#8b1a1a" }}>
            CLASSIFIED — LEVEL 4 CLEARANCE
          </div>
          {SPEC_ROWS.map(({ id, value }) => (
            <div key={id} style={{ display:"flex", alignItems:"baseline", gap:"2rem",
              borderBottom:"1px solid rgba(26,18,8,0.12)", padding:"0.65rem 0" }}>
              <span style={{ fontFamily:"VT323,monospace", fontSize:"0.68rem",
                color:"#b8a882", letterSpacing:"0.15em", flexShrink:0, width:60 }}>{id}</span>
              <span style={{ fontFamily:"'Special Elite',cursive", fontSize:"0.84rem",
                color:"#4a3f2a", lineHeight:1.6,
                ...(id==="STATUS" ? {color:"#8b1a1a", fontWeight:"bold"} : {}) }}>
                {id==="STATUS" ? <strong style={{color:"#8b1a1a"}}>{value}</strong> : value}
              </span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.87rem",
          lineHeight:2, color:"#4a3f2a", maxWidth:580 }}>
          This archive contains the public portion of the intercepted material:
          spectral data, decoded frequency maps, and the <strong>partial linguistic analysis</strong> completed
          before the project was terminated in November 1974. Fourteen pages remain sealed
          under Executive Order 11905.
        </p>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — WaveformSection
══════════════════════════════════════════════ */
const WaveformSection: FC = () => {
  const clock = useLiveClock();
  return (
    <div id="waveform-band" style={{
      background:"#0e0a04", padding:"4rem",
      borderTop:"2px solid #c8720a", borderBottom:"2px solid #c8720a",
    }}>
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <span style={{ fontFamily:"VT323,monospace", fontSize:"0.93rem",
            letterSpacing:"0.3em", color:"#d4850a", textTransform:"uppercase" }}>
            ▸ LIVE SIGNAL FEED — MERIDIAN ARRAY 7
          </span>
          <span style={{ fontFamily:"VT323,monospace", fontSize:"0.76rem",
            color:"rgba(212,133,10,0.45)", letterSpacing:"0.15em" }}>{clock}</span>
        </div>
        <WaveformCanvas />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          borderTop:"1px solid rgba(212,133,10,0.25)", marginTop:"2rem" }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{ padding:"2rem 0 2rem 2rem",
              borderRight: i<3 ? "1px solid rgba(212,133,10,0.15)" : "none" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"3.5rem",
                color:"#d4850a", lineHeight:1, letterSpacing:"0.02em" }}>{value}</div>
              <div style={{ fontFamily:"VT323,monospace", fontSize:"0.7rem",
                color:"rgba(212,133,10,0.45)", letterSpacing:"0.2em",
                textTransform:"uppercase", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — SignalSection
══════════════════════════════════════════════ */
const SignalSection: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef    = useRef<HTMLDivElement>(null);
  useGlyphPhysics(containerRef);
  useReveal(revealRef);

  return (
    <section id="signal" ref={containerRef}
      style={{ maxWidth:1400, margin:"0 auto", padding:"5rem 4rem",
        borderBottom:"2px solid #1a1208" }}>
      <ReactiveHeadline lines={["WHAT","WE","FOUND."]}
        style={{ fontFamily:"'Bebas Neue',sans-serif",
          fontSize:"clamp(3rem,6vw,7rem)", letterSpacing:"0.02em",
          lineHeight:0.9, marginBottom:"3rem", userSelect:"none" }}/>
      <div ref={revealRef} className="reveal"
        style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          border:"2px solid #1a1208" }}>
        {SIGNAL_CARDS.map(({ freq, title, body, num }) => (
          <div key={num}
            style={{ padding:"2.5rem", borderRight: num!=="03" ? "2px solid #1a1208" : "none",
              position:"relative", transition:"background 0.2s", cursor:"crosshair" }}
            onMouseEnter={e => (e.currentTarget.style.background="rgba(200,114,10,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
            <div style={{ fontFamily:"VT323,monospace", fontSize:"0.68rem",
              letterSpacing:"0.25em", color:"#c8720a", textTransform:"uppercase", marginBottom:8 }}>{freq}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.75rem",
              letterSpacing:"0.04em", color:"#1a1208", marginBottom:8, lineHeight:1 }}>{title}</div>
            <p style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.79rem",
              color:"#4a3f2a", lineHeight:1.85 }}>{body}</p>
            <span style={{ position:"absolute", bottom:"1.2rem", right:"1.5rem",
              fontFamily:"VT323,monospace", fontSize:"2rem",
              color:"rgba(26,18,8,0.07)" }}>{num}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — TransmissionLog
══════════════════════════════════════════════ */
const STATUS_COLORS: Record<string,string> = {
  "NOMINAL":"#c8720a", "PARTIAL":"#8b1a1a", "SEALED":"#8b1a1a", "UNDER REVIEW":"#4a3f2a",
};
const TransmissionLog: FC = () => {
  const revealRef = useRef<HTMLDivElement>(null);
  useReveal(revealRef);
  return (
    <section id="transmissions"
      style={{ maxWidth:1400, margin:"0 auto", padding:"5rem 4rem",
        borderBottom:"2px solid #1a1208" }}>
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between",
        marginBottom:"2.5rem", borderBottom:"2px solid #1a1208", paddingBottom:"1rem" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2.5rem",
          letterSpacing:"0.04em", color:"#1a1208" }}>TRANSMISSION LOG</div>
        <div style={{ fontFamily:"VT323,monospace", fontSize:"0.74rem",
          color:"#4a3f2a", letterSpacing:"0.15em" }}>PARTIAL RELEASE — EXEC. ORDER 11905</div>
      </div>
      <div ref={revealRef} className="reveal">
        {TRANSMISSIONS.map(({ date, name, detail, status }) => (
          <div key={date}
            style={{ display:"grid", gridTemplateColumns:"130px 1fr 160px",
              gap:"2rem", alignItems:"baseline",
              borderBottom:"1px solid rgba(26,18,8,0.12)",
              padding:"1.2rem 0", transition:"background 0.15s, padding-left 0.15s",
              cursor:"crosshair" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(200,114,10,0.05)"; e.currentTarget.style.paddingLeft="0.5rem"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}>
            <span style={{ fontFamily:"VT323,monospace", fontSize:"0.78rem",
              color:"#b8a882", letterSpacing:"0.12em" }}>{date}</span>
            <div>
              <div style={{ fontFamily:"'Special Elite',cursive", fontSize:"0.96rem", color:"#1a1208" }}>{name}</div>
              <div style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.72rem",
                color:"#4a3f2a", marginTop:4 }}>{detail}</div>
            </div>
            <span style={{ fontFamily:"VT323,monospace", fontSize:"0.76rem",
              letterSpacing:"0.15em", textTransform:"uppercase",
              textAlign:"right", color: STATUS_COLORS[status] ?? "#4a3f2a" }}>{status}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════
   COMPONENT — Footer
══════════════════════════════════════════════ */
const Footer: FC = () => (
  <footer id="contact" style={{ background:"#1a1208", color:"#e8dfc8", padding:"4rem" }}>
    <div style={{ maxWidth:1400, margin:"0 auto",
      display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"4rem",
      borderBottom:"1px solid rgba(232,223,200,0.08)",
      paddingBottom:"3rem", marginBottom:"2rem" }}>
      <div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.6rem",
          letterSpacing:"0.1em", marginBottom:"0.8rem" }}>MERIDIAN<br/>TELEMETRICS</div>
        <p style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.74rem",
          color:"rgba(232,223,200,0.35)", lineHeight:1.85 }}>
          Deep signal reception &amp; analysis.<br/>Est. 1961 — Santiago, Chile.<br/>
          Operating continuously since first light.
        </p>
      </div>
      {[
        { heading:"// Archive",  items:["Signal Database","Declassified Reports","Frequency Maps","Linguistic Analysis","Equipment Logs"] },
        { heading:"// Contact",  items:["Press Enquiries","Research Access","FOIA Requests","Array Status Feed","Secure Submissions"] },
      ].map(({ heading, items }) => (
        <div key={heading}>
          <h4 style={{ fontFamily:"VT323,monospace", fontSize:"0.74rem", letterSpacing:"0.25em",
            textTransform:"uppercase", color:"#d4850a", marginBottom:"1rem" }}>{heading}</h4>
          <ul style={{ listStyle:"none" }}>
            {items.map(item => (
              <li key={item} style={{ fontFamily:"'Courier Prime',monospace", fontSize:"0.74rem",
                color:"rgba(232,223,200,0.38)", marginBottom:"0.5rem",
                cursor:"crosshair", transition:"color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color="#e8dfc8")}
                onMouseLeave={e => (e.currentTarget.style.color="rgba(232,223,200,0.38)")}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ maxWidth:1400, margin:"0 auto", display:"flex",
      justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontFamily:"VT323,monospace", fontSize:"0.7rem",
        color:"rgba(232,223,200,0.2)", letterSpacing:"0.1em" }}>
        © 1974–2025 MERIDIAN TELEMETRICS INC. ALL RIGHTS RESERVED. SOME MATERIAL REMAINS CLASSIFIED.
      </span>
      <span style={{ fontFamily:"VT323,monospace", fontSize:"0.7rem",
        color:"rgba(212,133,10,0.35)", letterSpacing:"0.1em" }}>
        23°51′S 69°04′W — ALT 3,020m — ARRAY-7 ONLINE
      </span>
    </div>
  </footer>
);

/* ══════════════════════════════════════════════
   ROOT — App
══════════════════════════════════════════════ */
const App: FC = () => {
  // Inject global CSS + fonts once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.prepend(style);
  }, []);

  return (
    <div className="page">
      <GrainOverlay />
      <Nav />
      <HeroSection />
      <RuleDivider label="Transmission Log"    file="FILE 001 OF 847" />
      <MissionSection />
      <RuleDivider label="Signal Analysis"     file="FILE 002 OF 847" />
      <WaveformSection />
      <RuleDivider label="Signal Cards"        file="FILE 003 OF 847" />
      <SignalSection />
      <RuleDivider label="Transmission Archive" file="FILE 004 OF 847" />
      <TransmissionLog />
      <Footer />
    </div>
  );
};

export default App;
