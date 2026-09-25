# Apply Progress: Character Creation Wizard

## Status

**Change**: character-creation-wizard
**Mode**: Standard (Strict TDD disabled)
**Slice**: PR 2 — Frontend Foundation (Phase 1)
**Chain strategy**: stacked-to-main
**Branch**: `feat/character-creation-wizard-foundation` → `master`

## Blockers

- **Phase 0 (Backend extension)**: Blocked because the sibling `dungeon-world-api` repository is outside the authorized workspace edit root. The `damageDice` exposure tasks (0.1–0.3) cannot be implemented from this workspace. Frontend work that strictly requires `damageDice` from the API is deferred until Phase 0 lands.

## Completed Tasks

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

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `pnpm lint && pnpm build` |
| Focused test result | lint: 0 errors; build: success (dynamic route `/characters/new`) |
| Runtime harness | Start Next.js on port 3000 and open `/characters/new`; step navigation renders; no API writes occur because step components are placeholders and Finalize is not wired |
| Rollback boundary | Delete `app/characters/new/*`, `lib/api/*`, `lib/character-wizard/*`; revert `next.config.ts`, `app/layout.tsx`, `app/page.tsx`; remove `.env.example` |

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `.env.example` | Created | Documents `API_ORIGIN=http://localhost:3001` |
| `next.config.ts` | Modified | Adds fallback rewrite `/api/:path*` → `${API_ORIGIN}/api/:path*` |
| `app/layout.tsx` | Modified | `lang="es"`, Spanish metadata |
| `app/page.tsx` | Modified | Entry link to `/characters/new` |
| `lib/api/types.ts` | Created | DTO mirrors and domain types |
| `lib/api/client.ts` | Created | `fetch` wrapper + Spanish error normalization |
| `lib/api/classes.ts` | Created | `listClasses`, `listClassesServer`, `getClass` |
| `lib/api/equipment.ts` | Created | `listEquipment` |
| `lib/api/characters.ts` | Created | Character-scoped API helpers with id guards |
| `lib/character-wizard/draft.ts` | Created | `WizardDraft`, reducer, class-change invalidation |
| `lib/character-wizard/wizard-context.tsx` | Created | `WizardProvider`, `useWizard`, `useWizardSelector` |
| `lib/character-wizard/validation.ts` | Created | `validateStep`, `validateAllSteps`, step labels |
| `app/characters/new/page.tsx` | Created | Server page starting class-list promise |
| `app/characters/new/wizard.tsx` | Created | Client shell with step switcher and navigation |
| `app/characters/new/loading.tsx` | Created | Spanish loading UI |
| `app/characters/new/steps/*.tsx` | Created | Placeholder step components for all 9 steps |
| `openspec/changes/character-creation-wizard/tasks.md` | Modified | Marked Phase 1 complete, added Phase 0 blocker note |

## Deviations from Design

- **Step components are placeholders**: Unit 1 scope is the foundation shell. Steps 1–9 render minimal UI and are not yet interactive. Their full implementation is planned for Phases 2–5.
- **Class list promise passed to client but not yet consumed**: The promise is started on the server and passed to `WizardShell`; it will be consumed by the class step in Phase 2.
- **Finalize button logs (no-op)**: The Finalize action is intentionally not wired to the commit orchestrator, which is Phase 5 scope.

## Issues Found

- None within the implemented slice.

## Remaining Tasks

### Phase 0 (Blocked — outside edit root)

- [ ] 0.1 Verify `classes.damageDice` column and migration exist in `dungeon-world-api`
- [ ] 0.2 Add `damageDice` to `ClassDetailDto`
- [ ] 0.3 Map `damageDice` in the class mapper

### Phase 2: Class, Race, and Alignment

- [ ] 2.1 Implement Step 1 — Class selection
- [ ] 2.2 Implement Step 2 — Race selection
- [ ] 2.3 Implement Step 6 — Alignment selection
- [ ] 2.4 Verify class-change invalidation

### Phase 3: Identity, Stats, and Derived Values

- [ ] 3.1 Implement Step 3 — Identity and appearance
- [ ] 3.2 Implement derived-stats pure functions
- [ ] 3.3 Implement Step 4 — Stats array assignment
- [ ] 3.4 Implement Step 5 — Derived HP/load display

### Phase 4: Class Configuration

- [ ] 4.1 Inspect seeded move metadata to lock completion key
- [ ] 4.2 Implement content-element parser and cardinality rules
- [ ] 4.3 Implement generic content-element renderer
- [ ] 4.4 Implement Step 7 — Class configuration
- [ ] 4.5 Create temporary mock spell module
- [ ] 4.6 Enforce backend spell-cap at finalize

### Phase 5: Equipment, Bonds, and Finalize

- [ ] 5.1 Inspect seeded equipment tags to confirm armor spelling
- [ ] 5.2 Implement Step 8 — Equipment selection
- [ ] 5.3 Create per-class bond templates
- [ ] 5.4 Implement Step 9 — Bonds
- [ ] 5.5 Implement finalize commit orchestrator with rollback
- [ ] 5.6 Wire Finalize button and error/success UI

### Phase 6 & 7: Verification and Functional Checks

- [ ] 6.1–6.6 Apply-time verification tasks
- [ ] 7.1–7.10 Manual functional checks

## Next Recommended Work Unit

Implement **Phase 2 (Class, Race, Alignment)** once Phase 0 lands, or proceed independently if the frontend can tolerate missing `damageDice` with a fallback.

## Risks

- Phase 0 backend blocker may delay end-to-end functional checks.
- Placeholder step components mean the wizard is not yet usable for character creation.
- `useWizardSelector` subscription store is intentionally simple; verify performance with real step components in later phases.
