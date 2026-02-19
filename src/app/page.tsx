export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
          Calltide
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Bilingual AI voice agent for small businesses.
          Never miss a call again.
        </p>
        <div className="flex gap-4 text-sm text-zinc-500">
          <span>Phase 2: Outreach Engine + Admin Portal</span>
        </div>
      </main>
    </div>
  );
}
