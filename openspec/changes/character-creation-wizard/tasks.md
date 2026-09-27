# Tasks: Character Creation Wizard

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,200 – 1,800 authored lines (≈25 new/modified files; excludes generated lockfile changes) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend exposure) → PR 2 (foundation + shell) → PR 3 (class/race/alignment) → PR 4 (identity/stats/derived) → PR 5 (class configuration) → PR 6 (equipment/bonds/finalize) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

The chain strategy has not been selected yet. Before `sdd-apply` starts, the team must choose `stacked-to-main`, `feature-branch-chain`, or `size-exception`. Because the delivery strategy is `auto-chain`, once the strategy is selected the orchestrator may proceed with the first slice without another go/no-go decision.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 0 | Expose `damageDice` in the sibling backend so the wizard can display base damage dice. | PR 1 | `pnpm build` inside `dungeon-world-api` passes; `GET /api/classes/1` returns `damageDice`. | Start `dungeon-world-api` on `PORT=3001` with seeded classes and curl `/api/classes/1`. | Revert the `ClassDetailDto` + mapper changes; no schema migration expected. |
| 1 | Frontend foundation: API client, error normalization, rewrite config, wizard shell, navigation, and draft provider. | PR 2 | `pnpm lint && pnpm build` in `dungeon-world-game`. | Start Next.js on port 3000, open `/characters/new`, verify step nav renders and no network writes occur while browsing. | Delete `app/characters/new/*`, `lib/api/*`, `lib/character-wizard/*`; revert `next.config.ts`, `app/layout.tsx`, `app/page.tsx`. |
| 2 | Class, race, and alignment steps with class-change invalidation and custom-alignment flow. | PR 3 | `pnpm lint && pnpm build`. | Select each official class, confirm base HP/damage/load appear; select race and standard/custom alignment; verify dependent choices clear on class change. | Revert the three step components and any validation changes specific to these steps. |
| 3 | Identity, stats array, modifiers, and derived HP/load display. | PR 4 | `pnpm lint && pnpm build`. | Fill name/looks, assign the standard array, confirm modifiers and HP/load update immediately when stats are swapped. | Revert `lib/character-wizard/derived-stats.ts`, identity and stats step components. |
| 4 | Class configuration step: generic content-element renderer, cardinality, mock spell lists, and Mage/Cleric/Fighter/Ranger choices. | PR 5 | `pnpm lint && pnpm build`. | Open step 7 for each class, complete required move answers, verify min/max select, unknown-type blocking, and spell selections. | Revert `lib/character-wizard/content-element-renderer.tsx`, `content-elements.ts`, `mocks/spells.ts`, and the configuration step component. |
| 5 | Equipment, bonds, finalize orchestrator, rollback, and end-to-end functional check. | PR 6 | `pnpm lint && pnpm build`; manual finalize for all 8 classes. | Run a full wizard session per class, trigger a mid-sequence failure, and confirm `DELETE /characters/:id` rollback plus a clear error. | Revert `lib/character-wizard/commit.ts`, `bonds.ts`, equipment/bonds/finalize step components. |

---

## Phase 0: Backend Extension

Foundation for the class step. Must land before frontend work that reads `damageDice`.

> **Externally verified**: Phase 0 files live in the sibling `dungeon-world-api` repository, which is outside the authorized workspace edit root (`dungeon-world-game`). The `damageDice` column, DTO field, and mapper mapping were verified read-only; `pnpm build` in `dungeon-world-api` succeeds in this environment.

- [x] 0.1 Verify `classes.damageDice` column and migration exist in `dungeon-world-api` (read-only)
  - Acceptance criteria: The Prisma schema contains `damageDice Int` on `classes`; the migration table includes `20260924200000_add_class_damage_dice`; all 8 seeded rows have non-null values.
  - File scope: `dungeon-world-api/prisma/schema.prisma` (read-only), `dungeon-world-api/prisma/migrations/*/migration.sql` (read-only), seeded DB.
  - Rollback notes: If the column is missing, stop and surface a blocker; do not add a migration without explicit approval.

- [x] 0.2 Add `damageDice` to `ClassDetailDto` in `dungeon-world-api`
  - Acceptance criteria: The DTO declares `damageDice!: number` and matches the design contract.
  - File scope: `dungeon-world-api/src/modules/classes/dto/class-detail.dto.ts`.
  - Rollback notes: Revert this single-file additive change.

- [x] 0.3 Map `damageDice` in the class mapper
  - Acceptance criteria: `ClassMapper.toDetail` copies `model.damageDice` into the DTO; `GET /api/classes/:id` returns the field for all seeded classes.
  - File scope: `dungeon-world-api/src/modules/classes/mappers/class.mapper.ts`.
  - Rollback notes: Revert the mapper change together with the DTO change.

---

## Phase 1: Frontend Foundation

Everything downstream depends on the API client, rewrite, and wizard shell.

- [x] 1.1 Configure Next.js rewrite to sibling API on `PORT=3001`
  - Acceptance criteria: `/api/:path*` rewrites to `${API_ORIGIN}/api/:path*` with a fallback rewrite; `API_ORIGIN` is read from a server env var, not `NEXT_PUBLIC_`.
  - File scope: `next.config.ts`, `.env.example` (create).
  - Rollback notes: Revert `next.config.ts` and remove `.env.example`.

- [x] 1.2 Set Spanish UI language and add wizard entry link
  - Acceptance criteria: `app/layout.tsx` uses `lang="es"` and Spanish metadata; `app/page.tsx` links to `/characters/new`.
  - File scope: `app/layout.tsx`, `app/page.tsx`.
  - Rollback notes: Revert the two modified files.

- [x] 1.3 Create typed API DTO mirrors
  - Acceptance criteria: Types exist for `ClassSummary`, `ClassDetail`, `ClassContent`, `ContentElement`, `Equipment`, `CreateCharacterRequest`, `MoveElementPayload`, `WizardError`, and error category.
  - File scope: `lib/api/types.ts`.
  - Rollback notes: Delete the file.

- [x] 1.4 Create `fetch` wrapper with Spanish error normalization
  - Acceptance criteria: Network failures map to `category: "network"`; HTTP 400 to `"validation"` with joined Spanish messages; 404/Prisma P2025 to `"not_found"`; everything else to `"operation"` without leaking parse exceptions.
  - File scope: `lib/api/client.ts`.
  - Rollback notes: Delete the file.

- [x] 1.5 Create API modules for classes, equipment, and characters
  - Acceptance criteria: `listClasses`, `getClass`, `listEquipment`, `createCharacter`, `createCustomAlignment`, `selectAlignment`, `selectRace`, `replaceEquipment`, `replaceSpells`, `updateMove`, `createBond`, `deleteCharacter` all exist and guard character-scoped calls when `characterId` is missing.
  - File scope: `lib/api/classes.ts`, `lib/api/equipment.ts`, `lib/api/characters.ts`.
  - Rollback notes: Delete the three files.

- [x] 1.6 Create wizard draft type, initial state, and reducer
  - Acceptance criteria: `WizardDraft` matches the design shape; actions cover `selectClass`, `setClassDetail`, `selectRace`, `setIdentity`, `assignStats`, `setAlignment`, `setMoveAnswer`, `setSpellIds`, `toggleEquipment`, `setBondText`, `reset`, and `classChange` invalidation that clears race/alignment/moveAnswers/spells/equipment/bonds.
  - File scope: `lib/character-wizard/draft.ts`.
  - Rollback notes: Delete the file.

- [x] 1.7 Create `WizardProvider` and consume/use hooks
  - Acceptance criteria: Provider wraps `/characters/new`; `useWizard()` returns draft and dispatch; `useWizardSelector()` or equivalent supports step components without extra re-renders.
  - File scope: `lib/character-wizard/wizard-context.tsx`.
  - Rollback notes: Delete the file.

- [x] 1.8 Create wizard server page and client shell
  - Acceptance criteria: `app/characters/new/page.tsx` starts the class-list promise and passes it to the client; `app/characters/new/wizard.tsx` renders the provider, step switcher, and Next/Back/Finalize navigation; `app/characters/new/loading.tsx` shows a Spanish loading state.
  - File scope: `app/characters/new/page.tsx`, `app/characters/new/wizard.tsx`, `app/characters/new/loading.tsx`.
  - Rollback notes: Delete the route directory.

- [x] 1.9 Add per-step validation entry point
  - Acceptance criteria: `validateStep(step, draft)` returns `{ valid: boolean; errors: string[] }` and is used to disable Continue/Finalize; finalization re-runs all steps.
  - File scope: `lib/character-wizard/validation.ts`.
  - Rollback notes: Delete the file.

---

## Phase 2: Class, Race, and Alignment

Depends on Phase 1.

- [x] 2.1 Implement Step 1 — Class selection
  - Acceptance criteria: Lists classes from `GET /api/classes`; selecting a class fetches detail and displays `hitPoints`, `damageDice` as `d{n}`, and `baseLoad`; only one class can be selected at a time.
  - File scope: `app/characters/new/steps/class-step.tsx`.
  - Checks: Spec scenario "Class detail is displayed".
  - Rollback notes: Delete the component.

- [x] 2.2 Implement Step 2 — Race selection
  - Acceptance criteria: Shows only `classDetail.races`; selecting a race stores `raceContentId` and stores the race description (`ClassContent.content`) as `raceMechanic` in the draft; the mechanic is cleared on class change.
  - File scope: `app/characters/new/steps/race-step.tsx`, `lib/character-wizard/draft.ts`.
  - Checks: Spec scenario "Race is restricted to the selected class".
  - Rollback notes: Delete the component; revert `raceMechanic` additions in the draft type/reducer.

- [x] 2.3 Implement Step 6 — Alignment selection
  - Acceptance criteria: Lists `classDetail.alignments`; supports standard selection; supports custom alignment with name + description; validation blocks empty custom fields.
  - File scope: `app/characters/new/steps/alignment-step.tsx`.
  - Checks: Spec scenarios "Custom alignment is captured" and "Invalid custom alignment is rejected".
  - Rollback notes: Delete the component.

- [x] 2.4 Verify class-change invalidation
  - Acceptance criteria: Changing the class in Step 1 clears race, alignment, move answers, spells, equipment, and bonds from the draft; navigation to later steps requires re-selection.
  - File scope: `lib/character-wizard/draft.ts`.
  - Checks: Spec scenario "Class change invalidates dependent choices".
  - Rollback notes: Revert invalidation logic in the reducer.

---

## Phase 3: Identity, Stats, and Derived Values

Depends on Phase 1.

- [ ] 3.1 Implement Step 3 — Identity and appearance
  - Acceptance criteria: Required `name.trim()`. Optional text fields for gaze, hair/head, clothing/attire, body; supports adding extra appearance lines; blanks are retained.
  - File scope: `app/characters/new/steps/identity-step.tsx`.
  - Checks: Spec scenario "Identity and optional appearance are accepted".
  - Rollback notes: Delete the component.

- [ ] 3.2 Implement derived-stats pure functions
  - Acceptance criteria: `modifier(score)` returns official DW values for 1–18 and reports invalid for out-of-range; `maxHp = hitPoints + constitution`; `maxLoad = baseLoad + strength`; armor parser sums case-insensitive `armadura n`/`armor n` tags; `carriedLoad` sums `weight * quantity`; `encumbered = carried > maxLoad`.
  - File scope: `lib/character-wizard/derived-stats.ts`.
  - Checks: Spec scenarios in `character-derived-stats`.
  - Rollback notes: Delete the file.

- [ ] 3.3 Implement Step 4 — Stats array assignment
  - Acceptance criteria: User assigns `16, 15, 13, 12, 9, 8` exactly once each across the six abilities; duplicate assignment is rejected; all six must be assigned to continue.
  - File scope: `app/characters/new/steps/stats-step.tsx`.
  - Checks: Spec scenarios "Valid standard array assignment" and "Duplicate score cannot be assigned".
  - Rollback notes: Delete the component.

- [ ] 3.4 Implement Step 5 — Derived HP/load display
  - Acceptance criteria: Display-only step shows max HP, max load, and encumbrance preview based on current class and stats; updates immediately when the user returns to Step 4 and changes assignments.
  - File scope: `app/characters/new/steps/derived-step.tsx`.
  - Checks: Spec scenario "Derived values update after reassignment".
  - Rollback notes: Delete the component.

---

## Phase 4: Class Configuration (Step 7)

Depends on Phase 1 and Phase 2 (class detail).

- [ ] 4.1 Inspect seeded move metadata to lock the completion key
  - Acceptance criteria: Document whether the DB uses `requiresCompletion`, `needsCompletion`, or both; update parser to treat truthy `requiresCompletion` canonical with `needsCompletion` as fallback; remove ambiguity before production code hardens.
  - File scope: `dungeon-world-api` seeded DB (read-only), `lib/character-wizard/content-elements.ts`.
  - Checks: Design open question #1.
  - Rollback notes: Revert parser change.

- [ ] 4.2 Implement content-element metadata parser and cardinality rules
  - Acceptance criteria: Moves without completion flag render text only; moves with the flag render elements in `sortOrder`; RADIO/SELECT default to exactly one; CHECKBOX defaults to 0..n unless completion required (then min 1); explicit `minSelect`/`maxSelect` override defaults.
  - File scope: `lib/character-wizard/content-elements.ts`.
  - Checks: Spec scenarios for required vs ordinary move and min/max select.
  - Rollback notes: Delete the file.

- [ ] 4.3 Implement generic content-element renderer
  - Acceptance criteria: Supports TEXT, TEXTAREA, NUMBER, BOOLEAN, RADIO_GROUP, SELECT, CHECKBOX_GROUP; unknown types mark the move invalid with a Spanish message; answers keyed by `move.id` + `element.id` survive Back/Forward.
  - File scope: `lib/character-wizard/content-element-renderer.tsx`.
  - Checks: Spec scenario "Unknown element is not silently accepted".
  - Rollback notes: Delete the file.

- [ ] 4.4 Implement Step 7 — Class configuration
  - Acceptance criteria: Lists all `classDetail.initialMoves`; renders required move answers; validates every required move before continuing; captures Mage spellbook, Cleric deity/domain/precept, Fighter signature weapon, and Ranger animal companion via the generic renderer.
  - File scope: `app/characters/new/steps/config-step.tsx`.
  - Checks: Spec scenarios "Initial moves are listed with required choices" and "Class-specific choices are captured".
  - Rollback notes: Delete the component.

- [ ] 4.5 Create temporary mock spell module for draft lists
  - Acceptance criteria: `lib/character-wizard/mocks/spells.ts` is clearly marked temporary; provides level-0 cantrips/prayers and any class-specific level-1+ lists not served by the backend; ids copied from the seeded DB so finalize can persist them where allowed.
  - File scope: `lib/character-wizard/mocks/spells.ts`.
  - Checks: Design open question #4; spec scenario "Temporary level-zero spell data is isolated".
  - Rollback notes: Delete the file.

- [ ] 4.6 Enforce backend spell-cap at finalize
  - Acceptance criteria: `POST /characters/:id/spells` is sent only with a non-empty subset whose `sum(spellLevel) <= character.level + 1` (level 1 → cap 2); full wizard choices remain captured in move-element answers.
  - File scope: `lib/character-wizard/commit.ts` (partial), `lib/character-wizard/mocks/spells.ts`.
  - Checks: Design open question #5.
  - Rollback notes: Revert commit logic.

---

## Phase 5: Equipment, Bonds, and Finalize

Depends on Phase 1, Phase 3 (derived stats), and Phase 4 (no direct dependency but uses draft).

- [ ] 5.1 Inspect seeded equipment tags to confirm armor spelling
  - Acceptance criteria: Document whether tags use `armadura n` or `armor n`; ensure parser handles both; update acceptance criteria in derived-stats if needed.
  - File scope: `dungeon-world-api` seeded DB (read-only), `lib/character-wizard/derived-stats.ts` (read-only verification).
  - Checks: Design open question #2.
  - Rollback notes: N/A — verification only.

- [ ] 5.2 Implement Step 8 — Equipment selection
  - Acceptance criteria: Shows class starting equipment from `classDetail.equipment`; allows selecting/deselecting items; displays total armor, carried load, max load, and encumbrance state; selection ids are a subset of class equipment ids.
  - File scope: `app/characters/new/steps/equipment-step.tsx`.
  - Checks: Spec scenarios for equipment retention, armor/load sums, and encumbrance.
  - Rollback notes: Delete the component.

- [ ] 5.3 Create per-class bond templates
  - Acceptance criteria: `lib/character-wizard/bonds.ts` contains Spanish bond templates for all 8 official classes with `_____` slots; templates are frontend-owned static data.
  - File scope: `lib/character-wizard/bonds.ts`.
  - Checks: Design open question #3; spec scenario "Bond template is completed".
  - Rollback notes: Delete the file.

- [ ] 5.4 Implement Step 9 — Bonds
  - Acceptance criteria: Shows templates for the selected class; each `_____` slot must be filled before finalize; completed bond text is stored as free text.
  - File scope: `app/characters/new/steps/bonds-step.tsx`.
  - Checks: Spec scenario "Required bond remains incomplete".
  - Rollback notes: Delete the component.

- [ ] 5.5 Implement finalize commit orchestrator with rollback
  - Acceptance criteria: Runs validation; `POST /characters`; creates custom alignment if needed; selects alignment; selects race; replaces equipment; replaces spells only when cap-compliant; updates each answered move; creates each bond; on any failure after create, calls `DELETE /characters/:id` and surfaces a normalized error while preserving the draft.
  - File scope: `lib/character-wizard/commit.ts`.
  - Checks: Spec scenarios "Complete draft is persisted", "Custom alignment is created before selection", "Mid-sequence failure rolls back the new character", "Rollback failure is reported distinctly".
  - Rollback notes: Delete the file.

- [ ] 5.6 Wire Finalize button and error/success UI in the wizard shell
  - Acceptance criteria: Finalize is disabled until all steps valid; clicking Finalize shows loading, then success or normalized error; success may clear the draft; error preserves draft for retry.
  - File scope: `app/characters/new/wizard.tsx`.
  - Checks: Spec scenarios for API error normalization.
  - Rollback notes: Revert shell changes.

---

## Phase 6: Apply-Time Verification Tasks

These are the open questions from the design, converted into explicit checks before or during apply.

- [ ] 6.1 Lock the move-completion metadata key
  - Acceptance criteria: Inspect at least one seeded row per class in `classContent.metadata`; decide whether the code uses `requiresCompletion` or `needsCompletion`; update parser and remove fallback alias if seeded data is consistent.
  - File scope: `lib/character-wizard/content-elements.ts`.

- [ ] 6.2 Confirm armor tag spelling in seeded equipment
  - Acceptance criteria: Query `GET /api/equipment` and inspect `tags`; confirm `armadura N` vs `armor N` usage; document result in a code comment next to the parser.
  - File scope: `lib/character-wizard/derived-stats.ts`.

- [ ] 6.3 Copy official Spanish bond wording into templates
  - Acceptance criteria: Each official class has bond strings matching the Spanish Dungeon World playbook; no `_____` placeholder is left unannounced to the user.
  - File scope: `lib/character-wizard/bonds.ts`.

- [ ] 6.4 Map mock spell ids to seeded `spells` table rows
  - Acceptance criteria: `lib/character-wizard/mocks/spells.ts` ids exist in the backend `spells` table for the classes that need them; any missing id is replaced with the real seeded id before finalize is exercised.
  - File scope: `lib/character-wizard/mocks/spells.ts`.

- [ ] 6.5 Verify custom-alignment leftover behavior
  - Acceptance criteria: Confirm that `DELETE /characters/:id` does not cascade `classContent` rows created via `POST /alignments/custom`; document this as an accepted limitation.
  - File scope: `lib/character-wizard/commit.ts` comment / `dungeon-world-api` DB (read-only).

- [ ] 6.6 Verify catalog DTO shape
  - Acceptance criteria: Confirm `GET /api/classes` returns `{id, name}` and no required extra fields; if the DTO exposes unused `baseLoad`, ensure Step 1 ignores it and loads bases from detail.
  - File scope: `lib/api/types.ts`, `lib/api/classes.ts`.

---

## Phase 7: Functional Checks (Manual)

No automated tests are in scope; these checks close each work unit.

- [ ] 7.1 Backend exposure check
  - `GET /api/classes/:id` returns `damageDice` for ids 1–8.

- [ ] 7.2 No-API-writes-while-browsing check
  - Open DevTools Network; navigate all 9 steps; confirm no `POST /characters`, `POST /characters/*/races`, `POST /characters/*/alignments`, or `POST /characters/*/bonds` before Finalize.

- [ ] 7.3 Back/Forward draft retention check
  - Fill Step 3, go to Step 4, go back, change a field, return forward; values persist.

- [ ] 7.4 Class-change invalidation check
  - Select Mage, choose race/alignment/gear; switch to Fighter; verify race/alignment/gear are cleared.

- [ ] 7.5 Custom alignment end-to-end check
  - Create custom alignment "Protector de los débiles" with description; finalize; verify character has that alignment.

- [ ] 7.6 Derived stats boundary check
  - Assign CON 16 and STR 9; verify max HP and max load match `class base + score`; assign CON 8 and confirm update.

- [ ] 7.7 Encumbrance boundary check
  - Select gear so carried load equals max load → not impeded; add one more weight → impeded; excess visible.

- [ ] 7.8 Class configuration coverage check
  - Complete Mage spellbook, Cleric deity/precept, Fighter signature weapon (type + range + 2 improvements), and Ranger animal companion; ensure finalize succeeds.

- [ ] 7.9 Rollback check
  - Induce a failure after character creation (e.g., stop API mid-sequence); verify `DELETE /characters/:id` is issued and error is shown; confirm no orphan character remains.

- [ ] 7.10 All 8 official classes check
  - Successfully create and persist a character for each official class.
