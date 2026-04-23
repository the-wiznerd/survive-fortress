import type { Component } from 'vue'
import Check from '~client/components/icons/Check.vue'
import X from '~client/components/icons/X.vue'
import Plus from '~client/components/icons/Plus.vue'
import Minus from '~client/components/icons/Minus.vue'
import ArrowN from '~client/components/icons/ArrowN.vue'
import ArrowS from '~client/components/icons/ArrowS.vue'
import ArrowE from '~client/components/icons/ArrowE.vue'
import ArrowW from '~client/components/icons/ArrowW.vue'
import Ap from '~client/components/icons/Ap.vue'
import Heart from '~client/components/icons/Heart.vue'

/** Registry of all available icons. Add an entry here and a matching SFC in
 *  `components/icons/` — no other code changes needed. */
export const ICONS = {
  check:  Check,
  x:      X,
  plus:   Plus,
  minus:  Minus,
  arrowN: ArrowN,
  arrowS: ArrowS,
  arrowE: ArrowE,
  arrowW: ArrowW,
  ap:     Ap,
  heart:  Heart,
} satisfies Record<string, Component>

export type IconName = keyof typeof ICONS
