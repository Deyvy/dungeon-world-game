"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function StatsStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 4: Puntuaciones de característica</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Asigna el conjunto 16, 15, 13, 12, 9, 8 a los seis atributos.
      </p>
      <pre className="rounded bg-zinc-100 p-2 text-sm dark:bg-zinc-900">
        {JSON.stringify(draft.stats, null, 2)}
      </pre>
    </div>
  );
}
