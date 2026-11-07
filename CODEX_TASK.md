# Codex build mission — Napkin Outdoor Maker

Build a production-quality creative tool from the existing zero-dependency browser prototype. Preserve the existing functionality while migrating to React + TypeScript + Vite if useful.

## Product
One campaign idea or uploaded key visual → intelligent adaptation to 6-sheet, 48-sheet, 96-sheet, bus side, digital portrait and digital landscape → in-situ previews → animated digital OOH → exports.

## Priorities
1. Improve upload UX and preserve source image quality; include brand lockup safe zones, text legibility and format presets.
2. Implement template-driven layout recomposition with editable positions and no hallucinated logos or headlines. Clearly separate simple fit/crop from AI-generated adaptation.
3. Build realistic perspective-aware placement on user-supplied scene photos using four-corner mapping and masking. Mark synthetic previews as illustrative.
4. Add timeline-based DOOH motion (5–10 seconds) with browser-side preview and export; use a fallback if video rendering is unavailable.
5. Add PNG, ZIP and PDF deck exports with verified dimensions. Do not claim print-ready until vendor-specific DPI/bleed requirements are validated.
6. Add automated tests and clear setup documentation.

## DeepSeek experiment
Verify the official DeepSeek Creator/Harness project and installation steps independently. Use an isolated sandbox and compare results with Codex; do not assume claims in social media are accurate. Keep model providers swappable. Never commit credentials.

## Definition of done
Working deployable UI, 6 formats, 3 credible mockup scenes, 1 animated output, exports, tests, demo instructions and cost/latency notes. Open a PR with screenshots and limitations.
