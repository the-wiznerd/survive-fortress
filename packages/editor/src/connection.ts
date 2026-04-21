import type {
  EditorResponse,
  ListSavesResponse,
  LoadWorldResponse,
  SaveWorldResponse,
  CreateWorldResponse,
  ErrorResponse,
} from '@repo/editor-server/sdk'

const WS_URL = 'ws://localhost:5176'

type PendingRequest = {
  resolve: (response: EditorResponse) => void
  reject: (error: Error) => void
}

let ws: WebSocket | null = null
let seq = 0
const pending = new Map<number, PendingRequest>()
let connectPromise: Promise<void> | null = null

function connect(): Promise<void> {
  if (ws?.readyState === WebSocket.OPEN) return Promise.resolve()
  if (connectPromise) return connectPromise

  connectPromise = new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(WS_URL)

    socket.onopen = () => {
      ws = socket
      connectPromise = null
      resolve()
    }

    socket.onerror = () => {
      connectPromise = null
      reject(new Error('WebSocket connection failed'))
    }

    socket.onmessage = (event) => {
      const res = JSON.parse(event.data) as EditorResponse
      const request = pending.get(res.seq)
      if (request) {
        pending.delete(res.seq)
        if (res.type === 'error') {
          request.reject(new Error((res as ErrorResponse).message))
          return
        }

        request.resolve(res)
      }
    }

    socket.onclose = () => {
      const error = new Error('WebSocket connection closed')
      for (const request of pending.values()) {
        request.reject(error)
      }
      pending.clear()
      ws = null
      connectPromise = null
    }
  })

  return connectPromise
}

async function send<T extends EditorResponse>(req: Record<string, unknown>): Promise<T> {
  await connect()

  const socket = ws
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket not connected')
  }

  const id = ++seq

  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (res) => resolve(res as T),
      reject,
    })

    socket.send(JSON.stringify({ ...req, seq: id }))
  })
}

export async function listSaves(): Promise<string[]> {
  const res = await send<ListSavesResponse>({ type: 'list-saves' })
  return res.saves
}

export async function loadWorld(name: string): Promise<{ manifest: unknown; chunks: unknown[] }> {
  const res = await send<LoadWorldResponse>({ type: 'load-world', name })
  return { manifest: res.manifest, chunks: res.chunks }
}

export async function saveWorld(
  name: string,
  manifest: unknown,
  chunks: { filename: string; data: unknown }[],
): Promise<void> {
  await send<SaveWorldResponse>({ type: 'save-world', name, manifest, chunks })
}

export async function createWorld(name: string): Promise<void> {
  await send<CreateWorldResponse>({ type: 'create-world', name })
}
