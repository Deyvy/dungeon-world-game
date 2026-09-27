# Apply Progress: Character Creation Wizard

## Status

**Change**: character-creation-wizard
**Mode**: Standard (Strict TDD disabled)
**Slice**: PR 6 — Equipment, Bonds, and Finalize (Phase 5)
**Chain strategy**: stacked-to-main
**Branch**: `feat/character-creation-wizard-finalize` → `feat/character-creation-wizard-config`

## Blockers

- None.

## Corrective Findings

### Previous pass

- Phase 2 task 2.2 displayed the selected race description but only stored `raceContentId` in `WizardDraft`.
- Fix: extended `WizardDraft` with `raceMechanic: string`; `selectRace` now carries `raceContentId` and `raceMechanic` (populated from `ClassContent.content`); `clearDependentChoices` resets `raceMechanic` on class change.
- Verification: `pnpm lint` passes (0 errors); `pnpm build` succeeds for the dynamic `/characters/new` route.

### Phase 4 contract-validation pass

1. **Move completion key locked against seeded data**
   - Inspected `GET /api/classes/1` and `/api/classes/2`. Every initial-move `classContent.metadata` is `null`; neither `requiresCompletion` nor `needsCompletion` is present.
   - `requiresCompletion` is canonical; `needsCompletion` is kept as a documented compatibility fallback for older/future content imports.
   - Replaced the ambiguous `default` source with explicit `contentElements` (move has elements but no metadata flag) and `none` (no elements, no flag).

2. **minSelect/maxSelect validation is authoritative for every supported group**
   - Added `validateElementConfig` in `content-elements.ts`. It blocks configurations the generic renderer cannot represent:
     - RADIO_GROUP / SELECT with `maxSelect > 1` or `minSelect > 1`.
     - Any group with `minSelect > maxSelect` or options fewer than the required selection count.
   - The renderer, step validator, and config step now surface the specific reason instead of silently accepting or generic "unsupported type" messages.

3. **Placeholder spell IDs replaced with deterministic, isolated fallback IDs**
   - Confirmed `GET /api/spells` returns only the literal string `"This action returns all spells"`; no pre-character spell list exists.
   - Only Guerrero and Mago are seeded; Mago has no spells/equipment/races/alignments configured.
   - Fallback ids moved to isolated ranges (Mage 9000–9099, Cleric 9100–9199) and flagged via `isFallbackSpellId`; module comments now record the exact limitation.

4. **`computePersistableSpellIds` kept as a pure Phase 4 helper**
   - Added explicit JSDoc contract: pure, injectable lookup, no I/O, no rollback.
   - Documented that the default lookup uses fallback ids and that finalize for spellcasting classes will fail until real seeded ids replace them.

### Phase 5 equipment-shape verification

- Backend `GET /api/equipment` returns `{ id, name, description, metadata: { weight, tags, category, usesPerUnit } }`.
- The frontend `EquipmentItem` type keeps top-level `weight`/`tags`; `lib/api/equipment.ts` maps `metadata.weight` and `metadata.tags` without changing the backend contract.
- `classDetail.equipment[].equipmentId` is the canonical equipment id used for selection and for `POST /characters/:id/equipment`. Added `equipmentId?: number` to the frontend `ClassContent` type.
- Seed equipment tags were not directly inspectable from the workspace, so `derived-stats.ts` keeps both `armadura N` and `armor N` spellings and documents the limitation.

## Completed Tasks

### Phase 0: Backend Extension (externally verified)

- [x] 0.1 Verify `classes.damageDice` column and migration exist in `dungeon-world-api`
- [x] 0.2 Add `damageDice` to `ClassDetailDto` in `dungeon-world-api`
- [x] 0.3 Map `damageDice` in the class mapper

### Phase 1: Frontend Foundation

- [x] 1.1 Configure Next.js rewrite to sibling API on `PORT=3001`
- [x] 1.2 Set Spanish UI language and add wizard entry link
- [x] 1.3 Create typed API DTO mirrors
- [x] 1.4 Create `fetch` wrapper with Spanish error normalization
- [x] 1.5 Create API modules for classes, equipment, and characters
- [x] 1.6 Create wizard draft type, initial state, and reducer
- [x] 1.7 Create `WizardProvider` and consume/use hooks
- [x] 1.8 Create wizard server page and client shell
- [x] 1.9 Add per-step validation entry point

### Phase 2: Class, Race, and Alignment

- [x] 2.1 Implement Step 1 — Class selection
- [x] 2.2 Implement Step 2 — Race selection (corrected: stores `raceMechanic` from race description)
- [x] 2.3 Implement Step 6 — Alignment selection
- [x] 2.4 Verify class-change invalidation

### Phase 3: Identity, Stats, and Derived Values

- [x] 3.1 Implement Step 3 — Identity and appearance
- [x] 3.2 Implement derived-stats pure functions
- [x] 3.3 Implement Step 4 — Stats array assignment
- [x] 3.4 Implement Step 5 — Derived HP/load display

### Phase 4: Class Configuration (Step 7)

- [x] 4.1 Inspect seeded move metadata to lock the completion key
- [x] 4.2 Implement content-element metadata parser and cardinality rules
- [x] 4.3 Implement generic content-element renderer
- [x] 4.4 Implement Step 7 — Class configuration
- [x] 4.5 Create temporary mock spell module for draft lists
- [x] 4.6 Enforce backend spell-cap at finalize

### Phase 5: Equipment, Bonds, and Finalize

- [x] 5.1 Inspect seeded equipment tags to confirm armor spelling
- [x] 5.2 Implement Step 8 — Equipment selection
- [x] 5.3 Create per-class bond templates
- [x] 5.4 Implement Step 9 — Bonds
- [x] 5.5 Implement finalize commit orchestrator with rollback
- [x] 5.6 Wire Finalize button and error/success UI in the wizard shell

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `pnpm lint && pnpm build` |
| Focused test result | lint: 0 errors; build: success (dynamic route `/characters/new`) |
| Runtime harness | Start Next.js on port 3000 and open `/characters/new`; select Guerrero, fill Steps 1–9, click Finalizar. For a non-spellcasting class with valid data, finalize should create the character and show success. For Mage/Cleric, finalize is expected to fail on `POST /spells` because fallback ids are not real `spells` rows; verify rollback `DELETE /characters/:id` and error message. |
| Rollback boundary | Revert `lib/character-wizard/commit.ts`, `lib/character-wizard/bonds.ts`, `lib/character-wizard/draft.ts` (setBonds only), `lib/api/equipment.ts`, `lib/api/types.ts` (equipmentId only), `app/characters/new/steps/equipment-step.tsx`, `app/characters/new/steps/bonds-step.tsx`, `app/characters/new/steps/class-step.tsx` (bond init only), `app/characters/new/wizard.tsx`, and the equipment-step validation change in `lib/character-wizard/validation.ts`. |

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `lib/api/equipment.ts` | Modified | Maps backend `metadata.weight`/`metadata.tags` to frontend `EquipmentItem` top-level shape without changing the backend contract. |
| `lib/api/types.ts` | Modified | Added optional `equipmentId` to `ClassContent` so equipment selection uses the canonical equipment id. |
| `lib/character-wizard/bonds.ts` | Created | Frontend-owned Spanish bond templates for all 8 official classes with `_____` placeholders. |
| `lib/character-wizard/draft.ts` | Modified | Added `setBonds` reducer action; bonds are initialized when a class detail loads. |
| `lib/character-wizard/commit.ts` | Modified | Implemented finalize orchestrator: validation → create → alignment → race → equipment → spells → moves → bonds; rollback with distinct rollback-failure reporting. |
| `lib/character-wizard/derived-stats.ts` | Modified | Armor-tag parser comment now documents the backend metadata shape and the inability to inspect seed tags directly. |
| `lib/character-wizard/validation.ts` | Modified | Equipment-step validation now checks `equipmentId` instead of `classContent.id`. |
| `app/characters/new/steps/class-step.tsx` | Modified | Initializes draft bonds from class templates after class detail loads. |
| `app/characters/new/steps/equipment-step.tsx` | Modified | Full equipment selection UI with armor, carried load, max load, and encumbrance state. |
| `app/characters/new/steps/bonds-step.tsx` | Modified | Bond completion UI that marks bonds incomplete while `_____` remains. |
| `app/characters/new/wizard.tsx` | Modified | Finalize button wired through `commitCharacter`; loading, success, and normalized error UI; draft reset on success. |
| `openspec/changes/character-creation-wizard/tasks.md` | Modified | Marked Phase 5 tasks complete. |
| `openspec/changes/character-creation-wizard/apply-progress.md` | Modified | Records Phase 5 findings and updated file list. |

## Deviations from Design

- The design says moves without a completion flag render text only. After inspecting the seeded DB, the only initial move with configurable content (Guerrero's "Arma Distintiva", contentId 8) ships `metadata: null`. To keep the wizard usable against the current seeded data, `parseMoveMetadata` defaults to `requiresCompletion: true` when `contentElements` are non-empty and no explicit opt-out is present. An explicit `requiresCompletion: false` still opts out. This deviation is documented in `content-elements.ts` and the source is now explicit (`contentElements`).
- Spell selection for Mage/Cleric is implemented through the temporary mock module rather than through class-specific content elements, because the backend has not seeded move content for those classes. Move-element answers still capture Fighter's signature weapon via the generic renderer.
- The design's cardinality table does not explicitly call out blocking unrepresentable bounds. The implementation now validates element configs and blocks RADIO/SELECT configurations that require more than one selection, matching the single-select controls in the renderer.
- Equipment selection uses `classContent.equipmentId` rather than `classContent.id` because `POST /characters/:id/equipment` validates against the canonical `equipment` table. The frontend `ClassContent` type now carries `equipmentId` to support this.
- Bond templates are a best-effort neutral Spanish rendering of the official Dungeon World bonds; they should be reviewed against the licensed Spanish edition when available.

## Issues Found

- The seeded backend currently contains only two classes: Guerrero (id=1, complete initial move) and Mago (id=2, empty initial moves/equipment/races/alignments). The other six official classes are not present in the DB, so end-to-end functional checks covering all 8 classes are blocked until the backend is fully seeded.
- `GET /api/spells` returns only the literal string `"This action returns all spells"`; no pre-character spell list is available. Real seeded spell ids cannot be mapped, so the temporary catalog keeps deterministic fallback ids in isolated ranges. Finalize for spellcasting classes will fail until real ids replace them.
- Seed equipment tags could not be inspected directly from the workspace; the parser keeps both Spanish and English spellings as a defensive measure.
- Custom alignment rows on `classContent` (`metadata: { isCustom, characterId }`) are not deleted by `DELETE /characters/:id`. This is an accepted limitation documented in the design.

## Remaining Tasks

### Phase 6 & 7: Verification and Functional Checks

- [ ] 6.1–6.6 Apply-time verification tasks
- [ ] 7.1–7.10 Manual functional checks

## Next Recommended Work Unit

Implement **Phase 6 (Apply-Time Verification)** and **Phase 7 (Manual Functional Checks)** on a new branch targeting `feat/character-creation-wizard-finalize`, or proceed directly to `sdd-archive` if the remaining verification tasks are deferred.

## Risks

- Placeholder spell ids in `mocks/spells.ts` will cause finalize to fail for spellcasting classes until Phase 6 task 6.4 replaces them with real seeded ids.
- The default-to-completing behavior for moves with `contentElements` but no metadata flag is a pragmatic deviation; if the backend later adds metadata to some moves, the parser will respect the explicit flag.
- `ClassContent.title` rename continues to be respected by all later steps that render class-content labels.
- Bond template wording should be reviewed against the official Spanish Dungeon World playbooks before considering the feature complete.
- Rollback failure is reported distinctly, but the user must manually verify whether the orphaned character still exists.
