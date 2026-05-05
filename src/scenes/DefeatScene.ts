import Phaser from 'phaser';

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DefeatScene' });
  }

  create(data: { playerScore: number; aiScore: number; rounds: number }): void {
    const { width, height } = this.cameras.main;

    // Dark starry background
    const bg = this.add.graphics();
    const skyColors = [0x0a0a1e, 0x120a0a, 0x120a0a, 0x0f0a0a, 0x0a0a1e];
    const bandH = height / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, width, bandH + 1);
    });
    // Stars
    for (let i = 0; i < 25; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.5));
      bg.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.5), Phaser.Math.Between(1, 3));
    }

    for (let i = 0; i < 15; i++) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(height * 0.5, height),
        3, Phaser.Math.Between(30, 90), 0x4466aa, 0.3
      );
      this.tweens.add({
        targets: line, y: line.y + Phaser.Math.Between(150, 300), alpha: 0,
        duration: Phaser.Math.Between(800, 1500), delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        onRepeat: () => {
          line.x = Phaser.Math.Between(0, width);
          line.y = Phaser.Math.Between(-90, 90);
          line.alpha = 0.3;
        },
      });
    }

    this.add.text(width / 2, height / 2 - 330, '💀', { fontSize: '192px' }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 120, '失败...', {
      fontSize: '126px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 18,
    }).setOrigin(0.5);

    this.add.image(width / 2 - 165, height / 2 + 135, 'daodun_defeated').setScale(1.2);
    this.add.image(width / 2 + 165, height / 2 + 135, 'bibilabu_victory').setScale(1.2);

    const stats = `刀盾 ${data.playerScore ?? '?'} - ${data.aiScore ?? '?'} 比比拉布  |  共 ${data.rounds ?? '?'} 回合`;
    this.add.text(width / 2, height / 2 + 315, stats, {
      fontSize: '39px', color: '#aa8888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.createButton(width / 2, height / 2 + 450, '再来一局', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    });

    this.createButton(width / 2, height / 2 + 585, '返回标题', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const btnW = 540; const btnH = 120;
    const bg = this.add.graphics();
    const bx = x - btnW / 2; const by = y - btnH / 2;

    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(bx + 4, by + 6, btnW, btnH, 30);
      bg.fillStyle(0x662222, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.fillStyle(0x994444, 0.3);
      bg.fillRoundedRect(bx + 16, by + 6, btnW - 32, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      bg.lineStyle(5, 0x994444, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 30);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(bx + 4, by + 6, btnW, btnH, 30);
      bg.fillStyle(0x883333, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.fillStyle(0xbb6666, 0.3);
      bg.fillRoundedRect(bx + 16, by + 6, btnW - 32, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      bg.lineStyle(5, 0xbb6666, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 30);
    };
    drawNormal();

    this.add.text(x, y, label, {
      fontSize: '45px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.zone(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', onClick);
  }
}
