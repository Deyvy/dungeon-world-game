import {
  filterPersistableSpellIds,
  getTemporarySpellById,
} from "@/lib/character-wizard/mocks/spells";

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
 * Full finalize orchestrator. Implemented in Phase 5.
 *
 * The spell-cap helper above will be used here when persisting spells:
 *
 *   const persistableSpellIds = computePersistableSpellIds(draft.spellIds);
 *   if (persistableSpellIds.length > 0) {
 *     await replaceSpells(createdId, persistableSpellIds);
 *   }
 */
