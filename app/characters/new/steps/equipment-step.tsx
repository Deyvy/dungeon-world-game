"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function EquipmentStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 8: Equipamiento inicial</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Elige el equipo de inicio de tu personaje.
      </p>
      <p>Objetos seleccionados: {draft.equipmentIds.length}</p>
    </div>
  );
}
