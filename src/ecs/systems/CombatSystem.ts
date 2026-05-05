import type { World } from '../World';
import { C } from '../Components';
import type { BluffIntentData, HealthData, CombatEventData, RPS, Outcome } from '../Components';

const RPS_WINS_AGAINST: Record<RPS, RPS> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

/**
 * Pure-logic system: resolves RPS outcome, applies damage, checks crit.
 * Zero Phaser dependency — fully testable with plain data.
 */
export class CombatSystem {
  readonly requiredComponents = [C.BluffIntent, C.Health] as const;

  private world: World;
  private gameEntity: number;

  constructor(world: World, gameEntity: number) {
    this.world = world;
    this.gameEntity = gameEntity;
  }

  /** Resolve the round. Returns the outcome and whether it was a crit. */
  resolve(
    daodunEntity: number,
    bibilabuEntity: number,
    daodunDeclare: RPS | null,
  ): CombatEventData {
    const daodunIntent = this.world.get<BluffIntentData>(daodunEntity, C.BluffIntent)!;
    const bibilabuIntent = this.world.get<BluffIntentData>(bibilabuEntity, C.BluffIntent)!;
    const bibilabuHP = this.world.get<HealthData>(bibilabuEntity, C.Health)!;
    const daodunHP = this.world.get<HealthData>(daodunEntity, C.Health)!;

    const daodunMove = daodunIntent.actual!;
    const bibilabuMove = bibilabuIntent.actual!;
    const daodunWins = RPS_WINS_AGAINST[daodunMove] === bibilabuMove;
    const bibilabuWins = RPS_WINS_AGAINST[bibilabuMove] === daodunMove;
    const isDraw = daodunMove === bibilabuMove;

    let outcome: Outcome;
    let isCrit = false;

    if (isDraw) {
      outcome = 'draw';
    } else if (daodunWins) {
      outcome = 'player_win';
      // Crit: player was honest AND won
      isCrit = daodunDeclare === daodunMove;
      const dmg = isCrit ? 2 : 1;
      bibilabuHP.current = Math.max(0, bibilabuHP.current - dmg);
    } else {
      outcome = 'player_lose';
      daodunHP.current = Math.max(0, daodunHP.current - 1);
    }

    const event: CombatEventData = { outcome, isCrit };
    this.world.add(this.gameEntity, C.CombatEvent, event);

    return event;
  }
}
