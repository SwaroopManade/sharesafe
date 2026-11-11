# BlurBefore — SRS v1.1 Technical Addendum

**Base Specification:** [ShareSafe_Software_Requirements_Specification.pdf](../ShareSafe_Software_Requirements_Specification.pdf) (v1.0, 11 Nov 2026)  
**Addendum Version:** 1.1  
**Status:** Frozen for MVP Engine & UI Implementation  

---

## 1. Frozen Product & Scope Decisions (Resolves SRS Section 16.2)

| Decision | Frozen v1.1 Choice | Notes |
| --- | --- | --- |
| Product Name | `BlurBefore` (originally drafted under working name `ShareSafe`) | Centralized in `src/config/app.ts`; export suffix `-blurbefore`. |
| Architecture | 100% Client-Side Static Web App | Zero image uploads, zero accounts, zero database, zero external image APIs (`NFR-001`, `NFR-002`). |
| Default Redaction Tool | **Solid Cover** (`mode: "solid"`) | Treated as the secure default for sensitive text, IDs, and secrets. |
| Optional Redaction Tool | **Blur** (`mode: "blur"`) | Visual obscurity only; UI warns users it is not guaranteed irreversible. Pixelation (if added later) carries the same caveat. |
| Image Intake Paths | File picker, Drag-and-Drop, Clipboard paste | Single image at a time (`FR-006`, `FR-007`, `FR-012`). |
| Supported Input Formats | JPEG / JPG, PNG, WebP | Validated via both file metadata/MIME and magic-byte header inspection. GIF, HEIC/HEIF, TIFF, and SVG rejected cleanly in MVP. |
| Default Export Format | Preserve supported source format | JPEG → JPEG, PNG → PNG, WebP → WebP (if browser supports WebP encoding; otherwise inform user and offer PNG/JPEG fallback). |
| Metadata Removal Framing | Re-encode via Canvas/Blob to strip common metadata | Communicated honestly as removing common EXIF/GPS fields from supported raster exports—never claimed as forensic sanitization (`FR-031`). |
| Analytics | None in MVP | Strictly zero third-party telemetry scripts in initial release; page works with all blockers. |
| Hosting Target | Static export (`Vercel` or `Cloudflare Pages`) | Next.js `output: "export"` with platform-level HTTP security headers. |

---

## 2. Hard Client-Side Limits (Configurable in `src/config/limits.ts`)

| Limit | Initial v1.1 Value | Rationale |
| --- | --- | --- |
| Maximum source file size | `20 MB` (`20 * 1024 * 1024` bytes) | Prevents reading oversized payloads before decode (`FR-009`). |
| Maximum decoded pixel count | `16 MP` (`16,000,000` pixels, `width × height`) | Guards mobile Safari / browser canvas memory (~64 MB raw RGBA buffer per surface; `NFR-012`). |
| Maximum output dimension | `8192 px` width or height (bounded by 16 MP total) | Prevents oversized resize exports from exhausting memory (`FR-034`). |
| Simultaneous active images | `1` | Single-image memory-only session (`FR-041`). |
| Maximum redaction regions | `100` per image | Prevents pathological rendering/history overhead. |
| Minimum redaction region size | `4 × 4` source image pixels (after clamping) | Prevents accidental micro-clicks from creating invisible `0 px` boxes that give false confidence. |

---

## 3. Technical Architecture & Pixel Pipeline Rules

### 3.1 Normalized Coordinate Model
All redaction regions are stored in **normalized coordinates `[0..1]`** relative to the **EXIF-oriented decoded image dimensions**:

```ts
export type RedactionMode = "solid" | "blur";

export interface RedactionRegion {
  id: string;
  x: number;      // [0, 1) from left edge
  y: number;      // [0, 1) from top edge
  width: number;  // (0, 1], clamped so x + width <= 1
  height: number; // (0, 1], clamped so y + height <= 1
  mode: RedactionMode;
  color?: string; // Hex color for solid mode (default: "#09090b")
  blurStrength?: number; // Relative intensity 1..3 (default: 2)
}
```

- **Outward Pixel Rounding on Render/Export:**  
  When projecting a normalized region onto an integer pixel grid `(W, H)`:
  - `left = Math.max(0, Math.floor(region.x * W))`
  - `top = Math.max(0, Math.floor(region.y * H))`
  - `right = Math.min(W, Math.ceil((region.x + region.width) * W))`
  - `bottom = Math.min(H, Math.ceil((region.y + region.height) * H))`  
  Rounding outward guarantees sub-pixel floating math never shrinks a redaction box by `1 px` and exposes edge strokes of characters.

### 3.2 Deterministic Cross-Browser Blur (No Reliance on `ctx.filter`)
- `CanvasRenderingContext2D.filter` is not consistently supported across Safari and `OffscreenCanvas` worker contexts.
- The engine uses a **single deterministic pure-TypeScript `ImageData` multi-pass box blur** (3 passes of separable horizontal + vertical box blur, approximating Gaussian blur in $O(1)$ per pixel regardless of radius).
- **Isolated Region Sampling:** Only pixels *within* the extracted region `ImageData` buffer are sampled (edge pixels clamp to the region's own border) so unblurred high-contrast pixels outside the box cannot bleed in or leak boundary clues.
- **Scale-Aware Radius:** Blur radius scales with target image resolution (and user blur strength) so a `3000 px` photo and an `800 px` screenshot receive consistent visual obscuration.

### 3.3 Orientation-Aware Decoding & Resource Cleanup
- Decode using `createImageBitmap(blob, { imageOrientation: "from-image" })` where supported, with an HTML `Image` + `URL.createObjectURL` fallback on the main thread when `createImageBitmap` is unavailable or fails on specific inputs.
- Explicitly validate decoded pixel dimensions (`width * height <= MAX_DECODED_PIXELS`) **before** allocating working/export canvases.
- Always release `ImageBitmap.close()` and `URL.revokeObjectURL()` immediately once surfaces are drawn or replaced (`FR-042`).

### 3.4 Flattened Export Pipeline Order
1. **Validate** input file (non-empty, magic bytes match JPEG/PNG/WebP, size `<= 20 MB`, not animated/unsupported).
2. **Decode** with EXIF orientation applied; reject if `width * height > 16,000,000`.
3. **Flatten onto clean export surface** at target `(outputWidth, outputHeight)` (aspect-ratio locked by default):
   - If output MIME is `image/jpeg`, pre-fill the clean export canvas with opaque background `#FFFFFF` (`FR-045`) before drawing the source image so transparent PNG/WebP pixels never turn black.
   - Draw the source image onto the clean export canvas.
   - Apply all user redaction regions directly onto the export pixel surface (`solid` fills opaque rectangles; `blur` reads region `ImageData`, runs deterministic multi-pass blur in isolation, and writes back with `putImageData`).
   - Run off the main thread in a **Web Worker + `OffscreenCanvas`** when supported, with an identical **main-thread Canvas fallback** (`NFR-011`).
4. **Re-encode** to a fresh `Blob` at the chosen format and quality (`canvas.toBlob` / `offscreen.convertToBlob`). This re-encoding boundary strips common EXIF/GPS metadata (`FR-029`, `FR-030`).
5. **Verify output MIME (`blob.type`)**: If a browser falls back (e.g., returning `image/png` when `image/webp` was requested), surface an explicit error/warning rather than mislabeling the downloaded file extension.
6. **Generate filename**: `<sanitized-original-name>-blurbefore.<ext>` (`FR-026`).

---

## 4. Security Headers & Static Hosting Configuration (`NFR-007`)

Because Next.js static export (`output: "export"`) produces static HTML/JS/CSS without a Node.js server, security headers must be declared at the host/CDN layer (`vercel.json` and `public/_headers` for Cloudflare Pages / Netlify):

- `Content-Security-Policy`: Restricts network connections (`connect-src 'self'`), blocks framing (`frame-ancestors 'none'`), permits local `blob:`/`data:` images (`img-src 'self' blob: data:`), and permits `worker-src 'self' blob:` for Web Workers.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

