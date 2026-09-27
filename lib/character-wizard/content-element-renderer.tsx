"use client";

import {
  ContentElement,
  ContentElementOption,
  ElementAnswer,
} from "@/lib/api/types";
import { useWizard } from "@/lib/character-wizard/wizard-context";
import {
  getElementCardinality,
  isSupportedElementType,
  validateElementConfig,
} from "@/lib/character-wizard/content-elements";

type ContentElementRendererProps = {
  moveId: number;
  element: ContentElement;
};

export default function ContentElementRenderer({
  moveId,
  element,
}: ContentElementRendererProps) {
  const { draft } = useWizard();
  const answer = draft.moveAnswers[moveId]?.[element.id];

  const configValidation = validateElementConfig(element);
  if (!isSupportedElementType(element.type) || configValidation.kind === "unsupported") {
    return (
      <UnsupportedElement
        element={element}
        reason={
          configValidation.kind === "unsupported"
            ? configValidation.reason
            : undefined
        }
      />
    );
  }

  switch (element.type) {
    case "TEXT":
      return (
        <TextElement
          moveId={moveId}
          element={element}
          value={answer?.kind === "text" ? answer.value : ""}
        />
      );

    case "TEXTAREA":
      return (
        <TextareaElement
          moveId={moveId}
          element={element}
          value={answer?.kind === "text" ? answer.value : ""}
        />
      );

    case "NUMBER":
      return (
        <NumberElement
          moveId={moveId}
          element={element}
          value={answer?.kind === "number" ? answer.value : null}
        />
      );

    case "BOOLEAN":
      return (
        <BooleanElement
          moveId={moveId}
          element={element}
          value={answer?.kind === "boolean" ? answer.value : null}
        />
      );

    case "RADIO_GROUP":
      return (
        <RadioGroupElement
          moveId={moveId}
          element={element}
          selectedIds={answer?.kind === "choice" ? answer.optionIds : []}
        />
      );

    case "SELECT":
      return (
        <SelectElement
          moveId={moveId}
          element={element}
          selectedIds={answer?.kind === "choice" ? answer.optionIds : []}
        />
      );

    case "CHECKBOX_GROUP":
      return (
        <CheckboxGroupElement
          moveId={moveId}
          element={element}
          selectedIds={answer?.kind === "choice" ? answer.optionIds : []}
        />
      );

    default:
      return <UnsupportedElement element={element} />;
  }
}

function UnsupportedElement({
  element,
  reason,
}: {
  element: ContentElement;
  reason?: string;
}) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <p className="font-medium">Configuración no soportada</p>
      <p className="text-sm">
        El elemento &quot;{element.label}&quot; ({element.type})
        {reason !== undefined
          ? `: ${reason}`
          : " usa un tipo de configuración que el asistente no reconoce."}{" "}
        Completa el resto del formulario; este movimiento no se podrá finalizar
        hasta que se resuelva.
      </p>
    </div>
  );
}

type DispatchAnswerProps = {
  moveId: number;
  element: ContentElement;
};

function useElementAnswer({ moveId, element }: DispatchAnswerProps) {
  const { dispatch } = useWizard();

  function setAnswer(answer: ElementAnswer | null) {
    dispatch({ type: "setMoveAnswer", moveId, elementId: element.id, answer });
  }

  return { setAnswer };
}

function TextElement({
  moveId,
  element,
  value,
}: DispatchAnswerProps & { value: string }) {
  const { setAnswer } = useElementAnswer({ moveId, element });

  return (
    <div className="space-y-1">
      <label htmlFor={`element-${element.id}`} className="block font-medium">
        {element.label}
      </label>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <input
        id={`element-${element.id}`}
        type="text"
        value={value}
        onChange={(event) =>
          setAnswer(
            event.target.value === "" ? null : { kind: "text", value: event.target.value }
          )
        }
        className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
      />
    </div>
  );
}

function TextareaElement({
  moveId,
  element,
  value,
}: DispatchAnswerProps & { value: string }) {
  const { setAnswer } = useElementAnswer({ moveId, element });

  return (
    <div className="space-y-1">
      <label htmlFor={`element-${element.id}`} className="block font-medium">
        {element.label}
      </label>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <textarea
        id={`element-${element.id}`}
        value={value}
        rows={4}
        onChange={(event) =>
          setAnswer(
            event.target.value === "" ? null : { kind: "text", value: event.target.value }
          )
        }
        className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
      />
    </div>
  );
}

function NumberElement({
  moveId,
  element,
  value,
}: DispatchAnswerProps & { value: number | null }) {
  const { setAnswer } = useElementAnswer({ moveId, element });

  return (
    <div className="space-y-1">
      <label htmlFor={`element-${element.id}`} className="block font-medium">
        {element.label}
      </label>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <input
        id={`element-${element.id}`}
        type="number"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            setAnswer(null);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) {
            setAnswer({ kind: "number", value: parsed });
          }
        }}
        className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
      />
    </div>
  );
}

function BooleanElement({
  moveId,
  element,
  value,
}: DispatchAnswerProps & { value: boolean | null }) {
  const { setAnswer } = useElementAnswer({ moveId, element });
  const yesId = `element-${element.id}-yes`;
  const noId = `element-${element.id}-no`;

  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{element.label}</legend>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            id={yesId}
            type="radio"
            name={`element-${element.id}`}
            checked={value === true}
            onChange={() => setAnswer({ kind: "boolean", value: true })}
          />
          Sí
        </label>
        <label className="flex items-center gap-2">
          <input
            id={noId}
            type="radio"
            name={`element-${element.id}`}
            checked={value === false}
            onChange={() => setAnswer({ kind: "boolean", value: false })}
          />
          No
        </label>
      </div>
    </fieldset>
  );
}

function RadioGroupElement({
  moveId,
  element,
  selectedIds,
}: DispatchAnswerProps & { selectedIds: number[] }) {
  const { setAnswer } = useElementAnswer({ moveId, element });
  const options = sortedOptions(element.options ?? []);

  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{element.label}</legend>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded border p-3 dark:border-zinc-700"
          >
            <input
              type="radio"
              name={`element-${element.id}`}
              checked={selectedIds.includes(option.id)}
              onChange={() => setAnswer({ kind: "choice", optionIds: [option.id] })}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SelectElement({
  moveId,
  element,
  selectedIds,
}: DispatchAnswerProps & { selectedIds: number[] }) {
  const { setAnswer } = useElementAnswer({ moveId, element });
  const options = sortedOptions(element.options ?? []);
  const selected = selectedIds[0] ?? "";

  return (
    <div className="space-y-1">
      <label htmlFor={`element-${element.id}`} className="block font-medium">
        {element.label}
      </label>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <select
        id={`element-${element.id}`}
        value={selected}
        onChange={(event) => {
          const value = event.target.value;
          setAnswer(
            value === "" ? null : { kind: "choice", optionIds: [Number(value)] }
          );
        }}
        className="w-full rounded border bg-transparent px-3 py-2 dark:border-zinc-700"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxGroupElement({
  moveId,
  element,
  selectedIds,
}: DispatchAnswerProps & { selectedIds: number[] }) {
  const { setAnswer } = useElementAnswer({ moveId, element });
  const options = sortedOptions(element.options ?? []);
  const { max } = getElementCardinality(element, true);

  function toggleOption(optionId: number) {
    const current = new Set(selectedIds);
    if (current.has(optionId)) {
      current.delete(optionId);
    } else if (max === undefined || current.size < max) {
      current.add(optionId);
    }
    const next = Array.from(current);
    setAnswer(next.length === 0 ? null : { kind: "choice", optionIds: next });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{element.label}</legend>
      {element.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {element.description}
        </p>
      )}
      <div className="space-y-2">
        {options.map((option) => {
          const disabled =
            max !== undefined &&
            !selectedIds.includes(option.id) &&
            selectedIds.length >= max;

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded border p-3 dark:border-zinc-700 ${
                disabled ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selectedIds.includes(option.id)}
                onChange={() => toggleOption(option.id)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function sortedOptions(options: ContentElementOption[]): ContentElementOption[] {
  return [...options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
