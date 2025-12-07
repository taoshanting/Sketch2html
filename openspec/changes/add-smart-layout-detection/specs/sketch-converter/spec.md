## ADDED Requirements

### Requirement: Smart Layout Pattern Detection
The system SHALL automatically detect and apply optimal Flexbox layout patterns based on child element positions.

#### Scenario: Detect horizontal row layout
- **WHEN** multiple child elements have Y coordinates within 10px tolerance
- **THEN** the system SHALL identify this as a horizontal (row) layout
- **AND** the system SHALL set `flexDirection: 'row'` on the parent

#### Scenario: Detect vertical column layout
- **WHEN** multiple child elements have X coordinates within 10px tolerance
- **THEN** the system SHALL identify this as a vertical (column) layout
- **AND** the system SHALL set `flexDirection: 'column'` on the parent

#### Scenario: Detect consistent gap spacing
- **WHEN** adjacent child elements have consistent spacing (difference < 3px)
- **THEN** the system SHALL use `gap` property instead of individual margins
- **AND** the system SHALL remove redundant margin properties from children

### Requirement: Single Child Centering Optimization
The system SHALL detect and optimize single centered child elements.

#### Scenario: Single child horizontally centered
- **WHEN** a parent has exactly one child
- **AND** the child's horizontal center is within 5px of parent's center
- **THEN** the system SHALL add `alignItems: 'center'` to parent
- **AND** the system SHALL remove `marginLeft` and `width` from child (for Text)

#### Scenario: Single child vertically centered
- **WHEN** a parent has exactly one child
- **AND** the child's vertical center is within 5px of parent's center
- **THEN** the system SHALL add `justifyContent: 'center'` to parent
- **AND** the system SHALL remove `marginTop` from child

#### Scenario: Single child fully centered
- **WHEN** a parent has exactly one child centered on both axes
- **THEN** the system SHALL add both `alignItems: 'center'` and `justifyContent: 'center'`
- **AND** the system SHALL remove `marginLeft`, `marginTop`, and `width` from child

### Requirement: Space-Between Layout Detection
The system SHALL detect and apply space-between layout for edge-aligned elements.

#### Scenario: Two elements at opposite edges
- **WHEN** a parent has exactly two child elements in a row
- **AND** the first child is near the left edge (x < padding + 5px)
- **AND** the second child is near the right edge (x + width > parentWidth - padding - 5px)
- **THEN** the system SHALL set `flexDirection: 'row'` and `justifyContent: 'space-between'`
- **AND** the system SHALL remove `marginLeft` and `width` from both children

#### Scenario: Multiple elements with space-between pattern
- **WHEN** elements are evenly distributed with equal gaps
- **AND** first element is at left edge, last element is at right edge
- **THEN** the system SHALL apply `justifyContent: 'space-between'`

### Requirement: Vertical Center Alignment
The system SHALL detect vertically centered alignment in row layouts.

#### Scenario: Row elements vertically centered
- **WHEN** multiple elements are in a row layout
- **AND** elements are vertically centered within the parent height
- **THEN** the system SHALL add `alignItems: 'center'` to parent
- **AND** the system SHALL remove `marginTop` from children

## MODIFIED Requirements

### Requirement: Child Element Style Generation
The system SHALL generate optimized styles for child elements based on detected layout patterns.

#### Scenario: Child in centered layout
- **WHEN** parent uses centering (alignItems/justifyContent: center)
- **THEN** child style SHALL NOT include positioning margins
- **AND** Text elements SHALL NOT include explicit width

#### Scenario: Child in space-between layout
- **WHEN** parent uses `justifyContent: 'space-between'`
- **THEN** child style SHALL NOT include `marginLeft`
- **AND** child style SHALL NOT include explicit `width` for Text elements

#### Scenario: Child in row layout with gap
- **WHEN** parent uses `flexDirection: 'row'` with `gap`
- **THEN** child style SHALL NOT include `marginLeft` (except first child padding)
- **AND** child style SHALL NOT include `marginTop`

#### Scenario: Fallback to margin positioning
- **WHEN** no special layout pattern is detected
- **THEN** the system SHALL use the default margin-based positioning
- **AND** all original style properties SHALL be preserved
