

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
            {{ PALETTE_LABELS[type] ?? type }}
          </button>
        </div>
      </template>

      <div class="status-bar">
        <template v-if="hoveredCell">
          {{ hoveredCell.x }}, {{ hoveredCell.y }}, z={{ activeZ }}
        </template>
      </div>

      <div class="hints">
        <kbd>Click</kbd> Draw &nbsp; <kbd>Shift+Click</kbd> Delete<br>
        <kbd>Z</kbd> Z up &nbsp; <kbd>Shift+Z</kbd> Z down<br>
        <kbd>X</kbd> Toggle show all &nbsp; <kbd>Right-drag</kbd> Pan
      </div>
    </div>

    <div class="viewport">
      <canvas
        ref="canvasRef"
        @mousedown="onCanvasMouseDown"
        @mouseup="onCanvasMouseUp"
        @mousemove="onCanvasMouseMove"
        @mouseleave="onCanvasMouseLeave"
        @click="onCanvasClick"
        @contextmenu="onCanvasContextMenu"
      />
      <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { EditorRenderer } from '~editor/renderer'
  import { CELL_W, TOP_H } from '@repo/rendering'
  import { listSaves } from '~editor/connection'
  import {
    world,
    currentSaveName,
    editorLoadWorld,
    editorSaveWorld,
    editorNewWorld,
    placeEntity,
    deleteEntities,
    getEntities,
  } from '~editor/world'

  const PALETTE_TYPES = ['dirt', 'sand', 'stone', 'water', 'player', 'bush', 'bushSmall']
  const PALETTE_LABELS: Record<string, string> = {
    bush: 'Bush (Large)',
    bushSmall: 'Bush (Small)',
  }

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

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    cancelAnimationFrame(rafId)
  })

  function renderLoop() {
    if (renderer && world.value) {
      let entities = getEntities()
      if (!showAllZ.value) {
        entities = entities.filter(e => e.z === activeZ.value)
      }
      renderer.render(entities, activeZ.value, hoveredCell.value, effectiveTool.value, activeType.value!)
    }
    rafId = requestAnimationFrame(renderLoop)
  }

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
      const dy = (e.clientY - panStartY) / (TOP_H * cssScale)
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
      const type = activeType.value === 'bushSmall' ? 'bush' : activeType.value!
      const state = activeType.value === 'bushSmall'
        ? { size: 'small' }
        : activeType.value === 'bush'
          ? { size: 'large' }
          : undefined
      placeEntity(type, pos.x, pos.y, activeZ.value, state)
    } else {
      deleteEntities(pos.x, pos.y, activeZ.value)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    shiftHeld.value = e.shiftKey
    switch (e.key) {
      case 'z': activeZ.value++; break
      case 'Z': activeZ.value--; break
      case 'x': showAllZ.value = !showAllZ.value; break
      default: return
    }
    e.preventDefault()
  }

  function onKeyUp(e: KeyboardEvent) {
    shiftHeld.value = e.shiftKey
  }
</script>

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
.hints {
  margin-top: auto;
  padding-top: 12px;
  font-size: 11px;
  line-height: 1.6;
  color: #888;
}
.hints kbd {
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 10px;
  color: #ccc;
}
</style>
