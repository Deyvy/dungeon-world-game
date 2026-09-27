import {
  createBond,
  createCharacter,
  createCustomAlignment,
  deleteCharacter,
  replaceEquipment,
  replaceSpells,
  selectAlignment,
  selectRace,
  updateMove,
} from "@/lib/api/characters";
import { ContentElement, WizardError } from "@/lib/api/types";
import { WizardDraft } from "@/lib/character-wizard/draft";
import { validateAllSteps } from "@/lib/character-wizard/validation";
import {
  filterPersistableSpellIds,
  getTemporarySpellById,
} from "@/lib/character-wizard/mocks/spells";
import { serializeElementAnswer } from "@/lib/character-wizard/content-elements";

export type CommitResult =
  | { success: true; characterId: number }
  | { success: false; error: WizardError; rollbackFailed: boolean };

/**
 * Compute the spell ids that can safely be sent to
 * `POST /api/characters/:id/spells` for a level-1 character.
 *
 * Backend validation requires:
 * - non-empty array (`ArrayNotEmpty` on `AddSpellsDto`)
 * - `sum(spellLevel) <= character.level + 1` (level 1 → cap 2)
 * - each spell belongs to the character's class and is active
 *
 * This helper drops level-0 cantrips (the backend injects them on
 * `GET :id/spells`) and trims higher-level spells until the cap is satisfied.
 * If the result is empty, the caller should skip the `POST /spells` call.
 *
 * Contract for Phase 5 integration:
 * - The helper is pure: it only applies the level-sum cap to the ids it is
 *   given. It performs no I/O and no rollback.
 * - The lookup function is injectable so the orchestrator can replace the
 *   temporary fallback catalog with a real spell service when one becomes
 *   available.
 * - The default lookup uses the temporary fallback module. Because the backend
 *   `GET /api/spells` endpoint is a stub and no pre-character spell list
 *   exists, the fallback ids are placeholders (`isFallbackSpellId` returns
 *   true). Those ids will not exist in the backend `spells` table, so finalize
 *   for a spellcasting class will fail until they are replaced with real seeded
 *   ids. The orchestrator surfaces that failure and rolls back the created
 *   character.
 */
export function computePersistableSpellIds(
  draftSpellIds: number[],
  characterLevel = 1
): number[] {
  return filterPersistableSpellIds(
    draftSpellIds,
    (id) => {
      const spell = getTemporarySpellById(id);
      return spell !== undefined
        ? { spellLevel: spell.spellLevel }
        : undefined;
    },
    characterLevel
  );
}

/**
 * Persist a complete wizard draft as a new character.
 *
 * The orchestrator follows the design sequence:
 *   1. Validate the full draft.
 *   2. Create the character.
 *   3. Create + select custom alignment when needed, otherwise select standard.
 *   4. Select race.
 *   5. Replace equipment (only if non-empty, because the DTO requires it).
 *   6. Replace spells with a cap-compliant subset (only if non-empty).
 *   7. Update each answered initial move.
 *   8. Create each bond.
 *
 * If any step fails after the character is created, the orchestrator tries to
 * delete only that character. The draft is preserved so the user can retry.
 */
export async function commitCharacter(draft: WizardDraft): Promise<CommitResult> {
  const validation = validateAllSteps(draft);
  if (!validation.valid) {
    const error: WizardError = {
      category: "validation",
      message: validation.errors.join(" "),
      operation: "commitCharacter",
    };
    return { success: false, error, rollbackFailed: false };
  }

  if (draft.classDetail === null) {
    const error: WizardError = {
      category: "validation",
      message: "Faltan los datos de la clase.",
      operation: "commitCharacter",
    };
    return { success: false, error, rollbackFailed: false };
  }

  const appearance = [
    draft.appearance.gaze,
    draft.appearance.hair,
    draft.appearance.clothing,
    draft.appearance.body,
    ...draft.appearance.extra,
  ];

  const createRequest = {
    name: draft.name.trim(),
    classId: draft.classId!,
    appearance,
    strength: draft.stats.strength!,
    dexterity: draft.stats.dexterity!,
    constitution: draft.stats.constitution!,
    intelligence: draft.stats.intelligence!,
    wisdom: draft.stats.wisdom!,
    charisma: draft.stats.charisma!,
  };

  let createdId: number | null = null;

  try {
    const created = await createCharacter(createRequest);
    createdId = created.id;
  } catch (error) {
    return {
      success: false,
      error: normalizeCommitError(error, "createCharacter"),
      rollbackFailed: false,
    };
  }

  try {
    await runDependentWrites(createdId, draft);
    return { success: true, characterId: createdId };
  } catch (error) {
    return await rollback(createdId, error);
  }
}

async function runDependentWrites(
  characterId: number,
  draft: WizardDraft
): Promise<void> {
  if (draft.alignment?.kind === "custom") {
    const custom = await createCustomAlignment(characterId, {
      name: draft.alignment.name,
      description: draft.alignment.description,
    });
    await selectAlignment(characterId, custom.id);
  } else if (draft.alignment?.kind === "standard") {
    await selectAlignment(characterId, draft.alignment.contentId);
  }

  if (draft.raceContentId !== null) {
    await selectRace(characterId, draft.raceContentId);
  }

  if (draft.equipmentIds.length > 0) {
    await replaceEquipment(characterId, draft.equipmentIds);
  }

  const persistableSpellIds = computePersistableSpellIds(draft.spellIds);
  if (persistableSpellIds.length > 0) {
    await replaceSpells(characterId, persistableSpellIds);
  }

  for (const [moveIdString, answersByElement] of Object.entries(
    draft.moveAnswers
  )) {
    const moveId = Number(moveIdString);
    const elements = Object.entries(answersByElement).map(
      ([elementIdString, answer]) => {
        const elementId = Number(elementIdString);
        const element = findElement(draft, moveId, elementId);
        if (element === undefined) {
          throw new Error(
            `No se encontró el elemento ${elementId} del movimiento ${moveId}`
          );
        }
        return serializeElementAnswer(element, answer);
      }
    );

    if (elements.length > 0) {
      await updateMove(characterId, moveId, elements);
    }
  }

  for (const bond of draft.bonds) {
    if (bond.complete && bond.text.trim() !== "") {
      await createBond(characterId, bond.text);
    }
  }
}

function findElement(
  draft: WizardDraft,
  moveId: number,
  elementId: number
): ContentElement | undefined {
  if (draft.classDetail === null) {
    return undefined;
  }

  const move = draft.classDetail.initialMoves.find((m) => m.id === moveId);
  if (move === undefined) {
    return undefined;
  }

  return (move.contentElements ?? []).find((e) => e.id === elementId);
}

async function rollback(
  characterId: number,
  originalError: unknown
): Promise<CommitResult> {
  let deleteError: unknown;
  try {
    await deleteCharacter(characterId);
  } catch (error) {
    deleteError = error;
  }

  const baseMessage =
    originalError instanceof Error
      ? originalError.message
      : "No se pudo completar la creación del personaje.";

  if (deleteError === undefined) {
    const error: WizardError = {
      category: "operation",
      message: `${baseMessage} El personaje creado ha sido eliminado; puedes corregir el problema y volver a intentarlo.`,
      operation: "commitCharacter",
      details: originalError,
    };
    return { success: false, error, rollbackFailed: false };
  }

  const error: WizardError = {
    category: "operation",
    message: `${baseMessage} Además, no se pudo confirmar la eliminación del personaje creado (${characterId}). Revisa su estado antes de continuar.`,
    operation: "commitCharacter",
    details: { originalError, deleteError },
  };
  return { success: false, error, rollbackFailed: true };
}

function normalizeCommitError(
  cause: unknown,
  operation: string
): WizardError {
  if (
    cause !== null &&
    typeof cause === "object" &&
    "category" in cause &&
    "message" in cause
  ) {
    return cause as WizardError;
  }

  const message =
    cause instanceof Error
      ? cause.message
      : "Ocurrió un error inesperado al guardar el personaje.";

  return {
    category: "operation",
    message,
    operation,
    details: cause,
  };
}
