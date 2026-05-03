import Phaser from 'phaser';

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DefeatScene' });
  }

  create(data: { playerScore: number; aiScore: number; rounds: number }): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a0a);

    for (let i = 0; i < 15; i++) {
      const line = this.add.rectangle(
        Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
        1, Phaser.Math.Between(10, 30), 0x4466aa, 0.3
      );
      this.tweens.add({
        targets: line, y: line.y + Phaser.Math.Between(50, 100), alpha: 0,
        duration: Phaser.Math.Between(800, 1500), delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        onRepeat: () => {
          line.x = Phaser.Math.Between(0, width);
          line.y = Phaser.Math.Between(-30, 30);
          line.alpha = 0.3;
        },
      });
    }

    this.add.text(width / 2, height / 2 - 120, '💀', { fontSize: '80px' }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, '失败...', {
      fontSize: '48px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.image(width / 2 - 60, height / 2 + 50, 'cat_defeated').setScale(1.5);
    this.add.image(width / 2 + 60, height / 2 + 50, 'dog_victory').setScale(1.5);

    const stats = `猫猫 ${data.playerScore ?? '?'} - ${data.aiScore ?? '?'} 小狗  |  共 ${data.rounds ?? '?'} 回合`;
    this.add.text(width / 2, height / 2 + 110, stats, {
      fontSize: '14px', color: '#aa8888', fontFamily: 'monospace',
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
      bg.fillStyle(0x662222, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 8);
      bg.lineStyle(2, 0x994444, 1);
      bg.strokeRoundedRect(bx, by, btnW, btnH, 8);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x883333, 1);
      bg.fillRoundedRect(bx, by, btnW, btnH, 8);
      bg.lineStyle(2, 0xbb6666, 1);
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
