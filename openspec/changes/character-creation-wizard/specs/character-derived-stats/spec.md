# Character Derived Stats Specification

## Purpose

Define the Dungeon World modifier table and the live calculations shown while a character is being created.

## Requirements

### Requirement: Dungeon World ability modifiers

The system MUST calculate modifiers using the official Dungeon World table: scores 1–3 map to -3, 4–5 to -2, 6–8 to -1, 9–12 to 0, 13–15 to +1, 16–17 to +2, and 18 to +3. Values outside the supported range MUST NOT be silently assigned an incorrect modifier.

#### Scenario: Boundary scores use the official modifier

- GIVEN an ability score of 3, 4, 5, 6, 8, 9, 12, 13, 15, 16, 17, or 18
- WHEN the modifier is calculated
- THEN the result SHALL match the corresponding official table range

#### Scenario: Unsupported score is rejected

- GIVEN a score below 1 or above 18
- WHEN the system attempts to calculate its modifier
- THEN the calculation MUST report an invalid score
- AND it MUST NOT return a misleading valid modifier

### Requirement: Derived hit points and maximum load

The system MUST calculate maximum hit points as class base hit points plus the Constitution score, and maximum load as class base load plus the Strength score. The calculations MUST use raw ability scores rather than modifiers.

#### Scenario: Derived values use raw scores

- GIVEN a class has base hit points 4 and base load 6
- AND the draft has Constitution 13 and Strength 16
- WHEN derived values are calculated
- THEN maximum hit points SHALL be 17
- AND maximum load SHALL be 22

#### Scenario: Derived values update after reassignment

- GIVEN the draft has valid assigned ability scores and displayed derived values
- WHEN the user swaps Constitution or Strength with another standard-array value
- THEN maximum hit points or maximum load SHALL update immediately using the new raw score

### Requirement: Armor and carried-load totals

The system MUST calculate total armor as the sum of numeric armor values represented by equipped item tags in the supported armor-tag format. It MUST calculate carried load from the selected equipment weights and quantities where applicable.

#### Scenario: Armor tags are summed

- GIVEN equipped items have armor tags representing 2 and 1 armor
- WHEN the equipment totals are calculated
- THEN total armor SHALL be 3

#### Scenario: Non-armor tags do not affect armor

- GIVEN equipped items include armor tags, descriptive tags, and tags without a numeric armor value
- WHEN the armor total is calculated
- THEN only supported numeric armor tags SHALL contribute to total armor
- AND unrelated tags SHALL contribute zero armor

#### Scenario: Equipment weights are summed

- GIVEN selected equipment has weights 2 and 3 and a quantity of two for the second item
- WHEN carried load is calculated
- THEN total carried load SHALL be 8

### Requirement: Encumbrance state

The system MUST compare carried load with maximum load and MUST display a non-encumbered state when carried load is at or below maximum load and an impeded state when carried load exceeds maximum load. The display MUST update whenever equipment, quantities, Strength, or class changes.

#### Scenario: Load within limit is not impeded

- GIVEN maximum load is 10 and carried load is 10
- WHEN encumbrance is evaluated
- THEN the character SHALL be displayed as not impeded

#### Scenario: Load above limit is impeded

- GIVEN maximum load is 10 and carried load is 11
- WHEN encumbrance is evaluated
- THEN the character SHALL be displayed as impeded
- AND the excess load SHALL be visible to the user
