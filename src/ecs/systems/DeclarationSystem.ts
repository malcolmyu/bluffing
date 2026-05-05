import Phaser from 'phaser';
import type { RPS } from '../Components';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };

const DAODUN_X = 300;
const BIBILABU_X = 870;
const PET_Y = 930;

/**
 * Creates and manages speech bubbles above each pet.
 * Shows declare text with a pop-in tween.
 */
export class DeclarationSystem {
  readonly requiredComponents = [] as const;

  private scene: Phaser.Scene;

  private daodunBubble!: Phaser.GameObjects.Container;
  private bibilabuBubble!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Not per-frame — driven by PhaseSystem callbacks.
  update(): void {}

  // ==========================================================
  // Initialization (called once during bootstrap)
  // ==========================================================

  createBubbles(): void {
    this.daodunBubble = this.createBubble(DAODUN_X, PET_Y - 270);
    this.daodunBubble.setVisible(false);
    this.bibilabuBubble = this.createBubble(BIBILABU_X, PET_Y - 270);
    this.bibilabuBubble.setVisible(false);
  }

  private createBubble(x: number, y: number): Phaser.GameObjects.Container {
    const bubbleW = 300; const bubbleH = 96;
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.05);
    g.fillRoundedRect(-bubbleW / 2 + 3, -bubbleH / 2 + 3, bubbleW, bubbleH, 24);
    g.fillStyle(0xFFFEFA, 0.98);
    g.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 24);
    g.lineStyle(2, 0xD0CCC5, 1);
    g.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 24);
    g.fillStyle(0xFFFEFA, 0.98);
    g.fillTriangle(-16, bubbleH / 2, 16, bubbleH / 2, 0, bubbleH / 2 + 20);
    g.lineStyle(2, 0xD0CCC5, 1);
    g.beginPath();
    g.moveTo(-16, bubbleH / 2);
    g.lineTo(0, bubbleH / 2 + 20);
    g.lineTo(16, bubbleH / 2);
    g.strokePath();

    const txt = this.scene.add.text(0, 0, '', {
      fontSize: '30px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    const container = this.scene.add.container(x, y, [g, txt]);
    container.setDepth(50);
    return container;
  }

  // ==========================================================
  // Show/hide
  // ==========================================================

  private showBubble(container: Phaser.GameObjects.Container, text: string): void {
    (container.getAt(1) as Phaser.GameObjects.Text).setText(text);
    container.setVisible(true);
    container.setScale(0);
    this.scene.tweens.add({ targets: container, scale: 1, duration: 200, ease: 'Back.easeOut' });
  }

  showDaodunBubble(move: RPS): void {
    this.showBubble(this.daodunBubble, `我要出${RPS_EMOJI[move]}${RPS_NAME[move]}！`);
  }

  showBibilabuBubble(move: RPS): void {
    this.showBubble(this.bibilabuBubble, `我要出${RPS_EMOJI[move]}${RPS_NAME[move]}！`);
  }

  hideBubbles(): void {
    this.daodunBubble.setVisible(false);
    this.bibilabuBubble.setVisible(false);
  }
}
