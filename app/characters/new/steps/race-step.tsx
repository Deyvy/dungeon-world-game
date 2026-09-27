"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";

export default function RaceStep() {
  const { draft, dispatch } = useWizard();

  if (draft.classDetail === null) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paso 2: Elige una raza</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Vuelve al paso anterior y selecciona una clase primero.
        </p>
      </div>
    );
  }

  const races = draft.classDetail.races;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 2: Elige una raza</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona la raza de tu {draft.classDetail.name}.
      </p>

      {races.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta clase no tiene razas configuradas.
        </p>
      ) : (
        <fieldset className="space-y-3" aria-describedby="race-selection-help">
          <legend className="sr-only">Razas disponibles</legend>
          <p id="race-selection-help" className="sr-only">
            Selecciona una sola raza.
          </p>
          {races.map((race) => (
            <label
              key={race.id}
              className={`flex cursor-pointer flex-col gap-1 rounded border p-4 dark:border-zinc-700 ${
                draft.raceContentId === race.id ? "border-foreground" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="character-race"
                  value={race.id}
                  checked={draft.raceContentId === race.id}
                  onChange={() =>
                    dispatch({
                      type: "selectRace",
                      raceContentId: race.id,
                      raceMechanic: race.content ?? "",
                    })
                  }
                />
                <span className="font-medium">{race.title}</span>
              </span>
              {race.content && (
                <p className="pl-7 text-sm text-zinc-600 dark:text-zinc-400">
                  {race.content}
                </p>
              )}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
