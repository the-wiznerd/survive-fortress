class_name Palette
extends Object

## UI / world color palette. Mirrors packages/rendering/src/colors.ts so client
## and server-rendered art share a single set of swatches. Hex values match
## the canvas client byte-for-byte.

const WHITE: Color = Color("#eff0e0")
const LIGHTEST_GRAY: Color = Color("#c0c1aa")
const LIGHT_GRAY: Color = Color("#a7ad9a")
const GRAY: Color = Color("#8c978a")
const DARK_GRAY: Color = Color("#606762")
const DARKEST_GRAY: Color = Color("#3f3f3f")
const BLACK: Color = Color("#1a1a1a")

const LIGHTEST_RED: Color = Color("#dbaa7d")
const LIGHT_RED: Color = Color("#c47764")
const RED: Color = Color("#af5550")
const DARK_RED: Color = Color("#83474e")
const DARKEST_RED: Color = Color("#4f3541")

const LIGHTEST_YELLOW: Color = Color("#e0dc81")
const LIGHT_YELLOW: Color = Color("#c5a45f")
const YELLOW: Color = Color("#a7814e")
const DARK_YELLOW: Color = Color("#7f5845")
const DARKEST_YELLOW: Color = Color("#4f3541")

const LIGHTEST_GREEN: Color = Color("#e0dc81")
const LIGHT_GREEN: Color = Color("#c7c965")
const GREEN: Color = Color("#a2af50")
const DARK_GREEN: Color = Color("#627c4e")
const DARKEST_GREEN: Color = Color("#364949")

const LIGHTEST_BLUE: Color = Color("#89e2d0")
const LIGHT_BLUE: Color = Color("#76cdd1")
const BLUE: Color = Color("#518fb0")
const DARK_BLUE: Color = Color("#476f7a")
const DARKEST_BLUE: Color = Color("#364949")
