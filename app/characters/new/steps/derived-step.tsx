"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function DerivedStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 5: Salud y carga</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Revisa los valores derivados de tu personaje.
      </p>
      {draft.classDetail && (
        <div className="rounded border p-4 dark:border-zinc-700">
          <p>PG máximos: {draft.classDetail.hitPoints}</p>
          <p>Carga máxima: {draft.classDetail.baseLoad}</p>
        </div>
      )}
    </div>
  );
}
