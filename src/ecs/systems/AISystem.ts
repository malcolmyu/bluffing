import type { World } from '../World';
import { C } from '../Components';
import type { BluffIntentData, AITagData, RPS } from '../Components';
import { AIMemory } from '../AIMemory';

const MOVES: RPS[] = ['rock', 'scissors', 'paper'];

/**
 * AI move selection with memory-based prediction.
 *
 * When enough history exists (>= 3 rounds), the AI uses conditional
 * probability to predict the player's actual move given their declaration,
 * then counters it. 20% of decisions are deliberately random to prevent
 * the player from reverse-exploiting the AI.
 */
export class AISystem {
  readonly requiredComponents = [C.BluffIntent, C.AITag] as const;

  private world: World;
  private memory: AIMemory;

  constructor(world: World) {
    this.world = world;
    this.memory = new AIMemory();
  }

  // Not per-frame — driven by PhaseSystem callback.
  update(): void {}

  /** Expose memory so the conductor can record rounds and load history. */
  getMemory(): AIMemory {
    return this.memory;
  }

  /**
   * Choose AI's declare and actual moves.
   * @param playerDeclare — what the player just declared (used for prediction)
   */
  chooseMoves(playerDeclare: RPS): { declare: RPS; actual: RPS } {
    const [bibilabu] = this.world.query(C.BluffIntent, C.AITag);
    if (!bibilabu) return { declare: 'rock', actual: 'rock' };

    const ai = this.world.get<AITagData>(bibilabu, C.AITag)!;
    const intent = this.world.get<BluffIntentData>(bibilabu, C.BluffIntent)!;

    // Mixed strategy: 80% exploit (predict + counter), 20% random
    const useStrategy = this.memory.getRoundCount() >= 3 && Math.random() < 0.8;

    let actual: RPS;
    if (useStrategy) {
      actual = this.memory.predictBestCounter(playerDeclare);
    } else {
      actual = MOVES[Math.floor(Math.random() * MOVES.length)];
    }

    // Decide whether to tell the truth about the chosen actual
    let declare: RPS;
    if (Math.random() < ai.bluffChance) {
      declare = actual; // honest
    } else {
      const others = MOVES.filter((m) => m !== actual);
      declare = others[Math.floor(Math.random() * others.length)];
    }

    intent.declare = declare;
    intent.actual = actual;

    return { declare, actual };
  }
}
