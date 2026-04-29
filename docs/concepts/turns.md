# Turn architecture

The game uses a two-phase turn architecture. In the **planning phase**, players queue actions for the upcoming batch of ticks. In the **resolution phase**, the server runs the simulation for that batch, captures each tick's resulting state, and sends those frames back; the client plays them sequentially while the player watches the consequences unfold.

## Round flow

```
1. Client enters PLANNING (showing the last resolve frame, or initial join view).
2. Player builds a plan and submits it.
3. Server waits for all plans, or hits the timeout       [SUBMITTED]
4. Server runs the round's ticks as fast as it can.
5. Server returns the captured tick frames in one batch.
6. Client plays the frames back sequentially            [RESOLVING]
7. The last frame becomes the next planning view → repeat.
```

There is no separate round-start message. The join response provides the first planning view; each subsequent planning view is the last frame of the previous resolve.

- Each planning phase starts with a **fresh, empty plan**. No carryover from previous rounds.
- The plan is built from the latest ratified game state — the last resolve frame.
- If a resolve arrives while the client is still in PLANNING, the plan is discarded and the client transitions to RESOLVING. The player missed their window.

## Action points

**AP = ticks.** Each round is exactly `ACTIONS_PER_ROUND` ticks of simulation. Every system (moisture, hunger, entity types) runs every tick.

A player's plan is a flat list of `PlayerAction` values. The movement system consumes them one at a time, spending ticks according to pace. A pace-2 player spends 2 ticks per move; a pace-1 entity spends 1.

If an action is **invalid** (blocked move, etc.), the plan terminates immediately. Remaining ticks idle — the player stands still while the world continues to tick around them.

If AP is **exhausted** mid-action (e.g. terrain modifier increased movement cost), the unfinished action and all subsequent actions are dropped. The world ticks out the remainder.

The client **approximates** AP cost using the player's Movement trait data (already in the view). The engine is authoritative — the client's estimate can be wrong and the engine will enforce validity.

## AI entities

AI entities do **not** use the plan system. They run their per-tick logic independently during the resolve phase, deciding each tick what to do. This lets them react mid-round to the player's movement. Only player-controlled entities submit plans.
