import Phaser from 'phaser';
import type { World } from '../World';
import { C } from '../Components';
import type { BluffIntentData, PhaseData, RPS } from '../Components';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };

/**
 * Bridges Phaser button clicks to BluffIntent ECS components.
 * Manages declare/reveal button creation, visibility, and interaction.
 */
export class InputSystem {
  readonly requiredComponents = [C.BluffIntent, C.PlayerTag] as const;

  private scene: Phaser.Scene;
  private world: World;
  private gameEntity: number;

  declareButtons: Phaser.GameObjects.Container[] = [];
  revealButtons: Phaser.GameObjects.Container[] = [];
  private declareLabel!: Phaser.GameObjects.Text;
  private revealLabel!: Phaser.GameObjects.Text;

  /** Called when the player clicks a declare button. */
  onDeclare?: (move: RPS) => void;
  /** Called when the player clicks a reveal button. */
  onReveal?: (move: RPS) => void;

  constructor(scene: Phaser.Scene, world: World, gameEntity: number) {
    this.scene = scene;
    this.world = world;
    this.gameEntity = gameEntity;
  }

  // Not per-frame — driven by button callbacks.
  update(): void {}

  // ==========================================================
  // Button creation (called once during bootstrap)
  // ==========================================================

  createButtons(w: number, h: number): void {
    const moves: RPS[] = ['rock', 'scissors', 'paper'];
    const btnY = h - 195;
    const btnSpacing = 315;
    const startX = w / 2 - btnSpacing;
    const labelY = h - 306;

    moves.forEach((move, i) => {
      const bx = startX + i * btnSpacing;
      const declareBtn = this.createSingleButton(bx, btnY, RPS_EMOJI[move], RPS_NAME[move], () => this.onDeclareClick(move));
      this.declareButtons.push(declareBtn);
      const revealBtn = this.createSingleButton(bx, btnY, RPS_EMOJI[move], RPS_NAME[move], () => this.onRevealClick(move));
      revealBtn.setVisible(false);
      this.revealButtons.push(revealBtn);
    });

    this.declareLabel = this.scene.add.text(w / 2, labelY, '📢 宣称你要出的招式  (可以骗人哦！)', {
      fontSize: '33px', color: '#8A80A0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.revealLabel = this.scene.add.text(w / 2, labelY, '🎯 选择你真正要出的招式！', {
      fontSize: '33px', color: '#A08040', fontFamily: 'monospace',
    }).setOrigin(0.5).setVisible(false);
  }

  private createSingleButton(
    x: number, y: number,
    emoji: string, label: string,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const btnW = 255; const btnH = 144;
    const bg = this.scene.add.graphics();
    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.06);
      bg.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 4, btnW, btnH, 32);
      bg.fillStyle(0xF5F0EB, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 32);
      bg.lineStyle(2, 0xC5BDB0, 1);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 32);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.06);
      bg.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 4, btnW, btnH, 32);
      bg.fillStyle(0xEDE5DA, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 32);
      bg.lineStyle(2, 0xB5ADA0, 1);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 32);
    };
    drawNormal();

    const icon = this.scene.add.text(0, -12, emoji, { fontSize: '66px' }).setOrigin(0.5);
    const lbl = this.scene.add.text(0, 48, label, {
      fontSize: '33px', color: '#4A4540', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.scene.add.container(x, y, [bg, icon, lbl]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains,
    );
    container.input!.cursor = 'pointer';
    container.setDepth(60);
    container.on('pointerover', drawHover);
    container.on('pointerout', drawNormal);
    container.on('pointerdown', callback);
    return container;
  }

  // ==========================================================
  // Button visibility (called by PhaseSystem)
  // ==========================================================

  showDeclareButtons(): void {
    this.declareButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.revealButtons.forEach((b) => b.setVisible(false));
    this.declareLabel.setVisible(true);
    this.revealLabel.setVisible(false);
  }

  showRevealButtons(): void {
    this.declareButtons.forEach((b) => b.setVisible(false));
    this.revealButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.declareLabel.setVisible(false);
    this.revealLabel.setVisible(true);
  }

  disableButtons(): void {
    this.declareButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
    this.revealButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
  }

  // ==========================================================
  // Click handlers
  // ==========================================================

  private onDeclareClick(move: RPS): void {
    const phase = this.world.get<PhaseData>(this.gameEntity, C.Phase);
    if (!phase || phase.current !== 'declare' || phase.transitioning) return;
    phase.transitioning = true;

    const [daodun] = this.world.query(C.BluffIntent, C.PlayerTag);
    if (!daodun) return;
    const intent = this.world.get<BluffIntentData>(daodun, C.BluffIntent)!;
    intent.declare = move;

    this.disableButtons();
    this.onDeclare?.(move);
  }

  private onRevealClick(move: RPS): void {
    const phase = this.world.get<PhaseData>(this.gameEntity, C.Phase);
    if (!phase || phase.current !== 'reveal' || phase.transitioning) return;
    phase.transitioning = true;

    const [daodun] = this.world.query(C.BluffIntent, C.PlayerTag);
    if (!daodun) return;
    const intent = this.world.get<BluffIntentData>(daodun, C.BluffIntent)!;
    intent.actual = move;

    this.disableButtons();
    this.onReveal?.(move);
  }
}
