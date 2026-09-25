"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function IdentityStep() {
  const { draft } = useWizard();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 3: Identidad y aspecto</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Define el nombre y el aspecto de tu personaje.
      </p>
      {draft.name && <p>Nombre: {draft.name}</p>}
    </div>
  );
}
