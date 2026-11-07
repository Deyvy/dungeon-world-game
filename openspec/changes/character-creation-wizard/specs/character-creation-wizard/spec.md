# Character Creation Wizard Specification

## Purpose

Define the nine-step flow for creating a complete Dungeon World character, including draft navigation, validation, class-specific choices, and the final persistence transaction sequence.

## Requirements

### Requirement: Ordered nine-step wizard

The system MUST present character creation in this order: class, race, identity and looks, ability scores, derived health and load, alignment, class configuration and initial moves, starting equipment, and bonds. The system MUST allow the user to move backward and forward between completed or currently available steps without losing draft selections.

#### Scenario: User progresses through the wizard in order

- GIVEN the user has opened the character creation route
- WHEN the user completes each step's required selections and chooses to continue
- THEN the next step SHALL be displayed in the documented order
- AND the current draft SHALL retain all values entered in previous steps

#### Scenario: User navigates backward and forward

- GIVEN the user has completed the identity step and is viewing the stats step
- WHEN the user navigates back to identity, changes the appearance, and returns to stats
- THEN the updated appearance SHALL remain in the draft
- AND no previously selected class, race, or stat assignment SHALL be discarded unless invalidated by the changed selection

#### Scenario: Incomplete required step blocks progression

- GIVEN a step has a required value missing or an invalid selection
- WHEN the user attempts to continue
- THEN the system MUST keep the user on that step
- AND the system MUST identify the missing or invalid value

### Requirement: Client-only draft before finalization

The system MUST maintain all wizard selections as a client-side draft and MUST NOT write a character or any character-scoped selection to the API before finalization succeeds. The draft MAY be cleared when the user abandons the wizard.

#### Scenario: Browsing does not create API records

- GIVEN the user has selected a class, race, alignment, equipment, and class options
- WHEN the user moves between steps without finalizing
- THEN the system MUST issue no character-creation or character-scoped selection write
- AND the draft SHALL continue to reflect the selections

#### Scenario: Draft is isolated between wizard sessions

- GIVEN a user abandons a draft and starts a new character creation session
- WHEN the new wizard is displayed
- THEN the new session MUST NOT submit or display selections from the abandoned draft

### Requirement: Class and race selection

The system MUST load available classes from the backend and MUST display each selected class's base hit points, base damage dice, base load, races, alignments, initial moves, and equipment options when those values are supplied by the class detail contract. The user MUST select one available race for the chosen class, and the race description MUST be displayed as the racial mechanic without requiring a separate racial-move entity.

#### Scenario: Class detail is displayed

- GIVEN the class list has loaded successfully
- WHEN the user selects an official or backend-provided class
- THEN the system SHALL load and display that class's base hit points, damage dice, and base load
- AND the system SHALL make only data associated with that class available for subsequent choices

#### Scenario: Race is restricted to the selected class

- GIVEN the user has selected a class with a defined race list
- WHEN the user opens the race step
- THEN the system MUST show only races available to that class
- AND selecting a race SHALL store its description as the draft racial mechanic

#### Scenario: Class change invalidates dependent choices

- GIVEN the draft contains a race, alignment, class configuration, equipment, or move answer for class A
- WHEN the user changes the class to class B
- THEN the system MUST remove dependent choices that are not valid for class B
- AND the system MUST require a valid race and any other newly required class choices before finalization

### Requirement: Identity, appearance, and alignment

The system MUST collect a required character name and MAY collect blank or user-defined appearance values for gaze, hair or head, clothing or attire, and body. The system MUST provide the class's standard alignments and MUST allow a custom alignment with a name and description when the backend contract supports custom alignment creation.

#### Scenario: Identity and optional appearance are accepted

- GIVEN the user is on the identity step
- WHEN the user enters a non-empty name and leaves one or more appearance categories blank
- THEN the step SHALL be valid
- AND the draft SHALL retain the supplied name and all appearance values, including blanks

#### Scenario: Custom alignment is captured

- GIVEN the selected class allows the user to create a custom alignment
- WHEN the user provides a non-empty custom alignment name and description and selects it
- THEN the draft SHALL retain both custom values
- AND finalization MUST create the custom alignment before selecting it for the character

#### Scenario: Invalid custom alignment is rejected

- GIVEN the user is creating a custom alignment
- WHEN the name or description required by the alignment form is empty
- THEN the system MUST prevent progression or finalization
- AND the system MUST identify the invalid field

### Requirement: Fixed ability-score assignment

The system MUST allow the user to assign exactly the multiset `16, 15, 13, 12, 9, 8` once each to Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. The system MUST reject duplicate or out-of-array values and MUST require all six abilities to be assigned before the wizard can proceed.

#### Scenario: Valid standard array assignment

- GIVEN the user is on the ability-score step
- WHEN the user assigns each of `16, 15, 13, 12, 9, 8` to a different ability
- THEN the step SHALL be valid
- AND the draft SHALL contain all six ability scores

#### Scenario: Duplicate score cannot be assigned

- GIVEN the user has already assigned score 16 to one ability
- WHEN the user attempts to assign score 16 to a second ability without removing it from the first
- THEN the system MUST reject the assignment
- AND the available score state MUST remain a permutation of the standard array

### Requirement: Class-specific configuration and initial moves

The system MUST display the selected class's initial moves and MUST require completion of every move whose metadata marks it as requiring choices. The system MUST support the content element types TEXT, TEXTAREA, NUMBER, BOOLEAN, CHECKBOX_GROUP, RADIO_GROUP, and SELECT. Group controls MUST enforce their declared `minSelect` and `maxSelect` bounds. The wizard MUST cover Mage spellbook choices, Cleric deity/domain/precept and prepared spells, Fighter signature weapon choices, and Ranger animal companion choices.

#### Scenario: Initial moves are listed with required choices

- GIVEN the selected class detail contains initial moves
- WHEN the user opens class configuration
- THEN all initial moves SHALL be displayed
- AND moves marked as requiring completion SHALL expose their content elements
- AND the user MUST NOT proceed while a required element or choice is incomplete

#### Scenario: Checkbox and radio limits are enforced

- GIVEN a move contains a checkbox or radio group with `minSelect` and `maxSelect`
- WHEN the user selects fewer than `minSelect` or more than `maxSelect` options
- THEN the configuration SHALL be invalid
- AND when the selected count is within the bounds, the configuration SHALL be valid for that group

#### Scenario: Class-specific choices are captured

- GIVEN the user selects Mage, Cleric, Fighter, or Ranger
- WHEN the user completes the corresponding class configuration
- THEN the draft SHALL contain the required spellbook, deity/domain/precept and prepared spells, signature weapon, or animal companion values respectively
- AND those values SHALL be included in the final move answers or spell selections according to their owning content

#### Scenario: Temporary level-zero spell data is isolated

- GIVEN the selected class requires level-zero cantrips or prayers and the backend does not expose them
- WHEN the user opens the relevant spell selection
- THEN the wizard SHALL use the designated temporary data source
- AND the temporary source MUST be isolated from the general API client and MUST NOT silently replace backend level-one-or-higher data

### Requirement: Starting equipment and bonds

The system MUST allow the user to select valid equipment packages or items supplied by the selected class and MUST collect bond text for each required bond template. Bond templates SHALL provide blank slots that can be filled with party member names, while the persisted bond value SHALL be free text.

#### Scenario: Equipment selection is retained

- GIVEN the selected class supplies starting equipment options
- WHEN the user selects a valid equipment package or item set
- THEN the draft SHALL retain the selected equipment identifiers
- AND the equipment step SHALL display the resulting armor and load totals

#### Scenario: Bond template is completed

- GIVEN the selected class supplies a bond template containing a blank slot
- WHEN the user fills the slot with a party member name
- THEN the wizard SHALL produce the completed bond text
- AND the completed text SHALL be eligible for final persistence

#### Scenario: Required bond remains incomplete

- GIVEN a required bond template still contains an unfilled blank slot
- WHEN the user attempts to finalize
- THEN the system MUST reject finalization
- AND the incomplete bond MUST be identified to the user

### Requirement: Finalization commit sequence and rollback

On finalization, the system MUST create the character with name, class, all six stats, and appearance, then apply the selected alignment, race, equipment, spells, answered move elements, and bonds. A custom alignment MUST be created before it is selected. The system MUST perform no dependent write before the character identifier exists. If any dependent write fails after character creation, the system MUST attempt to delete only the character created by that attempt, surface a clear error, and preserve the draft for recovery unless the user explicitly discards it.

#### Scenario: Complete draft is persisted

- GIVEN all nine steps are valid and the draft contains the required class, stats, race, alignment, moves, equipment, spells, and bonds
- WHEN the user finalizes the character
- THEN the system SHALL create the character and apply all selected data in the required dependency order
- AND the user SHALL receive a success result only after the final bond write succeeds

#### Scenario: Custom alignment is created before selection

- GIVEN the draft uses a new custom alignment
- WHEN finalization begins
- THEN the system MUST create the custom alignment first
- AND the system MUST submit the resulting content identifier in the character alignment selection request

#### Scenario: Mid-sequence failure rolls back the new character

- GIVEN character creation has succeeded but a later race, alignment, equipment, spell, move, or bond write fails
- WHEN the commit orchestrator receives the failure
- THEN it MUST attempt to delete the character created in that same attempt
- AND it MUST surface an actionable error without claiming success
- AND it MUST NOT delete any pre-existing character

#### Scenario: Rollback failure is reported distinctly

- GIVEN a dependent write fails and the rollback delete also fails
- WHEN finalization reports the outcome
- THEN the system MUST tell the user that persistence failed and cleanup could not be confirmed
- AND the system MUST retain the original failure context for diagnosis

### Requirement: API errors are normalized for the wizard

The system MUST normalize backend failures, including Spanish error messages, into a stable client error shape that can be displayed at the relevant step or finalization state. Network failures and validation failures MUST be distinguishable.

#### Scenario: Backend validation error is shown at the relevant step

- GIVEN an API request returns a validation failure
- WHEN the wizard receives the response
- THEN it SHALL display a user-readable normalized error
- AND it SHALL identify the affected step or field when that information is available

#### Scenario: Network failure does not appear as validation success

- GIVEN an API request cannot reach the backend
- WHEN the failure is normalized
- THEN the wizard MUST show a connectivity error state
- AND the current draft MUST remain available for retry
