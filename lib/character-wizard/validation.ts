import type { WizardDraft } from "./draft";
import { isStandardArrayComplete } from "./draft";
import {
  isInvalidElement,
  isUnsupportedElement,
  parseMoveMetadata,
  validateElementAnswer,
} from "@/lib/character-wizard/content-elements";

export type WizardStep =
  | "class"
  | "race"
  | "identity"
  | "stats"
  | "derived"
  | "alignment"
  | "config"
  | "equipment"
  | "bonds";

export const STEP_ORDER: WizardStep[] = [
  "class",
  "race",
  "identity",
  "stats",
  "derived",
  "alignment",
  "config",
  "equipment",
  "bonds",
];

export function validateStep(
  step: WizardStep,
  draft: WizardDraft
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (step) {
    case "class": {
      if (draft.classId === null) {
        errors.push("Debes elegir una clase.");
      } else if (draft.classDetail === null) {
        errors.push("Los datos de la clase aún no se han cargado.");
      } else if (
        typeof draft.classDetail.hitPoints !== "number" ||
        typeof draft.classDetail.baseLoad !== "number" ||
        typeof draft.classDetail.damageDice !== "number"
      ) {
        errors.push("Los datos de la clase están incompletos.");
      }
      break;
    }

    case "race": {
      if (draft.raceContentId === null) {
        errors.push("Debes elegir una raza.");
      } else if (
        draft.classDetail !== null &&
        !draft.classDetail.races.some((race) => race.id === draft.raceContentId)
      ) {
        errors.push("La raza elegida no pertenece a esta clase.");
      }
      break;
    }

    case "identity": {
      if (draft.name.trim() === "") {
        errors.push("El personaje necesita un nombre.");
      }
      break;
    }

    case "stats": {
      if (!isStandardArrayComplete(draft.stats)) {
        errors.push("Asigna cada puntuación del conjunto estándar una sola vez.");
      }
      break;
    }

    case "derived": {
      if (!isStandardArrayComplete(draft.stats)) {
        errors.push("Faltan puntuaciones de características.");
      }
      if (draft.classDetail === null) {
        errors.push("Faltan los datos de la clase.");
      }
      break;
    }

    case "alignment": {
      if (draft.alignment === null) {
        errors.push("Debes elegir un alineamiento.");
      } else if (draft.alignment.kind === "custom") {
        if (draft.alignment.name.trim() === "") {
          errors.push("El alineamiento personalizado necesita un nombre.");
        }
        if (draft.alignment.description.trim() === "") {
          errors.push("El alineamiento personalizado necesita una descripción.");
        }
      } else if (
        draft.alignment !== null &&
        draft.alignment.kind === "standard" &&
        draft.classDetail !== null
      ) {
        const selectedContentId = draft.alignment.contentId;
        const belongsToClass = draft.classDetail.alignments.some(
          (alignment) => alignment.id === selectedContentId
        );
        if (!belongsToClass) {
          errors.push("El alineamiento elegido no pertenece a esta clase.");
        }
      }
      break;
    }

    case "config": {
      if (draft.classDetail === null) {
        errors.push("Faltan los datos de la clase.");
        break;
      }

      for (const move of draft.classDetail.initialMoves) {
        const metadata = parseMoveMetadata(move.metadata, {
          hasContentElements: (move.contentElements ?? []).length > 0,
        });
        if (!metadata.requiresCompletion) {
          continue;
        }

        const elements = move.contentElements ?? [];
        const moveAnswers = draft.moveAnswers[move.id] ?? {};

        for (const element of elements) {
          const answer = moveAnswers[element.id];
          const result = validateElementAnswer(
            element,
            answer,
            metadata.requiresCompletion
          );

          if (isUnsupportedElement(result)) {
            const detail = result.reason ?? `tipo ${result.type}`;
            errors.push(`${move.title}: ${detail}.`);
          } else if (isInvalidElement(result)) {
            errors.push(`${move.title}: ${result.errors.join(" ")}`);
          }
        }
      }
      break;
    }

    case "equipment": {
      if (draft.classDetail === null) {
        errors.push("Faltan los datos de la clase.");
        break;
      }

      const validIds = new Set(draft.classDetail.equipment.map((item) => item.id));
      const invalid = draft.equipmentIds.find((id) => !validIds.has(id));
      if (invalid !== undefined) {
        errors.push("Hay equipo seleccionado que no pertenece a esta clase.");
      }
      break;
    }

    case "bonds": {
      const incomplete = draft.bonds.find((bond) => !bond.complete);
      if (incomplete !== undefined) {
        errors.push("Completa todos los vínculos antes de finalizar.");
      }
      break;
    }

    default:
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAllSteps(draft: WizardDraft): { valid: boolean; errors: string[] } {
  const allErrors: string[] = [];

  for (const step of STEP_ORDER) {
    const result = validateStep(step, draft);
    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}


export function getStepIndex(step: WizardStep): number {
  return STEP_ORDER.indexOf(step);
}

export function getStepLabel(step: WizardStep): string {
  const labels: Record<WizardStep, string> = {
    class: "Clase",
    race: "Raza",
    identity: "Identidad",
    stats: "Características",
    derived: "Derivados",
    alignment: "Alineamiento",
    config: "Configuración",
    equipment: "Equipo",
    bonds: "Vínculos",
  };
  return labels[step];
}
