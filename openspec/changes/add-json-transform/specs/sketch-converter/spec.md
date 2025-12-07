## ADDED Requirements

### Requirement: JSON Format Transformation
The system SHALL provide functionality to transform simplified Sketch JSON into low-code format JSON.

#### Scenario: Transform element properties to props.style
- **WHEN** processing a simplified JSON element with frame, backgroundColor, borderRadius properties
- **THEN** the system SHALL convert frame dimensions to width/height with px units in props.style
- **AND** the system SHALL convert backgroundColor to rgba format
- **AND** the system SHALL convert borderRadius to string with px unit
- **AND** the system SHALL add default flexbox properties (display, flexDirection)

#### Scenario: Detect and assign componentName
- **WHEN** processing an element with type property
- **THEN** the system SHALL map "rectangle" type to componentName "Div"
- **AND** the system SHALL map "text" type to componentName "Text"
- **AND** the system SHALL map "symbolInstance" type to componentName "Image"
- **AND** the system SHALL map "artboard" type to componentName "Div"

#### Scenario: Generate className
- **WHEN** transforming an element
- **THEN** the system SHALL generate a unique className based on componentName and index
- **AND** the className format SHALL follow pattern like "view_1", "text_2", "imageView_3"

### Requirement: Hierarchy Reorganization
The system SHALL reorganize flat element structure into nested hierarchy based on position relationships.

#### Scenario: Detect element containment
- **WHEN** analyzing element positions
- **THEN** the system SHALL determine if element A is visually contained within element B
- **AND** containment is determined by checking if A's bounds are within B's bounds

#### Scenario: Reorganize children hierarchy
- **WHEN** multiple elements share the same parentId but have containment relationships
- **THEN** the system SHALL move contained elements into their visual parent's children array
- **AND** the system SHALL update parentId references accordingly

#### Scenario: Calculate relative margins
- **WHEN** an element is nested within a parent
- **THEN** the system SHALL calculate marginTop relative to the previous sibling or parent top
- **AND** the system SHALL calculate marginLeft relative to the parent left edge
- **AND** the margins SHALL be included in props.style

### Requirement: MCP Tool for JSON Transformation
The system SHALL expose JSON transformation functionality through an MCP tool.

#### Scenario: Transform JSON via MCP tool
- **WHEN** the `transformJSON` MCP tool is called with a file path
- **THEN** the tool SHALL load the source JSON file
- **AND** the tool SHALL transform it to low-code format
- **AND** the tool SHALL return the transformed JSON object
