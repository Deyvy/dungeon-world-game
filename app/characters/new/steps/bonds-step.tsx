"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function BondsStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 9: Vínculos</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Completa los vínculos iniciales con los otros personajes.
      </p>
      <p>Vínculos completados: {draft.bonds.filter((b) => b.complete).length} / {draft.bonds.length}</p>
    </div>
  );
}
