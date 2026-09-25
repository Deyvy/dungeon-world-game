"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function ClassStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 1: Elige una clase</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona la clase de tu personaje.
      </p>
      {draft.classDetail && (
        <div className="rounded border p-4 dark:border-zinc-700">
          <p>
            <strong>{draft.classDetail.name}</strong>
          </p>
          <p>PG base: {draft.classDetail.hitPoints}</p>
          <p>Daño base: d{draft.classDetail.damageDice}</p>
          <p>Carga base: {draft.classDetail.baseLoad}</p>
        </div>
      )}
    </div>
  );
}
