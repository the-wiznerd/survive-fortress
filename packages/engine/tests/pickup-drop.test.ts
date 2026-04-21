import { describe, it, expect, beforeAll } from 'vitest'
import { createWorld, getComponent, getEntitiesAt, type Action, type World, type EntityId } from '@repo/state'
import { spawnEntity } from '~engine/registry.js'
import { bootstrap } from '~engine/bootstrap.js'
import { tick } from '~engine/tick.js'
import {
  getContainerOf,
  getContainerContents,
  transferToContainer,
  getActorContainer,
  isHeldByActor,
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

describe('pickup action', () => {
  it("moves an adjacent carriable into the actor's equipped bag", () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const bag = bagId(world, player.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 6, y: 5, z: 0 } })

    setPlan(world, player.id, [{ type: 'pickup', targetId: berry.id }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBe(bag)
    expect(getContainerContents(world, bag)).toContain(berry.id)
    expect(getEntitiesAt(world, 6, 5, 0)).not.toContain(berry.id)
    expect(isHeldByActor(world, berry.id, player.id)).toBe(true)
  })

  it('fails validation when target is not adjacent', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 10, y: 10, z: 0 } })

    setPlan(world, player.id, [{ type: 'pickup', targetId: berry.id }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBeUndefined()
  })

  it('fails validation when the item is already contained', () => {
    const world = createWorld()
    const playerA = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const playerB = spawnEntity(world, 'player', { entityType: 'player', position: { x: 6, y: 5, z: 0 } })
    const bagA = bagId(world, playerA.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bagA)

    setPlan(world, playerB.id, [{ type: 'pickup', targetId: berry.id }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBe(bagA)
  })
})

describe('drop action', () => {
  it("removes an item from the actor's bag onto an adjacent tile", () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const bag = bagId(world, player.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bag)

    setPlan(world, player.id, [{ type: 'drop', targetId: berry.id, dx: 1, dy: 0 }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBeUndefined()
    expect(getContainerContents(world, bag)).not.toContain(berry.id)
    expect(getEntitiesAt(world, 6, 5, 0)).toContain(berry.id)

    const berryPos = getComponent(world, berry.id, 'position')!
    expect(berryPos.x).toBe(6)
    expect(berryPos.y).toBe(5)
  })

  it('drops onto the actor tile when dx and dy are zero', () => {
    const world = createWorld()
    const player = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const bag = bagId(world, player.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bag)

    setPlan(world, player.id, [{ type: 'drop', targetId: berry.id, dx: 0, dy: 0 }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBeUndefined()
    expect(getEntitiesAt(world, 5, 5, 0)).toContain(berry.id)
  })

  it('fails validation for items the actor does not hold', () => {
    const world = createWorld()
    const playerA = spawnEntity(world, 'player', { entityType: 'player', position: { x: 5, y: 5, z: 0 } })
    const playerB = spawnEntity(world, 'player', { entityType: 'player', position: { x: 6, y: 5, z: 0 } })
    const bagA = bagId(world, playerA.id)
    const berry = spawnEntity(world, 'berry', { entityType: 'berry', position: { x: 0, y: 0, z: 0 } })
    transferToContainer(world, berry.id, bagA)

    setPlan(world, playerB.id, [{ type: 'drop', targetId: berry.id, dx: 0, dy: 0 }])
    tick(world)

    expect(getContainerOf(world, berry.id)).toBe(bagA)
  })
})
