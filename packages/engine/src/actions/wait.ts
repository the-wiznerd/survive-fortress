import type { Action } from '@repo/state'
import { registerAction } from '~engine/actions/registry.js'

type WaitAction = Extract<Action, { type: 'wait' }>

registerAction<WaitAction>({
  type: 'wait',
  cost: () => 1,
  validate: () => true,
  execute: () => {},
})
