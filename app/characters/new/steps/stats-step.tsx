"use client";

import {
  ABILITIES,
  ABILITY_LABELS,
  Ability,
  STANDARD_ARRAY,
} from "@/lib/api/types";
import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function StatsStep() {
  const { draft, dispatch } = useWizard();

  const assigned = new Set(
    ABILITIES.map((ability) => draft.stats[ability]).filter(
      (value): value is number => value !== null
    )
  );

  function assignScore(ability: Ability, score: number | null) {
    const nextStats = { ...draft.stats, [ability]: score };
    dispatch({ type: "assignStats", stats: nextStats });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          Paso 4: Puntuaciones de característica
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Asigna cada puntuación del conjunto estándar a un atributo. Una vez
          usada, no podrás volver a seleccionarla sin quitarla primero.
        </p>
      </div>

      <div className="rounded border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium">Puntuaciones disponibles</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STANDARD_ARRAY.map((score) => {
            const isUsed = assigned.has(score);
            return (
              <span
                key={score}
                className={`rounded px-2 py-1 text-sm ${
                  isUsed
                    ? "bg-zinc-200 text-zinc-500 line-through dark:bg-zinc-800"
                    : "bg-white dark:bg-zinc-950"
                }`}
              >
                {score}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ABILITIES.map((ability) => {
          const current = draft.stats[ability];
          return (
            <div key={ability} className="space-y-1">
              <label
                htmlFor={`stat-${ability}`}
                className="block font-medium"
              >
                {ABILITY_LABELS[ability]}
              </label>
              <select
                id={`stat-${ability}`}
                value={current ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  assignScore(ability, value === "" ? null : Number(value));
                }}
                className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
              >
                <option value="">—</option>
                {STANDARD_ARRAY.map((score) => {
                  const isAssignedElsewhere =
                    assigned.has(score) && current !== score;
                  return (
                    <option
                      key={score}
                      value={score}
                      disabled={isAssignedElsewhere}
                    >
                      {score}
                      {isAssignedElsewhere ? " (ya usada)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
