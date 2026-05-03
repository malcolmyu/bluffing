import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data: { playerScore: number; aiScore: number; rounds: number }): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a0e);

    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 5), 0xffdd44, Phaser.Math.FloatBetween(0.3, 0.8)
      );
      this.tweens.add({
        targets: particle, y: particle.y - Phaser.Math.Between(20, 60), alpha: 0,
        duration: Phaser.Math.Between(1000, 2000), delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        onRepeat: () => {
          particle.x = Phaser.Math.Between(0, width);
          particle.y = Phaser.Math.Between(height * 0.6, height);
          particle.alpha = Phaser.Math.FloatBetween(0.3, 0.8);
        },
      });
    }

    this.add.text(width / 2, height / 2 - 120, '🏆', { fontSize: '80px' }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, '胜利！', {
      fontSize: '48px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.image(width / 2 - 60, height / 2 + 50, 'cat_victory').setScale(1.5);
    this.add.image(width / 2 + 60, height / 2 + 50, 'dog_defeated').setScale(1.5);

    const stats = `猫猫 ${data.playerScore ?? '?'} - ${data.aiScore ?? '?'} 小狗  |  共 ${data.rounds ?? '?'} 回合`;
    this.add.text(width / 2, height / 2 + 110, stats, {
      fontSize: '14px', color: '#88aa88', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.createButton(width / 2, height / 2 + 160, '再来一局', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('BattleScene'));
    });

    this.createButton(width / 2, height / 2 + 210, '返回标题', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('TitleScene'));
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const btnW = 200; const btnH = 44;
    const bg = this.add.graphics();
    const bx = x - btnW / 2; const by = y - btnH / 2;

    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x228833, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 8);
      bg.lineStyle(2, 0x44bb66, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 8);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x33aa44, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 8);
      bg.lineStyle(2, 0x66dd88, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 8);
    };
    drawNormal();

    this.add.text(x, y, label, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.zone(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', drawHover)
      .on('pointerout', drawNormal)
      .on('pointerdown', onClick);
  }
}
