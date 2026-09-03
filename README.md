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

The prototype does not replace the legacy entry point or change its hosting. No deployment configuration is added. Dependencies and generated builds are excluded from Git.
