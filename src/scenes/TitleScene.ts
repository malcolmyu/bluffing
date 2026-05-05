import Phaser from 'phaser';
import { generateAllTextures } from './PetGraphics';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload(): void {
    const states = ['idle', 'attack', 'hit', 'victory', 'defeated'];
    for (const state of states) {
      this.load.image(`daodun_${state}`, `assets/pets/daodun_${state}.png`);
      this.load.image(`bibilabu_${state}`, `assets/pets/bibilabu_${state}.png`);
    }
  }

  create(): void {
    generateAllTextures(this);

    const { width, height } = this.cameras.main;

    // Starry cartoon background
    const bg = this.add.graphics();
    const skyColors = [0x0a0a2e, 0x12123a, 0x1a1a3e, 0x15153a, 0x0d0d2a];
    const bandH = height / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, width, bandH + 1);
    });
    // Stars
    const starPositions = [
      [120, 80, 3], [340, 150, 2], [580, 60, 4], [890, 120, 2.5], [1050, 90, 3],
      [80, 280, 2], [260, 340, 3.5], [500, 220, 2], [720, 300, 3], [950, 260, 2],
      [1090, 350, 3.5], [180, 180, 1.5], [650, 140, 2], [420, 100, 2.5], [780, 200, 1.5],
      [70, 500, 2], [310, 480, 3], [600, 550, 2], [850, 420, 2.5], [1000, 520, 2],
      [200, 650, 3], [500, 700, 2], [750, 680, 2.5], [900, 750, 2], [1100, 630, 3],
    ];
    starPositions.forEach(([sx, sy, sr]) => {
      bg.fillStyle(0xffffff, 0.8);
      bg.fillCircle(sx as number, sy as number, sr as number);
    });
    // Cross-shaped sparkle stars
    const crossStars = [[200, 120], [600, 80], [1000, 200], [400, 380], [850, 550], [150, 600]] as const;
    bg.fillStyle(0xffeebb, 0.7);
    crossStars.forEach(([csx, csy]) => {
      bg.fillCircle(csx, csy, 3);
      bg.fillRect(csx - 6, csy - 1, 12, 2);
      bg.fillRect(csx - 1, csy - 6, 2, 12);
    });

    // Decorative ring arcs (subtle orbit lines)
    const decor = this.add.graphics();
    decor.lineStyle(2, 0x3a3a6e, 0.35);
    decor.strokeCircle(width / 2, height / 2, 300);
    decor.lineStyle(1.5, 0x3a3a6e, 0.25);
    decor.strokeCircle(width / 2, height / 2, 390);
    decor.lineStyle(1, 0x3a3a6e, 0.15);
    decor.strokeCircle(width / 2, height / 2, 480);

    // Small dots along orbit
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 345;
      const dx = width / 2 + Math.cos(angle) * r;
      const dy = height / 2 + Math.sin(angle) * r;
      decor.fillStyle(0x6655aa, 0.4);
      decor.fillCircle(dx, dy, 5);
    }

    const daodun = this.add.image(width / 2 - 270, height / 2 + 60, 'daodun_idle').setScale(0.9);
    const bibilabu = this.add.image(width / 2 + 270, height / 2 + 60, 'bibilabu_idle').setScale(0.9);
    daodun.setFlipX(true);

    this.tweens.add({ targets: daodun, y: daodun.y - 12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: bibilabu, y: bibilabu.y - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.add.text(width / 2, height / 2 - 390, '心口不一', {
      fontSize: '144px', color: '#ffdd88', fontFamily: 'serif',
      stroke: '#000', strokeThickness: 18,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 246, '剪刀石头布 · 千层饼博弈', {
      fontSize: '54px', color: '#ccbbaa', fontFamily: 'serif',
      stroke: '#000', strokeThickness: 9,
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, height / 2 + 285, '宣称一个招式，真正出招时可以反悔！', {
      fontSize: '36px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start button
    const btnW = 450; const btnH = 138;
    const btnX = width / 2 - btnW / 2;
    const btnY = height / 2 + 390;
    const btnBg = this.add.graphics();

    const drawNormal = () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.3);
      btnBg.fillRoundedRect(btnX + 4, btnY + 6, btnW, btnH, 32);
      btnBg.fillStyle(0x44aa66, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 32);
      btnBg.fillStyle(0x66cc88, 0.4);
      btnBg.fillRoundedRect(btnX + 14, btnY + 8, btnW - 28, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      btnBg.lineStyle(5, 0x66cc88, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 32);
    };
    const drawHover = () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.3);
      btnBg.fillRoundedRect(btnX + 4, btnY + 6, btnW, btnH, 32);
      btnBg.fillStyle(0x55cc77, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 32);
      btnBg.fillStyle(0x88eebb, 0.4);
      btnBg.fillRoundedRect(btnX + 14, btnY + 8, btnW - 28, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      btnBg.lineStyle(5, 0x88eebb, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 32);
    };
    drawNormal();

    this.add.text(width / 2, btnY + btnH / 2, '开始游戏', {
      fontSize: '51px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => this.scene.start('BattleScene'));
      });

    const start = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    };
    this.input.keyboard!.on('keydown-ENTER', start);
    this.input.keyboard!.on('keydown-SPACE', start);

    const hint = this.add.text(width / 2, btnY + btnH + 78, '按回车 / 空格  或  点击按钮开始', {
      fontSize: '30px', color: '#8877aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
