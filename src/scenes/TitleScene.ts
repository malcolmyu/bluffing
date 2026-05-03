import Phaser from 'phaser';
import { generateAllTextures } from './PetGraphics';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload(): void {
    // Load AI-generated pet sprites for all states
    const states = ['idle', 'attack', 'hit', 'victory', 'defeated'];
    for (const state of states) {
      this.load.image(`cat_${state}`, `assets/pets/cat_${state}.png`);
      this.load.image(`dog_${state}`, `assets/pets/dog_${state}.png`);
    }
  }

  create(): void {
    generateAllTextures(this);

    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const decor = this.add.graphics();
    decor.lineStyle(1, 0x2a2a4e, 0.4);
    decor.strokeCircle(width / 2, height / 2, 160);
    decor.strokeCircle(width / 2, height / 2, 200);
    decor.strokeCircle(width / 2, height / 2, 240);
    decor.strokeCircle(width / 2, height / 2, 280);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 180;
      const dx = width / 2 + Math.cos(angle) * r;
      const dy = height / 2 + Math.sin(angle) * r;
      decor.fillStyle(0x3a3a6e, 0.5);
      decor.fillCircle(dx, dy, 3);
    }

    const cat = this.add.image(width / 2 - 120, height / 2 + 20, 'cat_idle').setScale(1.2);
    const dog = this.add.image(width / 2 + 120, height / 2 + 20, 'dog_idle').setScale(1.2);
    dog.setFlipX(true);

    this.tweens.add({ targets: cat, y: cat.y - 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: dog, y: dog.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.add.text(width / 2, height / 2 - 140, '心口不一', {
      fontSize: '56px', color: '#ffdd88', fontFamily: 'serif',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 88, '剪刀石头布 · 千层饼博弈', {
      fontSize: '20px', color: '#ccbbaa', fontFamily: 'serif',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, height / 2 + 100, '宣称一个招式，真正出招时可以反悔！', {
      fontSize: '13px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start button
    const btnW = 160; const btnH = 50;
    const btnX = width / 2 - btnW / 2;
    const btnY = height / 2 + 140;
    const btnBg = this.add.graphics();

    const drawNormal = () => {
      btnBg.clear();
      btnBg.fillStyle(0x44aa66, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      btnBg.lineStyle(2, 0x66cc88, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);
    };
    const drawHover = () => {
      btnBg.clear();
      btnBg.fillStyle(0x55cc77, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
      btnBg.lineStyle(2, 0x88eebb, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);
    };
    drawNormal();

    this.add.text(width / 2, btnY + btnH / 2, '开始游戏', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => this.scene.start('BattleScene'));
      });

    // Keyboard
    const start = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    };
    this.input.keyboard!.on('keydown-ENTER', start);
    this.input.keyboard!.on('keydown-SPACE', start);

    const hint = this.add.text(width / 2, btnY + btnH + 30, '按回车键 或 点击按钮开始', {
      fontSize: '11px', color: '#666677', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
