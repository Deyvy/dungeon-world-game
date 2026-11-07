# Proposal: Character Creation Wizard

## Intent

The game frontend is a bare Next.js 16 scaffold with no character creation flow. Users need a guided, rules-accurate 9-step wizard that produces a complete Dungeon World character (class, race, identity, stats, alignment, class configuration, gear, bonds) persisted in the sibling backend `dungeon-world-api`.

Two constraints shape this change:

- The documented step order (class → race → identity → stats → …) cannot be written to the server incrementally: `POST /api/characters` requires name + classId + all six stats up front, and every selection endpoint is character-scoped (needs an existing id).
- The backend covers most of the domain but has small gaps (`damageDice` not exposed; level-0 cantrips/prayers not listable; spell-selection validation vs. spec expectations) that require either an authorized backend extension or a temporary mock/seed workaround.

## Scope

### In Scope

**Frontend (`dungeon-world-game`)**

1. Wizard route `app/characters/new/` implementing the 9 steps from `AGENTS.md`: (1) class, (2) race, (3) identity/looks, (4) stats, (5) derived HP/load, (6) alignment, (7) class configuration & initial moves, (8) equipment, (9) bonds.
2. Client-side draft state: no API writes until finalize; free back/forward navigation; per-step validation.
3. Stats step: assign the fixed array `16/15/13/12/9/8` to FUE/DES/CON/INT/SAB/CAR; DW modifier table (1-3: -3 … 18: +3) computed client-side.
4. Derived stats: `HP = class base + CON score` (score, not modifier), `Load = class baseLoad + STR score`, armor = sum of `armadura n` tags of equipped gear, encumbrance indicator vs max load.
5. Class configuration (step 7): auto-listing of initial moves; generic renderer over `initialMoves[].contentElements` (TEXT/TEXTAREA/NUMBER/BOOLEAN/CHECKBOX_GROUP/RADIO_GROUP/SELECT with `minSelect`/`maxSelect`), keyed on the move `metadata` flag that marks "needs completion". Must cover Mage spellbook (3 level-1 spells + cantrips), Cleric deity/domain/precept + prepared spells, Fighter signature weapon (type, range, 2 improvements), Ranger animal companion.
6. Spell data: level-1+ spells via backend endpoints; **temporary/mock data allowed** for level-0 cantrips/prayers and currently unsupported spell lists, isolated in one clearly marked module for later replacement.
7. Equipment step: gear packages from `ClassDetailDto.equipment` + `GET /api/equipment` metadata (`weight`, `tags[]`, `category`, `usesPerUnit`); client-side load and armor math; encumbrance state display.
8. Alignment step: standard alignments from `ClassDetailDto.alignments` + custom alignment creation via `POST :id/alignments/custom {name, description}` followed by a separate `POST :id/alignments {contentId}` selection request.
9. Bonds step: frontend-owned bond templates per class (backend stores free text only) with blank slots for party member names.
10. Commit orchestrator at finalize: `POST /characters {name, classId, stats, appearance}` → alignment (create custom first if chosen, then select) → `POST :id/races` → `POST :id/equipment {equipmentIds[]}` → `POST :id/spells {spellIds[]}` → per-move `PUT :id/moves/:contentId {elements[]}` → per-bond `POST :id/bonds {text}`; `DELETE /characters/:id` rollback on mid-sequence failure; clear error surfacing.
11. API client layer with typed domain models and error normalization (backend errors are Spanish).

**Backend (`dungeon-world-api` — explicitly authorized, minimal)**

12. Expose `damageDice` in class data (`ClassDetailDto` + class mapper + service). Schema/migration reportedly already exist — verify at apply; exposure-only change expected.

**Environment**

13. Dev setup to start the local sibling backend and seed/mock data when needed (authorized).

### Out of Scope

- Automated tests — deferred by decision; ordinary functional checks only (recorded as deferred testing debt).
- Auth, users, sessions; character list/management UI; character sheet view/edit after creation.
- Level-up, gameplay, advanced moves.
- Backend changes to spell validation (`sum(spellLevel) ≤ level + 1`) and cantrip listing — worked around via seed/mock data, not modified.
- Racial-move auto-assignment as a separate entity — decided: the race description IS the racial mechanic.
- i18n framework; custom classes beyond seeded content; production deployment.

## Capabilities

> No `openspec/specs/` exists yet — all capabilities are new.

### New Capabilities

- `character-creation-wizard`: the 9-step flow, step order, navigation, draft state, per-step validation, finalize commit sequence with rollback and error surfacing.
- `character-derived-stats`: DW modifier table, derived HP / max load / armor / encumbrance calculations and their display.
- `content-element-rendering`: generic renderer over backend `contentElements` with `minSelect`/`maxSelect` enforcement, driven by move metadata.
- `class-data-api`: the backend data contract the wizard consumes — `damageDice` exposure (extension), custom-alignment endpoints (already present), and the class/equipment/spell read endpoints as relied upon.

### Modified Capabilities

None (no existing specs).

## Approach

**Client draft + commit-at-end** (exploration Approach 1, recommended):

- Steps 1-9 operate on client draft state built from pre-creation endpoints: `GET /api/classes`, `GET /api/classes/:id` (`ClassDetailDto`: hitPoints, baseLoad, damageDice*, alignments, races, equipment, initialMoves + contentElements), `GET /api/equipment`.
- Nothing hits the API until finalize. This preserves the documented step order despite the character-scoped API, keeps one-shot race/alignment writes safe, and makes back/forward navigation free.
- Finalize is a rollback-aware commit orchestrator: sequential writes, `DELETE /characters/:id` on failure, explicit error state. Sequence respects one-shot semantics (alignment incl. custom creation, race) and replace semantics (`POST :id/equipment` and `POST :id/spells` replace whole collections).
- Frontend architecture choices (state store, data-fetch strategy, API base/proxy, port collision) are design-phase decisions constrained by the Next.js 16 bundled docs (`node_modules/next/dist/docs/` — this version diverges from training data per `AGENTS.md`).

### Backend/Frontend Boundary

| Wizard concern | Owner | Detail |
|---|---|---|
| Class list + base data (HP, baseLoad, damageDice*) | Backend | `GET /classes`, `GET /classes/:id`; *damageDice = the one backend extension |
| Race mechanic | Backend data, frontend display | Race description IS the racial mechanic; no separate entity |
| Modifier table, HP/load/armor/encumbrance math | Frontend | Mirrors backend rules (`HP = base + CON score`, `Load = baseLoad + STR score`) for live display |
| Alignment options + custom alignment | Backend | `ClassDetailDto.alignments`; `POST :id/alignments/custom` then separate `POST :id/alignments` |
| Move choice rendering + element answers | Backend data, frontend renderer | `contentElements` + metadata flag; `PUT :id/moves/:contentId` validates membership and min/max |
| Level-1+ spell lists | Backend | `GET :id/spells/available`, `POST :id/spells` (replace semantics) |
| Level-0 cantrips/prayers | Frontend (temporary) | Mock/seed data allowed; isolated module; display/draft-only until backend supports them |
| Equipment catalog + load/armor tags | Backend | `GET /equipment` metadata (`weight`, `tags[]`, `category`, `usesPerUnit`) |
| Bond templates | Frontend | Backend stores free text only; wizard owns template UX |
| Character persistence + HP computation | Backend | `POST /characters` computes `hpCurrent = class.hitPoints + constitution` and auto-assigns initial moves |

### Phased Delivery

Forecast against the 400-line review policy (`ask-on-risk`): chained PRs expected; formal forecast in `sdd-tasks`.

- **Phase 0 — Backend extension**: expose `damageDice` (small, additive, sibling repo).
- **Phase 1 — Frontend foundation**: project structure, API client, error normalization, wizard shell with step navigation + draft store.
- **Phase 2 — Class-scoped choices**: steps 1 (class), 2 (race), 6 (alignment incl. custom flow).
- **Phase 3 — Identity & stats**: steps 3 (name/looks), 4 (stats array + modifiers), 5 (derived HP/load display).
- **Phase 4 — Class configuration**: step 7 — initial moves, generic element renderer, spell selection (incl. mock cantrips/prayers).
- **Phase 5 — Equipment & bonds**: steps 8 (gear, armor/load/encumbrance) and 9 (bond templates).
- **Phase 6 — Finalize**: commit orchestrator with rollback + error UX; end-to-end functional check across the 8 official classes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/characters/new/` | New | Wizard route, step components |
| `app/page.tsx`, `app/layout.tsx` | Modified | Minimal: entry link to the wizard |
| Frontend API client + domain types | New | Typed client for classes/equipment/characters endpoints; error normalization |
| Wizard state store | New | Draft state for steps 1-9 (library chosen in design) |
| Generic element renderer | New | `contentElements` renderer for step 7 |
| Derived-stats module | New | Modifier table, HP/load/armor/encumbrance |
| Commit orchestrator | New | Finalize sequence + rollback |
| `package.json` | Modified | New deps (state/data-fetch — design decides) |
| `next.config.ts` / env | Modified | API base URL / proxy strategy |
| `dungeon-world-api`: `src/modules/classes/` (DTO, mapper, service) | Modified | Expose `damageDice` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Non-transactional finalize leaves partial characters | Medium | Rollback-aware commit orchestrator (`DELETE` on the id created in the same attempt); explicit error state at finalize |
| One-shot race/alignment semantics (second call → 400) | Medium | One-shot writes happen only inside the finalize sequence, never during browsing |
| Mock spell data drifts from future backend support | Medium | Isolate mocks in one marked module; scope to level-0 lists; document replacement path |
| Next.js 16 diverges from training data | High | Mandatory reading of bundled docs (`node_modules/next/dist/docs/`) in design and apply |
| Scope exceeds 400-line review budget | High | Phased delivery; chained PRs; formal forecast in `sdd-tasks` |
| No tests — commit orchestrator is untested | Medium | Per-phase functional checks; deferred-testing debt recorded; rollback path exercised manually in Phase 6 |
| Two-repo change coordination (frontend + sibling API) | Low | Backend change is additive and isolated in Phase 0; independent rollback |

## Rollback Plan

- **Frontend**: all work on a feature branch; revert the merged PR(s); no data or schema impact.
- **Backend**: `damageDice` exposure is a single additive commit in `dungeon-world-api`; revert that commit. Verify the Prisma schema/migration already exist before exposing — only add a migration if verified missing, and revert it together with the code.
- **Seeded/mock data**: local dev DB only; seed scripts kept and documented; no production data impact.
- **Wizard runtime failure**: rollback deletes only the character created in the same finalize attempt; the wizard performs no other destructive operations.

## Dependencies

- Sibling backend `dungeon-world-api` runnable locally with the 8 official classes seeded (classes, races, alignments, moves + elements, equipment, level-1+ spells). Starting it and seeding/mocking data when needed is authorized.
- Next.js 16 bundled docs at `node_modules/next/dist/docs/` (mandatory reading in design/apply).
- Confirmed product decisions (session, 2026-09-25): no tests for now (functional checks, testing deferred); temporary/mock spell data allowed for level-0 cantrips/prayers and currently unsupported spell data; race description = racial mechanic (no separate entity); custom alignments via existing backend endpoints (create → separate selection); backend extended to expose `damageDice`.

## Success Criteria

- [ ] A user can complete all 9 steps in the documented order and finalize a character fully persisted via the API (stats, race, alignment, initial moves with answered elements, spells, equipment, bonds).
- [ ] Back/forward navigation works at any step with zero API writes before finalize.
- [ ] Stats: only the fixed array `16/15/13/12/9/8` is assignable; modifiers follow the official DW table; displayed HP/load match backend computation (`base + score`).
- [ ] Class step shows base HP, base damage dice, and base load for the selected class.
- [ ] Class-specific configurations complete for Mage (spellbook incl. cantrips via mock/seed), Cleric (deity + prepared spells), Fighter (signature weapon), Ranger (animal companion).
- [ ] Custom alignment: create (`name` + `description`) then select — persisted on the character.
- [ ] Equipment step shows total armor (sum of `armadura n` tags), total load, and encumbrance state vs max load.
- [ ] A mid-sequence finalize failure rolls back (no orphan partial character) and surfaces a clear error.
- [ ] All 8 official classes can be created end-to-end (functional check).

## Open Assumptions

1. **UI copy language is undecided.** Game content and backend errors are Spanish; `AGENTS.md` requirements are Spanish; the artifact language contract defaults new UI copy to English for greenfield projects. Needs an explicit user decision before spec freezes language-sensitive requirements. (Leaning: match game content — Spanish — but not chosen here.)
2. Frontend state library, data-fetch strategy, API base/proxy, and the dev port collision (API `.env` `PORT=3000` vs Next dev default 3000) — design-phase decisions.
3. Armor tag format (`armadura n` vs `armor n`) — verify against actual seeded DB rows in design/apply before implementing armor math.
4. `damageDice` Prisma schema/migration already exist per exploration — verify at apply; exposure-only change expected.
5. Bond templates are frontend-owned static content (backend stores free text only) — template source and exact per-class wording confirmed at spec.
6. Scope of mock spell data (which class lists need level-0 mocks) is determined by inspecting seeded content at design/apply.
