"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function AlignmentStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 6: Alineamiento</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona o crea un alineamiento.
      </p>
      {draft.alignment && (
        <p>
          {draft.alignment.kind === "standard"
            ? `Alineamiento estándar: ${draft.alignment.contentId}`
            : `Alineamiento personalizado: ${draft.alignment.name}`}
        </p>
      )}
    </div>
  );
}
