# DeepSeek Harness and Creator mode evaluation

7 November 2026. **Recommendation: keep Harness out of the Outdoor Maker runtime.** The format and rendering path has no provider dependency. A future model could suggest layout settings behind a server-side interface; validate those settings and keep the creative decision and final render under user control.

## Verified source and installation

- [DeepSeek's official product page](https://www.deepseek.com/harness/en/) identifies **Creator mode** as a mode in **DeepSeek Harness**, and links to [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).
- The [upstream README at the inspected revision](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/README.md) documents `npx @deepseek-ai/dsh web` or a pnpm source build. [Creator practice notes](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/docs/user/develop/practice/dynamic-cordis.md) describe the plugin manager and extra read-only runtime inspection. This is a developer preview; read [upstream safety guidance](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/SAFETY.md).
- Installed the exact npm release `@deepseek-ai/dsh@0.2.2-rc.1` with lifecycle scripts disabled. Node 22 printed an engine warning (the package requires Node 24.9+); the conclusive startup check used Node 24.22.2.

## What ran

Installed in a non-root Docker container with capabilities dropped, no extra privileges, no host mounts and no published ports. Network access was used for the package install and removed before launch. Verified the container had zero attached networks, zero mounts and zero host port bindings during execution. No campaign files, repository checkout, real API credentials or browser profile entered the container. The generated local launch token remained inside the container.

On the isolated loopback interface, the Web profile returned 401 anonymously, 303 on the launch-token exchange and 200 HTML with the resulting local session. The default headless route was asked to calculate fit/crop for a synthetic 400 × 200 image on a 200 × 300 canvas. It returned `MISSING_CREDENTIAL` before inference. Creator mode's plugin generation and live model output were not exercised. Containers were removed after the check.

## Comparison with Codex

For the same fixture, Codex implemented and tested **fit** at 200 × 100 centred at (0, 100), and **crop** at 600 × 300 centred at (-200, 0). Harness verified install, boot and authentication boundaries, but produced no answer to score. This is a tooling comparison only. There is no measured inference quality, speed, cost or token comparison.

If plugin generation later becomes useful, run a separate, matched synthetic task against an approved isolated provider, with no campaign or repo access. Score output against the same tests and record time, tokens and corrections. The [official provider guide](https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/docs/user/guide/providers.md) documents alternative provider and gateway configuration.
