# Class Data API Specification

## Purpose

Define the backend data contract required by the character creation wizard for class, equipment, spell, alignment, and character-selection operations.

## Requirements

### Requirement: Class catalog and detail contract

The API MUST provide a class catalog and class detail response sufficient for the wizard to obtain class identity, base hit points, base load, damage dice, races, alignments, equipment, initial moves, and content elements. The class detail contract MUST expose `damageDice` as part of the class data.

#### Scenario: Class catalog is available

- GIVEN the backend is running with seeded class data
- WHEN the client requests the class catalog
- THEN the response SHALL contain the available classes and stable identifiers

#### Scenario: Class detail contains wizard data

- GIVEN the client requests a valid class identifier
- WHEN the backend returns class detail
- THEN the response SHALL include hit points, base load, damage dice, races, alignments, equipment, and initial moves
- AND each configurable move SHALL expose its content elements and relevant metadata

#### Scenario: Missing class is reported

- GIVEN the client requests an unknown class identifier
- WHEN the backend handles the request
- THEN it MUST return a structured not-found error
- AND the client MUST not treat the response as an empty valid class

### Requirement: Equipment and spell read endpoints

The API MUST provide equipment metadata including stable identifier, weight, tags, category, and uses per unit where available. The API MUST provide available level-one-and-higher spells for a selected class or character according to the backend contract. Temporary level-zero spell data MUST remain a frontend fallback until the backend supports those lists.

#### Scenario: Equipment metadata is consumed

- GIVEN the equipment catalog contains an item
- WHEN the client requests equipment data
- THEN the response SHALL expose its weight, tags, category, and uses-per-unit metadata when defined

#### Scenario: Available spells are loaded

- GIVEN the selected class has available level-one-or-higher spells
- WHEN the client requests the available spell list
- THEN the response SHALL contain stable spell identifiers and the data needed for spell selection

#### Scenario: Missing level-zero backend data uses isolated fallback

- GIVEN level-zero cantrips or prayers are not available from the backend
- WHEN the wizard requests the relevant options
- THEN the frontend MAY provide the designated temporary fallback data
- AND the API client MUST continue to use the backend for supported level-one-or-higher spell data

### Requirement: Alignment and character-scoped selection operations

The API MUST support class alignment reads and the character-scoped operations needed to select alignment, select race, replace equipment, replace spells, update move elements, and create bonds. Custom alignment creation MUST accept a name and description and MUST return an identifier usable by a separate alignment selection request.

#### Scenario: Custom alignment follows create-then-select contract

- GIVEN a valid character identifier and custom alignment values
- WHEN the client creates the custom alignment
- THEN the API SHALL return the new content identifier
- AND a subsequent alignment selection request using that identifier SHALL be accepted when valid

#### Scenario: Character-scoped operation requires a character

- GIVEN no character identifier has been created for the current draft
- WHEN the wizard attempts to call a character-scoped selection endpoint
- THEN the client MUST prevent the request
- AND no character-scoped API write SHALL occur before character creation

#### Scenario: Replace operations send complete selections

- GIVEN the wizard has selected equipment or spells
- WHEN finalization submits the corresponding replace operation
- THEN the request SHALL contain the complete selected identifier collection
- AND the client MUST not assume that omitted existing entries will be preserved

### Requirement: API client error normalization

The client API layer MUST expose typed domain responses and MUST normalize backend error payloads, including Spanish validation messages, into a stable error representation containing a category, user-facing message, and optional field or operation context.

#### Scenario: Validation payload is normalized

- GIVEN an endpoint returns a backend validation error payload
- WHEN the typed client handles the response
- THEN it SHALL return a validation-category client error
- AND it SHALL preserve enough context to identify the failed operation

#### Scenario: Unexpected response is normalized safely

- GIVEN an endpoint returns an unknown or malformed error payload
- WHEN the typed client handles the response
- THEN it SHALL return a generic operation error
- AND it MUST NOT expose an unhandled parsing exception to the wizard
