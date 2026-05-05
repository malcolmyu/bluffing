import Phaser from 'phaser';

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DefeatScene' });
  }

  create(data: { playerScore: number; aiScore: number; rounds: number }): void {
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
    for (let i = 0; i < 25; i++) {
      bg.fillStyle(0xD8D0C5, Phaser.Math.FloatBetween(0.15, 0.35));
      bg.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.5), Phaser.Math.Between(1, 2));
    }

    for (let i = 0; i < 15; i++) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(height * 0.5, height),
        3, Phaser.Math.Between(30, 90), 0xA0B0C8, 0.25
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
      fontSize: '126px', color: '#B04040', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.image(width / 2 - 165, height / 2 + 135, 'daodun_defeated').setScale(1.2);
    this.add.image(width / 2 + 165, height / 2 + 135, 'bibilabu_victory').setScale(1.2);

    const stats = `刀盾 ${data.playerScore ?? '?'} - ${data.aiScore ?? '?'} 比比拉布  |  共 ${data.rounds ?? '?'} 回合`;
    this.add.text(width / 2, height / 2 + 315, stats, {
      fontSize: '39px', color: '#8A7070', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.createButton(width / 2, height / 2 + 450, '再来一局', () => {
      this.cameras.main.fadeOut(400, 253, 251, 247);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    });

    this.createButton(width / 2, height / 2 + 585, '返回标题', () => {
      this.cameras.main.fadeOut(400, 253, 251, 247);
      this.time.delayedCall(400, () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 253, 251, 247);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const btnW = 540; const btnH = 120;
    const bg = this.add.graphics();
    const bx = x - btnW / 2; const by = y - btnH / 2;

    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.05);
      bg.fillRoundedRect(bx + 3, by + 4, btnW, btnH, 30);
      bg.fillStyle(0xF5F0EB, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.lineStyle(2, 0xC5BDB0, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 30);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.05);
      bg.fillRoundedRect(bx + 3, by + 4, btnW, btnH, 30);
      bg.fillStyle(0xEDE5DA, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 30);
      bg.lineStyle(2, 0xB5ADA0, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 30);
    };
    drawNormal();

    this.add.text(x, y, label, {
      fontSize: '45px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.zone(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', onClick);
  }
}
