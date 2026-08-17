import GameOfLifeBoard from "./components/game-of-life-board";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Conway&apos;s Game of Life
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          A zero-player cellular automaton on an infinite grid, evolving by
          four simple rules: underpopulation, survival, overpopulation, and
          reproduction.
        </p>
      </div>
      <GameOfLifeBoard />
    </div>
  );
}
