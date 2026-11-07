# Napkin Outdoor Maker

A browser workspace for adapting campaign artwork, reviewing it in context, and exporting digital motion and presentation files.

## Start here

Requires Node.js 22.12 or later. Run:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No model account or API keys are required. To build for a static host, run `npm run build` and serve the resulting `dist/` directory over HTTPS. `npm run preview` serves a local production preview. The app itself has no account or access-control layer; use a host with access controls for a private pilot.

## Five-minute demo

1. Upload a JPEG, PNG or WebP key visual, or start with the built-in demo. Pick one of the six formats. **Fit** shows the whole artwork at default zoom. **Crop** fills the frame. **Template** places your own headline and logo inside adjustable safe zones. Layout changes apply to the selected format.
2. Try the street poster, roadside billboard and retail screen. These are illustrations. For a real location, upload a photo, select the artwork format, then assign the four corners clockwise. For an object in front of the artwork, trace a single mask polygon. Use the sliders to fine-tune corners, opacity and brightness.
3. Pick a digital format, set the duration and scrub the timeline. Play it, then download a video or the numbered PNG sequence.
4. Download a single PNG, the artwork ZIP or the PDF deck. Save on this device before reloading. Undo is available for the last 16 edits in the current session.

| Preset | Artwork PNG |
| --- | ---: |
| 6-sheet portrait | 600 × 900 px |
| 48-sheet landscape | 1200 × 600 px |
| 96-sheet wide | 1500 × 500 px |
| Bus-side panel | 1200 × 420 px |
| Digital portrait | 1080 × 1920 px |
| Digital landscape | 1920 × 1080 px |

## Review and production limits

- These are **review presets**. Confirm dimensions, safe area, bleed, DPI, colour profile and video delivery specs with each media owner before production. The PDF is a presentation deck.
- Fit/crop and template recomposition are local, predictable operations. The app does not invent text, alter logos, recognise embedded lockups, or generate new artwork. The legibility check uses type size and overlap as cues; it cannot judge a headline embedded in an image or certify distance readability.
- Uploads keep the original file in the browser's saved project. JPEG, PNG and WebP are supported up to 30 MB and 50 megapixels each. Preview sizes are reduced; the artwork PNG uses the full preset dimensions. Mockups are capped at 2400 px on the longest edge. A photo works best with a flat display surface and a matching artwork aspect ratio. The four-corner map stretches the artwork across the selected surface. There is one manual foreground mask, with no automatic segmentation, curved surfaces, lighting simulation or reflections.
- Motion supports a 5–10 second silent zoom and fade. The headline and logo stay fixed. Video uses the browser's MP4 or WebM encoder at the digital preset size; real-time recording can drop frames on slower hardware. Keep the tab visible. The fallback is a 6 fps PNG ZIP at 960 × 540 or 540 × 960 for review or assembly in an editor.
- The workspace stores one project per browser profile and site address. It does not sync between devices or survive clearing site data. Review exports are not editable backups. Use one editing tab at a time. Nothing is sent to a server by the application. Host requests and access logs depend on the static host.
- Phone-sized touch layout was exercised in browser emulation. Physical phones, mobile Safari export, private hosting and low-memory devices still need pilot verification.

## Checks

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

Use `OUTDOOR_CHROME=1 npm run test:browser` to test installed Chrome instead. `OUTDOOR_SCREENSHOTS=1` refreshes the [review screenshots](docs/screenshots/). The browser tests run against a production build and check saved uploads, format sizes, compositing pixels, deck page count, animation exports and touch editing.

See [pilot costs and measurements](docs/pilot.md) and [DeepSeek Harness evaluation](docs/deepseek.md).
