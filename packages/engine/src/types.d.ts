// Supplement auto-imports: classes used as type annotations need explicit type declarations.
// Auto-imports provide the value (constructor); this file provides the type (instance).

type Trait<K extends ComponentName = any> = import('~engine/traits/Trait').Trait<K>
type BaseEntityType = import('~engine/entityTypes/BaseEntityType').BaseEntityType
type PositionTrait = import('~engine/traits/PositionTrait').PositionTrait
