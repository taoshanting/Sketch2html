## MODIFIED Requirements

### Requirement: Row Child Margin Calculation
The system SHALL calculate child element margins correctly within row containers.

#### Scenario: Calculate marginLeft for row children
- **WHEN** processing children within a row container (Row or LeftGroup)
- **THEN** the system SHALL calculate marginLeft as: `child.x - previousSiblingRightEdge`
- **AND** for the first child, previousSiblingRightEdge SHALL be the parent's left edge (parentFrame.x)
- **AND** for subsequent children, previousSiblingRightEdge SHALL be `previousChild.x + previousChild.width`

#### Scenario: Row container with gap property
- **WHEN** a row container has a gap property set
- **THEN** child elements SHALL NOT have marginLeft applied
- **AND** spacing between children SHALL be controlled by the gap property

#### Scenario: First child in row container
- **WHEN** processing the first child in a row container
- **THEN** marginLeft SHALL be calculated relative to the parent's left edge
- **AND** if marginLeft is 0, it SHALL be omitted from the style
