# DanceDanceDisorder

Two implementations live alongside each other:

- **Original Unity WebGL export:** root `index.html` and `Build/`. These existing files are unchanged.
- **Web-native physics prototype:** [`web-prototype/`](web-prototype/README.md), built with TypeScript, Vite, Phaser and Planck.

## Run the new prototype

With Node.js 22.12+ or 24+ and pnpm installed:

```sh
cd web-prototype
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Hold Space or the play area to pull left; release to pull right. Live controls include a physical head and self-collision toggles.

`pnpm test` runs physics checks; `pnpm build` produces `web-prototype/dist/`.

GitHub Actions builds and deploys both games on every push to master. The original Unity entry point and Build/ remain at the site root; the Vite production output is published under web-prototype/. Source TypeScript and node_modules are not included in the deployment. Relative asset URLs support the existing /DanceDanceDisorder/web-prototype/ path.

Workflow: .github/workflows/pages.yml. Pages publishing source must be GitHub Actions (Settings → Pages). To stage locally after building, run node scripts/stage-pages.mjs from the repository root. The disposable output is .pages-site/. Dependencies and generated builds are excluded from Git.
