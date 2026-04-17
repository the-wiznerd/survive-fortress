import type {
  EditorRequest,
  EditorResponse,
  ListSavesResponse,
  LoadWorldResponse,
  SaveWorldResponse,
  CreateWorldResponse,
  ErrorResponse,
} from '@repo/editor-server/sdk'

const WS_URL = 'ws://localhost:5175'

type PendingCallback = (response: EditorResponse) => void

let ws: WebSocket | null = null
let seq = 0
const pending = new Map<number, PendingCallback>()
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
      const cb = pending.get(res.seq)
      if (cb) {
        pending.delete(res.seq)
        cb(res)
      }
    }

    socket.onclose = () => {
      ws = null
      connectPromise = null
    }
  })

  return connectPromise
}

function send<T extends EditorResponse>(req: Record<string, unknown>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    await connect()
    const id = ++seq
    pending.set(id, (res) => {
      if (res.type === 'error') reject(new Error((res as ErrorResponse).message))
      else resolve(res as T)
    })
    ws!.send(JSON.stringify({ ...req, seq: id }))
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
