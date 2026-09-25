"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function ConfigStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 7: Configuración de clase</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Completa las opciones de los movimientos iniciales.
      </p>
      {draft.classDetail && (
        <p>Movimientos iniciales: {draft.classDetail.initialMoves.length}</p>
      )}
    </div>
  );
}
