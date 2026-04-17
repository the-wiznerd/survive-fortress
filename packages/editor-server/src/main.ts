import { WebSocketServer } from 'ws'
import type { EditorRequest } from './sdk/types.js'
import { handleRequest } from './handlers.js'

const PORT = 5175

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  console.log('Editor connected')

  ws.on('message', (raw) => {
    try {
      const req = JSON.parse(String(raw)) as EditorRequest
      const res = handleRequest(req)
      ws.send(JSON.stringify(res))
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', seq: -1, message: 'Invalid request' }))
    }
  })

  ws.on('close', () => {
    console.log('Editor disconnected')
  })
})

console.log(`Editor server listening on ws://localhost:${PORT}`)
