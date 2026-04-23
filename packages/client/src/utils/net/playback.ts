// Frame playback timer — pure, no Vue or store imports.
// Plays a sequence of frames at a fixed cadence, invoking `onFrame` per tick.

import type { GameView } from '@repo/server/sdk'

const PLAYBACK_TICK_MS = 400

export interface PlaybackHandle {
  /** Cancel any in-flight playback. Safe to call multiple times. */
  cancel(): void
}

export interface PlaybackCallbacks {
  /** Invoked once per tick with the current frame. */
  onFrame(frame: GameView): void
  /** Invoked once after the final frame has been delivered, or immediately if frames is empty. */
  onDone(): void
}

/** Begin draining `frames` to `onFrame` at the playback cadence. */
export function playFrames(frames: GameView[], { onFrame, onDone }: PlaybackCallbacks): PlaybackHandle {
  if (frames.length === 0) {
    onDone()
    return { cancel() {} }
  }

  let cancelled = false
  let timerId: ReturnType<typeof setTimeout> | null = null
  let frameIndex = 0

  function step() {
    if (cancelled) return
    const frame = frames[frameIndex]
    if (!frame) {
      timerId = null
      onDone()
      return
    }
    onFrame(frame)
    frameIndex++
    if (frameIndex < frames.length) {
      timerId = setTimeout(step, PLAYBACK_TICK_MS)
    } else {
      // Hold the final frame on screen for one tick so the last action's
      // success/failure state is actually visible before `onDone` resets it.
      timerId = setTimeout(() => {
        timerId = null
        onDone()
      }, PLAYBACK_TICK_MS)
    }
  }

  step()

  return {
    cancel() {
      cancelled = true
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
    },
  }
}
