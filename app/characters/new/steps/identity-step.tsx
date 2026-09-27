"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";
import { AppearanceDraft } from "@/lib/character-wizard/draft";

const APPEARANCE_FIELDS: {
  key: keyof Omit<AppearanceDraft, "extra">;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "gaze",
    label: "Mirada",
    placeholder: "Ej: ojos penetrantes, mirada cansada...",
  },
  {
    key: "hair",
    label: "Pelo o cabeza",
    placeholder: "Ej: melena oscura, calvo, yelmo ornamentado...",
  },
  {
    key: "clothing",
    label: "Ropa o atuendo",
    placeholder: "Ej: túnica viajera, armadura de cuero...",
  },
  {
    key: "body",
    label: "Cuerpo",
    placeholder: "Ej: alto y delgado, musculoso, pequeño...",
  },
];

export default function IdentityStep() {
  const { draft, dispatch } = useWizard();

  function updateName(name: string) {
    dispatch({
      type: "setIdentity",
      name,
      appearance: draft.appearance,
    });
  }

  function updateAppearance(
    key: keyof Omit<AppearanceDraft, "extra">,
    value: string
  ) {
    dispatch({
      type: "setIdentity",
      name: draft.name,
      appearance: { ...draft.appearance, [key]: value },
    });
  }

  function addExtraLine() {
    dispatch({
      type: "setIdentity",
      name: draft.name,
      appearance: { ...draft.appearance, extra: [...draft.appearance.extra, ""] },
    });
  }

  function updateExtraLine(index: number, value: string) {
    const extra = [...draft.appearance.extra];
    extra[index] = value;
    dispatch({
      type: "setIdentity",
      name: draft.name,
      appearance: { ...draft.appearance, extra },
    });
  }

  function removeExtraLine(index: number) {
    const extra = draft.appearance.extra.filter((_, i) => i !== index);
    dispatch({
      type: "setIdentity",
      name: draft.name,
      appearance: { ...draft.appearance, extra },
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Paso 3: Identidad y aspecto</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Define el nombre y el aspecto de tu personaje. Solo el nombre es
          obligatorio.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="character-name" className="block font-medium">
          Nombre <span className="text-red-600">*</span>
        </label>
        <input
          id="character-name"
          type="text"
          value={draft.name}
          onChange={(event) => updateName(event.target.value)}
          placeholder="Nombre del personaje"
          className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="font-medium">Aspecto</legend>
        {APPEARANCE_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label htmlFor={`appearance-${field.key}`} className="block text-sm">
              {field.label}
            </label>
            <input
              id={`appearance-${field.key}`}
              type="text"
              value={draft.appearance[field.key]}
              onChange={(event) =>
                updateAppearance(field.key, event.target.value)
              }
              placeholder={field.placeholder}
              className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
            />
          </div>
        ))}
      </fieldset>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Líneas adicionales de aspecto</span>
          <button
            type="button"
            onClick={addExtraLine}
            className="rounded border px-3 py-1 text-sm dark:border-zinc-700"
          >
            Añadir línea
          </button>
        </div>

        {draft.appearance.extra.length === 0 && (
          <p className="text-sm text-zinc-500">
            No has añadido líneas adicionales.
          </p>
        )}

        {draft.appearance.extra.map((line, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={line}
              onChange={(event) => updateExtraLine(index, event.target.value)}
              placeholder="Detalle adicional de aspecto"
              className="flex-1 rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => removeExtraLine(index)}
              className="rounded border px-3 py-2 text-red-700 dark:border-zinc-700 dark:text-red-300"
              aria-label={`Eliminar línea de aspecto ${index + 1}`}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
