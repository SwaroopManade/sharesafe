---
name: uiux-layout-ux
description: >-
  UX layout principles for BlurBefore: information architecture, component placement,
  user flow psychology, progressive disclosure, cognitive load reduction, and
  responsive layout patterns. Load this skill when making decisions about WHERE
  components go, what order controls appear in, and how the layout adapts.
---

# UX Layout & Information Architecture — BlurBefore

## 1. The Core User Job-to-be-Done

The user arrives with ONE goal:
> **"I need to safely share this image — help me hide the sensitive parts quickly."**

Every layout decision must serve this job. Anything that doesn't help the user complete this job within 60 seconds on first use is friction.

---

## 2. User Psychology & Mental Model

### The 3-Phase Mental Model
Users mentally process BlurBefore in exactly 3 phases:
1. **Load** — Get my image in (easiest possible action)
2. **Cover** — Mark what to hide (the main task)
3. **Export** — Get the safe image out (the payoff)

The layout must visually reinforce this left-to-right / top-to-bottom progression:
```
[Phase 1: Intake] → [Phase 2: Edit Canvas + Toolbar] → [Phase 3: Export]
```

### Hick's Law — Reduce Choices
- Never show more than 2–3 primary choices at once
- Default to Solid Cover; blur is secondary (matches security recommendation + reduces decision fatigue)
- The first button the user sees should ALWAYS be the most important next action

### Fitts's Law — Click Targets
- Primary CTA (export button) must be large and in an easy-to-reach position
- Resize handles: minimum 24×24px touch targets
- Frequently used buttons (undo/redo, mode toggle) must be reachable without crossing the canvas

### Peak-End Rule — Make the Exit Memorable
- The export preview modal is the "peak moment" — make it celebratory and confident
- Show a clear success state: green confirmation, download button prominently placed
- End on a positive: "Your image is ready to share safely"

---

## 3. Layout Architecture

### Page Layout (after image loaded)
```
┌─────────────────── HEADER (40px fixed) ─────────────────────┐
│  [BB Logo]                              [Editor] [Privacy]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────── TOOLBAR (tool controls) ───────────────────┐   │
│  │  [Solid●SECURE] [Blur○] │ [+Box] [Del] │ [←][→][↺]   │   │
│  │  [Color swatches / blur strength]                     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────── MAIN CONTENT ──────────────────────┐    │
│  │                                      │               │    │
│  │   CANVAS (image + overlay regions)   │  EXPORT       │    │
│  │   [image fills this area]            │  PANEL        │    │
│  │                                      │  (sidebar)    │    │
│  │   ─── Status bar ─────────────────── │               │    │
│  │   [filename · dims · size]           │               │    │
│  │   [Region list chips]                │               │    │
│  │                                      │               │    │
│  └───────────────────────────────────── ┘               │    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (capabilities explanation, privacy link)             │
└──────────────────────────────────────────────────────────────┘
```

### Export Panel Sidebar Column Width
- Desktop (≥1280px): 300px fixed sidebar
- Tablet (≥1024px): 280px fixed sidebar
- Mobile (<1024px): Full-width, stacked below canvas

### Toolbar Placement Rationale
- Toolbar above canvas: matches natural reading order (configure tool → use tool)
- Mode toggles on the LEFT of the toolbar (primary decision)
- History/utility controls on the RIGHT (secondary actions, available but not in the way)

---

## 4. Progressive Disclosure

### Phase 1 — Intake State (no image loaded)
Show ONLY:
- Large, friendly dropzone (the entire viewport center)
- Clear privacy signal ("Nothing leaves your device")
- File constraints (formats, size limit — in small text below)

Hide: toolbar, canvas, export panel, privacy FAQ details

### Phase 2 — Editor State (image loaded)
Reveal:
- Toolbar (immediately, full-width above canvas)
- Canvas with the image
- Export sidebar

Auto-select: First region if drawn immediately (no extra click needed)
Auto-focus: Canvas for keyboard users (tab stop on canvas `role="application"`)

### Phase 3 — Export Preview Modal
The modal is FULL FOCUS — dim the entire background:
- Large image preview (≥50% of modal height)
- Stats grid below: dimensions, size, format, filename
- Download button: large, bottom-right, green
- "Continue Editing" secondary: left of download

---

## 5. Control Placement Psychology

### Toolbar Control Order (left → right = most used → least used)
```
1. Mode Toggle (Solid / Blur) — MOST IMPORTANT decision
2. Contextual sub-controls (color swatches / blur strength) — RIGHT of mode
3. Separator
4. Add Box — keyboard alternative
5. Delete Selected — appears only when region is selected
6. Separator
7. Undo / Redo
8. Reset All
9. Separator
10. Zoom controls (−, zoom label, +)
11. New Image — LEAST used, far right
```

### Export Panel Order (top → bottom = decision sequence)
```
1. Source info (dimensions, format) — orientation
2. Metadata cleaning status (trust signal — always visible)
3. Resize controls — optional, collapsible on mobile
4. Format selector
5. Quality controls (only visible for JPEG/WebP)
6. Error message (if any)
7. Export CTA button — always at the bottom, full width
```

---

## 6. Cognitive Load Reduction Techniques

### Sensible Defaults
- Solid Cover is pre-selected (no choice needed for first use)
- Aspect ratio locked by default
- Output format pre-selected to match input format
- Quality set to "Balanced" (82%)

### Feedback Loops (immediate response to actions)
- Drawing a region → it appears instantly on canvas (no lag)
- Selecting a region → toolbar sub-controls update to reflect that region's current settings
- Hovering over export format → tooltip explains if disabled + why
- Undo → region disappears immediately with undo animation

### Error Prevention over Error Recovery
- File size checked BEFORE decode (not after a 10-second wait)
- Format checked via magic bytes (not after decode failure)
- Minimum region size enforced with tooltip ("Too small — drag a larger rectangle")
- Warn before closing/replacing if unsaved edits exist

---

## 7. Responsive Behavior

### Mobile (<768px): Stack Layout
```
[Header]
[Intake Dropzone — full width]
↓ (after load)
[Toolbar — wrap to 2 rows if needed]
[Canvas — full viewport width]
[Status bar]
[Region chips]
[Export panel — full width]
[Footer]
```

### Tablet (768–1024px): Narrow side-by-side or stacked
- Canvas takes 65% of width
- Export panel takes 35%
- Toolbar stays single row

### Desktop (≥1024px): Full 2-column layout (described above)

---

## 8. Accessibility Layout Requirements

- Logical tab order: Header nav → Toolbar → Canvas (application role) → Export panel → Footer
- Skip-to-content link at top of page (visually hidden, appears on focus)
- All interactive regions in region list are reachable via Tab
- Modal (confirm discard + export preview) traps focus until closed
- Canvas has `aria-label` and `role="application"` with keyboard instructions in a visible caption
- Color is never the ONLY indicator (always paired with shape/text label)

