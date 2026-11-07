# Pilot notes

**Problem:** A creative team adapting one campaign often repeats crops, logo placement and presentation assembly across several shapes. The MVP brings these steps into one workspace, where the art director can still move each element. It is meant to accelerate review, before vendor proofing and final artwork.

**Known cost:** The MVP makes zero model calls per campaign by design, so its model API cost is zero. Preview, compositing and encoding run on the reviewer's device. Hosting, access controls, QA, maintenance, media-owner proofing and operator time have not been priced. There is no evidence yet of time, cash or revenue savings.

**Latency:** A six-second video requires about six seconds of foreground recording, plus encoding/download overhead. PNG, ZIP and PDF time depends on the source pixels and device. In one local Chrome workflow, the full desktop browser test took 10.9 seconds, including upload, editing, reload and every export. The recorded file measured 6.011 seconds at 1920 × 1080 (H.264, 388,556 bytes), checked with ffprobe. These are one-machine observations; no production latency distribution or cross-device benchmark has been established.

**Next measurement:** Ask an art director to produce the same six adaptations, one real location mockup, one six-second motion and a review deck with their normal tools and with Outdoor Maker. Record hands-on minutes, correction rounds, rejected outputs and QA time on both routes. Use agreed loaded labour rate × net minutes saved ÷ 60, subtract hosting and maintenance per campaign, and review creative quality before making a commercial claim.
