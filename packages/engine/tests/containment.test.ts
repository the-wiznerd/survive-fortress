import { describe, it, expect, beforeAll } from 'vitest'
import { createWorld, getComponent, getEntitiesAt, type World } from '@repo/state'
import { spawnEntity } from '~engine/registry.js'
import { bootstrap } from '~engine/bootstrap.js'
import type { HarvestableTrait } from '~engine/traits/HarvestableTrait.js'
import {
  transferToContainer,
  removeFromContainer,
  getContainerOf,
  getContainerContents,
  getActorContainer,
} from '~engine/containment.js'

beforeAll(() => bootstrap())

function spawnPlayer(world: World, x: number, y: number) {
  return spawnEntity(world, 'player', { entityType: 'player', position: { x, y, z: 0 } })
}

function spawnBerry(world: World, x: number, y: number) {
  return spawnEntity(world, 'berry', { entityType: 'berry', position: { x, y, z: 0 } })
}

/** Convenience: the entity id of the player's equipped bag. */
function bagId(world: World, playerId: number): number {
  const id = getActorContainer(world, playerId)
  if (id === undefined) throw new Error('player has no container')
  return id
}

describe('containment', () => {
  it('transfers an item into a container, syncs spatial index, and exposes back-pointer', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    const berry = spawnBerry(world, 0, 0)

    expect(getEntitiesAt(world, 0, 0, 0)).toContain(berry.id)

    expect(transferToContainer(world, berry.id, bag)).toBe(true)

    expect(getContainerOf(world, berry.id)).toBe(bag)
    expect(getContainerContents(world, bag)).toContain(berry.id)
    // Berry's spatial entry follows the carrier (the bag, which follows the player).
    expect(getEntitiesAt(world, 0, 0, 0)).not.toContain(berry.id)
    expect(getEntitiesAt(world, 5, 5, 0)).toContain(berry.id)
  })

  it('PositionTrait getters delegate recursively through equipment and container', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    const berry = spawnBerry(world, 0, 0)
    transferToContainer(world, berry.id, bag)

    const berryPos = getComponent(world, berry.id, 'position')!
    expect(berryPos.x).toBe(5)
    expect(berryPos.y).toBe(5)

    // Move the carrier and both bag + berry's spatial entries follow.
    const playerPos = getComponent(world, player.id, 'position')!
    playerPos.x = 7
    playerPos.y = 8

    expect(berryPos.x).toBe(7)
    expect(berryPos.y).toBe(8)
    expect(getEntitiesAt(world, 7, 8, 0)).toContain(berry.id)
    expect(getEntitiesAt(world, 7, 8, 0)).toContain(bag)
    expect(getEntitiesAt(world, 5, 5, 0)).not.toContain(berry.id)
    expect(getEntitiesAt(world, 5, 5, 0)).not.toContain(bag)
  })

  it("setters on a contained entity's position are inert", () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    const berry = spawnBerry(world, 0, 0)
    transferToContainer(world, berry.id, bag)

    const berryPos = getComponent(world, berry.id, 'position')!
    berryPos.x = 99
    expect(berryPos.x).toBe(5) // delegates to carrier; write is ignored
  })

  it('rejects items that exceed capacity', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    // Bag default capacity is 8 — fill it then try one more.
    for (let i = 0; i < 8; i++) {
      const b = spawnBerry(world, 0, 0)
      expect(transferToContainer(world, b.id, bag)).toBe(true)
    }
    const overflow = spawnBerry(world, 0, 0)
    expect(transferToContainer(world, overflow.id, bag)).toBe(false)
    expect(getContainerOf(world, overflow.id)).toBeUndefined()
  })

  it('removes an item from a container back to the world', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    const berry = spawnBerry(world, 0, 0)
    transferToContainer(world, berry.id, bag)

    expect(removeFromContainer(world, berry.id, 3, 3, 0)).toBe(true)
    expect(getContainerOf(world, berry.id)).toBeUndefined()
    expect(getContainerContents(world, bag)).not.toContain(berry.id)
    expect(getEntitiesAt(world, 5, 5, 0)).not.toContain(berry.id)
    expect(getEntitiesAt(world, 3, 3, 0)).toContain(berry.id)

    // After removal, the position trait stores its own coords again.
    const berryPos = getComponent(world, berry.id, 'position')!
    expect(berryPos.x).toBe(3)
    berryPos.x = 4
    expect(berryPos.x).toBe(4)
  })
})

describe('bush harvest produces berries', () => {
  it('places yielded berries into the harvester container', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    const bush = spawnEntity(world, 'bush', { entityType: 'bush', position: { x: 6, y: 5, z: 0 }, size: 'small' })

    const harvestable = getComponent(world, bush.id, 'harvestable')! as HarvestableTrait
    const yielded = harvestable.amount
    expect(yielded).toBe(4)

    harvestable.onHarvest(player.id)

    expect(harvestable.amount).toBe(0)
    const contents = getContainerContents(world, bag)
    expect(contents.length).toBe(yielded)
    for (const id of contents) {
      expect(getComponent(world, id, 'entityType')!.type).toBe('berry')
    }
  })

  it('overflow berries drop on the harvester tile', () => {
    const world = createWorld()
    const player = spawnPlayer(world, 5, 5)
    const bag = bagId(world, player.id)
    // Pre-fill the 8-capacity bag with 6 berries → only 2 of the 4 yield will fit.
    for (let i = 0; i < 6; i++) {
      const b = spawnBerry(world, 0, 0)
      transferToContainer(world, b.id, bag)
    }

    const bush = spawnEntity(world, 'bush', { entityType: 'bush', position: { x: 6, y: 5, z: 0 }, size: 'small' })
    const harvestable = getComponent(world, bush.id, 'harvestable')! as HarvestableTrait
    harvestable.onHarvest(player.id)

    expect(getContainerContents(world, bag).length).toBe(8)
    // Two berries should have dropped on the player's tile.
    const onTile = getEntitiesAt(world, 5, 5, 0)
    const dropped = onTile.filter(id =>
      getComponent(world, id, 'entityType')?.type === 'berry'
      && getContainerOf(world, id) === undefined,
    )
    expect(dropped.length).toBe(2)
  })
})
