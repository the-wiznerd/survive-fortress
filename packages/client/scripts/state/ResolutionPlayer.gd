class_name ResolutionPlayer
extends Node

## Plays back the per-tick GameView frames that arrive in a single
## round-resolve message. Frames are emitted one at a time on a fixed
## interval so the player can watch the world tick forward; subscribers
## (world renderer, feed, sidebar) advance their state on each tick.
##
## Two timing details matter for how the feed reads:
##   • The first frame fires *synchronously* on play() so the chip-status
##     update for tick 1 lands at the start of its display window, not
##     after an empty interval where the world is still showing planning
##     state.
##   • After the last frame, we hold one more interval before signaling
##     completion. The caller flips phase out of RESOLVING on that signal
##     rather than on the last tick — otherwise the final frame's resolved
##     chip statuses would be replaced by the planning render in the same
##     call they were rendered, giving the player no time to register them.

const TICK_INTERVAL_S: float = 0.5

## Fired for each frame in playback order.
signal tick_advanced(view: GameView)
## Fired once, one TICK_INTERVAL_S after the final frame, so the caller can
## transition out of the resolving phase with the last frame already shown.
signal playback_complete()

var _frames: Array[GameView] = []
var _next_index: int = 0
var _accum: float = 0.0
## True between "last frame emitted" and "playback_complete fired" — the
## hold interval that gives the final tick its watchable moment.
var _holding_for_complete: bool = false

## Begin playing the supplied frames. Replaces any in-flight playback —
## the assumption is that round-resolve messages don't overlap (the server
## only sends the next round's frames after the previous resolved). Empty
## frame lists short-circuit straight to playback_complete so the caller's
## end-of-round logic still runs.
func play(frames: Array[GameView]) -> void:
	_frames = frames
	_next_index = 0
	_accum = 0.0
	_holding_for_complete = false
	if _frames.is_empty():
		playback_complete.emit()
		return
	_emit_next()

func _emit_next() -> void:
	var view: GameView = _frames[_next_index]
	_next_index += 1
	tick_advanced.emit(view)
	if _next_index >= _frames.size():
		_holding_for_complete = true

func _process(delta: float) -> void:
	if _next_index >= _frames.size() and not _holding_for_complete:
		return
	_accum += delta
	if _accum < TICK_INTERVAL_S:
		return
	_accum -= TICK_INTERVAL_S
	if _holding_for_complete:
		_holding_for_complete = false
		playback_complete.emit()
		return
	_emit_next()
