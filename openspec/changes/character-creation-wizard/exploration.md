# Exploration: Character Creation Wizard (9-step flow)

> Change name is provisional (`character-creation-wizard`) — exploration ran before `sdd-new`, so no change folder existed. Rename or relocate this file when the change is formally created.
> Sources: `AGENTS.md` (requirements), frontend repo at HEAD `397c7bb`, backend `dungeon-world-api` (read-only inspection of controllers, services, DTOs, mappers, Prisma schema).

## Current State

**Frontend (`dungeon-world-game`)** — greenfield. Bare `create-next-app` scaffold: Next.js 16.3.6 (App Router), React 19.2.8, Tailwind v4, TypeScript strict, `@/*` alias, pnpm. Only `app/page.tsx`, `app/layout.tsx`, `globals.css` exist. No components, no state library, no data layer, no routing beyond root. `AGENTS.md` warns this Next.js version has breaking changes vs. training data — bundled docs at `node_modules/next/dist/docs/` MUST be read before writing code (verified present).

**Backend (`dungeon-world-api`)** — mature NestJS + Prisma + MySQL. Global prefix `/api`, CORS wide open, no auth guards. ValidationPipe with `whitelist + forbidNonWhitelisted` (unknown body props → 400). Character creation already works end-to-end and is **resource-granular**:

- `POST /api/characters` `{name, classId, strength…charisma (1-18), appearance?[]}` → computes `hpCurrent = class.hitPoints + constitution`, auto-assigns all INITIAL moves (sorted), returns `CharacterResponseDto`. **Name, classId, and all six stats are required at creation.**
- All option/selection endpoints are **character-scoped** (need an existing id): `POST :id/races|alignments {contentId}`, `POST :id/equipment {equipmentIds[]}`, `POST :id/spells {spellIds[]}`, `PUT :id/moves/:contentId {elements[]}`, `POST :id/bonds {text}`, plus `GET :id/*/available`.
- Pre-character content source: `GET /api/classes/:id` → `ClassDetailDto` with `hitPoints`, `baseLoad`, and grouped `alignments[]`, `races[]`, `equipment[]` (with `equipmentId`), `initialMoves[]` — each move including `contentElements[]` (type TEXT/TEXTAREA/NUMBER/BOOLEAN/CHECKBOX_GROUP/RADIO_GROUP/SELECT, `minSelect`/`maxSelect`, options). `GET /api/classes` returns only `{id, name}`.
- `GET /api/equipment` → full catalog with parsed `metadata {weight, tags[], category, usesPerUnit}` — the source for load and armor math in step 8.
- Dynamic move choices (signature weapon, animal companion, deity): generic renderer over `contentElements` + `PUT /:id/moves/:contentId`; backend validates membership and min/max select.
- Destructive semantics: `POST :id/equipment` **replaces** the whole inventory; `POST :id/spells` **replaces** the whole spell list; `selectRace`/`selectAlignment` are **one-shot** (second call → 400, no update endpoint).
- Bonds are free text; no templates server-side — wizard owns bond template UX.

## Affected Areas

- `app/` — new route for the wizard (e.g. `app/characters/new/`); layout/page scaffold is untouched otherwise.
- New frontend layers (none exist yet): API client, wizard state store, step components, generic element renderer, derived-stats module, commit orchestrator.
- `package.json` — likely new deps (state/data-fetch choice) — design-phase decision.
- `next.config.ts` / env — API base URL or rewrite/proxy strategy — design-phase decision.
- Backend (read-only here): several gaps below may need a separate change in `dungeon-world-api`.

## Wizard ↔ API Mapping

| Step | Data source | Write |
|---|---|---|
| 1 Class | `GET /classes`, `GET /classes/:id` | draft |
| 2 Race | `ClassDetailDto.races` | draft (server write needs id) |
| 3 Identity/Looks | free text; `appearance[]` | draft |
| 4 Stats | fixed array 16/15/13/12/9/8, DW modifier table is **frontend logic** | draft |
| 5 HP/Load | mirror backend: `HP = hitPoints + CON` (score, not mod), `Load = baseLoad + STR` — display only | — |
| 6 Alignment | `ClassDetailDto.alignments` | draft |
| 7 Move choices | `initialMoves[].contentElements` (renderer keyed on elements/metadata flag) | draft → `PUT :id/moves/:contentId` |
| 8 Gear | `ClassDetailDto.equipment` + `GET /equipment` metadata; armor = sum of `armadura n` tags; encumbrance client-side | draft → `POST :id/equipment` |
| 9 Bonds | frontend templates | draft → `POST :id/bonds` |

**Core constraint**: the spec order (race at step 2) is impossible against a character-scoped API because `POST /characters` requires name + stats (steps 3-4) and race selection requires the character id.

## Approaches

1. **Client draft + commit-at-end sequence** — steps 1-9 in client state using class-scoped endpoints; on finalize: `POST /characters` → races → alignments → equipment → spells → move elements → bonds, with `DELETE /characters/:id` rollback on mid-sequence failure.
   - Pros: preserves spec step order; no partial characters during browsing; back/forward navigation is free; matches one-shot race/alignment semantics.
   - Cons: commit is not server-transactional; rollback logic needed; error UX at finalize time.
   - Effort: Medium.
2. **Incremental server-backed wizard** — create character right after step 4, then persist each later step immediately.
   - Pros: per-step persistence; survives reload; uses `available` endpoints directly.
   - Cons: breaks spec step order (race must move after step 4); abandoned wizards leave half-characters; race/alignment immutability makes "back" impossible post-write.
   - Effort: Medium.
3. **Reorder spec steps to fit API** — identity + stats first, class-scoped choices after creation.
   - Pros: simplest client.
   - Cons: contradicts `AGENTS.md` flow; worse UX narrative (class is the hook).
   - Effort: Low.

## Recommendation

**Approach 1 (client draft + commit sequence)**, with the commit orchestrator as an explicit, rollback-aware module. It preserves the documented wizard flow, keeps one-shot server writes safe (nothing hits the API until the user finalizes), and localizes complexity in one place. All pre-creation data is already available via `GET /classes/:id` + `GET /equipment`, so no backend change is required for the draft phase itself.

## Open Questions / Decision Gaps (resolve before or during proposal)

1. **Wizard spell count conflicts with backend validation.** Spec: Mage picks 3 level-1 spells + cantrips. Backend `addSpells` enforces `sum(spellLevel) ≤ level + 1` (= 2 at level 1) → 3×level-1 is rejected. Also `GET :id/spells/available` excludes cantrips (`spellLevel: {gt: 0}`) and `GET /spells` is a stub — **no endpoint lists a class's cantrips**. Needs: spec correction, or a backend change (separate change in the API repo).
2. **Racial moves not wired.** `selectRace` only records the RACE content; spec says the racial move is auto-assigned. Unclear how racial moves are modeled in data (race text vs. a linked MOVE) — needs DB/content inspection with the user.
3. **Custom alignment lines can't persist.** Spec step 6 allows creating a new alignment; `selectAlignment` accepts only an existing `contentId`. Either drop the feature, keep it display-only, or extend the backend.
4. **`damageDice` not exposed.** Schema and migration exist, but no DTO returns it — step 1 cannot show base damage. Backend coordination item.
5. **Frontend state + data-fetch conventions** (wizard store, fetch vs. route-handler proxy, error normalization) — choose in design; must follow Next.js 16 bundled docs, not prior-version habits.
6. **Dev port collision**: API `.env` has `PORT=3000`, same as Next dev default. Convention needed (e.g. API on 3001 or Next rewrites).
7. **UI language**: requirements and backend errors are Spanish; no established frontend convention yet. Proposal should fix UI copy language explicitly.
8. **Tag format for armor/load** (`armadura n` vs `armor n`) — verify against actual DB rows before implementing step 8 math.

## Risks

- **Partial commit**: multi-request finalize without a server transaction can leave incomplete characters; rollback and clear error surfacing are mandatory in the design.
- **Backend is read-only for this change**: gaps 1-4 block full spec compliance; wizard must degrade gracefully or the user must authorize a separate API change.
- **Next.js 16 divergence**: applying React/Next patterns from training data without reading bundled docs risks broken code (per AGENTS.md warning).
- **Scope size**: greenfield wizard + API client + renderer will very likely exceed the 400-line review budget → chained PRs expected (forecast formally in `sdd-tasks`; strategy `ask-on-risk`).
- **Tests deferred by session decision** — commit-orchestrator logic is the highest-risk untested surface; flag for later.

## Ready for Proposal

**Yes** — with open questions 1-4 surfaced to the user first (they are spec-vs-backend conflicts, not implementation choices). Questions 5-8 can be resolved inside `sdd-design`.
