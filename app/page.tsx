import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 p-6 font-sans dark:bg-black">
      <main className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Dungeon World
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Crea un nuevo personaje para tu próxima aventura.
        </p>
        <Link
          href="/characters/new"
          className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Crear personaje
        </Link>
      </main>
    </div>
  );
}
