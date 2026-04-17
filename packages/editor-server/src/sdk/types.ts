// ─── Editor Protocol ───
// Type-discriminated JSON messages between editor (browser) and editor-server (Node).
// Request/response pairs share a `seq` number for correlation.

// ─── Requests (editor → server) ───

export interface ListSavesRequest {
  type: 'list-saves'
  seq: number
}

export interface LoadWorldRequest {
  type: 'load-world'
  seq: number
  name: string
}

export interface SaveWorldRequest {
  type: 'save-world'
  seq: number
  name: string
  manifest: unknown
  chunks: { filename: string; data: unknown }[]
}

export interface CreateWorldRequest {
  type: 'create-world'
  seq: number
  name: string
}

export type EditorRequest =
  | ListSavesRequest
  | LoadWorldRequest
  | SaveWorldRequest
  | CreateWorldRequest

// ─── Responses (server → editor) ───

export interface ListSavesResponse {
  type: 'list-saves'
  seq: number
  saves: string[]
}

export interface LoadWorldResponse {
  type: 'load-world'
  seq: number
  manifest: unknown
  chunks: unknown[]
}

export interface SaveWorldResponse {
  type: 'save-world'
  seq: number
  ok: boolean
}

export interface CreateWorldResponse {
  type: 'create-world'
  seq: number
  ok: boolean
}

export interface ErrorResponse {
  type: 'error'
  seq: number
  message: string
}

export type EditorResponse =
  | ListSavesResponse
  | LoadWorldResponse
  | SaveWorldResponse
  | CreateWorldResponse
  | ErrorResponse
