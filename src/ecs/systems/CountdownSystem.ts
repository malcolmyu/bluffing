import Phaser from 'phaser';
import type { RPS } from '../Components';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };

const DAODUN_X = 300;
const BIBILABU_X = 870;
const PET_Y = 930;

/**
 * 3-2-1-开始！ countdown animation with scale bounce.
 * Also manages move emoji reveal above each pet.
 */
export class CountdownSystem {
  readonly requiredComponents = [] as const;

  private scene: Phaser.Scene;

  countdownText!: Phaser.GameObjects.Text;
  private daodunMoveEmoji!: Phaser.GameObjects.Text;
  private bibilabuMoveEmoji!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Not per-frame — driven by PhaseSystem callbacks.
  update(): void {}

  // ==========================================================
  // Initialization (called once during bootstrap)
  // ==========================================================

  create(): void {
    const { width, height } = this.scene.cameras.main;

    this.countdownText = this.scene.add.text(width / 2, height / 2 - 60, '', {
      fontSize: '192px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    this.daodunMoveEmoji = this.scene.add.text(DAODUN_X, PET_Y - 330, '', {
      fontSize: '126px',
    }).setOrigin(0.5).setVisible(false).setDepth(80);

    this.bibilabuMoveEmoji = this.scene.add.text(BIBILABU_X, PET_Y - 330, '', {
      fontSize: '126px',
    }).setOrigin(0.5).setVisible(false).setDepth(80);
  }

  // ==========================================================
  // Countdown sequence
  // ==========================================================

  /** Run 3-2-1-开始！ countdown, then call onComplete. */
  runCountdown(onComplete: () => void): void {
    this.countdownText.setVisible(true);
    const steps = ['5', '4', '3', '2', '1', '开始！'];
    let idx = 0;
    const showNext = () => {
      if (idx >= steps.length) {
        this.countdownText.setVisible(false);
        onComplete();
        return;
      }
      const step = steps[idx];
      this.countdownText.setText(step);
      this.countdownText.setColor(step === '开始！' ? '#A89830' : '#3A3630');
      this.countdownText.setScale(1.5);
      this.scene.tweens.add({ targets: this.countdownText, scale: 1, duration: 300, ease: 'Back.easeOut' });
      idx++;
      this.scene.time.delayedCall(800, showNext);
    };
    showNext();
  }

  // ==========================================================
  // Move emoji reveal
  // ==========================================================

  revealMoveEmojis(daodunMove: RPS, bibilabuMove: RPS): void {
    this.daodunMoveEmoji.setText(RPS_EMOJI[daodunMove]).setVisible(true).setAlpha(0).setScale(0.3);
    this.scene.tweens.add({ targets: this.daodunMoveEmoji, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut' });

    this.bibilabuMoveEmoji.setText(RPS_EMOJI[bibilabuMove]).setVisible(true).setAlpha(0).setScale(0.3);
    this.scene.tweens.add({ targets: this.bibilabuMoveEmoji, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut' });
  }

  hideMoveEmojis(): void {
    this.daodunMoveEmoji.setVisible(false);
    this.bibilabuMoveEmoji.setVisible(false);
  }
}
