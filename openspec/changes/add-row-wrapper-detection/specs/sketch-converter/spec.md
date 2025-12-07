## ADDED Requirements

### Requirement: Row Grouping Detection
The system SHALL automatically detect elements that belong to the same row based on Y coordinates.

#### Scenario: Elements with similar Y coordinates
- **WHEN** multiple child elements have Y coordinates within 4px tolerance
- **THEN** the system SHALL group these elements as belonging to the same row
- **AND** the system SHALL create a Row wrapper container for them

#### Scenario: Single element in a row
- **WHEN** only one element exists at a particular Y coordinate level
- **THEN** the system SHALL NOT create a Row wrapper
- **AND** the element SHALL remain at its original position in the hierarchy

### Requirement: Row Wrapper Container Creation
The system SHALL create Row wrapper containers for horizontally aligned elements.

#### Scenario: Create Row wrapper for multiple elements
- **WHEN** multiple elements are detected in the same row
- **THEN** the system SHALL create a wrapper element with `name: "Row"`
- **AND** the wrapper SHALL have `display: flex` and `flexDirection: row`
- **AND** the wrapper's frame SHALL be the bounding box of all contained elements
- **AND** the original elements SHALL become children of the wrapper

#### Scenario: Row wrapper with space-between layout
- **WHEN** row elements are distributed at left and right edges
- **THEN** the system SHALL add `justifyContent: space-between` to the Row wrapper
- **AND** child elements SHALL have their marginLeft removed

### Requirement: Left-Right Group Detection
The system SHALL detect left and right element groups within a row for space-between layout.

#### Scenario: Elements split between left and right
- **WHEN** some elements are positioned in the left half of the parent
- **AND** other elements are positioned in the right half
- **THEN** the system SHALL identify this as a space-between layout candidate

#### Scenario: Multiple elements on the left side
- **WHEN** multiple elements are grouped on the left side
- **AND** one or more elements are on the right side
- **THEN** the system SHALL create a LeftGroup wrapper for left elements
- **AND** the LeftGroup SHALL use `display: flex` and `flexDirection: row`
- **AND** the Row wrapper SHALL contain LeftGroup and right elements as direct children

#### Scenario: Two elements at opposite edges
- **WHEN** exactly two elements exist in a row
- **AND** one is near the left edge and one is near the right edge
- **THEN** the system SHALL apply space-between without creating sub-groups

## MODIFIED Requirements

### Requirement: Hierarchy Reorganization
The system SHALL reorganize flat element structure into nested hierarchy with Row wrappers.

#### Scenario: Apply row grouping during reorganization
- **WHEN** reorganizing child elements
- **THEN** the system SHALL first group elements by row
- **AND** the system SHALL create Row wrappers for multi-element rows
- **AND** the system SHALL maintain vertical ordering of rows

#### Scenario: Preserve containment relationships
- **WHEN** elements have containment relationships (element A inside element B)
- **THEN** the system SHALL process containment before row grouping
- **AND** row grouping SHALL only apply to sibling elements at the same level
