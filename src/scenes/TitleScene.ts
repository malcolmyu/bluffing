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

    // Warm cream background
    const bg = this.add.graphics();
    const skyColors = [0xFDFBF7, 0xF8F4ED, 0xF0EDE8, 0xF5F2EC, 0xFDFBF7];
    const bandH = height / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, width, bandH + 1);
    });
    // Subtle dots
    const starPositions = [
      [120, 80, 2], [340, 150, 1.5], [580, 60, 3], [890, 120, 2], [1050, 90, 2],
      [80, 280, 1.5], [260, 340, 2.5], [500, 220, 1.5], [720, 300, 2], [950, 260, 1.5],
      [1090, 350, 2.5], [180, 180, 1], [650, 140, 1.5], [420, 100, 2], [780, 200, 1],
      [70, 500, 1.5], [310, 480, 2], [600, 550, 1.5], [850, 420, 2], [1000, 520, 1.5],
      [200, 650, 2], [500, 700, 1.5], [750, 680, 2], [900, 750, 1.5], [1100, 630, 2],
    ];
    starPositions.forEach(([sx, sy, sr]) => {
      bg.fillStyle(0xD8D0C5, 0.45);
      bg.fillCircle(sx as number, sy as number, sr as number);
    });
    // Subtle cross accents
    const crossStars = [[200, 120], [600, 80], [1000, 200], [400, 380], [850, 550], [150, 600]] as const;
    bg.fillStyle(0xD0C8BA, 0.4);
    crossStars.forEach(([csx, csy]) => {
      bg.fillCircle(csx, csy, 2);
      bg.fillRect(csx - 4, csy - 0.5, 8, 1);
      bg.fillRect(csx - 0.5, csy - 4, 1, 8);
    });

    // Decorative ring arcs (subtle)
    const decor = this.add.graphics();
    decor.lineStyle(1.5, 0xD8D0C5, 0.35);
    decor.strokeCircle(width / 2, height / 2, 300);
    decor.lineStyle(1, 0xD8D0C5, 0.25);
    decor.strokeCircle(width / 2, height / 2, 390);
    decor.lineStyle(1, 0xD8D0C5, 0.15);
    decor.strokeCircle(width / 2, height / 2, 480);

    // Small dots along orbit
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 345;
      const dx = width / 2 + Math.cos(angle) * r;
      const dy = height / 2 + Math.sin(angle) * r;
      decor.fillStyle(0xD0C8BA, 0.3);
      decor.fillCircle(dx, dy, 4);
    }

    const daodun = this.add.image(width / 2 - 270, height / 2 + 60, 'daodun_idle').setScale(0.9);
    const bibilabu = this.add.image(width / 2 + 270, height / 2 + 60, 'bibilabu_idle').setScale(0.9);
    daodun.setFlipX(true);

    this.tweens.add({ targets: daodun, y: daodun.y - 12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: bibilabu, y: bibilabu.y - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.add.text(width / 2, height / 2 - 390, '心口不一', {
      fontSize: '144px', color: '#7A7060', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 246, '剪刀石头布 · 千层饼博弈', {
      fontSize: '54px', color: '#8A8580', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Description
    this.add.text(width / 2, height / 2 + 285, '宣称一个招式，真正出招时可以反悔！', {
      fontSize: '36px', color: '#9A9590', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start button
    const btnW = 450; const btnH = 138;
    const btnX = width / 2 - btnW / 2;
    const btnY = height / 2 + 390;
    const btnBg = this.add.graphics();

    const drawNormal = () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.05);
      btnBg.fillRoundedRect(btnX + 3, btnY + 4, btnW, btnH, 32);
      btnBg.fillStyle(0xF5F0EB, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 32);
      btnBg.lineStyle(2, 0xC5BDB0, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 32);
    };
    const drawHover = () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.05);
      btnBg.fillRoundedRect(btnX + 3, btnY + 4, btnW, btnH, 32);
      btnBg.fillStyle(0xEDE5DA, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 32);
      btnBg.lineStyle(2, 0xB5ADA0, 1);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 32);
    };
    drawNormal();

    this.add.text(width / 2, btnY + btnH / 2, '开始游戏', {
      fontSize: '51px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.zone(width / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 253, 251, 247);
        this.time.delayedCall(400, () => this.scene.start('BattleScene'));
      });

    const start = () => {
      this.cameras.main.fadeOut(400, 253, 251, 247);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    };
    this.input.keyboard!.on('keydown-ENTER', start);
    this.input.keyboard!.on('keydown-SPACE', start);

    const hint = this.add.text(width / 2, btnY + btnH + 78, '按回车 / 空格  或  点击按钮开始', {
      fontSize: '30px', color: '#A09890', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.cameras.main.fadeIn(400, 253, 251, 247);
  }
}
