---
description: "Design philosophy, aesthetic, game concept, and technical terminology — world space, screen space, columns, elevation, and vision."
---

# Game Concepts & Terminology

## Design Philosophy & Concept

### The Core Fantasy

You are one person in a world that does not revolve around you. The land was here before you arrived, and it will continue without you. Rain falls, rivers flow, grass grows, animals hunt and graze, seasons turn. You are shipwrecked into this — a newcomer in a place that is already alive. Your goal is not to conquer or complete it. Your goal is to *survive in it*, and over time, to leave your mark on it.

The fundamental pleasure is **belonging to a living place**. Not managing it. Not optimizing it. *Being in it.*

### Values (Priority Order)

1. **The world feels alive without you.** Things happen whether you're watching or not. Animals migrate. Water erodes. Plants spread. Weather changes. The player should regularly stumble onto things that happened on their own — a pond that dried up, a predator that cleared out a rabbit warren, moss creeping over a ruin. This is the single most important quality of the game.

2. **Discovery over direction.** There are no quest markers, no tutorials, no objectives list. You learn what the world does by watching it and experimenting. "What happens if I drop meat near a wolf den?" "Does this plant only grow near water?" The game rewards curiosity and observation, not task completion.

3. **Impression of depth over simulation depth.** A few well-chosen, visible interactions create more wonder than a hundred invisible ones. A rain system that visibly fills puddles, causes flowers to bloom, and makes paths muddy does more for the feeling of a living world than a hydrologically accurate water table. Prioritize behaviors the player can *see and understand* over ones that are technically impressive but experientially invisible.

4. **Player actions, player consequences.** You act in the world directly — you walk, you pick things up, you plant, you dig, you fight, you build a fire. Not through menus, management screens, or worker assignments. If you dam a stream, the downstream dries up. If you overhunt, the animals thin out. The world remembers what you did, and you can see it.

5. **Emergent narrative over authored narrative — but authored moments are welcome in disguise.** There is no main story. But there are *stories* — the time you survived a flood by climbing a hill, the grove you planted that attracted songbirds, the winter you almost starved. Most of these arise from the intersection of systems. But some are **seeded events**: authored moments that are subtly triggered by game state and disguised as organic happenings. A glowing pixie at the forest's edge on a dark night. A trader who passes through. Natives locked in a conflict you stumble into. These are always *invitations*, never forced — the player can ignore them entirely. They should feel indistinguishable from the world just doing its thing. There should be enough of them that no player encounters all of them in a single playthrough, keeping each run fresh. The principle from value #3 applies here: **rich experience over rich simulation**. A well-placed, believable trigger creates a better story than trying to simulate the conditions for that story to emerge on its own.

6. **Pacing through expanding capability.** The game's content is not gated by triggers, levels, or unlocks. It's gated by the player's growing ability to range further, stay out longer, and survive in harsher environments. Early on, you're pinned to the coast scrounging for food. As you get secure, your radius naturally expands. You go further. You stay out later. You find things that were always there but that you couldn't reach before. The world doesn't send content to you — your growing capability is what opens it up.

7. **Crafting and building serve survival, not vice versa.** You can make things. You can change the terrain. But these are means, not ends. The game is not about unlocking the next tier of workbench. It's about solving problems the world presents — cold, hunger, predators, floods — with whatever you can find or make. The crafting is practical and intuitive, not a tech tree to climb.

### Aesthetic

**Minimal, evocative pixel art in an isometric-ish top-down view.** Tiny sprites, limited palette, no animation flourishes. The world reads more like a diagram or a living map than a cartoon. A fox is a small orange shape. Rain is a few blue marks. A forest is a dense cluster of green.

The deliberate sparseness is the point: **your real eyes are the graphics card.** The game gives you just enough visual information to understand what's there, and your imagination renders the rest — the sound of the river, the smell of wet earth, the tension of a wolf at the edge of the firelight. Richer graphics would *reduce* this effect, not enhance it.

Two pixel fonts. A muted, naturalistic palette with moments of color — wildflowers in a meadow, lava in a cavern, the glow of magic. The sidebar shows you data about what you're looking at, like reading the stats of a place you're standing in. It's almost scientific — you're an observer-participant in an ecosystem.

### The World

A vast, continuous landscape that wraps at the edges — walk far enough east and you come back from the west. The surface is a 2D grid, but terrain stacks vertically: cliffs, caves, riverbeds, hilltops. You see the world from above, but elevation matters — you need a way up a cliff, a way down into a cavern.

The starting experience: **shipwrecked on an unfamiliar coast.** A brief, mostly text-based prologue — a few screens of text with a single static pixel art image — puts you on a ship in a storm. You choose one of three rooms to grab supplies from before the ship goes down. You don't know what matters yet. Then black. Then sand. The items you grabbed are what you start with. The prologue is short, atmospheric, and non-verbal beyond the text. It frames the experience without explaining it.

From there: sandy shore, grassland interior, a river, a pond, trees, dense forest you can't easily penetrate. Animals. Weather. Day and night. Go.

Over time, the world opens up. The coast gives way to plains, hills, marshes, mountains, deserts, tundra. Underground caverns. Ruins. Places where the rules are different — magical biomes, strange creatures, unexplained phenomena. The world is *mostly* naturalistic, but not entirely. There are things out there that don't follow the normal rules, and discovering them is part of the draw.

### What "Fun" Means Here

The game is not fast. It's not twitchy. It's not about power curves or dopamine loops. The fun is:

- **Observation.** Watching the world do its thing and noticing patterns. "The deer always go to the river at dawn." "This flower only grows where two biomes meet."
- **Experimentation.** Testing your understanding. "If I start a fire near the beehive, will the bees leave?" "Can I redirect this stream?"
- **Problem-solving.** Winter is coming. You have no shelter. The nearest wood is across a river. What do you do?
- **Accumulation of place.** Over many sessions, you develop a home, a territory, a relationship with the land around you. You know where the berry bushes are, where the wolves den, which cave floods in the rain. The world becomes *yours* not because you own it, but because you *know* it.
- **Surprise.** The world is complex enough that it still surprises you. A combination of conditions you've never seen. A creature behaving in a way you didn't expect. A cascade of consequences from something you did three days ago.

### What It Is Not

- Not a crafting game. You can make things, but the crafting is not the point.
- Not a building game. You can change the world, but construction is not the core loop.
- Not a management game. You don't direct workers or optimize production chains.
- Not a combat game. There is danger, and you can fight, but combat is situational, not central.
- Not a progression game. There are no levels, no skill trees, no unlocks. *You* get better at the game by understanding the world better — the game itself is the skill tree.

### The Game Arc

**Early game:** Pure survival. You're hungry, exposed, and ignorant. Every discovery matters — a berry bush, a freshwater source, a sheltered overhang. The world is small because you can't afford to go far.

**Mid game:** Security becomes achievable. You domesticate animals, cultivate crops, build shelter. You solve individual survival problems one by one. Hunger, then cold, then predators. Each solution feels earned. But security is never permanent — storms flatten crops, predators are attracted to your livestock, fires can spread. The satisfaction is in building something that *works*, and in defending it when it's tested.

**Late game:** With survival handled, your world expands. You travel further, stay out longer, discover stranger things. Seeded events become more likely as you explore new territory — encountering native peoples, magical phenomena, ruins with history. The game becomes about *what you do with security* rather than how to achieve it.

**Endgame:** Your character ages and eventually dies. Or perhaps you find a way off the island. When you replay, the world carries traces of your previous life — your shelter now occupied by an NPC, your farm overgrown but still partially there. The world moved on. It always does.

### Input Model — Simultaneous Planning Rounds

The game plays like an animated board game. Each round has two phases:

**Plan:** You queue actions for the coming batch of ticks. Enter inputs for a path to walk it, add a "pick up" or "eat" or "place foundation" to the queue. Your planned actions appear as ghost markers on the board.

**Resolve:** All plans execute at once, alongside everything else in the world. Your character walks, the rabbit hops, the river glimmers, the cloud shifts. Resolution is animated at a comfortable pace. You watch the consequences of your plan and everyone else's, then plan again.

**Why this works for this game:**

- **Observation over action.** Planning rewards reading the board and predicting behavior, not reflexes. Cornering an animal is a positioning puzzle over several rounds, not a chase.
- **No dead time.** Planning is always active thinking. Resolution is always active watching. Neither phase is waiting.
- **Multiplayer solved.** Nobody waits for anyone — everyone plans in parallel. Resolution is simultaneous. Scales to any number of players. Networking is batched action lists, not streaming input.
- **Matches the aesthetic.** You're already looking at a living map, reading data in a sidebar. The board-game rhythm reinforces "observer moving through a rich system" rather than "character running through a world."

**Examples of feel:**

- *Walking to an apple, picking it up, eating it:* Plan a 5-tile path, add pickup and eat. Resolution shows the walk, grab, and bite in ~2 seconds while the world moves around you.
- *Cornering a fowl:* Over several rounds, you study its movement pattern, then plan an approach that cuts off its escape. If you misread it, you see it bolt in resolution and adjust next round. Hunting is patient, observational, satisfying.
- *Building a shelter:* You sketch a foundation in build mode (just planning, no actions spent). Then over several rounds, your actions are spent placing materials. The building rises over 3–4 resolutions while the world continues around you — rain starts, a deer wanders past, the sun sets.

**Multiplayer pacing options:** Timed rounds (15–30s planning, adjustable) for active sessions. Untimed rounds (resolve when all players confirm) for relaxed or asynchronous play.

### The Non-Realistic Elements

The world is grounded in naturalism — weather, ecology, geology, biology — but it is not Earth. There is magic. There are creatures that don't exist. There are places where physics bends. These elements follow their *own* consistent rules, discoverable the same way you discover natural ones. Magic is not a system you level up in; it's a phenomenon you encounter, study, and learn to work with — or avoid. It should feel like finding something *genuinely strange* in an otherwise comprehensible world, not like entering a magic shop.

---

## World Space

The game world is a 3D grid of integer positions **(x, y, z)**.

- **x** — East/West axis (positive = east)
- **y** — North/South axis (positive = south)
- **z** — Elevation (positive = up)

**z = 0** is "sea level." Negative z values exist (e.g. riverbeds, underground).

## Columns

A **column** is all entities at the same (x, y) across all z-levels. Entities stacked vertically share the same column — a dirt at (5, 3, 0) is directly below a dirt at (5, 3, 1).

## Screen Space

The client renders a 2D isometric-style top-down grid. Each world position maps to a screen cell:

- **Screen column** = world x
- **Screen row** = world y − world z

This means elevation shifts entities upward on screen. Two entities at different world positions can overlap the same screen cell if their y and z differ by the same amount — e.g. world (0, 0, 0) and (0, 1, 1) both map to screen row 0--almost, differences in cell height (front faces) and cell "depth" (top faces) mean rows stacked in game space don't exactly line up with the rows behind them and down.

The z component does not appear as a spatial axis on screen. Instead, it becomes **draw order and occlusion**: higher-z entities are drawn later and can visually overlap lower-z entities in the same or adjacent screen cells.

## Vision

Vision is per-entity, defined by two parameters: **horizontalRange** and **verticalRange**.

**Horizontal scope:** All columns within a circular radius of `horizontalRange` around the entity's (x, y).

**Vertical scope per column — two walks from entity z:**

Each column is searched in two directions. Both walks have the same two-phase structure: a **clear phase** (before the first occluder) and a **cliff-face phase** (after the first occluder).

**Downward (from entity z toward `entity.z − verticalRange`):**

- **Clear phase:** Every position with entities is visible. Non-opaque entities (e.g. water) don't stop the search. The first opaque position is included and triggers the transition to cliff-face phase.
- **Cliff-face phase:** Only opaque tiles that have at least one exposed cardinal side face (N/S/E/W neighbor is not opaque) are visible. Fully surrounded tiles are skipped.

**Upward (from `entity.z + 1` toward `entity.z + verticalRange`):**

- **Clear phase:** Non-opaque entities are visible. The first opaque position is always included and triggers cliff-face phase.
- **Cliff-face phase:** Same as downward — only opaque tiles with an exposed cardinal side face are visible.

**Cliff-face rationale:** After hitting a solid occluder, the player can still see tiles beyond it that have an exposed side — like looking down (or up) a cliff wall. Tiles fully enclosed in opaque terrain are hidden.

**No X/Y plane occlusion.** Vision does not ray-cast horizontally — if a column is within range, it's checked. Only z-axis (vertical) occlusion matters.

Only entities at visible positions are sent to the client. The client never receives data about positions outside the player's vision.
