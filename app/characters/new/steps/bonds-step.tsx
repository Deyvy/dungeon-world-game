"use client";

import { useWizard } from "@/lib/character-wizard/wizard-context";
import { getBondTemplates } from "@/lib/character-wizard/bonds";

export default function BondsStep() {
  const { draft, dispatch } = useWizard();

  if (draft.classDetail === null) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paso 9: Vínculos</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Vuelve al paso anterior y selecciona una clase primero.
        </p>
      </div>
    );
  }

  const templates = getBondTemplates(draft.classDetail.name);

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paso 9: Vínculos</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta clase no tiene plantillas de vínculo configuradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Paso 9: Vínculos</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Completa los vínculos iniciales de tu {draft.classDetail.name}{" "}
          sustituyendo <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">_____</code>{" "}
          por el nombre de otro personaje.
        </p>
      </div>

      <div className="space-y-4">
        {templates.map((template) => {
          const bond = draft.bonds.find((b) => b.templateId === template.id);
          const text = bond?.text ?? template.text;

          return (
            <div key={template.id} className="space-y-2">
              <label
                htmlFor={`bond-${template.id}`}
                className="block text-sm font-medium"
              >
                Vínculo {templates.indexOf(template) + 1}
              </label>
              <input
                id={`bond-${template.id}`}
                type="text"
                onChange={(event) =>
                  dispatch({
                    type: "setBondText",
                    templateId: template.id,
                    text: event.target.value,
                  })
                }
                placeholder={text}
                className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
