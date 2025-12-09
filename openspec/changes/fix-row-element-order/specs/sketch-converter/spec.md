## MODIFIED Requirements

### Requirement: Row Layout Child Ordering
The system SHALL order children by X coordinate for row layouts.

#### Scenario: Row layout children ordering
- **GIVEN** a container with `flexDirection: row`
- **WHEN** transforming children
- **THEN** children SHALL be sorted by X coordinate (ascending)
- **AND** the leftmost element SHALL appear first in the output

### Requirement: Row Layout Margin Calculation
The system SHALL calculate margins for row layout children relative to container edges.

#### Scenario: First element margin-left
- **GIVEN** a row layout container
- **AND** the first child element has X position > container X
- **WHEN** transforming the first child
- **THEN** margin-left SHALL be calculated as (element.x - container.x)

#### Scenario: Last element margin-right
- **GIVEN** a row layout container with `justifyContent: space-between`
- **AND** the last child element does not reach the container's right edge
- **WHEN** transforming the last child
- **THEN** margin-right SHALL be calculated as (container.x + container.width - element.x - element.width)
