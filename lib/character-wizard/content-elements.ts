import {
  ContentElement,
  ContentElementType,
  ElementAnswer,
  MoveElementPayload,
} from "@/lib/api/types";

export type MoveMetadata = {
  requiresCompletion: boolean;
  source: "requiresCompletion" | "needsCompletion" | "default" | "explicitFalse";
};

export type ElementCardinality = {
  min: number;
  max: number | undefined;
};

/**
 * Parse move metadata and decide whether the move requires player completion.
 *
 * Canonical key: `requiresCompletion`. Fallback alias: `needsCompletion`.
 *
 * Apply-time finding: the currently seeded `classContent` rows do not set either
 * flag, but the only initial move that has configurable content (Guerrero's
 * "Arma Distintiva") ships `metadata: null`. To keep the wizard usable against
 * the current seeded data, a move with non-empty `contentElements` defaults to
 * requiring completion. An explicit `requiresCompletion: false` opts out.
 */
export function parseMoveMetadata(
  metadata: unknown,
  options: { hasContentElements?: boolean } = {}
): MoveMetadata {
  const parsed = parseJsonMetadata(metadata);

  if (parsed !== null && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;

    if (record.requiresCompletion === false) {
      return { requiresCompletion: false, source: "explicitFalse" };
    }

    if (record.requiresCompletion === true || record.requiresCompletion === "true") {
      return { requiresCompletion: true, source: "requiresCompletion" };
    }

    if (record.needsCompletion === true || record.needsCompletion === "true") {
      return { requiresCompletion: true, source: "needsCompletion" };
    }
  }

  if (options.hasContentElements) {
    return { requiresCompletion: true, source: "default" };
  }

  return { requiresCompletion: false, source: "default" };
}

function parseJsonMetadata(metadata: unknown): unknown {
  if (metadata === undefined || metadata === null) {
    return null;
  }

  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  }

  return metadata;
}

/**
 * Return the effective min/max selection count for a content element.
 *
 * - RADIO_GROUP / SELECT default to exactly one.
 * - CHECKBOX_GROUP defaults to 0..n, or 1..n when completion is required and no
 *   explicit minSelect is set.
 * - Scalar types ignore minSelect/maxSelect; the caller uses `requiresCompletion`
 *   to decide whether an answer is mandatory.
 */
export function getElementCardinality(
  element: ContentElement,
  requiresCompletion: boolean
): ElementCardinality {
  switch (element.type) {
    case "RADIO_GROUP":
    case "SELECT": {
      const min = element.minSelect ?? 1;
      const max = element.maxSelect ?? 1;
      return { min, max };
    }

    case "CHECKBOX_GROUP": {
      const min = element.minSelect ?? (requiresCompletion ? 1 : 0);
      const max = element.maxSelect;
      return { min, max };
    }

    default:
      return { min: requiresCompletion ? 1 : 0, max: undefined };
  }
}

export type ElementValidationResult =
  | { kind: "valid" }
  | { kind: "invalid"; errors: string[] }
  | { kind: "unsupported"; type: string };

/**
 * Validate a single element answer against the element type and cardinality.
 *
 * Unknown element types produce `kind: "unsupported"` so the caller can block
 * the affected move instead of silently accepting it.
 */
export function validateElementAnswer(
  element: ContentElement,
  answer: ElementAnswer | undefined,
  requiresCompletion: boolean
): ElementValidationResult {
  const errors: string[] = [];

  switch (element.type) {
    case "TEXT":
    case "TEXTAREA": {
      const value = answer?.kind === "text" ? answer.value : undefined;
      if (requiresCompletion && (value === undefined || value.trim() === "")) {
        errors.push(`Completa el campo "${element.label}".`);
      }
      break;
    }

    case "NUMBER": {
      const value = answer?.kind === "number" ? answer.value : undefined;
      if (requiresCompletion && (value === undefined || Number.isNaN(value))) {
        errors.push(`Completa el campo numérico "${element.label}".`);
      }
      break;
    }

    case "BOOLEAN": {
      if (requiresCompletion && answer?.kind !== "boolean") {
        errors.push(`Selecciona una opción para "${element.label}".`);
      }
      break;
    }

    case "RADIO_GROUP":
    case "SELECT": {
      const optionIds = answer?.kind === "choice" ? answer.optionIds : [];
      const { min, max } = getElementCardinality(element, requiresCompletion);

      if (optionIds.length < min) {
        errors.push(
          `Selecciona una opción para "${element.label}".`
        );
      }
      if (max !== undefined && optionIds.length > max) {
        errors.push(
          `Selecciona como máximo ${max} opción${max === 1 ? "" : "es"} para "${element.label}".`
        );
      }
      break;
    }

    case "CHECKBOX_GROUP": {
      const optionIds = answer?.kind === "choice" ? answer.optionIds : [];
      const { min, max } = getElementCardinality(element, requiresCompletion);

      if (optionIds.length < min) {
        errors.push(
          `Selecciona al menos ${min} opción${min === 1 ? "" : "es"} para "${element.label}".`
        );
      }
      if (max !== undefined && optionIds.length > max) {
        errors.push(
          `Selecciona como máximo ${max} opción${max === 1 ? "" : "es"} para "${element.label}".`
        );
      }
      break;
    }

    default:
      return {
        kind: "unsupported",
        type: element.type,
      };
  }

  if (errors.length > 0) {
    return { kind: "invalid", errors };
  }

  return { kind: "valid" };
}

export function isUnsupportedElement(
  result: ElementValidationResult
): result is { kind: "unsupported"; type: string } {
  return result.kind === "unsupported";
}

export function isInvalidElement(
  result: ElementValidationResult
): result is { kind: "invalid"; errors: string[] } {
  return result.kind === "invalid";
}

/**
 * Convert a draft element answer into the payload shape expected by
 * `PUT /api/characters/:id/moves/:contentId`.
 *
 * - TEXT / TEXTAREA → `{ elementId, value }`
 * - NUMBER → `{ elementId, value: stringified number }`
 * - BOOLEAN → `{ elementId, value: "true" | "false" }`
 * - RADIO_GROUP / SELECT / CHECKBOX_GROUP → `{ elementId, optionIds }`
 */
export function serializeElementAnswer(
  element: ContentElement,
  answer: ElementAnswer
): MoveElementPayload {
  switch (element.type) {
    case "TEXT":
    case "TEXTAREA": {
      if (answer.kind !== "text") {
        throw new Error(`Expected text answer for element ${element.id}`);
      }
      return { elementId: element.id, value: answer.value };
    }

    case "NUMBER": {
      if (answer.kind !== "number") {
        throw new Error(`Expected number answer for element ${element.id}`);
      }
      return { elementId: element.id, value: String(answer.value) };
    }

    case "BOOLEAN": {
      if (answer.kind !== "boolean") {
        throw new Error(`Expected boolean answer for element ${element.id}`);
      }
      return { elementId: element.id, value: answer.value ? "true" : "false" };
    }

    case "RADIO_GROUP":
    case "SELECT":
    case "CHECKBOX_GROUP": {
      if (answer.kind !== "choice") {
        throw new Error(`Expected choice answer for element ${element.id}`);
      }
      return { elementId: element.id, optionIds: answer.optionIds };
    }

    default:
      throw new Error(`Cannot serialize unsupported element type ${element.type}`);
  }
}

/**
 * All element types the generic renderer knows how to display and validate.
 */
export const SUPPORTED_ELEMENT_TYPES: ContentElementType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "BOOLEAN",
  "RADIO_GROUP",
  "SELECT",
  "CHECKBOX_GROUP",
];

export function isSupportedElementType(type: string): type is ContentElementType {
  return (SUPPORTED_ELEMENT_TYPES as string[]).includes(type);
}
