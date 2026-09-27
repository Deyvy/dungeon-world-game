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
 *   ids. The orchestrator must surface that failure and roll back the created
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
 * Full finalize orchestrator. Implemented in Phase 5.
 *
 * The spell-cap helper above will be used here when persisting spells:
 *
 *   const persistableSpellIds = computePersistableSpellIds(draft.spellIds);
 *   if (persistableSpellIds.length > 0) {
 *     await replaceSpells(createdId, persistableSpellIds);
 *   }
 *
 * Until the temporary fallback spell ids are replaced with real seeded ids,
 * `replaceSpells` is expected to fail for spellcasting classes, triggering the
 * rollback path documented in the design.
 */
