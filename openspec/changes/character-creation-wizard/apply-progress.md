# Apply Progress: Character Creation Wizard

## Status

**Change**: character-creation-wizard
**Mode**: Standard (Strict TDD disabled)
**Slice**: PR 5 — Class Configuration (Phase 4)
**Chain strategy**: stacked-to-main
**Branch**: `feat/character-creation-wizard-config` → `feat/character-creation-wizard-identity-stats`

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

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `pnpm lint && pnpm build` |
| Focused test result | lint: 0 errors; build: success (dynamic route `/characters/new`) |
| Runtime harness | Start Next.js on port 3000 and open `/characters/new`; select Guerrero, advance to Step 7, fill the "Arma Distintiva" fields (name, description, type, two tags), and verify the configuration step becomes valid; inspect `GET /api/classes/1` and `/api/classes/2` to confirm initial-move `metadata` is `null` and only Guerrero has content elements; call `GET /api/spells` to confirm it returns only a stub string. |
| Rollback boundary | Revert `lib/character-wizard/content-elements.ts`, `lib/character-wizard/content-element-renderer.tsx`, `lib/character-wizard/mocks/spells.ts`, `lib/character-wizard/commit.ts`, `app/characters/new/steps/config-step.tsx`, and the validation/parser changes in `lib/character-wizard/validation.ts` and `lib/api/types.ts`. |

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `lib/character-wizard/content-elements.ts` | Modified | Metadata parser (canonical `requiresCompletion`, compatibility fallback `needsCompletion`, explicit `contentElements`/`none` sources); cardinality rules; new `validateElementConfig` that blocks unrepresentable minSelect/maxSelect configs; element validation with unsupported-type/config detection; answer serialization for move updates. |
| `lib/character-wizard/content-element-renderer.tsx` | Modified | Generic renderer now validates element config before rendering and surfaces the specific reason when a configuration is unsupported. |
| `lib/character-wizard/mocks/spells.ts` | Modified | Temporary spell catalog now uses isolated fallback id ranges (9000–9099 Mage, 9100–9199 Cleric) and exports `isFallbackSpellId`; comments record the exact backend limitation (`GET /api/spells` is a stub; only Guerrero/Mago seeded). |
| `lib/character-wizard/commit.ts` | Modified | `computePersistableSpellIds` contract documented as a pure Phase 4 helper with injectable lookup; notes fallback-id limitation for Phase 5 integration. |
| `app/characters/new/steps/config-step.tsx` | Modified | Lists initial moves, renders required content elements, surfaces unsupported element/config reasons per element, and adds a spell-selection section for temporary spellcasting classes. |
| `lib/character-wizard/validation.ts` | Modified | Config-step validation reports specific unsupported element/config reasons as move-blocking errors. |
| `lib/api/types.ts` | Modified | Added `sortOrder?: number` to `ContentElementOption` to match the backend detail DTO. |
| `openspec/changes/character-creation-wizard/tasks.md` | Modified | Updated Phase 4 task evidence; marked 6.1 and 6.4 complete with observed limitations. |
| `openspec/changes/character-creation-wizard/apply-progress.md` | Modified | Records Phase 4 contract-validation findings and updated file list. |

## Deviations from Design

- The design says moves without a completion flag render text only. After inspecting the seeded DB, the only initial move with configurable content (Guerrero's "Arma Distintiva", contentId 8) ships `metadata: null`. To keep the wizard usable against the current seeded data, `parseMoveMetadata` defaults to `requiresCompletion: true` when `contentElements` are non-empty and no explicit opt-out is present. An explicit `requiresCompletion: false` still opts out. This deviation is documented in `content-elements.ts` and the source is now explicit (`contentElements`).
- Spell selection for Mage/Cleric is implemented through the temporary mock module rather than through class-specific content elements, because the backend has not seeded move content for those classes. Move-element answers still capture Fighter's signature weapon via the generic renderer.
- The design's cardinality table does not explicitly call out blocking unrepresentable bounds. The implementation now validates element configs and blocks RADIO/SELECT configurations that require more than one selection, matching the single-select controls in the renderer.

## Issues Found

- The seeded backend currently contains only two classes: Guerrero (id=1, complete initial move) and Mago (id=2, empty initial moves/equipment/races/alignments). The other six official classes are not present in the DB, so end-to-end functional checks covering all 8 classes are blocked until the backend is fully seeded.
- `GET /api/spells` returns only the literal string `"This action returns all spells"`; no pre-character spell list is available. Real seeded spell ids cannot be mapped, so the temporary catalog keeps deterministic fallback ids in isolated ranges. Finalize for spellcasting classes will fail until real ids replace them (tracked in Phase 6 task 6.4, now recorded as a known limitation).
- The backend equipment endpoint returns `weight` inside `metadata`, while the frontend `EquipmentItem` type expects `weight` top-level. This mismatch affects Phase 5 and is not fixed in this slice.

## Remaining Tasks

### Phase 5: Equipment, Bonds, and Finalize

- [ ] 5.1 Inspect seeded equipment tags to confirm armor spelling
- [ ] 5.2 Implement Step 8 — Equipment selection
- [ ] 5.3 Create per-class bond templates
- [ ] 5.4 Implement Step 9 — Bonds
- [ ] 5.5 Implement finalize commit orchestrator with rollback
- [ ] 5.6 Wire Finalize button and error/success UI in the wizard shell

### Phase 6 & 7: Verification and Functional Checks

- [ ] 6.1–6.6 Apply-time verification tasks
- [ ] 7.1–7.10 Manual functional checks

## Next Recommended Work Unit

Implement **Phase 5 (Equipment, Bonds, and Finalize)** on a new `feat/character-creation-wizard-finalize` branch targeting `feat/character-creation-wizard-config`.

## Risks

- Placeholder spell ids in `mocks/spells.ts` will cause finalize to fail for spellcasting classes until Phase 6 task 6.4 replaces them with real seeded ids.
- The default-to-completing behavior for moves with `contentElements` but no metadata flag is a pragmatic deviation; if the backend later adds metadata to some moves, the parser will respect the explicit flag.
- `ClassContent.title` rename continues to be respected by all later steps that render class-content labels.
- The equipment API shape mismatch (`metadata.weight` vs top-level `weight`) must be resolved before Phase 5 can calculate real carried load.
