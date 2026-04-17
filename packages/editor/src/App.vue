<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { EditorRenderer } from './renderer'
import { listSaves } from './connection'
import {
  world,
  currentSaveName,
  editorLoadWorld,
  editorSaveWorld,
  placeEntity,
  deleteEntities,
  getEntities,
} from './world'

const PALETTE_TYPES = ['dirt', 'sand', 'stone', 'water', 'player']

// State
const saves = ref<string[]>([])
const activeZ = ref(0)
const activeTool = ref<'draw' | 'delete'>('draw')
const activeType = ref(PALETTE_TYPES[0])
const hoveredCell = ref<{ x: number; y: number } | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const SCALE = 3
const VIEW_W = 40
const VIEW_H = 40

let renderer: EditorRenderer | null = null
let rafId = 0

// Camera panning state
const cameraX = ref(0)
const cameraY = ref(0)
let panning = false
let panStartX = 0
let panStartY = 0
let panCamStartX = 0
let panCamStartY = 0

// Rendering loop
function renderLoop() {
  if (renderer && world.value) {
    renderer.render(getEntities(), activeZ.value, hoveredCell.value)
  }
  rafId = requestAnimationFrame(renderLoop)
}

onMounted(async () => {
  try {
    saves.value = await listSaves()
  } catch {
    // Server not running
  }
})

watch(canvasRef, (canvas) => {
  if (!canvas) return
  renderer = new EditorRenderer(canvas, VIEW_W, VIEW_H, SCALE)
  renderer.onReady = () => renderLoop()
})

// Save browser
async function openSave(name: string) {
  await editorLoadWorld(name)
  // Trigger a re-render
}

async function handleSave() {
  await editorSaveWorld()
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

  if (panning) {
    const dx = (e.clientX - panStartX) / renderer.destW
    const dy = (e.clientY - panStartY) / renderer.rowStep
    cameraX.value = panCamStartX - dx
    cameraY.value = panCamStartY - dy
    updateCamera()
  }

  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const canvasX = e.clientX - rect.left
  const canvasY = e.clientY - rect.top
  hoveredCell.value = renderer.screenToWorld(canvasX, canvasY, activeZ.value)
}

function onCanvasMouseLeave() {
  hoveredCell.value = null
  panning = false
}

function onCanvasClick(e: MouseEvent) {
  if (!renderer || !world.value) return
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const canvasX = e.clientX - rect.left
  const canvasY = e.clientY - rect.top
  const pos = renderer.screenToWorld(canvasX, canvasY, activeZ.value)

  if (activeTool.value === 'draw') {
    placeEntity(activeType.value, pos.x, pos.y, activeZ.value)
  } else {
    deleteEntities(pos.x, pos.y, activeZ.value)
  }
}

function onKeyDown(e: KeyboardEvent) {
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
</script>

<template>
  <div class="editor-layout">
    <div class="sidebar">
      <h2>Saves</h2>
      <div class="save-list">
        <button
          v-for="name in saves"
          :key="name"
          :class="{ active: name === currentSaveName }"
          @click="openSave(name)"
        >
          {{ name }}
        </button>
      </div>

      <template v-if="world">
        <button @click="handleSave">Save</button>

        <h2>Z-Level</h2>
        <div class="z-controls">
          <button @click="activeZ--">−</button>
          <span>{{ activeZ }}</span>
          <button @click="activeZ++">+</button>
        </div>

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
      />
    </div>
  </div>
</template>
