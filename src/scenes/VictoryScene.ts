import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data: { playerScore: number; aiScore: number; rounds: number }): void {
    const { width, height } = this.cameras.main;

    // Starry sky background
    const bg = this.add.graphics();
    const skyColors = [0x0a0a1e, 0x0f1f1a, 0x0f1f1a, 0x0a1a0e, 0x0a0a1e];
    const bandH = height / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, width, bandH + 1);
    });
    // Stars
    for (let i = 0; i < 25; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.7));
      bg.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.5), Phaser.Math.Between(1, 3));
    }

    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(height * 0.5, height),
        Phaser.Math.Between(6, 15), 0xffdd44, Phaser.Math.FloatBetween(0.3, 0.8)
      );
      this.tweens.add({
        targets: particle, y: particle.y - Phaser.Math.Between(60, 180), alpha: 0,
        duration: Phaser.Math.Between(1000, 2000), delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        onRepeat: () => {
          particle.x = Phaser.Math.Between(0, width);
          particle.y = Phaser.Math.Between(height * 0.6, height);
          particle.alpha = Phaser.Math.FloatBetween(0.3, 0.8);
        },
      });
    }

    this.add.text(width / 2, height / 2 - 330, '🏆', { fontSize: '192px' }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 120, '胜利！', {
      fontSize: '126px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 18,
    }).setOrigin(0.5);

    this.add.image(width / 2 - 165, height / 2 + 135, 'daodun_victory').setScale(1.2);
    this.add.image(width / 2 + 165, height / 2 + 135, 'bibilabu_defeated').setScale(1.2);

    const stats = `刀盾 ${data.playerScore ?? '?'} - ${data.aiScore ?? '?'} 比比拉布  |  共 ${data.rounds ?? '?'} 回合`;
    this.add.text(width / 2, height / 2 + 315, stats, {
      fontSize: '39px', color: '#88aa88', fontFamily: 'monospace',
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
      bg.fillStyle(0x228833, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.fillStyle(0x44bb66, 0.35);
      bg.fillRoundedRect(bx + 16, by + 6, btnW - 32, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      bg.lineStyle(5, 0x44bb66, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 30);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(bx + 4, by + 6, btnW, btnH, 30);
      bg.fillStyle(0x33aa44, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.fillStyle(0x66dd88, 0.35);
      bg.fillRoundedRect(bx + 16, by + 6, btnW - 32, btnH / 2 - 4, { tl: 24, tr: 24, bl: 0, br: 0 });
      bg.lineStyle(5, 0x66dd88, 1);
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
