export type LiveCells = Set<string>;

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function parseCellKey(key: string): [number, number] {
  const [x, y] = key.split(",").map(Number);
  return [x, y];
}

/**
 * Advances the board by one generation on an unbounded grid. Only cells
 * adjacent to a live cell are ever candidates, so the board never needs a
 * fixed size or edge handling.
 */
export function step(liveCells: LiveCells): LiveCells {
  const neighborCounts = new Map<string, number>();

  for (const key of liveCells) {
    const [x, y] = parseCellKey(key);
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const neighborKey = cellKey(x + dx, y + dy);
      neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1);
    }
  }

  const next: LiveCells = new Set();
  for (const [key, count] of neighborCounts) {
    if (count === 3 || (count === 2 && liveCells.has(key))) {
      next.add(key);
    }
  }
  return next;
}

export type Pattern = {
  name: string;
  cells: [number, number][];
};

function parsePatternRows(rows: string[]): [number, number][] {
  const cells: [number, number][] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === "O") cells.push([x, y]);
    });
  });
  return cells;
}

export const PRESET_PATTERNS: Pattern[] = [
  { name: "Glider", cells: parsePatternRows([".O.", "..O", "OOO"]) },
  { name: "Blinker", cells: parsePatternRows(["OOO"]) },
  { name: "Toad", cells: parsePatternRows([".OOO", "OOO."]) },
  {
    name: "Beacon",
    cells: parsePatternRows(["OO..", "O...", "...O", "..OO"]),
  },
  {
    name: "Pulsar",
    cells: parsePatternRows([
      "..OOO...OOO..",
      ".............",
      "O....O.O....O",
      "O....O.O....O",
      "O....O.O....O",
      "..OOO...OOO..",
      ".............",
      "..OOO...OOO..",
      "O....O.O....O",
      "O....O.O....O",
      "O....O.O....O",
      ".............",
      "..OOO...OOO..",
    ]),
  },
];

export function getPatternSize(pattern: Pattern): [number, number] {
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of pattern.cells) {
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [maxX + 1, maxY + 1];
}

export function placePattern(
  pattern: Pattern,
  originX: number,
  originY: number
): LiveCells {
  const cells: LiveCells = new Set();
  for (const [dx, dy] of pattern.cells) {
    cells.add(cellKey(originX + dx, originY + dy));
  }
  return cells;
}

export function randomCells(
  originX: number,
  originY: number,
  width: number,
  height: number,
  density = 0.35
): LiveCells {
  const cells: LiveCells = new Set();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() < density) {
        cells.add(cellKey(originX + x, originY + y));
      }
    }
  }
  return cells;
}
