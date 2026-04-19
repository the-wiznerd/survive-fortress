import fs from 'node:fs'
import path from 'node:path'
import { WebSocketServer } from 'ws'
import { type WorldManifest, type ChunkData } from '@repo/state'
import { bootstrap, importWorld } from '@repo/engine'
import { GameServer } from '~server/sdk/GameServer.js'
import type { ClientMessage, ServerMessage, SerializedGameView, GameView } from '~server/sdk/types.js'

const PORT = 5174
const TICK_INTERVAL_MS = 500
const SAVES_DIR = path.resolve(import.meta.dirname, '../../../saves')

function serializeView(view: GameView): SerializedGameView {
  return { ...view, visiblePositions: [...view.visiblePositions] }
}

function loadSave(name: string): { manifest: WorldManifest; chunks: ChunkData[] } {
  const worldDir = path.join(SAVES_DIR, name)
  const manifest = JSON.parse(fs.readFileSync(path.join(worldDir, 'world.json'), 'utf-8')) as WorldManifest
  const chunksDir = path.join(worldDir, 'chunks')
  const chunks: ChunkData[] = []
  if (fs.existsSync(chunksDir)) {
    for (const file of fs.readdirSync(chunksDir)) {
      if (file.endsWith('.json')) {
        chunks.push(JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf-8')) as ChunkData)
      }
    }
  }
  return { manifest, chunks }
}

bootstrap()

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  console.log('Client connected')

  let server: GameServer | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  function send(msg: ServerMessage) {
    ws.send(JSON.stringify(msg))
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as ClientMessage

      switch (msg.type) {
        case 'join': {
          if (server) {
            send({ type: 'error', message: 'Already joined' })
            break
          }
          const { manifest, chunks } = loadSave(msg.save)
          const { world, playerIds } = importWorld(manifest, chunks)
          server = new GameServer(world, playerIds[0])

          // Send initial view.
          send({ type: 'joined', view: serializeView(server.getView()) })

          // Start tick loop, push views.
          intervalId = setInterval(() => {
            const actionResult = server!.tick()
            if (actionResult) send(actionResult)
            send({ type: 'view', view: serializeView(server!.getView()) })
          }, TICK_INTERVAL_MS)
          break
        }

        case 'action': {
          if (!server) {
            send({ type: 'error', message: 'Not joined yet' })
            break
          }
          server.sendAction(msg.actionId, msg.action)
          break
        }
      }
    } catch (err) {
      send({ type: 'error', message: 'Invalid message' })
    }
  })

  ws.on('close', () => {
    if (intervalId) clearInterval(intervalId)
    console.log('Client disconnected')
  })
})

console.log(`Game server listening on ws://localhost:${PORT}`)
