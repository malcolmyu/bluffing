import Phaser from 'phaser';
import type { World } from '../World';
import { C } from '../Components';
import type { PhaseData, BluffIntentData, CombatEventData, ScoreData, HealthData, RPS } from '../Components';
import type { InputSystem } from './InputSystem';
import type { AISystem } from './AISystem';
import type { DeclarationSystem } from './DeclarationSystem';
import type { CountdownSystem } from './CountdownSystem';
import type { CombatSystem } from './CombatSystem';
import type { AnimationSystem } from './AnimationSystem';
import type { ResultSystem } from './ResultSystem';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };
const RPS_WINS_AGAINST: Record<RPS, RPS> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

/**
 * PhaseSystem is the conductor. It owns the full game state machine
 * (declare → reveal → countdown → attack → result → game_over)
 * and orchestrates all other systems via timed callbacks.
 *
 * It's the one exception to "systems don't call each other" —
 * as the conductor, it directly invokes methods on other systems
 * at the right times.
 */
export class PhaseSystem {
  readonly requiredComponents = [C.Phase] as const;

  private scene: Phaser.Scene;
  private world: World;
  private gameEntity: number;
  private daodunEntity: number;
  private bibilabuEntity: number;

  private input!: InputSystem;
  private ai!: AISystem;
  private decl!: DeclarationSystem;
  private countdown!: CountdownSystem;
  private combat!: CombatSystem;
  private anim!: AnimationSystem;
  private result!: ResultSystem;

  constructor(
    scene: Phaser.Scene,
    world: World,
    gameEntity: number,
    daodunEntity: number,
    bibilabuEntity: number,
  ) {
    this.scene = scene;
    this.world = world;
    this.gameEntity = gameEntity;
    this.daodunEntity = daodunEntity;
    this.bibilabuEntity = bibilabuEntity;
  }

  // Not per-frame — all logic is callback-driven.
  update(): void {}

  /** Wire all sibling systems and connect input callbacks. */
  wire(systems: {
    input: InputSystem;
    ai: AISystem;
    decl: DeclarationSystem;
    countdown: CountdownSystem;
    combat: CombatSystem;
    anim: AnimationSystem;
    result: ResultSystem;
  }): void {
    this.input = systems.input;
    this.ai = systems.ai;
    this.decl = systems.decl;
    this.countdown = systems.countdown;
    this.combat = systems.combat;
    this.anim = systems.anim;
    this.result = systems.result;

    this.input.onDeclare = (move) => this.onPlayerDeclare(move);
    this.input.onReveal = (move) => this.onPlayerReveal(move);
  }

  // ==========================================================
  // Phase: DECLARE
  // ==========================================================

  startDeclarePhase(): void {
    this.ai.getMemory().load();
    this.setPhase('declare');

    // Reset intents for both pets
    for (const e of [this.daodunEntity, this.bibilabuEntity]) {
      const bi = this.world.get<BluffIntentData>(e, C.BluffIntent)!;
      bi.declare = null;
      bi.actual = null;
    }

    const round = this.world.get<{ number: number }>(this.gameEntity, C.Round)!;
    round.number++;
    const score = this.world.get<ScoreData>(this.gameEntity, C.Score)!;

    this.result.setRoundLabel(`第 ${round.number} 回合`);
    this.result.setPhaseLabel('📢 宣称阶段', '#A89850');
    this.result.updateScoreLabel(score.player, score.ai);
    this.result.hideResult();

    this.input.showDeclareButtons();
    this.decl.hideBubbles();
    this.countdown.hideMoveEmojis();
  }

  private onPlayerDeclare(move: RPS): void {
    this.decl.showDaodunBubble(move);
    this.result.setPhaseLabel(`你宣称：${RPS_EMOJI[move]} ${RPS_NAME[move]}`, '#6090B0');

    this.scene.time.delayedCall(600, () => {
      const { declare: aiDeclare } = this.ai.chooseMoves(move);
      this.decl.showBibilabuBubble(aiDeclare);
      this.result.setPhaseLabel(
        `比比拉布宣称：${RPS_EMOJI[aiDeclare]} ${RPS_NAME[aiDeclare]}`,
        '#B08050',
      );
      this.scene.time.delayedCall(1000, () => this.startRevealPhase());
    });
  }

  // ==========================================================
  // Phase: REVEAL
  // ==========================================================

  private startRevealPhase(): void {
    this.setPhase('reveal');
    this.result.setPhaseLabel('🎯 出招阶段', '#5090A0');
    this.input.showRevealButtons();
    this.decl.hideBubbles();
  }

  private onPlayerReveal(move: RPS): void {
    this.result.setPhaseLabel(`你出招：${RPS_EMOJI[move]} ${RPS_NAME[move]}`, '#509A60');
    this.scene.time.delayedCall(400, () => this.startCountdown());
  }

  // ==========================================================
  // Phase: COUNTDOWN
  // ==========================================================

  private startCountdown(): void {
    this.setPhase('countdown');

    this.countdown.runCountdown(() => {
      const daodunIntent = this.world.get<BluffIntentData>(this.daodunEntity, C.BluffIntent)!;
      const bibilabuIntent = this.world.get<BluffIntentData>(this.bibilabuEntity, C.BluffIntent)!;
      this.countdown.revealMoveEmojis(daodunIntent.actual!, bibilabuIntent.actual!);
      this.scene.time.delayedCall(600, () => this.executeAttack());
    });
  }

  // ==========================================================
  // Phase: ATTACK
  // ==========================================================

  private executeAttack(): void {
    this.setPhase('attack');

    const daodunIntent = this.world.get<BluffIntentData>(this.daodunEntity, C.BluffIntent)!;
    const bibilabuIntent = this.world.get<BluffIntentData>(this.bibilabuEntity, C.BluffIntent)!;

    const event = this.combat.resolve(
      this.daodunEntity,
      this.bibilabuEntity,
      daodunIntent.declare!,
    );

    const daodunMove = daodunIntent.actual!;
    const bibilabuMove = bibilabuIntent.actual!;
    const daodunWins = RPS_WINS_AGAINST[daodunMove] === bibilabuMove;
    const bibilabuWins = RPS_WINS_AGAINST[bibilabuMove] === daodunMove;
    const isDraw = daodunMove === bibilabuMove;

    if (isDraw) {
      this.anim.playAttack(this.daodunEntity, 'daodun');
      this.anim.playAttack(this.bibilabuEntity, 'bibilabu');
      this.scene.time.delayedCall(500, () => {
        this.anim.playHit(this.daodunEntity, 'daodun', false);
        this.anim.playHit(this.bibilabuEntity, 'bibilabu', false);
      });
    } else if (daodunWins) {
      this.anim.playAttack(this.daodunEntity, 'daodun');
      this.scene.time.delayedCall(200, () => {
        this.anim.playHit(this.bibilabuEntity, 'bibilabu', event.isCrit);
        if (event.isCrit) this.anim.showCritText(this.bibilabuEntity);
      });
    } else {
      this.anim.playAttack(this.bibilabuEntity, 'bibilabu');
      this.scene.time.delayedCall(200, () => {
        this.anim.playHit(this.daodunEntity, 'daodun', false);
      });
    }

    this.scene.time.delayedCall(1200, () => this.showResult());
  }

  // ==========================================================
  // Phase: RESULT
  // ==========================================================

  private showResult(): void {
    this.setPhase('result');

    this.countdown.hideMoveEmojis();

    const daodunIntent = this.world.get<BluffIntentData>(this.daodunEntity, C.BluffIntent)!;
    const bibilabuIntent = this.world.get<BluffIntentData>(this.bibilabuEntity, C.BluffIntent)!;
    const event = this.world.get<CombatEventData>(this.gameEntity, C.CombatEvent)!;
    const score = this.world.get<ScoreData>(this.gameEntity, C.Score)!;
    const daodunHP = this.world.get<HealthData>(this.daodunEntity, C.Health)!;
    const bibilabuHP = this.world.get<HealthData>(this.bibilabuEntity, C.Health)!;

    // Update score
    if (event.outcome === 'player_win') score.player++;
    else if (event.outcome === 'player_lose') score.ai++;

    // Record round to AI memory
    const round = this.world.get<{ number: number }>(this.gameEntity, C.Round)!;
    this.ai.getMemory().record({
      round: round.number,
      playerDeclare: daodunIntent.declare!,
      playerActual: daodunIntent.actual!,
      aiDeclare: bibilabuIntent.declare!,
      aiActual: bibilabuIntent.actual!,
      outcome: event.outcome,
    });

    // Play pet result animations
    if (event.outcome === 'player_win') {
      this.anim.playVictory(this.daodunEntity, 'daodun');
    } else if (event.outcome === 'player_lose') {
      this.anim.playDefeated(this.daodunEntity, 'daodun');
      this.anim.playVictory(this.bibilabuEntity, 'bibilabu');
    }

    this.result.showResult(
      event.outcome,
      event.isCrit,
      daodunIntent.declare!,
      daodunIntent.actual!,
      bibilabuIntent.declare!,
      bibilabuIntent.actual!,
      score.player,
      score.ai,
    );

    // Check game over
    if (daodunHP.current <= 0 || bibilabuHP.current <= 0) {
      this.scene.time.delayedCall(2000, () => this.endGame());
    } else {
      this.scene.time.delayedCall(2500, () => this.startDeclarePhase());
    }
  }

  // ==========================================================
  // GAME OVER
  // ==========================================================

  private endGame(): void {
    this.setPhase('game_over');
    this.result.clearPhaseLabel();

    const bibilabuHP = this.world.get<HealthData>(this.bibilabuEntity, C.Health)!;
    const score = this.world.get<ScoreData>(this.gameEntity, C.Score)!;
    const round = this.world.get<{ number: number }>(this.gameEntity, C.Round)!;

    if (bibilabuHP.current <= 0) {
      this.result.resultText.setText('🏆 胜利！').setColor('#A89830').setVisible(true);
    } else {
      this.result.resultText.setText('💀 失败...').setColor('#B04040').setVisible(true);
    }

    this.scene.cameras.main.fadeOut(1500, 253, 251, 247);
    this.scene.time.delayedCall(1500, () => {
      const playerWon = bibilabuHP.current <= 0;
      this.scene.scene.start(playerWon ? 'VictoryScene' : 'DefeatScene', {
        playerScore: score.player,
        aiScore: score.ai,
        rounds: round.number,
      });
    });
  }

  // ==========================================================
  // Helpers
  // ==========================================================

  private setPhase(phase: PhaseData['current']): void {
    const p = this.world.get<PhaseData>(this.gameEntity, C.Phase)!;
    p.current = phase;
    p.transitioning = false;
  }
}
