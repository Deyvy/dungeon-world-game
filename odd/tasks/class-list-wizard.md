# Class list in character wizard

## Objective
Render the classes returned by the backend in the first character-creation wizard step and let the user select one.

## Problem
The page loads `/api/classes`, but `WizardContent` discards the resolved list and `ClassStep` only renders an already-populated `draft.classDetail`.

## Why
Users currently see an empty class step despite a successful backend response.

## Scope
- Pass the resolved class summaries from `WizardContent` to `ClassStep`.
- Render accessible selectable class options.
- Persist the selected class summary in the wizard draft without changing unrelated wizard steps.

## Constraints
- Preserve existing uncommitted files and changes.
- Follow the current React/Next.js App Router conventions.
- Keep generated technical artifacts in English.

## Tasks
- [x] CLS-001 Implement class option rendering and selection state in the first wizard step.

## Authorized scope
`app/characters/new/wizard.tsx`, `app/characters/new/steps/class-step.tsx`, and the minimum wizard draft/context files required to persist selection.

## Acceptance criteria
- The two backend class summaries are visible as selectable options.
- Selecting an option updates the wizard draft and allows the existing validation to recognize the class selection.
- The selected class remains visible when the step rerenders.
- Existing lint/build checks pass.

## Applicable checks
- `pnpm lint`
- `pnpm build`

## Progress
- Route: delegated direct writer (2 non-trivial source files; preparation and implementation delegated together).
- Status: implemented in commit `30272d5`. `WizardContent` passes the resolved summaries to `ClassStep`; selecting an option stores the class ID, fetches the detail required by existing validation, and preserves the selected radio option across rerenders.
- The reducer and validation contract remain unchanged.

## Verification evidence
- `pnpm lint` — passed (`eslint` exited with code 0).
- `pnpm build` — passed (Next.js production build completed successfully, including TypeScript checks and route generation).

## Next step
No further implementation is required. The implementation work is committed; unrelated pre-existing changes remain untouched.
