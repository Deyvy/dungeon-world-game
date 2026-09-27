"use client";

import { useRef, useState } from "react";
import { getClass } from "@/lib/api/classes";
import { ClassSummary } from "@/lib/api/types";
import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function ClassStep({ classes }: { classes: ClassSummary[] }) {
  const { draft, dispatch } = useWizard();
  const requestId = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClassChange(classId: number) {
    if (draft.classId === classId && draft.classDetail !== null) {
      return;
    }

    const currentRequest = ++requestId.current;
    setError(null);
    setIsLoading(true);
    dispatch({ type: "selectClass", classId });

    try {
      const classDetail = await getClass(classId);
      if (currentRequest === requestId.current) {
        dispatch({ type: "setClassDetail", classDetail });
      }
    } catch {
      if (currentRequest === requestId.current) {
        setError("No se pudieron cargar los datos de la clase.");
      }
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 1: Elige una clase</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona la clase de tu personaje.
      </p>
      <fieldset className="space-y-3" aria-describedby="class-selection-help">
        <legend className="sr-only">Clases disponibles</legend>
        <p id="class-selection-help" className="sr-only">
          Selecciona una sola clase.
        </p>
        {classes.map((classSummary) => (
          <label
            key={classSummary.id}
            className={`flex cursor-pointer items-center gap-3 rounded border p-4 dark:border-zinc-700 ${
              draft.classId === classSummary.id ? "border-foreground" : ""
            }`}
          >
            <input
              type="radio"
              name="character-class"
              value={classSummary.id}
              checked={draft.classId === classSummary.id}
              onChange={() => void handleClassChange(classSummary.id)}
            />
            <span>{classSummary.name}</span>
          </label>
        ))}
      </fieldset>

      {isLoading && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Cargando datos de la clase...
        </p>
      )}
      {error && <p className="text-red-700 dark:text-red-300">{error}</p>}

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
