import type { World } from '../World';
import { C } from '../Components';
import type { BluffIntentData, AITagData, RPS } from '../Components';

const MOVES: RPS[] = ['rock', 'scissors', 'paper'];

/**
 * When the player has declared a move, AI picks its actual move randomly
 * and decides whether to bluff based on its configured bluffChance.
 */
export class AISystem {
  readonly requiredComponents = [C.BluffIntent, C.AITag] as const;

  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  update(_world: World, entities: number[]): void {
    // AI acts reactively when phase changes, not per-frame
  }

  /** Pick AI moves. Called by the game orchestrator after player declares. */
  chooseMoves(): { declare: RPS; actual: RPS } {
    const [bibilabu] = this.world.query(C.BluffIntent, C.AITag);
    if (!bibilabu) {
      return { declare: 'rock', actual: 'rock' };
    }

    const ai = this.world.get<AITagData>(bibilabu, C.AITag)!;
    const intent = this.world.get<BluffIntentData>(bibilabu, C.BluffIntent)!;

    // Pick actual move randomly
    const actual = MOVES[Math.floor(Math.random() * MOVES.length)];

    // Decide whether to tell the truth
    let declare: RPS;
    if (Math.random() < ai.bluffChance) {
      declare = actual; // honest
    } else {
      // Bluff: pick a different move
      const others = MOVES.filter((m) => m !== actual);
      declare = others[Math.floor(Math.random() * others.length)];
    }

    intent.declare = declare;
    intent.actual = actual;

    return { declare, actual };
  }
}
