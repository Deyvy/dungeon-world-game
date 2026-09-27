# Apply Progress: Character Creation Wizard

## Status

**Change**: character-creation-wizard
**Mode**: Standard (Strict TDD disabled)
**Slice**: PR 4 — Identity, Stats, and Derived Values (Phase 3)
**Chain strategy**: stacked-to-main
**Branch**: `feat/character-creation-wizard-identity-stats` → `feat/character-creation-wizard-class-race-alignment`

## Blockers

- None.

## Corrective Finding (previous pass)

- Phase 2 task 2.2 displayed the selected race description but only stored `raceContentId` in `WizardDraft`.
- Fix: extended `WizardDraft` with `raceMechanic: string`; `selectRace` now carries `raceContentId` and `raceMechanic` (populated from `ClassContent.content`); `clearDependentChoices` resets `raceMechanic` on class change.
- Verification: `pnpm lint` passes (0 errors); `pnpm build` succeeds for the dynamic `/characters/new` route.

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

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `pnpm lint && pnpm build` |
| Focused test result | lint: 0 errors; build: success (dynamic route `/characters/new`) |
| Runtime harness | Start Next.js on port 3000 and open `/characters/new`; reach Step 3, fill name and optional appearance fields including extra lines, and verify progression is allowed; on Step 4 assign each standard-array score to a different ability and confirm used scores are disabled; on Step 5 confirm max HP = class base + CON score, max load = class base + STR score, encumbrance preview shows "within limit" for zero carried load, and modifiers update immediately when scores are swapped. |
| Rollback boundary | Revert `lib/character-wizard/derived-stats.ts`, `app/characters/new/steps/identity-step.tsx`, `app/characters/new/steps/stats-step.tsx`, `app/characters/new/steps/derived-step.tsx`; revert `AppearanceDraft` export in `lib/character-wizard/draft.ts`. |

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `lib/character-wizard/derived-stats.ts` | Created | Pure functions for DW modifier table (1–18 with invalid out-of-range), max HP, max load, armor tag parser (`armadura`/`armor`), carried load, encumbrance, and display helpers. |
| `app/characters/new/steps/identity-step.tsx` | Modified | Full identity form with required name, optional gaze/hair/clothing/body fields, and dynamic extra appearance lines with add/remove. |
| `app/characters/new/steps/stats-step.tsx` | Modified | Six ability dropdowns populated from the standard array; already-assigned scores are disabled in other abilities to enforce exact uniqueness. |
| `app/characters/new/steps/derived-step.tsx` | Modified | Display-only step showing max HP, max load, encumbrance preview (carried load is currently zero until equipment is implemented), and all six ability modifiers. |
| `lib/character-wizard/draft.ts` | Modified | Exports `AppearanceDraft` so the identity step can type its local field configuration. |
| `openspec/changes/character-creation-wizard/tasks.md` | Modified | Marks Phase 3 tasks complete. |

## Deviations from Design

- None. Implementation matches `design.md`.
- Note: `modifier(score)` returns a tagged union (`{ kind: "valid"; value: number } | { kind: "invalid"; score: number }`) to satisfy the spec requirement of reporting invalid out-of-range scores instead of returning a misleading value.

## Issues Found

- None within the implemented slice.

## Remaining Tasks

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

Implement **Phase 4 (Class Configuration)** on a new `feat/character-creation-wizard-config` branch targeting `feat/character-creation-wizard-identity-stats`.

## Risks

- `ClassContent.title` rename must continue to be respected by all later steps that render class-content labels.
- The derived step currently shows zero carried load because equipment selection is not yet implemented; the encumbrance preview is accurate for the current draft state and will gain real totals in Phase 5.
- `useWizardSelector` subscription store is intentionally simple; verify performance with real step components in later phases.
