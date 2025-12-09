## ADDED Requirements

### Requirement: Group as Image Detection
The system SHALL detect group elements that should be treated as images.

#### Scenario: Small icon group
- **GIVEN** a group element with dimensions ≤48px in both width and height
- **AND** the group contains only graphic primitives (oval, shapePath, shapeGroup, rectangle)
- **AND** the group does not contain any text elements
- **WHEN** the element is transformed
- **THEN** the element SHALL be converted to an Image component
- **AND** the `props.src` SHALL be set to empty string `""`
- **AND** the `props.alt` SHALL be set to the element's name
- **AND** the children SHALL NOT be recursively processed

#### Scenario: Group with text content
- **GIVEN** a group element that contains text elements
- **WHEN** the element is transformed
- **THEN** the element SHALL be treated as a regular Div container
- **AND** the children SHALL be recursively processed

#### Scenario: Large group container
- **GIVEN** a group element with dimensions >48px in either width or height
- **WHEN** the element is transformed
- **THEN** the element SHALL be treated as a regular Div container
- **AND** the children SHALL be recursively processed

## MODIFIED Requirements

### Requirement: Component Name Detection
The system SHALL detect the appropriate component name based on element type and characteristics.

#### Scenario: symbolInstance type
- **WHEN** an element has type `symbolInstance`
- **THEN** the componentName SHALL be `Image`

#### Scenario: group type as image
- **WHEN** an element has type `group`
- **AND** the element is detected as an image (per Group as Image Detection)
- **THEN** the componentName SHALL be `Image`

#### Scenario: group type as container
- **WHEN** an element has type `group`
- **AND** the element is NOT detected as an image
- **THEN** the componentName SHALL be `Div`
