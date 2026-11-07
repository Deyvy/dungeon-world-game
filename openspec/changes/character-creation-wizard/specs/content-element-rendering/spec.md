# Content Element Rendering Specification

## Purpose

Define the data-driven rendering and validation behavior for initial-move content elements used by class configuration.

## Requirements

### Requirement: Metadata-driven move completion

The system MUST render a move's configurable content only when the move metadata identifies that completion is required, while still displaying non-configurable move text. The renderer MUST preserve answers by stable move and content-element identity during wizard navigation.

#### Scenario: Required move renders its elements

- GIVEN an initial move has metadata marking it as requiring completion
- WHEN the class configuration step is displayed
- THEN the move's content elements SHALL be rendered in their supplied order
- AND each answer SHALL be associated with that move and element

#### Scenario: Ordinary move remains informational

- GIVEN an initial move has no completion-required metadata
- WHEN the class configuration step is displayed
- THEN its content text SHALL be displayed
- AND the system SHALL NOT require an answer for an absent configurable element

### Requirement: Supported content element types

The system MUST support TEXT, TEXTAREA, NUMBER, BOOLEAN, CHECKBOX_GROUP, RADIO_GROUP, and SELECT content element types. Unknown element types MUST be treated as unsupported configuration data and MUST prevent finalization of the affected move rather than being silently ignored.

#### Scenario: Scalar element values are captured

- GIVEN a move contains TEXT, TEXTAREA, NUMBER, or BOOLEAN elements
- WHEN the user enters or selects a valid value for each element
- THEN the renderer SHALL retain each typed answer
- AND the move SHALL be valid when all required scalar elements are complete

#### Scenario: Choice element values are captured

- GIVEN a move contains CHECKBOX_GROUP, RADIO_GROUP, or SELECT elements
- WHEN the user makes a valid choice
- THEN the renderer SHALL retain the selected option identifiers or values
- AND the answer SHALL be serializable for the move update request

#### Scenario: Unknown element is not silently accepted

- GIVEN a move contains an element type not supported by the renderer
- WHEN the user attempts to finalize
- THEN the affected move MUST be invalid
- AND the system MUST identify that the element type is unsupported

### Requirement: Choice cardinality validation

The system MUST enforce `minSelect` and `maxSelect` for CHECKBOX_GROUP and RADIO_GROUP elements. A missing bound MAY use the control type's normal cardinality, but a supplied bound MUST be authoritative. The renderer MUST prevent selections above `maxSelect` and MUST report a validation error below `minSelect`.

#### Scenario: Minimum selection is required

- GIVEN a choice group declares `minSelect: 2`
- WHEN the user selects zero or one option
- THEN the group MUST be invalid
- AND the renderer MUST state that at least two options are required

#### Scenario: Maximum selection is enforced

- GIVEN a checkbox group declares `maxSelect: 2`
- WHEN the user attempts to select a third option
- THEN the third option MUST NOT be accepted
- AND the group SHALL retain no more than two selected options

#### Scenario: Valid range is accepted

- GIVEN a choice group declares `minSelect: 1` and `maxSelect: 2`
- WHEN the user selects one or two options
- THEN the group SHALL be valid
- AND the serialized answer SHALL contain exactly the selected options
