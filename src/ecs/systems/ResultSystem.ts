import Phaser from 'phaser';
import type { World } from '../World';
import { C } from '../Components';
import type { RPS, Outcome } from '../Components';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };

const PET_Y = 930;

/**
 * Displays result text, detail text, bluff text, score, and phase/round labels.
 * Checks game-over condition and triggers scene transition.
 */
export class ResultSystem {
  readonly requiredComponents = [] as const;

  private scene: Phaser.Scene;
  private world: World;
  private gameEntity: number;

  resultText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private bluffText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private phaseLabel!: Phaser.GameObjects.Text;
  private roundLabel!: Phaser.GameObjects.Text;

  /** Called when game is over. Parameters: playerWon, playerScore, aiScore, rounds. */
  onGameOver?: (playerWon: boolean, playerScore: number, aiScore: number, rounds: number) => void;

  constructor(scene: Phaser.Scene, world: World, gameEntity: number) {
    this.scene = scene;
    this.world = world;
    this.gameEntity = gameEntity;
  }

  // Not per-frame — driven by PhaseSystem callbacks.
  update(): void {}

  // ==========================================================
  // Initialization (called once during bootstrap)
  // ==========================================================

  create(): void {
    const { width } = this.scene.cameras.main;

    this.scoreText = this.scene.add.text(width / 2, 30, '', {
      fontSize: '42px', color: '#5A5550', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.phaseLabel = this.scene.add.text(width / 2, 90, '', {
      fontSize: '54px', color: '#8A8070', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.roundLabel = this.scene.add.text(width / 2, 300, '', {
      fontSize: '36px', color: '#8A8580', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const resultBaseY = PET_Y + 330;
    this.resultText = this.scene.add.text(width / 2, resultBaseY, '', {
      fontSize: '84px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.detailText = this.scene.add.text(width / 2, resultBaseY + 84, '', {
      fontSize: '39px', color: '#6A6560', fontFamily: 'monospace',
      align: 'center', wordWrap: { width: 1020 },
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.bluffText = this.scene.add.text(width / 2, resultBaseY + 174, '', {
      fontSize: '42px', color: '#A08850', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(90);
  }

  // ==========================================================
  // Label setters
  // ==========================================================

  updateScoreLabel(playerScore: number, aiScore: number): void {
    this.scoreText.setText(`刀盾 ${playerScore} - ${aiScore} 比比拉布`);
  }

  setPhaseLabel(text: string, color?: string): void {
    this.phaseLabel.setText(text);
    if (color) this.phaseLabel.setColor(color);
  }

  setRoundLabel(text: string): void {
    this.roundLabel.setText(text);
  }

  clearPhaseLabel(): void {
    this.phaseLabel.setText('');
  }

  // ==========================================================
  // Result display
  // ==========================================================

  showResult(
    outcome: Outcome,
    isCrit: boolean,
    playerDeclare: RPS,
    playerActual: RPS,
    aiDeclare: RPS,
    aiActual: RPS,
    playerScore: number,
    aiScore: number,
  ): void {
    const daodunBluffed = playerDeclare !== playerActual;
    const bibilabuBluffed = aiDeclare !== aiActual;

    if (outcome === 'player_win') {
      const critText = isCrit ? '💥 暴击！' : '🎉 你赢了！';
      this.resultText.setText(critText).setColor(isCrit ? '#B06030' : '#4A9A5A');
    } else if (outcome === 'player_lose') {
      this.resultText.setText('😵 比比拉布赢了！').setColor('#B04040');
    } else {
      this.resultText.setText('🤝 平局！').setColor('#A89830');
    }

    this.updateScoreLabel(playerScore, aiScore);
    this.resultText.setVisible(true);

    const playerDeclareText = `${RPS_EMOJI[playerDeclare]}${RPS_NAME[playerDeclare]}`;
    const playerActualText = `${RPS_EMOJI[playerActual]}${RPS_NAME[playerActual]}`;
    const aiDeclareText = `${RPS_EMOJI[aiDeclare]}${RPS_NAME[aiDeclare]}`;
    const aiActualText = `${RPS_EMOJI[aiActual]}${RPS_NAME[aiActual]}`;

    let detailStr: string;
    if (!daodunBluffed && !bibilabuBluffed) {
      detailStr = `双方诚实：你出 ${playerActualText}  vs  比比拉布出 ${aiActualText}`;
    } else {
      detailStr = `你：宣称${playerDeclareText} → 实际${playerActualText}\n比比拉布：宣称${aiDeclareText} → 实际${aiActualText}`;
    }
    this.detailText.setText(detailStr).setVisible(true);

    let bluffMsg: string;
    if (outcome === 'player_win') {
      if (!daodunBluffed) {
        bluffMsg = '💥 诚实暴击！扣 2 分！';
      } else if (bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗人了，但你还是赢了！';
      } else {
        bluffMsg = '🎭 骗人成功，你赢了！';
      }
    } else if (outcome === 'player_lose') {
      if (daodunBluffed && bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗了，但你输了...';
      } else if (daodunBluffed) {
        bluffMsg = '😞 骗人失败了...';
      } else if (bibilabuBluffed) {
        bluffMsg = '🐕 比比拉布骗了你，你输了！';
      } else {
        bluffMsg = '😔 诚实对决，但比比拉布赢了...';
      }
    } else {
      // draw
      if (daodunBluffed && bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗人了，打个平手！';
      } else if (daodunBluffed) {
        bluffMsg = '🎭 你骗人了，但打了个平局';
      } else if (bibilabuBluffed) {
        bluffMsg = '🐕 比比拉布骗了你，不过平局！';
      } else {
        bluffMsg = '😇 诚实对决，平局！';
      }
    }
    this.bluffText.setText(bluffMsg).setVisible(true);
  }

  hideResult(): void {
    this.resultText.setVisible(false);
    this.detailText.setVisible(false);
    this.bluffText.setVisible(false);
  }
}
