"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  PRESET_PATTERNS,
  cellKey,
  getPatternSize,
  placePattern,
  randomCells,
  step,
  type LiveCells,
  type Pattern,
} from "@/lib/game-of-life";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "./transport-icons";

const MAX_WRAPPER_WIDTH = 768;
const ASPECT_RATIO = 448 / 768;
const DEFAULT_CELL_PX = 16;
const MIN_CELL_PX = 8;
const MAX_CELL_PX = DEFAULT_CELL_PX;
const MIN_SPEED = 1;
const MAX_SPEED = 30;

function colsFor(width: number, cellSize: number) {
  return Math.ceil(width / cellSize);
}

function rowsFor(height: number, cellSize: number) {
  return Math.ceil(height / cellSize);
}

const INITIAL_OFFSET = {
  x: -Math.floor(colsFor(MAX_WRAPPER_WIDTH, DEFAULT_CELL_PX) / 2),
  y: -Math.floor(
    rowsFor(Math.round(MAX_WRAPPER_WIDTH * ASPECT_RATIO), DEFAULT_CELL_PX) / 2
  ),
};

function createInitialCells(): LiveCells {
  const pulsar = PRESET_PATTERNS.find((p) => p.name === "Pulsar")!;
  const [w, h] = getPatternSize(pulsar);
  return placePattern(pulsar, -Math.floor(w / 2), -Math.floor(h / 2));
}

function touchDistance(a: Touch, b: Touch) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export default function GameOfLifeBoard() {
  const [liveCells, setLiveCells] = useState<LiveCells>(createInitialCells);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_PX);
  const [wrapperWidth, setWrapperWidth] = useState(MAX_WRAPPER_WIDTH);
  const [generation, setGeneration] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Pulsar");
  const [history, setHistory] = useState<LiveCells[]>([]);

  const outerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const liveCellsRef = useRef<LiveCells>(liveCells);
  const offsetRef = useRef(offset);
  const cellSizeRef = useRef(cellSize);
  const wrapperWidthRef = useRef(wrapperWidth);

  useEffect(() => {
    liveCellsRef.current = liveCells;
  }, [liveCells]);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);
  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);
  useEffect(() => {
    wrapperWidthRef.current = wrapperWidth;
  }, [wrapperWidth]);

  const wrapperHeight = Math.round(wrapperWidth * ASPECT_RATIO);
  const cols = colsFor(wrapperWidth, cellSize);
  const rows = rowsFor(wrapperHeight, cellSize);

  function stepForward() {
    setHistory((h) => [...h, liveCellsRef.current]);
    setLiveCells((prev) => step(prev));
    setGeneration((g) => g + 1);
  }

  function stepBack() {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setLiveCells(prevState);
    setGeneration((g) => Math.max(0, g - 1));
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(stepForward, 1000 / speed);
    return () => clearInterval(id);
  }, [running, speed]);

  // Recenters the view on the same absolute point after the visible
  // column/row count changes (from a zoom or a container resize).
  function recenterForDimensionChange(
    prevCols: number,
    prevRows: number,
    nextCols: number,
    nextRows: number
  ) {
    setOffset((prevOffset) => ({
      x: prevOffset.x + Math.floor((prevCols - nextCols) / 2),
      y: prevOffset.y + Math.floor((prevRows - nextRows) / 2),
    }));
  }

  function applyZoom(factor: number) {
    const prevSize = cellSizeRef.current;
    let nextSize = Math.round(prevSize * factor);
    if (nextSize === prevSize) {
      nextSize = prevSize + (factor > 1 ? 1 : -1);
    }
    nextSize = Math.min(MAX_CELL_PX, Math.max(MIN_CELL_PX, nextSize));
    if (nextSize === prevSize) return;

    const width = wrapperWidthRef.current;
    const height = Math.round(width * ASPECT_RATIO);
    recenterForDimensionChange(
      colsFor(width, prevSize),
      rowsFor(height, prevSize),
      colsFor(width, nextSize),
      rowsFor(height, nextSize)
    );
    setCellSize(nextSize);
  }

  // Measures the responsive container and keeps the pixel-sized grid in
  // sync with it, recentering the view when the visible area changes.
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    function applyWidth(width: number) {
      const prevWidth = wrapperWidthRef.current;
      if (width === prevWidth) return;
      const size = cellSizeRef.current;
      const prevHeight = Math.round(prevWidth * ASPECT_RATIO);
      const nextHeight = Math.round(width * ASPECT_RATIO);
      recenterForDimensionChange(
        colsFor(prevWidth, size),
        rowsFor(prevHeight, size),
        colsFor(width, size),
        rowsFor(nextHeight, size)
      );
      setWrapperWidth(width);
    }

    applyWidth(Math.max(200, Math.round(el.getBoundingClientRect().width)));

    const observer = new ResizeObserver((entries) => {
      applyWidth(Math.max(200, Math.round(entries[0].contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toggleCell(x: number, y: number) {
    setSelectedPreset(null);
    setLiveCells((prev) => {
      const key = cellKey(x, y);
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function cellFromPoint(clientX: number, clientY: number) {
    const el = wrapperRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const size = cellSizeRef.current;
    const off = offsetRef.current;
    const col = Math.floor((clientX - rect.left) / size);
    const row = Math.floor((clientY - rect.top) / size);
    return { x: off.x + col, y: off.y + row };
  }

  function handleCellMouseDown(e: React.MouseEvent, x: number, y: number) {
    if (e.button !== 0) return;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startOffset = offset;
    const dragCellSize = cellSize;
    let dragged = false;

    function onMove(ev: MouseEvent) {
      const dxPx = ev.clientX - startClientX;
      const dyPx = ev.clientY - startClientY;
      if (!dragged && Math.hypot(dxPx, dyPx) > 4) dragged = true;
      if (dragged) {
        const dxCells = Math.round(dxPx / dragCellSize);
        const dyCells = Math.round(dyPx / dragCellSize);
        setOffset({
          x: startOffset.x - dxCells,
          y: startOffset.y - dyCells,
        });
      }
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!dragged) toggleCell(x, y);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // Wheel-to-zoom (desktop) and touch pan / tap-to-toggle / pinch-to-zoom
  // (mobile), wired up as native listeners so gestures stay smooth and
  // page scroll/zoom doesn't fight with them.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      applyZoom(e.deltaY > 0 ? 0.85 : 1 / 0.85);
    }

    let mode: "none" | "pan" | "pinch" = "none";
    let dragged = false;
    let startClientX = 0;
    let startClientY = 0;
    let startOffset = { x: 0, y: 0 };
    let startCellSize = DEFAULT_CELL_PX;
    let pinchStartDist = 0;
    let tapTarget: { x: number; y: number } | null = null;

    function beginPan(touch: Touch) {
      mode = "pan";
      dragged = false;
      startClientX = touch.clientX;
      startClientY = touch.clientY;
      startOffset = offsetRef.current;
      startCellSize = cellSizeRef.current;
      tapTarget = cellFromPoint(touch.clientX, touch.clientY);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        beginPan(e.touches[0]);
      } else if (e.touches.length === 2) {
        mode = "pinch";
        pinchStartDist = touchDistance(e.touches[0], e.touches[1]);
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const dxPx = touch.clientX - startClientX;
        const dyPx = touch.clientY - startClientY;
        if (!dragged && Math.hypot(dxPx, dyPx) > 6) dragged = true;
        if (dragged) {
          const dxCells = Math.round(dxPx / startCellSize);
          const dyCells = Math.round(dyPx / startCellSize);
          setOffset({
            x: startOffset.x - dxCells,
            y: startOffset.y - dyCells,
          });
        }
      } else if (mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const dist = touchDistance(e.touches[0], e.touches[1]);
        if (pinchStartDist > 0) applyZoom(dist / pinchStartDist);
        pinchStartDist = dist;
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (mode === "pan" && !dragged && tapTarget) {
        toggleCell(tapTarget.x, tapTarget.y);
      }
      if (e.touches.length === 1) {
        beginPan(e.touches[0]);
      } else if (e.touches.length === 0) {
        mode = "none";
        tapTarget = null;
      } else {
        mode = "pinch";
        pinchStartDist = touchDistance(e.touches[0], e.touches[1]);
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
    // applyZoom only reads refs and calls stable setters, so the stale
    // closure captured here stays correct across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadPreset(pattern: Pattern) {
    const [w, h] = getPatternSize(pattern);
    const centerX = offset.x + Math.floor(cols / 2);
    const centerY = offset.y + Math.floor(rows / 2);
    setLiveCells(
      placePattern(pattern, centerX - Math.floor(w / 2), centerY - Math.floor(h / 2))
    );
    setGeneration(0);
    setRunning(false);
    setSelectedPreset(pattern.name);
    setHistory([]);
  }

  function randomize() {
    setLiveCells(randomCells(offset.x, offset.y, cols, rows));
    setGeneration(0);
    setRunning(false);
    setSelectedPreset(null);
    setHistory([]);
  }

  function clearBoard() {
    setLiveCells(new Set());
    setGeneration(0);
    setRunning(false);
    setSelectedPreset(null);
    setHistory([]);
  }

  function recenter() {
    setOffset({ x: -Math.floor(cols / 2), y: -Math.floor(rows / 2) });
  }

  const rowIndices = Array.from({ length: rows }, (_, row) => row);
  const colIndices = Array.from({ length: cols }, (_, col) => col);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-black/8 p-1 dark:border-white/[.145]">
          <button
            onClick={stepBack}
            disabled={running || history.length === 0}
            aria-label="Step back"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/4 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a1a1a]"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {running ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            onClick={stepForward}
            disabled={running}
            aria-label="Step forward"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/4 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#1a1a1a]"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <button
          onClick={randomize}
          className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Randomize
        </button>
        <button
          onClick={clearBoard}
          className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Clear
        </button>
        <button
          onClick={recenter}
          className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Center view
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Speed</span>
        <input
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-32 accent-foreground"
        />
        <span className="w-16 text-zinc-600 dark:text-zinc-400">
          {speed} gen/s
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Presets:</span>
        {PRESET_PATTERNS.map((pattern) => (
          <button
            key={pattern.name}
            onClick={() => loadPreset(pattern)}
            aria-pressed={pattern.name === selectedPreset}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              pattern.name === selectedPreset
                ? "border-foreground bg-foreground text-background"
                : "border-black/8 hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            }`}
          >
            {pattern.name}
          </button>
        ))}
      </div>

      <div className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
        <span>Generation: {generation}</span>
        <span>Population: {liveCells.size}</span>
      </div>

      <div ref={outerRef} className="w-full max-w-3xl">
        <div
          ref={wrapperRef}
          className="mx-auto select-none overflow-hidden border border-zinc-300 dark:border-zinc-700"
          style={{
            width: wrapperWidth,
            height: wrapperHeight,
            maxWidth: "100%",
            touchAction: "none",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            }}
          >
            {rowIndices.map((row) =>
              colIndices.map((col) => {
                const x = offset.x + col;
                const y = offset.y + row;
                const alive = liveCells.has(cellKey(x, y));
                return (
                  <div
                    key={`${col}-${row}`}
                    onMouseDown={(e) => handleCellMouseDown(e, x, y)}
                    className={`cursor-pointer border border-zinc-100 dark:border-zinc-900 ${
                      alive
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-white hover:bg-zinc-100 dark:bg-black dark:hover:bg-zinc-900"
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="max-w-md text-center text-sm text-zinc-500 dark:text-zinc-500">
        Tap or click a cell to toggle it, drag to pan, and pinch or scroll to
        zoom on the infinite grid.
      </p>
    </div>
  );
}
