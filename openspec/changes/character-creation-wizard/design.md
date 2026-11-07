# Design: Character Creation Wizard

## Technical Approach

Implement a client-only 9-step wizard on the greenfield Next.js 16 App Router frontend. All browsing and validation happen against an in-memory draft. Persistence happens once, at finalize, through a rollback-aware commit orchestrator that talks to the sibling NestJS API.

This maps to proposal Approach 1 and to the four delta specs:

- `character-creation-wizard` — ordered steps, draft isolation, per-step validation, commit sequence, error surfacing
- `character-derived-stats` — DW modifier table, HP, load, armor, encumbrance
- `content-element-rendering` — metadata-driven move answers
- `class-data-api` — typed client, `damageDice` exposure, custom-alignment create-then-select

Frontend owns UX, draft math, bond templates, and temporary spell catalogs. Backend remains the source of class/equipment/character truth. The only authorized backend change is exposing `damageDice` (Prisma field and migration already exist).

## Architecture Decisions

### Decision: Client draft until finalize

**Choice**: Keep the entire wizard in React state. Issue no `POST /api/characters` and no character-scoped writes until the user finalizes a valid draft.

**Alternatives considered**: Incremental server-backed wizard (create after stats); reorder steps to match the API.

**Rationale**: `POST /api/characters` requires name + `classId` + all six stats. Race and alignment are one-shot and character-scoped. Creating early would break the documented step order and make Back unsafe. Spec `Client-only draft before finalization` forbids character-scoped writes while browsing.

### Decision: React context + reducer, no extra state library

**Choice**: One `WizardProvider` with `useReducer` around the `/characters/new` route. Draft lives in memory only (no `localStorage`).

**Alternatives considered**: Zustand; URL-serialized step state; React Query as the source of truth.

**Rationale**: The frontend currently has no state library. The draft is session-scoped and must not survive abandon (`Draft is isolated between wizard sessions`). A single flow does not justify a new dependency. Selection-driven API data (class detail, equipment catalog) is cached on the draft, not in a general-purpose cache.

### Decision: Same-origin `/api` rewrite; API process on 3001

**Choice**: Next.js stays on port 3000. Sibling API runs on `PORT=3001`. `next.config.ts` fallback-rewrites `/api/:path*` to `${API_ORIGIN}/api/:path*`. The browser client calls relative `/api/...`. Server-side fetches (if any) use `API_ORIGIN` directly.

**Alternatives considered**: `NEXT_PUBLIC_API_BASE_URL` + CORS; Next.js Route Handler BFF; moving Next to 3001.

**Rationale**: API `.env.template` defaults to `PORT=3000`, colliding with `next dev`. Backend already enables CORS, but a rewrite matches the Next.js 16 docs for proxying a CRA-style backend and avoids leaking the origin to the client bundle. `API_ORIGIN` stays a server env var (not `NEXT_PUBLIC_`). Changing the local API port is authorized as part of sibling-backend dev setup.

### Decision: Typed `fetch` client, no SWR / React Query

**Choice**: A small `lib/api/client.ts` wrapper around `fetch`. Class catalog can be started in the Server Component page and read in the client via React `use()`. Class detail and equipment load on demand from the client wrapper.

**Alternatives considered**: SWR; React Query; Route Handlers that re-expose every backend endpoint.

**Rationale**: Next.js 16 client-fetch guidance is `use` for server-started promises, or a community library. Wizard reads are selection-driven and writes exist only at finalize, so a library cache is unused weight. A BFF would duplicate the Nest surface without adding a transaction (the API still has none).

### Decision: Generic content-element renderer, not class-specific forms

**Choice**: One renderer for `TEXT | TEXTAREA | NUMBER | BOOLEAN | CHECKBOX_GROUP | RADIO_GROUP | SELECT`. Mage, Cleric, Fighter, and Ranger configuration are data-driven from `initialMoves[].contentElements`. Unknown types block finalization of that move.

**Alternatives considered**: Hard-coded Mage/Cleric/Fighter/Ranger panels.

**Rationale**: Backend already validates membership and `min_select`/`max_select` on `PUT /characters/:id/moves/:contentId`. Custom classes are expected later. Class-specific panels would duplicate the contract and miss seeded variants.

### Decision: Isolated temporary spell module for draft lists

**Choice**: Draft spell options come from `lib/character-wizard/mocks/spells.ts` (marked temporary). `GET /api/spells` is a stub string. `GET /api/characters/:id/spells/available` requires a character id and excludes `spellLevel = 0`. The typed API client never reads the mock module.

**Alternatives considered**: Adding `GET /classes/:id/spells` (not authorized); creating a throwaway character just to list spells.

**Rationale**: Proposal allows mock/seed for level-0 and currently unsupported lists, and forbids extra backend spell work. A throwaway character would violate draft isolation. Apply must copy real seeded spell ids into the mock so finalize `POST /spells` can succeed.

### Decision: Spell persistence is best-effort against backend caps

**Choice**: Step 7 still collects the full Dungeon World selection (Mage: 3 first-level + cantrips, etc.). Finalize:

1. Persists spell-like answers that live on move elements via `PUT .../moves/:contentId` (primary).
2. Calls `POST /characters/:id/spells` only when the selected `spellIds` satisfy `sum(spellLevel) <= character.level + 1` (level 1 → cap 2) and the array is non-empty (`ArrayNotEmpty` on `AddSpellsDto`).
3. Does not POST level-0 cantrips unless they are required for a passing subset; the backend already injects class cantrips on `GET :id/spells`.

**Alternatives considered**: POST three level-1 spells and accept 400; skip `POST /spells` entirely.

**Rationale**: Backend validation is out of scope. Sending three level-1 spells cannot succeed. Move-element answers still capture the full wizard choice. The orchestrator must not claim success if a required persistable spell write was skipped because of the cap — see Open Questions.

### Decision: Derived math is frontend-owned and stricter than the API helper

**Choice**: Pure functions in `lib/character-wizard/derived-stats.ts`. Modifiers use the official table and reject scores outside 1–18. HP = `class.hitPoints + CON score`. Max load = `class.baseLoad + STR score`. Armor sums supported numeric armor tags. Carried load sums `weight * quantity`.

**Alternatives considered**: Reuse backend `calculateModifier` semantics (`stat <= 3` → -3, including 0).

**Rationale**: Spec forbids silently assigning a modifier to unsupported scores. Backend `create` already uses `hitPoints + constitution` (score, not modifier). Live display must match that formula.

### Decision: UI copy in Spanish; code and this artifact in English

**Choice**: Authored wizard strings (labels, validation, commit errors) are neutral professional Spanish. Backend names/descriptions render as delivered. Identifiers, comments, and SDD artifacts stay English. Root layout `lang` becomes `es`.

**Alternatives considered**: English UI (artifact-language default for greenfield).

**Rationale**: Confirmed product decision (2026-09-25): wizard interface language is Spanish; backend data values stay as delivered.

## Frontend / Backend Boundary

| Concern | Owner | Notes |
|---|---|---|
| Class catalog `{id, name}` | Backend `GET /api/classes` | Detail loaded separately |
| Class detail including `damageDice` | Backend `GET /api/classes/:id` | Frontend extension: map `damageDice` |
| Race list + racial mechanic | Backend data, frontend display | Race `content` text IS the mechanic |
| Name, looks, stats array | Frontend draft → `POST /characters` | Appearance as `string[]` |
| Modifiers, HP, load, armor, encumbrance | Frontend | Mirror backend HP formula |
| Standard alignments | Backend class detail | One-shot `POST :id/alignments` |
| Custom alignment | Backend create-then-select | `POST :id/alignments/custom` then `POST :id/alignments` |
| Initial moves + elements | Backend auto-assign on create; frontend answers | `PUT :id/moves/:contentId` |
| Level-1+ spell catalog at draft time | Frontend mock (temporary) | No pre-character list API |
| Spell persistence | Backend replace semantics | Skip empty body; respect level-sum cap |
| Equipment catalog metadata | Backend `GET /api/equipment` | `weight`, `tags[]`, `category`, `usesPerUnit` |
| Starting gear choices | Backend class `equipment[]` | Replace via `POST :id/equipment` |
| Bond templates | Frontend static | Backend stores free text only |
| Character delete (rollback) | Backend cascade on character-owned rows | Custom alignment `classContent` is NOT cascaded |

## Data Flow

### Browse (no writes)

```
                    ┌─────────────────────────────────────┐
                    │  GET /api/classes                   │
Server page ───────►│  (promise passed into client)       │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                         WizardProvider (in-memory draft)
                                      │
         step 1 select class ─────────┼──► GET /api/classes/:id
         step 8 open gear    ─────────┼──► GET /api/equipment
         step 7 spells       ─────────┼──► mocks/spells.ts only
                                      │
                    derived-stats.ts ◄┘  (pure, no I/O)
```

Class change clears dependent draft fields: race, alignment (including custom), move answers, spells, equipment, bonds.

### Finalize sequence

```
User hits Finalizar
        │
        ▼
validateAllSteps(draft) ──fail──► stay on first invalid step
        │ ok
        ▼
POST /api/characters {name, classId, stats, appearance[]}
        │  id = createdId  (initial moves assigned here)
        ▼
[if custom] POST /api/characters/:id/alignments/custom {name, description}
        │  contentId from response
        ▼
POST /api/characters/:id/alignments {contentId}
        ▼
POST /api/characters/:id/races {contentId}
        ▼
[if equipmentIds.length] POST /api/characters/:id/equipment {equipmentIds}
        ▼
[if persistableSpellIds.length] POST /api/characters/:id/spells {spellIds}
        ▼
for each answered move: PUT /api/characters/:id/moves/:contentId {elements}
        ▼
for each bond: POST /api/characters/:id/bonds {text}
        │
        ▼
success UI (draft may clear)     on any failure after create:
                                        DELETE /api/characters/:id
                                        keep draft; show normalized error
```

Dependent writes never run without `createdId`. One-shot race/alignment run only in this sequence.

### Rollback

```
catch (error)
  if createdId is null → surface error, draft intact (nothing to delete)
  else
    try DELETE /api/characters/:id
      ok  → category=operation, message from original error,
            note that the new character was removed
      fail → category=operation, distinct "cleanup could not be confirmed"
            payload includes original error + delete error
  never delete any id other than createdId from this attempt
```

Prisma cascades character-owned rows (appearance, bonds, content, equipment, element values/options, spells). Custom alignment rows on `classContent` (`metadata: { isCustom, characterId }`) are **not** deleted. That leftover is scoped to the deleted character id and filtered out of other characters' available alignments. Documented limitation; no extra backend cleanup endpoint is in scope.

## Content-Element Rendering

Parse `move.metadata` as JSON when present. A move **requires completion** when the parsed object has a truthy `requiresCompletion` (canonical) or `needsCompletion` (alias until apply inspects seeded rows).

- Moves without the flag: show `title` + `content` only; no answers required.
- Moves with the flag: render `contentElements` in `sortOrder`.
- Answers keyed by `move.id` + `element.id` so Back/Forward does not lose values.

| Element type | Draft value | Finalize payload |
|---|---|---|
| TEXT / TEXTAREA | `string` | `{ elementId, value }` |
| NUMBER | `number` serialized as string | `{ elementId, value }` |
| BOOLEAN | `boolean` serialized `"true"`/`"false"` | `{ elementId, value }` |
| RADIO_GROUP / SELECT | one `optionId` | `{ elementId, optionIds: [id] }` |
| CHECKBOX_GROUP | `optionId[]` | `{ elementId, optionIds }` |

Cardinality:

- Missing `minSelect`/`maxSelect`: RADIO/SELECT behave as exactly one; CHECKBOX uses 0..n unless the flag requires completion (then min 1).
- Present bounds are authoritative. UI refuses a click that would exceed `maxSelect`. Count `< minSelect` invalidates the step.

Unknown `element.type` → move invalid, user-visible "tipo de elemento no soportado", cannot finalize.

## Derived Calculations

```
modifier(score):
  1–3 → -3; 4–5 → -2; 6–8 → -1; 9–12 → 0;
  13–15 → +1; 16–17 → +2; 18 → +3;
  else → invalid (no numeric fallback)

maxHp      = class.hitPoints + constitution
maxLoad    = class.baseLoad + strength
armor      = sum(parseArmorTag(tag) for tag in equipped.metadata.tags)
carried    = sum((weight ?? 0) * quantity)
encumbered = carried > maxLoad   // equal is not impeded
```

Armor tag parser (verify against seeded tags at apply):

- Case-insensitive match on `armadura\s+(\d+)` or `armor\s+(\d+)`
- Unmatched tags contribute 0

Starting-gear quantities default to 1 (`selectEquipment` always writes `quantity: 1`). The load function still accepts quantity so the spec scenario (weight 2 + two×3 = 8) is implementable.

Damage dice: schema stores `damageDice` as `Int` (4, 6, 8, 10). UI shows `d{n}`.

## API Contracts

### Backend extension (sibling repo)

Expose existing Prisma `classes.damageDice` on `ClassDetailDto`:

```ts
// dungeon-world-api/src/modules/classes/dto/class-detail.dto.ts
export class ClassDetailDto {
  id!: number;
  name!: string;
  description?: string;
  appearance?: string;
  hitPoints!: number;
  baseLoad!: number;
  damageDice!: number; // ADD
  alignments!: ClassContentResponseDto[];
  races!: ClassContentResponseDto[];
  equipment!: ClassContentResponseDto[];
  initialMoves!: ClassContentResponseDto[];
  advancedMoves!: ClassContentResponseDto[];
}
```

`ClassMapper.toDetail` copies `model.damageDice`. `findOne` already loads the full class row; no query change expected. Migration `20260924200000_add_class_damage_dice` already exists — at apply, verify every seeded class has a non-null value (the migration only backfilled ids 1 and 2).

### Frontend domain types (mirror, not generate)

```ts
type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

type StandardArray = [16, 15, 13, 12, 9, 8];

type WizardDraft = {
  classId: number | null;
  classDetail: ClassDetail | null;
  raceContentId: number | null;
  name: string;
  appearance: {
    gaze: string;
    hair: string;
    clothing: string;
    body: string;
    extra: string[];
  };
  stats: Record<Ability, number | null>;
  alignment:
    | { kind: "standard"; contentId: number }
    | { kind: "custom"; name: string; description: string }
    | null;
  moveAnswers: Record<number, Record<number, ElementAnswer>>;
  spellIds: number[];
  equipmentIds: number[];
  bonds: { templateId: string; text: string; complete: boolean }[];
};

type CreateCharacterRequest = {
  name: string;
  classId: number;
  appearance?: string[];
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

type MoveElementPayload = {
  elementId: number;
  value?: string;
  optionIds?: number[];
};
```

Appearance array order sent to the API: `[gaze, hair, clothing, body, ...extra]`, including empty strings.

### Client error shape

```ts
type WizardErrorCategory =
  | "validation"
  | "not_found"
  | "network"
  | "operation";

type WizardError = {
  category: WizardErrorCategory;
  message: string;          // user-facing Spanish
  status?: number;
  operation?: string;       // e.g. "selectRace"
  field?: string;
  details?: unknown;        // raw payload, not shown raw
};
```

Normalization rules:

- `fetch` throw / failed network → `network` ("No se pudo conectar con el servidor")
- HTTP 400 with Nest `{ statusCode, message, error }` → `validation`; `message` array joined; keep Spanish backend text
- HTTP 404 / Prisma P2025 body → `not_found`
- Other HTTP / malformed JSON → `operation` generic; never leak a parse exception
- Character-scoped client methods throw if `characterId` is missing (no request)

## Validation

Per-step gates (Continue disabled / blocked with field errors):

| Step | Valid when |
|---|---|
| 1 Class | `classId` set and detail loaded (`hitPoints`, `damageDice`, `baseLoad` present) |
| 2 Race | `raceContentId` in `classDetail.races` |
| 3 Identity | `name.trim()` non-empty; appearance may be blank |
| 4 Stats | permutation of `16,15,13,12,9,8` on the six abilities |
| 5 Derived | previous stats + class bases exist (display-only) |
| 6 Alignment | standard `contentId` or custom name+description both non-empty |
| 7 Config | every `requiresCompletion` move has valid element answers; unknown types fail |
| 8 Gear | selected ids ⊆ class equipment `equipmentId`s; show armor/load/encumbrance even if valid |
| 9 Bonds | every required template has no unfilled `_____` slot |

Finalize re-runs all gates before the first write.

## File Changes

| File | Action | Description |
|---|---|---|
| `app/characters/new/page.tsx` | Create | Server Component: start class-catalog fetch, render client wizard |
| `app/characters/new/loading.tsx` | Create | Route loading UI (Spanish) |
| `app/characters/new/wizard.tsx` | Create | Client shell: provider, step switch, nav, finalize |
| `app/characters/new/steps/*.tsx` | Create | One component per step |
| `app/page.tsx` | Modify | Replace scaffold with entry link to `/characters/new` |
| `app/layout.tsx` | Modify | `lang="es"`, Spanish metadata |
| `lib/api/client.ts` | Create | `fetch` wrapper + error normalization |
| `lib/api/types.ts` | Create | DTO mirrors |
| `lib/api/classes.ts` | Create | `listClasses`, `getClass` |
| `lib/api/equipment.ts` | Create | `listEquipment` |
| `lib/api/characters.ts` | Create | create/select/update/delete helpers; guard missing id |
| `lib/character-wizard/draft.ts` | Create | Draft type, initial state, reducer, class-change invalidation |
| `lib/character-wizard/wizard-context.tsx` | Create | Provider + hooks |
| `lib/character-wizard/validation.ts` | Create | Per-step validators |
| `lib/character-wizard/derived-stats.ts` | Create | Modifier, HP, load, armor, encumbrance |
| `lib/character-wizard/content-elements.ts` | Create | Metadata parse, cardinality, serialize answers |
| `lib/character-wizard/content-element-renderer.tsx` | Create | Generic controls |
| `lib/character-wizard/commit.ts` | Create | Finalize orchestrator + rollback |
| `lib/character-wizard/bonds.ts` | Create | Per-class templates with `_____` slots |
| `lib/character-wizard/mocks/spells.ts` | Create | TEMPORARY level-0 and draft level-1+ lists |
| `next.config.ts` | Modify | `rewrites` to `API_ORIGIN` |
| `.env.example` | Create | `API_ORIGIN=http://localhost:3001` |
| `dungeon-world-api/.../class-detail.dto.ts` | Modify | Add `damageDice` |
| `dungeon-world-api/.../class.mapper.ts` | Modify | Map `damageDice` |

No deletions. No new npm dependencies planned.

## Testing Strategy

Automated tests are **out of scope** (confirmed decision). Recorded as deferred debt. Ordinary functional checks only.

| Layer | What to Test | Approach |
|---|---|---|
| Unit (deferred) | Modifier table boundaries; HP/load; armor tag parse; standard-array uniqueness; min/max select; error normalization | Pure functions in `derived-stats.ts` / `validation.ts` / `client.ts` |
| Integration (deferred) | Commit sequence order; skip empty equipment/spells; DELETE only `createdId`; rollback-failed path | Mock `fetch` around `commit.ts` |
| E2E (deferred) | All 8 official classes through 9 steps | Manual |
| Manual now | Class detail shows dX; back/forward keeps draft; no network writes until finalize; custom alignment create-then-select; encumbrance at load==max vs max+1; mid-sequence failure rolls back; Mage/Cleric/Fighter/Ranger configuration | Phase 6 checklist |

Threat-matrix RED tests: none (matrix not applicable).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Next.js App Router pages and HTTP rewrites to the sibling API are not that boundary.

## Migration / Rollout

No production data migration.

- Frontend: feature branch; revert PRs. No schema.
- Backend: additive `damageDice` on the DTO/mapper. Revert that commit if needed. Do not add a new Prisma migration unless apply verifies the column is missing.
- Local API port: document `PORT=3001` for wizard development; do not commit secrets from `dungeon-world-api/.env`.
- Review budget: 400 lines. Phased delivery from the proposal (0 backend → 6 finalize) is expected to become chained PRs in `sdd-tasks`.

## Open Questions

- [ ] Exact seeded `classContent.metadata` key for "needs completion" — design accepts `requiresCompletion` and `needsCompletion`; lock the key after inspecting DB rows at apply.
- [ ] Seeded armor tag spelling (`armadura n` vs `armor n`) — parser accepts both; confirm rows at apply.
- [ ] Bond template wording per class — copy official Spanish playbook bonds into `bonds.ts` at apply; backend has no templates.
- [ ] Mock spell ids must match the seeded `spells` table. Apply inspects the live DB (or seed) before filling `mocks/spells.ts`.
- [ ] Mage "3 first-level spells" vs backend `sum(spellLevel) <= 2`. Move answers capture the full choice; `POST /spells` only sends a cap-compliant subset. If product later requires all three persisted, that is a backend validation change (out of this change).
- [ ] Custom alignment rows survive character DELETE. Acceptable leftover unless a later API change adds cleanup.
- [ ] `GET /api/classes` returns `{id, name}` only (DTO also declares unused `baseLoad`). Step 1 loads bases from detail, not the catalog — no extra backend catalog change.

These do not block design; they are apply-time verifications or documented limitations.
