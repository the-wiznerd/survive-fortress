class_name ResolutionPlayer
extends Node

## Plays back the per-tick GameView frames that arrive in a single
## round-resolve message. Frames are emitted one at a time on a fixed
## interval so the player can watch the world tick forward; subscribers
## (world renderer, feed, sidebar) advance their state on each tick.
##
## Idle when no frames are queued. play() restarts playback from frame 0.

## Real-time delay between consecutive frame emissions. Tunable.
const TICK_INTERVAL_S: float = 0.5

## Fired for each frame in playback order. `is_last` lets subscribers run
## end-of-resolution work (clearing the plan, restoring planning input)
## without owning a separate "playback complete" hook.
signal tick_advanced(view: GameView, is_last: bool)

var _frames: Array[GameView] = []
var _next_index: int = 0
var _accum: float = 0.0

## Begin playing the supplied frames. Replaces any in-flight playback —
## the assumption is that round-resolve messages don't overlap (the server
## only sends the next round's frames after the previous resolved).
func play(frames: Array[GameView]) -> void:
	_frames = frames
	_next_index = 0
	_accum = 0.0

func _process(delta: float) -> void:
	if _next_index >= _frames.size():
		return
	_accum += delta
	if _accum < TICK_INTERVAL_S:
		return
	_accum -= TICK_INTERVAL_S
	var view: GameView = _frames[_next_index]
	_next_index += 1
	var is_last: bool = _next_index >= _frames.size()
	tick_advanced.emit(view, is_last)
