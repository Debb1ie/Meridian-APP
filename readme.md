# MERIDIAN TELEMETRICS

> *A fictional 1962 deep-space signal archive. Built in React + TypeScript.*

---

## Concept

MERIDIAN TELEMETRICS is a retro-futurist website for a government signal-interception agency that never existed — but feels like it should have. The design language is **yellowed paper, amber phosphor CRT, ink stamps, and analog instruments**. Every visual choice has a reason. Nothing glows teal.

The central creative bet: **typography that physically reacts to the mouse**. Not a CSS hover effect. A real per-glyph physics simulation — velocity, damping, spring restoration — running at 60fps via `requestAnimationFrame`.

---

## Stack

| Layer | Choice |
|---|---|
| UI framework | React 18 |
| Language | TypeScript (strict) |
| Build tool | Vite |
| Styling | CSS-in-JS (injected via `useEffect`, zero runtime library) |
| Canvas | Web Canvas API — no Three.js, no PixiJS |
| Fonts | Google Fonts — VT323, Bebas Neue, Courier Prime, Special Elite |
| Dependencies | None beyond React itself |

---

## Getting Started

```bash
# 1. Scaffold
npm create vite@latest meridian -- --template react-ts
cd meridian

# 2. Replace src/App.tsx with MeridianApp.tsx
cp MeridianApp.tsx src/App.tsx

# 3. Install & run
npm install
npm run dev
```

No extra packages needed. The component is self-contained.

---

## Component Tree

```
<App>
  <GrainOverlay />          — fixed vignette layer (z-index 8998)
  <Nav />                   — sticky, smooth-scroll, scroll-shadow on scroll
  <HeroSection>
    <ReactiveHeadline />    — physics glyph engine
    <AnalogDial />          — animated canvas instrument ×2
    <SignalReadout />       — cycling status messages
  </HeroSection>
  <RuleDivider />           — FILE 001 OF 847
  <MissionSection>
    <ReactiveHeadline />
    <TypeSpecimen />        — classified data table
  </MissionSection>
  <RuleDivider />           — FILE 002 OF 847
  <WaveformSection>
    <WaveformCanvas />      — live signal feed (3-layer sine + noise + blip)
    <StatGrid />
  </WaveformSection>
  <RuleDivider />           — FILE 003 OF 847
  <SignalSection>
    <ReactiveHeadline />
    <SignalGrid />          — 3 analysis cards
  </SignalSection>
  <RuleDivider />           — FILE 004 OF 847
  <TransmissionLog />       — 6 archive entries with scroll reveal
  <Footer />
```

---

## Custom Hooks

### `useSmoothNav()`
Returns a `navigate(id: string)` function that calls `scrollIntoView({ behavior: "smooth" })`. Used by every nav button — this is why the navbar actually works.

### `useGlyphPhysics(containerRef)`
The core engine. Attaches a `mousemove` listener to `window` and a `requestAnimationFrame` tick loop. For every `.glyph` element inside the container:

- Calculates distance from cursor
- Applies a repulsion force scaled by `(1 - dist/radius)^2.2`
- Integrates velocity into position, rotation, scaleX, scaleY, opacity
- Applies damping (`0.71–0.77`) and spring restoration per frame
- Writes directly to `el.style` — no React re-renders

Each glyph's state is stored in a `WeakMap<HTMLElement, GlyphState>` keyed on the DOM node.

### `useLiveClock()`
Formats `new Date()` into `YYYY.MM.DD — HH:MM:SS UTC`, updates every second via `setInterval`. Cleans up on unmount.

### `useReadout()`
Cycles through `STATUS_MSGS` array every 12 seconds. Drives the signal readout panel in the hero sidebar.

### `useReveal(ref)`
Wraps `IntersectionObserver` with `threshold: 0.12`. Adds class `"in"` when the element enters the viewport, then disconnects. Used on mission body, signal grid, and transmission log.

---

## TypeScript Interfaces

```typescript
interface GlyphState {
  vx: number; vy: number; vr: number;   // velocity: x, y, rotation
  x: number;  y: number;  r: number;    // position, rotation angle
  sx: number; sy: number;               // scale x, scale y
  op: number;                           // opacity
  hot: boolean;                         // currently being disturbed
  rest: number;                         // frames since last disturbance
}

interface TransmissionEntry {
  date: string;
  name: string;
  detail: string;
  status: "NOMINAL" | "PARTIAL" | "SEALED" | "UNDER REVIEW";
}
```

---

## Canvas Work

**`AnalogDial`** — drawn each frame with:
- Radial gradient face
- Tick marks (major every 5, minor between)
- Gradient needle from `accentColor` → `#1a1208`
- Center pin
- Needle angle: `startAngle + value × 1.5π`

**`WaveformCanvas`** — three overlapping sine waves at different frequencies, amplitudes, and phases, plus pre-generated noise array (`Float32Array` length 3000), plus a travelling blip pulse rendered as a vertical linear gradient.

Both canvases resize to their container on `window.resize`.

---

## Design Tokens

```css
--paper:    #e8dfc8   /* base page background — aged paper */
--aged:     #d4c9a8   /* slightly darker paper — rule bands, specimen blocks */
--amber:    #c8720a   /* primary accent — links, dials, borders */
--ink:      #1a1208   /* near-black — all text, structural lines */
--phosphor: #d4850a   /* CRT amber — waveform, readout, stat numbers */
--ghost:    #b8a882   /* muted mid-tone — dates, spec IDs */
--red:      #8b1a1a   /* classification stamps, SEALED status */
--dim:      #4a3f2a   /* body text, nav links */
```

---

## Files

```
MeridianApp.tsx       — full React + TypeScript source (1,015 lines)
meridian-app.html     — same codebase, Babel-compiled inline for browser preview
README.md             — this file
```

---

*Built in the void. Signals received. Some pages remain sealed.*
