# Factory Launch

Factory Launch is a research-driven resource management and automation prototype inspired by **Factorio** and **Immortality Factory**. The project now includes a browser-playable build that can be hosted on GitHub Pages for quick playtesting alongside the original Python simulation code.

## What's Included

- **Static Web Client** – `index.html`, `css/`, and `js/` provide a standalone build that runs entirely in the browser. The interface now renders a grid-based launch site where you click deposits to gather materials, place machines, contribute to research, and refuel your production line.
- **Simulation Logic in JavaScript** – Modular ES6 scripts (`js/gameState.js`, `js/machines.js`, `js/storage.js`, and `js/constants.js`) mirror the original game systems and drive the UI. Everything runs locally with no server dependencies, making it ideal for GitHub Pages hosting.
- **Python Core Simulation (Legacy)** – The earlier Python game-state package and tests remain in place for reference and future backend tooling.

## Getting Started

Open `index.html` directly in a browser or serve the repository with any static web host. For GitHub Pages, place the repository on a branch configured for Pages (for example `main` or `gh-pages`) and enable Pages in the repository settings—the client works without any build step.

Local development using a lightweight HTTP server:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Gameplay Overview

1. **Manual Gathering** – Click resource deposits on the grid to collect the starting stone, coal, iron, and copper required for the first research node.
2. **Research Progression** – Contribute resources to unlock coal-powered drills and the stone smelter. Progress bars reflect how close you are to completing the initial tech.
3. **Coal-Powered Drills** – Select the drill tool from the build toolbar and place drills directly on deposits to automate mining, then keep them fueled with coal.
4. **Stone Smelter** – Place the smelter on open ground, switch between iron and copper plate recipes, and keep it powered with coal to transform raw ore into processed materials.
5. **Storage & Inventory** – The UI surfaces player inventory and the starting storage chests, honoring stack limits of 50 (player) and 999 (chests).

## Automated Tests

The Python simulation is still covered by a pytest suite:

```bash
pip install -r requirements-dev.txt
pytest
```

The tests validate drill clustering, smelting throughput, research costs, and inventory limits in the Python reference implementation.
