# Conway's Game of Life

An interactive, infinite-grid implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), built with Next.js.

**Live demo:** [cgol.herinzaveri.com](https://cgol.herinzaveri.com/)

## Features

- **Infinite grid** — cells are tracked sparsely (no fixed board size), so patterns can grow and roam without ever hitting an edge
- **Play / pause / step**, with a speed slider and a step-back button that replays through history since the last reset
- **Pan and zoom** — click-and-drag or touch-drag to pan, scroll wheel or pinch to zoom
- **Click or tap** a cell to toggle it
- **Presets** — Glider, Blinker, Toad, Beacon, and Pulsar
- **Randomize** / **Clear** the board, and a **Center view** button to jump back to the origin
- Generation counter and live population count
- Responsive layout with full touch support for mobile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## The rules

Each generation, every cell's fate is decided by its 8 neighbors:

1. A live cell with fewer than 2 live neighbors dies (underpopulation)
2. A live cell with 2 or 3 live neighbors survives
3. A live cell with more than 3 live neighbors dies (overpopulation)
4. A dead cell with exactly 3 live neighbors becomes alive (reproduction)

## Project structure

- [`lib/game-of-life.ts`](lib/game-of-life.ts) — pure simulation logic: the step function, preset patterns, and cell helpers
- [`app/components/game-of-life-board.tsx`](app/components/game-of-life-board.tsx) — the interactive board component (state, gestures, controls)
- [`app/page.tsx`](app/page.tsx) — the page shell
