"use client";

import { useState } from "react";
import { useWizard } from "@/lib/character-wizard/wizard-context";

type AlignmentMode = "standard" | "custom";

export default function AlignmentStep() {
  const { draft, dispatch } = useWizard();

  const [mode, setMode] = useState<AlignmentMode>(
    draft.alignment?.kind === "custom" ? "custom" : "standard"
  );
  const [standardId, setStandardId] = useState<number | null>(
    draft.alignment?.kind === "standard" ? draft.alignment.contentId : null
  );
  const [customName, setCustomName] = useState(
    draft.alignment?.kind === "custom" ? draft.alignment.name : ""
  );
  const [customDescription, setCustomDescription] = useState(
    draft.alignment?.kind === "custom" ? draft.alignment.description : ""
  );

  if (draft.classDetail === null) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paso 6: Alineamiento</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Vuelve al paso anterior y selecciona una clase primero.
        </p>
      </div>
    );
  }

  const alignments = draft.classDetail.alignments;

  function selectStandard(contentId: number) {
    setMode("standard");
    setStandardId(contentId);
    dispatch({
      type: "setAlignment",
      alignment: { kind: "standard", contentId },
    });
  }

  function switchMode(next: AlignmentMode) {
    setMode(next);
    if (next === "standard") {
      if (standardId !== null) {
        dispatch({
          type: "setAlignment",
          alignment: { kind: "standard", contentId: standardId },
        });
      } else {
        dispatch({ type: "setAlignment", alignment: null });
      }
    } else {
      dispatch({
        type: "setAlignment",
        alignment: {
          kind: "custom",
          name: customName,
          description: customDescription,
        },
      });
    }
  }

  function updateCustomName(value: string) {
    setCustomName(value);
    if (mode === "custom") {
      dispatch({
        type: "setAlignment",
        alignment: {
          kind: "custom",
          name: value,
          description: customDescription,
        },
      });
    }
  }

  function updateCustomDescription(value: string) {
    setCustomDescription(value);
    if (mode === "custom") {
      dispatch({
        type: "setAlignment",
        alignment: {
          kind: "custom",
          name: customName,
          description: value,
        },
      });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 6: Alineamiento</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Selecciona un alineamiento estándar o crea uno personalizado.
      </p>

      {alignments.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta clase no tiene alineamientos estándar configurados.
        </p>
      )}

      {alignments.length > 0 && (
        <fieldset
          className="space-y-3"
          aria-describedby="alignment-selection-help"
        >
          <legend className="sr-only">Alineamientos estándar</legend>
          <p id="alignment-selection-help" className="sr-only">
            Selecciona un alineamiento estándar.
          </p>
          {alignments.map((alignment) => (
            <label
              key={alignment.id}
              className={`flex cursor-pointer flex-col gap-1 rounded border p-4 dark:border-zinc-700 ${
                mode === "standard" && standardId === alignment.id
                  ? "border-foreground"
                  : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="alignment-mode"
                  value={`standard-${alignment.id}`}
                  checked={
                    mode === "standard" && standardId === alignment.id
                  }
                  onChange={() => selectStandard(alignment.id)}
                />
                <span className="font-medium">{alignment.title}</span>
              </span>
              {alignment.content && (
                <p className="pl-7 text-sm text-zinc-600 dark:text-zinc-400">
                  {alignment.content}
                </p>
              )}
            </label>
          ))}
        </fieldset>
      )}

      <label
        className={`flex cursor-pointer flex-col gap-3 rounded border p-4 dark:border-zinc-700 ${
          mode === "custom" ? "border-foreground" : ""
        }`}
      >
        <span className="flex items-center gap-3 font-medium">
          <input
            type="radio"
            name="alignment-mode"
            value="custom"
            checked={mode === "custom"}
            onChange={() => switchMode("custom")}
          />
          Alineamiento personalizado
        </span>

        <div className="pl-7">
          <label htmlFor="custom-alignment-name" className="sr-only">
            Nombre del alineamiento personalizado
          </label>
          <input
            id="custom-alignment-name"
            type="text"
            value={customName}
            onChange={(event) => updateCustomName(event.target.value)}
            disabled={mode !== "custom"}
            placeholder="Nombre del alineamiento"
            className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700 disabled:opacity-50"
          />
        </div>

        <div className="pl-7">
          <label htmlFor="custom-alignment-description" className="sr-only">
            Descripción del alineamiento personalizado
          </label>
          <textarea
            id="custom-alignment-description"
            value={customDescription}
            onChange={(event) =>
              updateCustomDescription(event.target.value)
            }
            disabled={mode !== "custom"}
            placeholder="Describe cómo actúa este alineamiento"
            rows={3}
            className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700 disabled:opacity-50"
          />
        </div>
      </label>
    </div>
  );
}
