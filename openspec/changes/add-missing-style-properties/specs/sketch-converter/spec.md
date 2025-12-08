## ADDED Requirements

### Requirement: Parse Complex Opacity Format
The system SHALL correctly parse opacity values in various formats.

#### Scenario: Numeric opacity
- **WHEN** opacity is a number (e.g., 0.7, 1)
- **THEN** the system SHALL use the value directly

#### Scenario: BigDecimal object opacity
- **WHEN** opacity is an object with `{s, e, c}` properties (BigDecimal format)
- **THEN** the system SHALL parse it to a numeric value
- **AND** the parsed value SHALL be between 0 and 1

#### Scenario: Undefined opacity
- **WHEN** opacity is undefined
- **THEN** the system SHALL default to 1

### Requirement: Process Gradient Background
The system SHALL process gradient background properties.

#### Scenario: Linear gradient background
- **WHEN** an element has a `background` property with linear-gradient value
- **THEN** the system SHALL include the background in the output style
- **AND** the gradient syntax SHALL be preserved

#### Scenario: Both background and backgroundColor
- **WHEN** an element has both `background` and `backgroundColor`
- **THEN** the system SHALL prioritize `background` (gradient)

### Requirement: Process Border Property
The system SHALL process border object properties.

#### Scenario: Border object with width and color
- **WHEN** an element has a `border` object with `width` and `color` properties
- **THEN** the system SHALL convert it to CSS border format
- **AND** the format SHALL be `{width}px solid {color}`

#### Scenario: Border color conversion
- **WHEN** border color is in rgb format
- **THEN** the system SHALL convert it to rgba format
