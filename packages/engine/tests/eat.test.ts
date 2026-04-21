import { describe, it, expect, beforeAll } from 'vitest'
import { createWorld, getComponent, hasComponent, type Action, type World, type EntityId } from '@repo/state'
import { spawnEntity } from '~engine/registry.js'
import { bootstrap } from '~engine/bootstrap.js'
import { tick } from '~engine/tick.js'
import {
  transferToContainer,
  getContainerOf,
  getActorContainer,
} from '~engine/containment.js'

beforeAll(() => bootstrap())

function setPlan(world: World, playerId: EntityId, actions: Action[]) {
  const pc = getComponent(world, playerId, 'playerControlled')!
  pc.plan = actions
  pc.planIndex = 0
  pc.actionTicksElapsed = 0
}

function bagId(world: World, playerId: EntityId): EntityId {
  const id = getActorContainer(world, playerId)
  if (id === undefined) throw new Error('player has no container')
  return id
}

describe('eat action', () => {
  it('eats a held berry, restores hunger, and destroys the entity', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const bag = bagId(world, player.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bag)

    const hunger = getComponent(world, player.id, 'hunger')!
    hunger.current = 20
    hunger.drainPerTick = 0
    const before = hunger.current
    const nutrition = getComponent(world, berry.id, 'edible')!.nutrition

    setPlan(world, player.id, [{ type: 'eat', targetId: berry.id }])
    tick(world)

    expect(hasComponent(world, berry.id, 'entityType')).toBe(false)
    expect(hunger.current).toBe(before + nutrition)
  })

  it('eats an adjacent berry on the ground', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 6, y: 5, z: 0 } })

    const hunger = getComponent(world, player.id, 'hunger')!
    hunger.current = 10
    const before = hunger.current

    setPlan(world, player.id, [{ type: 'eat', targetId: berry.id }])
    tick(world)

    expect(hasComponent(world, berry.id, 'entityType')).toBe(false)
    expect(hunger.current).toBeGreaterThan(before)
  })

  it('caps hunger at the maximum', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const bag = bagId(world, player.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bag)

    const hunger = getComponent(world, player.id, 'hunger')!
    hunger.current = hunger.max - 1
    hunger.drainPerTick = 0

    setPlan(world, player.id, [{ type: 'eat', targetId: berry.id }])
    tick(world)

    expect(hunger.current).toBe(hunger.max)
  })

  it('fails validation for out-of-reach targets', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 20, y: 20, z: 0 } })

    setPlan(world, player.id, [{ type: 'eat', targetId: berry.id }])
    tick(world)

    expect(hasComponent(world, berry.id, 'entityType')).toBe(true)
    expect(getContainerOf(world, berry.id)).toBeUndefined()
  })
})
