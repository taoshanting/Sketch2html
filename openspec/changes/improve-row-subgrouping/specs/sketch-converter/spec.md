## ADDED Requirements

### Requirement: Detect Close Element Groups
The system SHALL detect closely adjacent elements within the same row.

#### Scenario: Elements with small gaps
- **WHEN** multiple elements in the same row have gaps <= 30px between them
- **THEN** the system SHALL group these elements as a close group
- **AND** the system SHALL create a Row wrapper for the group

#### Scenario: Elements with large gaps
- **WHEN** elements in the same row have gaps > 30px between them
- **THEN** the system SHALL treat them as separate groups
- **AND** each group SHALL be processed independently

## MODIFIED Requirements

### Requirement: Row Grouping with Subgroups
The system SHALL apply row grouping with consideration for X-distance subgroups.

#### Scenario: Apply subgrouping within rows
- **WHEN** processing elements in the same row (similar Y coordinates)
- **THEN** the system SHALL first detect close groups by X-distance
- **AND** the system SHALL create Row wrappers only for close groups with multiple elements

#### Scenario: Calculate correct margins for subgroups
- **WHEN** creating a Row wrapper for a close group
- **THEN** the Row wrapper's marginLeft SHALL be calculated from the previous element's right edge
- **AND** child elements within the Row SHALL have marginLeft calculated from their previous sibling's right edge
