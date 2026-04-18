<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { EditorRenderer } from './renderer'
import { CELL_W, CELL_H } from '@repo/rendering'
import { listSaves } from './connection'
import {
  world,
  currentSaveName,
  editorLoadWorld,
  editorSaveWorld,
  editorNewWorld,
  placeEntity,
  deleteEntities,
  getEntities,
} from './world'

const PALETTE_TYPES = ['dirt', 'sand', 'stone', 'water', 'player']

// State
const saves = ref<string[]>([])
const activeZ = ref(0)
const showAllZ = ref(true)
const activeTool = ref<'draw' | 'delete'>('draw')
const activeType = ref(PALETTE_TYPES[0])
const hoveredCell = ref<{ x: number; y: number } | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const shiftHeld = ref(false)
const toastMessage = ref('')
let toastTimer = 0

const SCALE = 3
const VIEW_W = 40
const VIEW_H = 40

let renderer: EditorRenderer | null = null
let rafId = 0

// Camera panning state
const cameraX = ref(-Math.floor(VIEW_W / 2))
const cameraY = ref(-Math.floor(VIEW_H / 2))
let panning = false
let panStartX = 0
let panStartY = 0
let panCamStartX = 0
let panCamStartY = 0

// Rendering loop
const effectiveTool = computed(() => shiftHeld.value ? 'delete' : activeTool.value)

function renderLoop() {
  if (renderer && world.value) {
    let entities = getEntities()
    if (!showAllZ.value) {
      entities = entities.filter(e => e.z === activeZ.value)
    }
    renderer.render(entities, activeZ.value, hoveredCell.value, effectiveTool.value, activeType.value)
  }
  rafId = requestAnimationFrame(renderLoop)
}

onMounted(async () => {
  try {
    saves.value = await listSaves()
  } catch {
    // Server not running
  }

  const param = new URLSearchParams(window.location.search).get('save')
  if (param && saves.value.includes(param)) {
    await editorLoadWorld(param)
  }
})

watch(currentSaveName, (name) => {
  const url = new URL(window.location.href)
  if (name) {
    url.searchParams.set('save', name)
  } else {
    url.searchParams.delete('save')
  }
  history.replaceState(null, '', url)
})

watch(canvasRef, (canvas) => {
  if (!canvas) return
  renderer = new EditorRenderer(canvas, VIEW_W, VIEW_H, SCALE)
  renderer.setCamera(cameraX.value, cameraY.value)
  renderer.onReady = () => renderLoop()
})

// Save browser
async function onFileSelect(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  if (value === '__new__') {
    editorNewWorld()
  } else {
    await editorLoadWorld(value)
  }
}

async function handleSave() {
  await editorSaveWorld()
  showToast('Saved!')
}

async function handleSaveAs() {
  const name = prompt('Save as:', currentSaveName.value ?? '')
  if (!name) return
  await editorSaveWorld(name)
  if (!saves.value.includes(name)) saves.value.push(name)
  showToast(`Saved as "${name}"!`)
}

function showToast(msg: string) {
  toastMessage.value = msg
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 2000)
}

// Camera panning
function updateCamera() {
  if (renderer) renderer.setCamera(cameraX.value, cameraY.value)
}

function onCanvasMouseDown(e: MouseEvent) {
  // Middle-click (1) or right-click (2) starts panning
  if (e.button === 1 || e.button === 2) {
    e.preventDefault()
    panning = true
    panStartX = e.clientX
    panStartY = e.clientY
    panCamStartX = cameraX.value
    panCamStartY = cameraY.value
  }
}

function onCanvasMouseUp(e: MouseEvent) {
  if (e.button === 1 || e.button === 2) {
    panning = false
  }
}

function onCanvasContextMenu(e: MouseEvent) {
  e.preventDefault()
}

// Canvas interaction
function onCanvasMouseMove(e: MouseEvent) {
  if (!renderer) return
  shiftHeld.value = e.shiftKey

  if (panning) {
    const canvas = e.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const cssScale = rect.width / canvas.width
    const dx = (e.clientX - panStartX) / (CELL_W * cssScale)
    const dy = (e.clientY - panStartY) / (CELL_H * cssScale)
    cameraX.value = panCamStartX - dx
    cameraY.value = panCamStartY - dy
    updateCamera()
  }

  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const canvas = e.target as HTMLCanvasElement
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const canvasX = (e.clientX - rect.left) * scaleX
  const canvasY = (e.clientY - rect.top) * scaleY
  hoveredCell.value = renderer.screenToWorld(canvasX, canvasY, activeZ.value)
}

function onCanvasMouseLeave() {
  hoveredCell.value = null
  panning = false
}

function onCanvasClick(e: MouseEvent) {
  if (!renderer || !world.value) return
  shiftHeld.value = e.shiftKey
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const canvas = e.target as HTMLCanvasElement
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const canvasX = (e.clientX - rect.left) * scaleX
  const canvasY = (e.clientY - rect.top) * scaleY
  const pos = renderer.screenToWorld(canvasX, canvasY, activeZ.value)

  if (effectiveTool.value === 'draw') {
    placeEntity(activeType.value, pos.x, pos.y, activeZ.value)
  } else {
    deleteEntities(pos.x, pos.y, activeZ.value)
  }
}

function onKeyDown(e: KeyboardEvent) {
  shiftHeld.value = e.shiftKey
  const step = e.shiftKey ? 5 : 1
  switch (e.key) {
    case 'ArrowLeft':  cameraX.value -= step; break
    case 'ArrowRight': cameraX.value += step; break
    case 'ArrowUp':    cameraY.value -= step; break
    case 'ArrowDown':  cameraY.value += step; break
    default: return
  }
  e.preventDefault()
  updateCamera()
}

function onKeyUp(e: KeyboardEvent) {
  shiftHeld.value = e.shiftKey
}
</script>

<template>
  <div class="editor-layout">
    <div class="sidebar">
      <h2>File</h2>
      <select :value="currentSaveName ?? ''" @change="onFileSelect">
        <option value="__new__">New…</option>
        <option v-for="name in saves" :key="name" :value="name">{{ name }}</option>
      </select>

      <template v-if="world">
        <div class="save-buttons">
          <button @click="handleSave" :disabled="!currentSaveName">Save</button>
          <button @click="handleSaveAs">Save as…</button>
        </div>

        <h2>Z-Level</h2>
        <div class="z-controls">
          <button @click="activeZ--">−</button>
          <span>{{ activeZ }}</span>
          <button @click="activeZ++">+</button>
        </div>
        <label class="z-show-all"><input type="checkbox" v-model="showAllZ"> Show all</label>

        <h2>Tool</h2>
        <div class="tool-buttons">
          <button :class="{ active: activeTool === 'draw' }" @click="activeTool = 'draw'">Draw</button>
          <button :class="{ active: activeTool === 'delete' }" @click="activeTool = 'delete'">Delete</button>
        </div>

        <h2>Palette</h2>
        <div class="palette">
          <button
            v-for="type in PALETTE_TYPES"
            :key="type"
            :class="{ active: type === activeType }"
            @click="activeType = type"
          >
            {{ type }}
          </button>
        </div>
      </template>

      <div class="status-bar">
        <template v-if="hoveredCell">
          {{ hoveredCell.x }}, {{ hoveredCell.y }}, z={{ activeZ }}
        </template>
      </div>
    </div>

    <div class="viewport">
      <canvas
        ref="canvasRef"
        tabindex="0"
        @mousedown="onCanvasMouseDown"
        @mouseup="onCanvasMouseUp"
        @mousemove="onCanvasMouseMove"
        @mouseleave="onCanvasMouseLeave"
        @click="onCanvasClick"
        @contextmenu="onCanvasContextMenu"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
      />
      <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.toast {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(34, 120, 50, 0.85);
  color: #fff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
}
.viewport {
  position: relative;
}
</style>
