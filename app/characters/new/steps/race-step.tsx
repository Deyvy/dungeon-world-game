"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function RaceStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 2: Elige una raza</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona la raza disponible para tu clase.
      </p>
      {draft.raceContentId && (
        <p>Raza seleccionada: {draft.raceContentId}</p>
      )}
    </div>
  );
}
