# Turn Architecture: Simultaneous Planning Rounds

The game uses a two-phase turn architecture. During the Planning Phase, human players submit a plan--a queue of desired actions. After these plans are submitted, the server runs the game simulation for a stretch, using plan actions as player inputs and returning information about the game state and action succes during that stretch, which the client plays back during the Resolution Phase.

## Round Flow

```
1. Client enters PLANNING (from last resolve frame, or initial join view)
2. Player builds plan via the client → sends submit-plan
3. Server waits for all plans (or timeout)               [SUBMITTED phase]
4. Server runs ACTIONS_PER_ROUND ticks as fast as possible
5. Server sends round-resolve { frames: GameView[] }     (one per tick)
6. Client plays back frames sequentially                 [RESOLVING phase]
7. Client uses frames[last] as new planning state → back to 1
```

No separate `round-start` message. The join response provides the first planning view. Each subsequent planning view is the last frame of the previous resolve.

- Each planning phase starts with a **fresh, empty plan**. No carryover from previous rounds.
- The plan is built from the latest ratified game state (the last resolve frame).
- If `round-resolve` arrives while the client is still in PLANNING, the plan is discarded and the client transitions to RESOLVING. The player missed their window.

## Action Points

**AP = ticks.** Each round is exactly `ACTIONS_PER_ROUND` ticks of simulation (currently 8, tunable). Every system (moisture, hunger, entity types) runs every tick.

A player's **plan** is a flat list of `PlayerAction` values. The movement system consumes them one at a time, spending ticks according to pace. A pace-2 player spends 2 ticks (2 AP) per move. A pace-1 entity would spend 1.

If an action is **invalid** (blocked move, etc.), the plan terminates immediately. Remaining ticks idle — the player stands still while the world continues to tick around them.

If AP is **exhausted** mid-action (e.g. terrain modifier increased movement cost), the unfinished action and all subsequent actions are dropped. The world ticks out the remainder.

The client **approximates** AP cost using the player's Movement trait data (already in the view). The engine is authoritative — the client's estimate can be wrong and the engine will enforce validity.

## AI Entities

AI entities do **not** use the plan system. They run their per-tick logic independently during the resolve phase, deciding each tick what to do. This makes them feel responsive — they can react mid-round to the player's movement. Only player-controlled entities submit plans.