## MODIFIED Requirements

### Requirement: Close Group Detection Threshold
The system SHALL use an appropriate threshold for detecting close element groups.

#### Scenario: Elements with moderate gaps in same row
- **WHEN** multiple elements are in the same row (similar Y coordinates)
- **AND** gaps between elements are <= 150px
- **THEN** the system SHALL group these elements together
- **AND** the system SHALL create a Row wrapper for them

#### Scenario: Elements with very large gaps
- **WHEN** elements in the same row have gaps > 150px
- **THEN** the system SHALL treat them as separate groups
