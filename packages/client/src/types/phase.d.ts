// Ambient client-wide types — no import needed at use sites.
//
// Files in src/types/ are loaded automatically via tsconfig.json's include glob,
// and Vue's <script setup> recognizes ambient `declare global` types natively.

declare global {
  /** The current step of the planning-rounds turn cycle. */
  type RoundPhase = 'planning' | 'submitted' | 'resolving'

  /** Per-frame plan progress emitted during playback. */
  interface PlanProgress {
    /** Number of actions completed successfully so far. */
    index: number
    /** True if the plan was terminated by an invalid action this round. */
    terminated: boolean
    /** Number of simulation ticks (= AP) elapsed in the current round. */
    elapsedTicks: number
  }
}

export {}
