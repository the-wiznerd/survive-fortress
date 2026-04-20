---
description: "Planning rounds turn architecture — round flow, action points, plan execution, protocol, client state machine, and playback."
---

# Turn Architecture — Simultaneous Planning Rounds

## Round Flow

```
1. Client enters PLANNING (from last resolve frame, or initial join view)
2. Player builds plan with arrow keys, presses Enter → sends submit-plan
3. Server waits for all plans (or timeout)              [SUBMITTED phase]
4. Server runs ACTIONS_PER_ROUND ticks as fast as possible
5. Server sends round-resolve { frames: GameView[] }    (one per tick)
6. Client plays back frames sequentially                 [RESOLVING phase]
7. Client uses frames[last] as new planning state → back to 1
```

No separate `round-start` message. The join response provides the first planning view. Each subsequent planning view is the last frame of the previous resolve.

## Action Points

**AP = ticks.** Each round is exactly `ACTIONS_PER_ROUND` ticks of simulation (currently 8, tunable). Every system (moisture, hunger, entity types) runs every tick.

A player's **plan** is a flat list of `PlayerAction` values. The movement system consumes them one at a time, spending ticks according to pace. A pace-2 player spends 2 ticks (2 AP) per move. A pace-1 entity would spend 1.

If an action is **invalid** (blocked move, etc.), the plan terminates immediately. Remaining ticks idle — the player stands still while the world continues to tick around them.

If AP is **exhausted** mid-action (e.g. terrain modifier increased movement cost), the unfinished action and all subsequent actions are dropped. The world ticks out the remainder.

The client **approximates** AP cost using the player's Movement trait data (already in the view). The engine is authoritative — the client's estimate can be wrong and the engine will enforce validity.

## Plan Lifecycle

- Each planning phase starts with a **fresh, empty plan**. No carryover from previous rounds.
- The plan is built from the latest ratified game state (the last resolve frame).
- If `round-resolve` arrives while the client is still in PLANNING, the plan is discarded and the client transitions to RESOLVING. The player missed their window.

## AI Entities

AI entities do **not** use the plan system. They run their per-tick logic independently during the resolve phase, deciding each tick what to do. This makes them feel responsive — they can react mid-round to the player's movement. Only player-controlled entities submit plans.

## Protocol

### Client → Server

| Message | Fields |
|---|---|
| `join` | `{ type: 'join', save: string }` |
| `submit-plan` | `{ type: 'submit-plan', actions: PlayerAction[] }` |

### Server → Client

| Message | Fields |
|---|---|
| `joined` | `{ type: 'joined', view: GameView, actionsPerRound: number }` |
| `round-resolve` | `{ type: 'round-resolve', frames: SerializedGameView[] }` |
| `error` | `{ type: 'error', message: string }` |

The old `action`, `action-result`, and `view` messages are removed.

## Client State Machine

| Phase | Border | Player Can | Ends When |
|---|---|---|---|
| **PLANNING** | Blue (palette) | Build plan, inspect tiles | Enter pressed → SUBMITTED |
| **SUBMITTED** | Amber (palette) | Inspect, wait | `round-resolve` received → RESOLVING |
| **RESOLVING** | Green (palette) | Watch playback | Last frame played → PLANNING |

## Client Input (Planning Phase)

- **Arrow keys** append a move step to the plan (no modifier needed)
- **Backspace** clears the entire plan
- **Enter** submits the plan to the server
- Ghost markers on the map show the planned path
- No AP counter in the UI (feel the gameplay first)
- No click-to-pathfind (player manages their own pathing)

## Playback (Resolving Phase)

The client receives `frames: GameView[]` and steps through them sequentially (**slideshow MVP**). Tick playback speed is tunable (target ~250ms/tick for 8 ticks ≈ 2 seconds total).

The `frames` array is the key architecture for future animation: adjacent frames provide the before/after states needed for interpolation and tweening. Adding continuity animations later is a client-only change — swap the slideshow stepper for a diff-and-tween renderer. No protocol or server changes needed.

## Server Round Loop

The server replaces the old `setInterval` tick loop with an event-driven round model:

1. On join: send `joined` with initial view and `actionsPerRound`.
2. Idle until `submit-plan` received from all players (or timeout in timed mode). For single-player untimed: wait indefinitely.
3. Load each player's plan onto their `PlayerControlled` component (`plan: Action[]`, `planIndex: 0`).
4. Run `ACTIONS_PER_ROUND` ticks. After each tick, snapshot a `GameView` into the frames array.
5. Send `round-resolve { frames }` to all clients.
6. Go to step 2.

The world only advances during step 4. During planning, time is frozen.

## ECS Changes

`PlayerControlled` component changes from:

```ts
interface PlayerControlled {
  pendingAction: Action | null
}
```

to:

```ts
interface PlayerControlled {
  plan: Action[]
  planIndex: number
}
```

## Movement System Changes

The movement system reads `plan[planIndex]` instead of `pendingAction`:

- If `planIndex >= plan.length`: no action this tick (idle).
- If a mode is pace-ready: attempt `plan[planIndex]`.
  - **Success:** increment `planIndex`, reset tick counter.
  - **Failure:** set `planIndex = plan.length` (terminate plan).
- Pace tick counting works identically to the current system.
