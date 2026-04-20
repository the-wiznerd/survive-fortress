import { reactive, watch } from 'vue'

const STORAGE_KEY = 'survive-fortress-settings'

const DEFAULTS = {
  scale: 3,
  turnMode: 'auto' as 'manual' | 'auto',
}

type Settings = typeof DEFAULTS

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULTS }
}

function save(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const settings = reactive(load())

watch(settings, save)
