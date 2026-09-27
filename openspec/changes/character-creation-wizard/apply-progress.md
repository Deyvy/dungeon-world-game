# Apply Progress: Character Creation Wizard

## Status

**Change**: character-creation-wizard
**Mode**: Standard (Strict TDD disabled)
**Slice**: PR 3 — Class, Race, and Alignment (Phase 2)
**Chain strategy**: stacked-to-main
**Branch**: `feat/character-creation-wizard-class-race-alignment` → `feat/character-creation-wizard-foundation`

## Blockers

- None. The previous Phase 0 blocker has been reconciled: the sibling `dungeon-world-api` already exposes `damageDice` on the schema, `ClassDetailDto`, and the class mapper.

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
- [x] 2.2 Implement Step 2 — Race selection
- [x] 2.3 Implement Step 6 — Alignment selection
- [x] 2.4 Verify class-change invalidation

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `pnpm lint && pnpm build` |
| Focused test result | lint: 0 errors; build: success (dynamic route `/characters/new`) |
| Runtime harness | Start Next.js on port 3000 and open `/characters/new`; select a class and confirm base HP/damage/load appear; select a race and verify only class races are shown; select a standard or custom alignment and verify empty custom fields block progression; change class and verify dependent choices clear. |
| Rollback boundary | Revert `app/characters/new/steps/class-step.tsx`, `app/characters/new/steps/race-step.tsx`, `app/characters/new/steps/alignment-step.tsx`; revert `lib/api/types.ts` `ClassContent.name` → `ClassContent.title`; revert `lib/character-wizard/validation.ts` move-title error. |

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `app/characters/new/steps/class-step.tsx` | Modified | Loads class detail on selection, shows `d{n}` damage dice, base HP, and base load; avoids duplicate fetches and shows loading/error states. |
| `app/characters/new/steps/race-step.tsx` | Modified | Lists only the selected class's races, displays the racial mechanic from the race content, and stores `raceContentId`. |
| `app/characters/new/steps/alignment-step.tsx` | Modified | Supports standard alignment selection from `classDetail.alignments` and a custom alignment with name + description; disables custom inputs until custom mode is active. |
| `lib/api/types.ts` | Modified | Renames `ClassContent.name` to `ClassContent.title` to match the backend `ClassDetailDto` contract. |
| `lib/character-wizard/validation.ts` | Modified | Updates move validation error message to use `move.title` instead of the removed `move.name`. |
| `openspec/changes/character-creation-wizard/tasks.md` | Modified | Marks Phase 0 and Phase 2 complete; resolves chain strategy to `stacked-to-main`. |

## Deviations from Design

- **Type correction, not a UX deviation**: `ClassContent` used `name` in the frontend mirror but the backend DTO returns `title`. Renamed the field to align the mirror with the actual API contract. The UI now renders race/alignment titles correctly.
- No other deviations from `design.md`.

## Issues Found

- None within the implemented slice.
- Backend build note: a previous attempt reportedly failed with `ERR_PNPM_IGNORED_BUILDS`. In this session, `pnpm build` in `dungeon-world-api` completed successfully (`$ nest build` with no errors). The frontend build also succeeded.

## Remaining Tasks

### Phase 3: Identity, Stats, and Derived Values

- [ ] 3.1 Implement Step 3 — Identity and appearance
- [ ] 3.2 Implement derived-stats pure functions
- [ ] 3.3 Implement Step 4 — Stats array assignment
- [ ] 3.4 Implement Step 5 — Derived HP/load display

### Phase 4: Class Configuration (Step 7)

- [ ] 4.1 Inspect seeded move metadata to lock completion key
- [ ] 4.2 Implement content-element metadata parser and cardinality rules
- [ ] 4.3 Implement generic content-element renderer
- [ ] 4.4 Implement Step 7 — Class configuration
- [ ] 4.5 Create temporary mock spell module for draft lists
- [ ] 4.6 Enforce backend spell-cap at finalize

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

Implement **Phase 3 (Identity, Stats, and Derived Values)** on a new `feat/character-creation-wizard-identity-stats` branch targeting `feat/character-creation-wizard-class-race-alignment`.

## Risks

- `ClassContent.title` rename must be respected by all later steps that render class-content labels (equipment, configuration). The remaining placeholder steps do not yet reference these fields.
- The custom alignment flow stores free-text values in the draft; finalization will need to call `POST /characters/:id/alignments/custom` before selection (Phase 5).
- `useWizardSelector` subscription store is intentionally simple; verify performance with real step components in later phases.
