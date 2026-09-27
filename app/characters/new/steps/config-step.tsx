"use client";

import { MoveContent } from "@/lib/api/types";
import ContentElementRenderer from "@/lib/character-wizard/content-element-renderer";
import {
  isSupportedElementType,
  parseMoveMetadata,
  validateElementConfig,
} from "@/lib/character-wizard/content-elements";
import { useWizard } from "@/lib/character-wizard/wizard-context";
import {
  getTemporarySpellsForClass,
  isTemporarySpellcastingClass,
} from "@/lib/character-wizard/mocks/spells";

export default function ConfigStep() {
  const { draft, dispatch } = useWizard();

  if (draft.classDetail === null) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Paso 7: Configuración de clase</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Vuelve al paso anterior y selecciona una clase primero.
        </p>
      </div>
    );
  }

  const moves = draft.classDetail.initialMoves;
  const className = draft.classDetail.name;
  const classId = draft.classDetail.id;

  const hasSpellSection = isTemporarySpellcastingClass(className);
  const availableSpells = hasSpellSection
    ? getTemporarySpellsForClass(classId, className)
    : [];

  const leveledSpells = availableSpells.filter((spell) => spell.spellLevel > 0);
  const cantrips = availableSpells.filter((spell) => spell.spellLevel === 0);

  function toggleSpell(spellId: number) {
    const current = new Set(draft.spellIds);
    if (current.has(spellId)) {
      current.delete(spellId);
    } else {
      current.add(spellId);
    }
    dispatch({ type: "setSpellIds", spellIds: Array.from(current) });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Paso 7: Configuración de clase</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Completa las opciones de los movimientos iniciales de tu{" "}
          {className}.
        </p>
      </div>

      {moves.length === 0 && !hasSpellSection && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta clase no tiene movimientos configurados.
        </p>
      )}

      <div className="space-y-6">
        {moves.map((move) => (
          <MoveCard key={move.id} move={move} />
        ))}
      </div>

      {hasSpellSection && (
        <div className="space-y-4 rounded border p-4 dark:border-zinc-700">
          <div className="space-y-1">
            <h3 className="font-semibold">Conjuros</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Selecciona tus conjuros iniciales. La lista es temporal mientras el
              backend expone el catálogo completo.
            </p>
          </div>

          {leveledSpells.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Conjuros de nivel 1</legend>
              <div className="space-y-2">
                {leveledSpells.map((spell) => (
                  <label
                    key={spell.id}
                    className="flex cursor-pointer items-start gap-3 rounded border p-3 dark:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={draft.spellIds.includes(spell.id)}
                      onChange={() => toggleSpell(spell.id)}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{spell.name}</span>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {spell.description}
                      </p>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {cantrips.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Trucos de nivel 0</legend>
              <div className="space-y-2">
                {cantrips.map((spell) => (
                  <label
                    key={spell.id}
                    className="flex cursor-pointer items-start gap-3 rounded border p-3 dark:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={draft.spellIds.includes(spell.id)}
                      onChange={() => toggleSpell(spell.id)}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{spell.name}</span>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {spell.description}
                      </p>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}

function MoveCard({ move }: { move: MoveContent }) {
  const { requiresCompletion } = parseMoveMetadata(move.metadata, {
    hasContentElements: (move.contentElements ?? []).length > 0,
  });

  const elements = [...(move.contentElements ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  const unsupportedConfigs = elements
    .map((element) => ({
      element,
      validation: validateElementConfig(element),
    }))
    .filter(
      (item) =>
        !isSupportedElementType(item.element.type) ||
        item.validation.kind === "unsupported"
    );

  return (
    <section
      className="space-y-4 rounded border p-4 dark:border-zinc-700"
      aria-labelledby={`move-title-${move.id}`}
    >
      <div className="space-y-1">
        <h3 id={`move-title-${move.id}`} className="font-semibold">
          {move.title}
        </h3>
        {move.content && (
          <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300">
            <MoveContentText content={move.content} />
          </div>
        )}
      </div>

      {unsupportedConfigs.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Movimiento bloqueado</p>
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {unsupportedConfigs.map(({ element, validation }) => (
              <li key={element.id}>
                {element.label} ({element.type})
                {validation.kind === "unsupported"
                  ? `: ${validation.reason}`
                  : ": tipo de configuración no soportado."}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            No podrás finalizar hasta que se resuelvan.
          </p>
        </div>
      )}

      {requiresCompletion && elements.length > 0 && (
        <div className="space-y-4">
          {elements.map((element) => (
            <ContentElementRenderer key={element.id} moveId={move.id} element={element} />
          ))}
        </div>
      )}
    </section>
  );
}

function MoveContentText({ content }: { content: string }) {
  // Render line breaks from the backend content as paragraphs for readability.
  const lines = content.split(/\n+/).filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return null;
  }

  return (
    <>
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </>
  );
}
