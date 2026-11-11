---
name: uiux-component-patterns
description: >-
  Specific component-level UI patterns and implementation guidance for BlurBefore:
  exact Tailwind class patterns, component anatomy, interaction states, and
  Lucide icon integration. Load this skill when writing or refactoring individual
  React/Tailwind components for the BlurBefore editor.
---

# Component Patterns — BlurBefore UI Refactor

## 0. Install Lucide Icons (prerequisite)

```bash
npm install lucide-react
```

Import icons individually:
```tsx
import { Download, Upload, Square, Layers, Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Lock, Unlock, Plus, AlertTriangle, CheckCircle2, X, RefreshCw, PlusSquare } from "lucide-react";
```

---

## 1. Design Token Tailwind Mapping

Apply these exact Tailwind classes to match the design system defined in `uiux-visual-design`:

### Surface Classes
```
Page bg:          bg-[#0a0a0a]
Surface-1 cards:  bg-[#111111]
Surface-2 panel:  bg-[#1a1a1a]
Surface-3 input:  bg-[#242424]
Border subtle:    border-[#2e2e2e]
Border strong:    border-[#3d3d3d]
```

### Text Classes
```
Primary text:   text-[#f5f5f5]
Secondary text: text-[#a3a3a3]
Muted text:     text-[#666666]
```

### Accent Utility Classes
```
Green primary bg:   bg-[#22c55e]
Green hover bg:     hover:bg-[#16a34a]
Green tint bg:      bg-[#052e16]
Green border:       border-[#166534]
Green text dim:     text-[#4ade80]

Amber bg tint:      bg-[#1c1200]
Amber border:       border-[#92400e]
Amber text:         text-[#fbbf24]

Red tint bg:        bg-[#1f0a0a]
Red border:         border-[#7f1d1d]
Red text:           text-[#f87171]
```

---

## 2. Button Component Patterns

### Primary CTA Button (Export, Choose Image)
```tsx
<button className="
  inline-flex items-center justify-center gap-2
  rounded-lg px-5 py-2.5
  bg-[#22c55e] text-[#0a0a0a] text-sm font-semibold
  transition-all duration-150
  hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]
  active:scale-[0.97]
  disabled:opacity-50 disabled:cursor-not-allowed
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]
">
  <Download size={16} strokeWidth={1.75} />
  Export Image
</button>
```

### Secondary Button (Undo, Redo, Add Box)
```tsx
<button className="
  inline-flex items-center justify-center gap-1.5
  rounded-lg px-3 py-1.5
  bg-[#1a1a1a] border border-[#2e2e2e] text-[#a3a3a3] text-xs font-medium
  transition-all duration-150
  hover:bg-[#242424] hover:border-[#3d3d3d] hover:text-[#f5f5f5]
  active:scale-[0.97]
  disabled:opacity-40 disabled:cursor-not-allowed
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]
">
  <Undo2 size={14} strokeWidth={1.75} />
  Undo
</button>
```

### Danger Button (Delete Selected)
```tsx
<button className="
  inline-flex items-center justify-center gap-1.5
  rounded-lg px-3 py-1.5
  bg-[#1f0a0a] border border-[#7f1d1d] text-[#f87171] text-xs font-medium
  transition-all duration-150
  hover:bg-[#2d0f0f] hover:text-[#fca5a5]
  active:scale-[0.97]
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444]
">
  <Trash2 size={14} strokeWidth={1.75} />
  Delete
</button>
```

### Ghost Button (Zoom, New Image)
```tsx
<button className="
  inline-flex items-center justify-center gap-1
  rounded-lg px-2 py-1.5
  text-[#666666] text-xs font-medium
  transition-all duration-150
  hover:text-[#a3a3a3] hover:bg-[#1a1a1a]
  active:scale-[0.97]
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]
">
  <ZoomIn size={14} strokeWidth={1.75} />
</button>
```

---

## 3. Mode Toggle (Solid Cover vs Blur)

```tsx
// Solid Cover - active state
<button aria-pressed={mode === "solid"} className="
  inline-flex items-center gap-2
  rounded-lg px-3.5 py-2
  bg-[#052e16] border border-[#166534] text-[#4ade80] text-sm font-medium
  transition-all duration-150
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]
">
  <Square size={14} strokeWidth={0} fill="currentColor" />
  Solid Cover
  <span className="text-[10px] font-bold uppercase tracking-wider text-[#22c55e] bg-[#052e16] border border-[#166534] rounded px-1.5 py-0.5">
    Secure
  </span>
</button>

// Blur - active state
<button aria-pressed={mode === "blur"} className="
  inline-flex items-center gap-2
  rounded-lg px-3.5 py-2
  bg-[#1c1200] border border-[#92400e] text-[#fbbf24] text-sm font-medium
  ...
">
  <Layers size={14} strokeWidth={1.5} />
  Blur
  <span className="text-[10px] font-medium text-[#78350f] bg-[#1c1200] border border-[#92400e] rounded px-1.5 py-0.5">
    Visual Only
  </span>
</button>
```

---

## 4. Card / Panel Pattern

```tsx
<div className="
  rounded-xl border border-[#2e2e2e] bg-[#111111]
  p-4 sm:p-5
  shadow-[0_1px_2px_rgba(0,0,0,0.5)]
">
```

### Tinted Status Cards
```tsx
// Success / trust
<div className="rounded-lg border border-[#166534] bg-[#052e16] px-3.5 py-3">

// Warning
<div className="rounded-lg border border-[#92400e] bg-[#1c1200] px-3.5 py-3">

// Error
<div className="rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] px-3.5 py-3">

// Info
<div className="rounded-lg border border-[#1e3a5f] bg-[#0c1829] px-3.5 py-3">
```

---

## 5. Intake Dropzone Component

```tsx
// Outer container: full viewport center, dotted border
<div className="
  flex flex-col items-center justify-center
  min-h-[60vh]
  rounded-2xl border-2 border-dashed border-[#2e2e2e]
  bg-[#0a0a0a]
  px-8 py-16 text-center
  transition-all duration-200
  hover:border-[#3d3d3d]
  data-[drag-over=true]:border-[#166534] data-[drag-over=true]:bg-[#052e16]
">
  {/* Upload icon inside a tinted circle */}
  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a] border border-[#2e2e2e]">
    <Upload size={28} strokeWidth={1.5} className="text-[#4ade80]" />
  </div>

  <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">
    Drop your image here
  </h2>
  <p className="text-sm text-[#666666] max-w-sm mb-8">
    Or select a file. Everything is processed locally — your image never leaves this tab.
  </p>

  {/* Primary + secondary CTAs side by side */}
  <div className="flex flex-wrap items-center justify-center gap-3">
    <button>Choose Image</button>  {/* Primary green */}
    <button>Paste from Clipboard</button>  {/* Secondary */}
  </div>

  <p className="mt-6 text-xs text-[#666666]">
    JPEG · PNG · WebP (static) · Max 20 MB · 16 MP
  </p>
</div>
```

---

## 6. Canvas Status Bar Pattern

```tsx
<div className="
  flex items-center justify-between gap-4
  rounded-lg border border-[#2e2e2e] bg-[#111111]
  px-4 py-2.5
  text-xs text-[#666666]
">
  <div className="flex items-center gap-3 min-w-0">
    {/* Filename - truncated */}
    <span className="font-medium text-[#a3a3a3] truncate max-w-[200px]">{filename}</span>
    <span className="text-[#2e2e2e]">·</span>
    <span>{width} × {height}</span>
    <span className="text-[#2e2e2e]">·</span>
    <span>{fileSize}</span>
  </div>
  <div className="shrink-0 text-[#444444]">
    ↑↓←→ nudge · <kbd>Del</kbd> remove · edits in memory only
  </div>
</div>
```

---

## 7. Region Chip List Pattern

```tsx
<div className="flex flex-wrap gap-1.5">
  {regions.map((r, i) => (
    <div key={r.id} className={`
      inline-flex items-center gap-1.5
      rounded-md border px-2.5 py-1
      text-xs font-medium cursor-pointer
      transition-all duration-150
      ${selected
        ? "bg-[#052e16] border-[#166534] text-[#4ade80]"
        : "bg-[#1a1a1a] border-[#2e2e2e] text-[#666666] hover:border-[#3d3d3d] hover:text-[#a3a3a3]"
      }
    `}>
      <span>#{i + 1}</span>
      <span>{r.mode === "solid" ? "Solid" : "Blur"}</span>
      <button onClick={remove} className="ml-0.5 text-current opacity-50 hover:opacity-100">
        <X size={10} />
      </button>
    </div>
  ))}
</div>
```

---

## 8. Export Panel Input Pattern

```tsx
// Input field with label
<label className="block space-y-1.5">
  <span className="text-xs font-medium text-[#666666] uppercase tracking-wider">Width</span>
  <input
    type="number"
    className="
      w-full rounded-lg border border-[#2e2e2e] bg-[#1a1a1a]
      px-3 py-2 text-sm text-[#f5f5f5]
      placeholder:text-[#444444]
      transition-colors duration-150
      hover:border-[#3d3d3d]
      focus:border-[#166534] focus:outline-none focus:ring-1 focus:ring-[#166534]/30
    "
  />
</label>

// Checkbox (aspect ratio lock)
<label className="flex items-center gap-2 cursor-pointer">
  <div className="relative">
    <input type="checkbox" className="sr-only peer" />
    <div className="
      h-4 w-4 rounded border border-[#2e2e2e] bg-[#1a1a1a]
      peer-checked:bg-[#22c55e] peer-checked:border-[#22c55e]
      transition-colors duration-150
    " />
    <Lock size={10} className="absolute inset-0 m-auto text-[#0a0a0a] opacity-0 peer-checked:opacity-100" />
  </div>
  <span className="text-xs text-[#a3a3a3]">Preserve aspect ratio</span>
</label>
```

---

## 9. Format Selector Button Grid

```tsx
<div className="grid grid-cols-3 gap-1.5">
  {["JPEG", "PNG", "WebP"].map(fmt => (
    <button className={`
      rounded-lg py-2 text-xs font-semibold
      transition-all duration-150
      ${active
        ? "bg-[#22c55e] text-[#0a0a0a]"
        : supported
          ? "bg-[#1a1a1a] border border-[#2e2e2e] text-[#a3a3a3] hover:border-[#3d3d3d] hover:text-[#f5f5f5]"
          : "bg-transparent border border-[#1a1a1a] text-[#333333] cursor-not-allowed"
      }
    `}>
      {fmt}
    </button>
  ))}
</div>
```

---

## 10. Export Preview Modal Pattern

```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
  <div className="
    w-full sm:max-w-2xl
    rounded-t-2xl sm:rounded-2xl
    border border-[#2e2e2e] bg-[#111111]
    shadow-[0_8px_32px_rgba(0,0,0,0.7)]
    flex flex-col max-h-[95vh] sm:max-h-[90vh]
    overflow-hidden
  ">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e]">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} strokeWidth={1.75} className="text-[#22c55e]" />
        <div>
          <p className="text-sm font-semibold text-[#f5f5f5]">Export Ready</p>
          <p className="text-xs text-[#4ade80]">Redactions baked in · Metadata cleaned</p>
        </div>
      </div>
      <button>Close</button>
    </div>

    {/* Preview area — dark checkered bg for transparency */}
    <div className="flex-1 overflow-auto bg-[#0a0a0a] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] p-4 flex items-center justify-center">
      <img className="max-h-[45vh] rounded border border-[#2e2e2e] object-contain shadow-lg" />
    </div>

    {/* Stats + Download */}
    <div className="border-t border-[#2e2e2e] bg-[#111111] px-5 py-4 space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {/* Stats cells */}
      </div>
      <div className="flex items-center justify-between gap-3">
        <button>Continue Editing</button>  {/* Secondary */}
        <a download>
          <button>Download PNG</button>  {/* Primary green, with Download icon */}
        </a>
      </div>
    </div>
  </div>
</div>
```

---

## 11. Site Header Pattern

```tsx
<header className="
  sticky top-0 z-40
  border-b border-[#2e2e2e] bg-[#0a0a0a]/90
  backdrop-blur-md
">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
    {/* Logo */}
    <a href="/" className="flex items-center gap-2.5">
      <div className="
        h-7 w-7 rounded-lg bg-[#052e16] border border-[#166534]
        flex items-center justify-center
        text-[11px] font-bold text-[#4ade80] tracking-tighter
      ">BB</div>
      <span className="text-sm font-semibold text-[#f5f5f5]">BlurBefore</span>
      <span className="
        hidden sm:inline-flex
        rounded-full border border-[#166534] bg-[#052e16]
        px-2 py-0.5 text-[10px] font-medium text-[#4ade80]
      ">100% Local</span>
    </a>

    {/* Nav */}
    <nav className="flex items-center gap-1">
      {/* Active nav: bg-[#1a1a1a] text-[#f5f5f5] */}
      {/* Inactive nav: text-[#666666] hover:text-[#a3a3a3] */}
    </nav>
  </div>
</header>
```

---

## 12. Notice/Alert Banner Pattern (Transient)

```tsx
// Appear below toolbar, above canvas; dismissible
<div role="status" className="
  flex items-center justify-between gap-3
  rounded-lg border border-[#92400e] bg-[#1c1200]
  px-4 py-2.5 text-xs text-[#fbbf24]
  animate-in slide-in-from-top-2 duration-200
">
  <div className="flex items-center gap-2">
    <AlertTriangle size={14} strokeWidth={1.75} />
    <span>{message}</span>
  </div>
  <button onClick={dismiss} className="text-[#92400e] hover:text-[#fbbf24]">
    <X size={14} />
  </button>
</div>
```

---

## 13. Section Divider Pattern (Toolbar / Export Panel)

```tsx
{/* Vertical separator between button groups */}
<div className="h-5 w-px bg-[#2e2e2e]" aria-hidden="true" />

{/* Horizontal separator within panels */}
<div className="h-px bg-[#2e2e2e] -mx-4 sm:-mx-5" aria-hidden="true" />
```

---

## 14. Quality Slider Pattern

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-xs">
    <span className="text-[#666666] uppercase tracking-wider font-medium">Quality</span>
    <span className="font-mono text-[#a3a3a3]">{Math.round(quality * 100)}%</span>
  </div>
  <input
    type="range" min={10} max={100} step={1}
    className="
      w-full h-1.5 rounded-full
      bg-[#2e2e2e] accent-[#22c55e]
      cursor-pointer
    "
  />
  <div className="flex justify-between text-[10px] text-[#444444]">
    <span>Smaller file</span>
    <span>Higher quality</span>
  </div>
</div>
```

