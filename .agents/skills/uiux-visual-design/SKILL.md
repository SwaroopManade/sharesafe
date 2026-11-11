---
name: uiux-visual-design
description: >-
  Visual design system principles for BlurBefore: color psychology, typography hierarchy,
  spacing systems, component aesthetics, and motion/micro-interaction patterns.
  Load this skill when refactoring the UI color theme, component visual style,
  shadows, borders, or any aesthetic changes to the design system.
---

# Visual Design System — BlurBefore UI Refactor

## 1. Design Philosophy

BlurBefore is a **privacy-first tool for professionals**. The visual language must communicate:
- **Trust & safety** (not a flashy SaaS — clean, calm, competent)
- **Focus** (the image is the hero; chrome is minimal)
- **Confidence** (every action is clear, every outcome is predictable)

Design language inspiration: **Linear, Vercel Dashboard, Raycast** — dark, precise, serious.

---

## 2. Color Psychology & Palette

### Surface Palette (backgrounds)
```
page-bg:         #0a0a0a   (near-black — the canvas of focus)
surface-1:       #111111   (primary panels/cards)
surface-2:       #1a1a1a   (secondary panels, elevated cards)
surface-3:       #242424   (input backgrounds, inner cards)
surface-hover:   #2a2a2a   (hover states on surface-3)
border-subtle:   #2e2e2e   (card borders, dividers)
border-strong:   #3d3d3d   (input focus-adjacent borders)
```

### Text Palette
```
text-primary:    #f5f5f5   (headings, labels — slightly warm white, not pure)
text-secondary:  #a3a3a3   (descriptions, metadata)
text-muted:      #666666   (placeholders, disabled labels)
text-inverse:    #0a0a0a   (text on accent buttons)
```

### Accent Colors (purpose-driven, not decorative)
```
accent-green:    #22c55e   (primary CTA — solid cover, export, trust signals)
accent-green-bg: #052e16   (green tinted backgrounds)
accent-green-dim:#15803d   (pressed/hover state for green)

warning-amber:   #f59e0b   (blur mode — caution, not danger)
warning-bg:      #1c1200   (amber tinted backgrounds)

danger-red:      #ef4444   (delete, discard confirmations)
danger-bg:       #1f0a0a   (red tinted backgrounds)

info-blue:       #3b82f6   (informational notices)
info-bg:         #0c1829   (blue tinted backgrounds)
```

### Psychology Rationale
- **Near-black (not pure black)** — reduces eye strain in extended sessions; feels premium vs. flat #000
- **Green as primary CTA** — universally associated with "go", "safe", "proceed" — perfect for export
- **Amber for blur mode** — caution signal; reinforces the "not guaranteed secure" message subconsciously
- **Red only for destructive** — delete/discard; never used for decorative or info purposes
- **High contrast text** (#f5f5f5 on #111) — passes WCAG AA at all relevant sizes

---

## 3. Typography Scale

```
font-family: system-ui, -apple-system, 'Inter', sans-serif

label-xs:    11px / 400 / 0.04em uppercase tracking  (badge labels, keyboard hints)
body-xs:     12px / 400 / normal                      (help text, metadata)
body-sm:     13px / 400 / normal                      (panel content, descriptions)
body-base:   14px / 400 / normal                      (default body)
body-md:     14px / 500 / normal                      (interactive labels, button text)
heading-sm:  14px / 600 / -0.01em                     (section headers, card titles)
heading-md:  16px / 600 / -0.02em                     (panel headings)
heading-lg:  20px / 700 / -0.03em                     (page headings)
heading-xl:  28px / 700 / -0.04em                     (hero heading)
```

---

## 4. Spacing System (4px base grid)

```
gap-1: 4px    (icon-to-label, tight badge padding)
gap-2: 8px    (button internal H-padding sm, inline items)
gap-3: 12px   (button internal H-padding, form field gaps)
gap-4: 16px   (card padding sm, section spacing sm)
gap-5: 20px   (card padding default)
gap-6: 24px   (panel padding, section gap)
gap-8: 32px   (between major layout sections)
gap-12: 48px  (between page-level sections)
```

---

## 5. Border Radius Scale
```
radius-sm:   6px   (badges, small chips)
radius-md:   8px   (buttons, inputs, small cards)
radius-lg:   12px  (panels, toolbars, dropzone corners)
radius-xl:   16px  (modals, main cards)
radius-2xl:  24px  (hero cards, intake area)
```

---

## 6. Elevation / Shadow System
```
shadow-sm:  0 1px 2px rgba(0,0,0,0.5)                                    (subtle card lift)
shadow-md:  0 4px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)        (floating panels)
shadow-lg:  0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)        (modals, dropdowns)
shadow-glow-green: 0 0 20px rgba(34,197,94,0.15)                          (CTA button hover)
```

---

## 7. Button Design Patterns

### Primary (Export / Choose Image)
- Background: `#22c55e`, text: `#0a0a0a`
- Hover: `#16a34a` + `shadow-glow-green`
- Radius: 8px, padding: `10px 20px`, font-weight: 600

### Secondary (Undo / Redo / Add Box / Cancel)
- Background: `#1a1a1a`, border: `1px solid #2e2e2e`, text: `#a3a3a3`
- Hover: background `#242424`, text `#f5f5f5`, border `#3d3d3d`

### Danger (Delete / Discard)
- Background: `#1f0a0a`, border: `1px solid #7f1d1d`, text: `#f87171`
- Hover: background `#2d0f0f`, text `#fca5a5`

### Ghost (Zoom / New Image)
- Background: transparent, border: none, text: `#666666`
- Hover: text `#a3a3a3`

### Mode Toggle (Solid vs Blur)
- Inactive: `surface-2` background, `text-secondary`
- Active Solid: Left icon bar + background `#052e16`, border `#166534`, text `#4ade80`
- Active Blur: background `#1c1200`, border `#92400e`, text `#fbbf24`

---

## 8. Micro-Interaction Patterns

- All interactive elements: `transition: all 150ms ease`
- Button press: `transform: scale(0.97)` on active
- Canvas region hover: ring color transitions 150ms
- Modal entry: `opacity 0→1` + `transform: translateY(8px)→0`, 200ms ease-out
- Error/notice banners: slide in from top, 200ms
- Progress/loading: spinner or shimmer on the canvas area during decode

---

## 9. Icon Strategy

Use **Lucide Icons** (already compatible with React/Next.js) for all UI icons:
- Consistently 16×16 or 20×20
- `strokeWidth={1.5}` for a refined, modern feel (not chunky)
- Never mix filled and outlined icons in the same context

Key icons to use:
- Upload/intake: `Upload` or `ImagePlus`
- Solid cover tool: `Square` (filled)
- Blur tool: `Layers` or `Sparkles`
- Undo: `Undo2`, Redo: `Redo2`
- Delete: `Trash2`
- Export: `Download`
- Zoom in/out: `ZoomIn`, `ZoomOut`
- New image: `RefreshCw`
- Add box: `PlusSquare`
- Close: `X`
- Lock aspect: `Lock` / `Unlock`
- Check/success: `CheckCircle2`
- Warning: `AlertTriangle`
- Info: `Info`

