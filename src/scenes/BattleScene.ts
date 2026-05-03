import Phaser from 'phaser';
import { playerConfig, enemyConfig } from '../gameConfig.json';

type RPS = 'rock' | 'scissors' | 'paper';
type Phase = 'declare' | 'wait_ai_declare' | 'reveal' | 'countdown' | 'attack' | 'result' | 'game_over';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };
const RPS_WINS_AGAINST: Record<RPS, RPS> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

const CAT_START_X = 280;
const DOG_START_X = 744;
const PET_Y = 400;

export class BattleScene extends Phaser.Scene {
  private cat!: Phaser.GameObjects.Image;
  private dog!: Phaser.GameObjects.Image;

  private catHP = playerConfig.maxHealth.value;
  private dogHP = enemyConfig.maxHealth.value;
  private catHPBar!: Phaser.GameObjects.Graphics;
  private dogHPBar!: Phaser.GameObjects.Graphics;
  private catHPText!: Phaser.GameObjects.Text;
  private dogHPText!: Phaser.GameObjects.Text;

  private playerScore = 0;
  private aiScore = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private phase: Phase = 'declare';
  private phaseLabel!: Phaser.GameObjects.Text;
  private roundLabel!: Phaser.GameObjects.Text;

  private playerDeclare: RPS | null = null;
  private playerActual: RPS | null = null;
  private aiDeclare: RPS | null = null;
  private aiActual: RPS | null = null;

  private declareButtons: Phaser.GameObjects.Container[] = [];
  private revealButtons: Phaser.GameObjects.Container[] = [];
  private declareLabel!: Phaser.GameObjects.Text;
  private revealLabel!: Phaser.GameObjects.Text;

  private catBubble!: Phaser.GameObjects.Container;
  private dogBubble!: Phaser.GameObjects.Container;
  private countdownText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private bluffText!: Phaser.GameObjects.Text;

  // Large move emoji displayed above pets during reveal
  private catMoveEmoji!: Phaser.GameObjects.Text;
  private dogMoveEmoji!: Phaser.GameObjects.Text;

  private roundNum = 0;
  private transitioning = false;

  private catHeart!: Phaser.GameObjects.Image;
  private dogHeart!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.catHP = playerConfig.maxHealth.value;
    this.dogHP = enemyConfig.maxHealth.value;
    this.playerScore = 0;
    this.aiScore = 0;
    this.roundNum = 0;
    this.phase = 'declare';
    this.transitioning = false;
    this.playerDeclare = null;
    this.playerActual = null;
    this.aiDeclare = null;
    this.aiActual = null;

    this.drawBackground(width, height);

    const floor = this.add.graphics();
    floor.fillStyle(0x222244, 0.5);
    floor.fillEllipse(width / 2, PET_Y + 20, 400, 120);
    floor.lineStyle(1, 0x333366, 0.3);
    floor.strokeEllipse(width / 2, PET_Y + 20, 400, 120);

    this.cat = this.add.image(CAT_START_X, PET_Y, 'cat_idle').setScale(1.2);
    this.dog = this.add.image(DOG_START_X, PET_Y, 'dog_idle').setScale(1.2);
    this.dog.setFlipX(true);
    this.startIdleBobbing();

    const barW = 100;
    this.catHPBar = this.add.graphics();
    this.dogHPBar = this.add.graphics();
    this.catHeart = this.add.image(CAT_START_X - barW / 2 - 12, 76, 'heart_icon').setScale(0.6).setDepth(1);
    this.dogHeart = this.add.image(DOG_START_X - barW / 2 - 12, 76, 'heart_icon').setScale(0.6).setDepth(1);
    this.drawHealthBars();

    this.catHPText = this.add.text(CAT_START_X, 94, `${this.catHP} / ${playerConfig.maxHealth.value}`, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.dogHPText = this.add.text(DOG_START_X, 94, `${this.dogHP} / ${enemyConfig.maxHealth.value}`, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Score — Chinese
    this.scoreText = this.add.text(width / 2, 12, `猫猫 ${this.playerScore} - ${this.aiScore} 小狗`, {
      fontSize: '16px', color: '#ccccdd', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Phase label
    this.phaseLabel = this.add.text(width / 2, 36, '宣称阶段', {
      fontSize: '20px', color: '#ffdd88', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.roundLabel = this.add.text(width / 2, 112, '', {
      fontSize: '13px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Speech bubbles
    this.catBubble = this.createSpeechBubble(CAT_START_X, PET_Y - 80, '');
    this.catBubble.setVisible(false);
    this.dogBubble = this.createSpeechBubble(DOG_START_X, PET_Y - 80, '');
    this.dogBubble.setVisible(false);

    // Countdown
    this.countdownText = this.add.text(width / 2, height / 2 - 40, '', {
      fontSize: '72px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 8,
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    // Result
    this.resultText = this.add.text(width / 2, height / 2 - 100, '', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    // Detail text (shows declared vs actual)
    this.detailText = this.add.text(width / 2, height / 2 - 55, '', {
      fontSize: '15px', color: '#ddddee', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.bluffText = this.add.text(width / 2, height / 2 - 35, '', {
      fontSize: '16px', color: '#ffcc88', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    // Large move emoji above pets (used during reveal)
    this.catMoveEmoji = this.add.text(CAT_START_X, PET_Y - 105, '', {
      fontSize: '48px', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setVisible(false).setDepth(80);

    this.dogMoveEmoji = this.add.text(DOG_START_X, PET_Y - 105, '', {
      fontSize: '48px', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setVisible(false).setDepth(80);

    // Buttons
    this.createButtons(width, height);

    this.time.delayedCall(500, () => this.startDeclarePhase());
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ============================================================
  // BACKGROUND
  // ============================================================

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0x16213e, 0.5);
    bg.fillRect(0, 0, w, h / 2);
    bg.lineStyle(2, 0x2a2a4e, 0.5);
    bg.lineBetween(0, PET_Y + 50, w, PET_Y + 50);
    bg.lineStyle(1, 0x333366, 0.2);
    bg.lineBetween(0, PET_Y + 50, w / 2, PET_Y + 10);
    bg.lineBetween(w, PET_Y + 50, w / 2, PET_Y + 10);
  }

  // ============================================================
  // IDLE
  // ============================================================

  private startIdleBobbing(): void {
    this.tweens.add({ targets: this.cat, y: PET_Y - 3, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.dog, y: PET_Y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ============================================================
  // HEALTH
  // ============================================================

  private drawHealthBars(): void {
    const barW = 100; const barH = 12;
    this.catHPBar.clear();
    this.catHPBar.fillStyle(0x333333, 1);
    this.catHPBar.fillRect(CAT_START_X - barW / 2 - 1, 70, barW + 2, barH + 2);
    const catRatio = this.catHP / playerConfig.maxHealth.value;
    this.catHPBar.fillStyle(catRatio > 0.5 ? 0x44cc66 : catRatio > 0.25 ? 0xddcc44 : 0xdd4444, 1);
    this.catHPBar.fillRect(CAT_START_X - barW / 2, 71, barW * catRatio, barH);

    this.dogHPBar.clear();
    this.dogHPBar.fillStyle(0x333333, 1);
    this.dogHPBar.fillRect(DOG_START_X - barW / 2 - 1, 70, barW + 2, barH + 2);
    const dogRatio = this.dogHP / enemyConfig.maxHealth.value;
    this.dogHPBar.fillStyle(dogRatio > 0.5 ? 0x44cc66 : dogRatio > 0.25 ? 0xddcc44 : 0xdd4444, 1);
    this.dogHPBar.fillRect(DOG_START_X - barW / 2, 71, barW * dogRatio, barH);
  }

  // ============================================================
  // SPEECH BUBBLE
  // ============================================================

  private createSpeechBubble(x: number, y: number, text: string): Phaser.GameObjects.Container {
    const bubbleW = 110; const bubbleH = 36;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 8);
    g.lineStyle(1.5, 0x666666, 1);
    g.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 8);
    g.fillStyle(0xffffff, 0.95);
    g.fillTriangle(-8, bubbleH / 2, 8, bubbleH / 2, 0, bubbleH / 2 + 10);

    const txt = this.add.text(0, 0, text, {
      fontSize: '11px', color: '#333333', fontFamily: 'monospace', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [g, txt]);
    container.setDepth(50);
    return container;
  }

  private setBubbleText(container: Phaser.GameObjects.Container, text: string): void {
    (container.getAt(1) as Phaser.GameObjects.Text).setText(text);
  }

  private showBubble(container: Phaser.GameObjects.Container, text: string): void {
    this.setBubbleText(container, text);
    container.setVisible(true);
    container.setScale(0);
    this.tweens.add({ targets: container, scale: 1, duration: 200, ease: 'Back.easeOut' });
  }

  // ============================================================
  // BUTTONS
  // ============================================================

  private createButtons(w: number, h: number): void {
    const moves: RPS[] = ['rock', 'scissors', 'paper'];
    const btnY = h - 70;
    const btnSpacing = 110;
    const startX = w / 2 - btnSpacing;

    moves.forEach((move, i) => {
      const bx = startX + i * btnSpacing;
      const declareBtn = this.createSingleButton(bx, btnY, RPS_EMOJI[move], RPS_NAME[move], () => this.onDeclareClick(move));
      this.declareButtons.push(declareBtn);
      const revealBtn = this.createSingleButton(bx, btnY, RPS_EMOJI[move], RPS_NAME[move], () => this.onRevealClick(move));
      revealBtn.setVisible(false);
      this.revealButtons.push(revealBtn);
    });

    this.declareLabel = this.add.text(w / 2, h - 110, '📢 宣称你要出的招式（可以骗人！）', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.revealLabel = this.add.text(w / 2, h - 110, '🎯 选择真正的出招！', {
      fontSize: '13px', color: '#ffcc66', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);
  }

  private createSingleButton(x: number, y: number, emoji: string, label: string, callback: () => void): Phaser.GameObjects.Container {
    const btnW = 90; const btnH = 50;
    const bg = this.add.graphics();
    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(0x334466, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      bg.lineStyle(2, 0x5577aa, 1);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    };
    const drawHover = () => {
      bg.clear();
      bg.fillStyle(0x445588, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      bg.lineStyle(2, 0x7799cc, 1);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    };
    drawNormal();

    const icon = this.add.text(0, -6, emoji, { fontSize: '24px' }).setOrigin(0.5);
    const lbl = this.add.text(0, 16, label, {
      fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, icon, lbl]);
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });
    container.setDepth(60);
    container.on('pointerover', drawHover);
    container.on('pointerout', drawNormal);
    container.on('pointerdown', callback);
    return container;
  }

  // ============================================================
  // DECLARE
  // ============================================================

  private startDeclarePhase(): void {
    this.phase = 'declare';
    this.transitioning = false;
    this.playerDeclare = null;
    this.playerActual = null;
    this.aiDeclare = null;
    this.aiActual = null;
    this.roundNum++;

    this.roundLabel.setText(`第 ${this.roundNum} 回合`);
    this.phaseLabel.setText('📢 宣称阶段').setColor('#ffdd88');

    this.declareButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.revealButtons.forEach((b) => b.setVisible(false));
    this.declareLabel.setVisible(true);
    this.revealLabel.setVisible(false);
    this.catBubble.setVisible(false);
    this.dogBubble.setVisible(false);
    this.catMoveEmoji.setVisible(false);
    this.dogMoveEmoji.setVisible(false);
  }

  private onDeclareClick(move: RPS): void {
    if (this.phase !== 'declare' || this.transitioning) return;
    this.transitioning = true;
    this.playerDeclare = move;
    this.declareButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
    this.showBubble(this.catBubble, `我要出${RPS_EMOJI[move]}${RPS_NAME[move]}！`);
    this.phaseLabel.setText(`你宣称：${RPS_EMOJI[move]} ${RPS_NAME[move]}`).setColor('#88ccff');
    this.time.delayedCall(600, () => this.aiChooseDeclare());
  }

  private aiChooseDeclare(): void {
    const moves: RPS[] = ['rock', 'scissors', 'paper'];
    this.aiActual = Phaser.Math.RND.pick(moves);
    const bluffChance = enemyConfig.bluffChance.value;
    if (Math.random() < bluffChance) {
      this.aiDeclare = this.aiActual;
    } else {
      this.aiDeclare = Phaser.Math.RND.pick(moves.filter((m) => m !== this.aiActual));
    }

    this.showBubble(this.dogBubble, `我要出${RPS_EMOJI[this.aiDeclare!]}${RPS_NAME[this.aiDeclare!]}！`);
    this.phaseLabel.setText(`小狗宣称：${RPS_EMOJI[this.aiDeclare!]} ${RPS_NAME[this.aiDeclare!]}`).setColor('#ffaa66');
    this.time.delayedCall(1000, () => this.startRevealPhase());
  }

  // ============================================================
  // REVEAL
  // ============================================================

  private startRevealPhase(): void {
    this.phase = 'reveal';
    this.transitioning = false;
    this.phaseLabel.setText('🎯 出招阶段').setColor('#66ddff');

    this.declareButtons.forEach((b) => b.setVisible(false));
    this.revealButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.declareLabel.setVisible(false);
    this.revealLabel.setVisible(true);
    this.catBubble.setVisible(false);
    this.dogBubble.setVisible(false);
  }

  private onRevealClick(move: RPS): void {
    if (this.phase !== 'reveal' || this.transitioning) return;
    this.transitioning = true;
    this.playerActual = move;
    this.revealButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
    this.phaseLabel.setText(`你出招：${RPS_EMOJI[move]} ${RPS_NAME[move]}`).setColor('#88ffaa');
    this.time.delayedCall(400, () => this.startCountdown());
  }

  // ============================================================
  // COUNTDOWN
  // ============================================================

  private startCountdown(): void {
    this.phase = 'countdown';
    this.countdownText.setVisible(true);
    const steps = ['3', '2', '1', '开始！'];
    let idx = 0;
    const showNext = () => {
      if (idx >= steps.length) {
        this.countdownText.setVisible(false);
        this.revealMoves();
        this.time.delayedCall(600, () => this.executeAttack());
        return;
      }
      const step = steps[idx];
      this.countdownText.setText(step);
      this.countdownText.setColor(step === '开始！' ? '#ffcc44' : '#ffffff');
      this.countdownText.setScale(1.5);
      this.tweens.add({ targets: this.countdownText, scale: 1, duration: 300, ease: 'Back.easeOut' });
      idx++;
      this.time.delayedCall(step === '开始！' ? 500 : 500, showNext);
    };
    showNext();
  }

  // Show both actual moves as large emoji above pets
  private revealMoves(): void {
    this.catMoveEmoji.setText(RPS_EMOJI[this.playerActual!]).setVisible(true).setAlpha(0).setScale(0.3);
    this.tweens.add({ targets: this.catMoveEmoji, alpha: 1, scale: 1.2, duration: 300, ease: 'Back.easeOut' });

    this.dogMoveEmoji.setText(RPS_EMOJI[this.aiActual!]).setVisible(true).setAlpha(0).setScale(0.3);
    this.tweens.add({ targets: this.dogMoveEmoji, alpha: 1, scale: 1.2, duration: 300, ease: 'Back.easeOut' });
  }

  // ============================================================
  // ATTACK
  // ============================================================

  private executeAttack(): void {
    this.phase = 'attack';
    const catMove = this.playerActual!;
    const dogMove = this.aiActual!;
    const catWins = RPS_WINS_AGAINST[catMove] === dogMove;
    const dogWins = RPS_WINS_AGAINST[dogMove] === catMove;
    const isDraw = catMove === dogMove;

    if (isDraw) {
      this.playAttackAnim(this.cat, 'cat_attack', CAT_START_X, 1);
      this.playAttackAnim(this.dog, 'dog_attack', DOG_START_X, -1);
      this.time.delayedCall(500, () => {
        this.playHitAnim(this.cat, 'cat_hit', CAT_START_X);
        this.playHitAnim(this.dog, 'dog_hit', DOG_START_X);
      });
      this.time.delayedCall(1200, () => this.showResult('draw'));
    } else if (catWins) {
      this.playAttackAnim(this.cat, 'cat_attack', CAT_START_X, 1);
      this.time.delayedCall(200, () => {
        this.dogHP = Math.max(0, this.dogHP - 1);
        this.drawHealthBars();
        this.dogHPText.setText(`${this.dogHP} / ${enemyConfig.maxHealth.value}`);
        this.playHitAnim(this.dog, 'dog_hit', DOG_START_X);
      });
      this.time.delayedCall(1200, () => this.showResult('player_win'));
    } else {
      this.playAttackAnim(this.dog, 'dog_attack', DOG_START_X, -1);
      this.time.delayedCall(200, () => {
        this.catHP = Math.max(0, this.catHP - 1);
        this.drawHealthBars();
        this.catHPText.setText(`${this.catHP} / ${playerConfig.maxHealth.value}`);
        this.playHitAnim(this.cat, 'cat_hit', CAT_START_X);
      });
      this.time.delayedCall(1200, () => this.showResult('player_lose'));
    }
  }

  private playAttackAnim(sprite: Phaser.GameObjects.Image, texKey: string, startX: number, dir: number): void {
    this.tweens.killTweensOf(sprite);
    sprite.setTexture(texKey);
    this.tweens.add({
      targets: sprite, x: startX + dir * 60, duration: 200, ease: 'Quad.easeOut', yoyo: true,
      onComplete: () => {
        sprite.x = startX;
        sprite.setTexture(texKey.startsWith('cat') ? 'cat_idle' : 'dog_idle');
      },
    });
  }

  private playHitAnim(sprite: Phaser.GameObjects.Image, texKey: string, startX: number): void {
    this.tweens.killTweensOf(sprite);
    sprite.setTexture(texKey);
    const dir = texKey.startsWith('cat') ? -1 : 1;
    this.tweens.add({
      targets: sprite, x: startX + dir * 20, duration: 60, yoyo: true, repeat: 3,
      onComplete: () => {
        sprite.x = startX;
        sprite.setTint(0xff4444);
        this.time.delayedCall(150, () => {
          sprite.clearTint();
          sprite.setTexture(texKey.startsWith('cat') ? 'cat_idle' : 'dog_idle');
          if (this.phase !== 'game_over') this.startIdleBobbing();
        });
      },
    });
  }

  // ============================================================
  // RESULT
  // ============================================================

  private showResult(outcome: 'player_win' | 'player_lose' | 'draw'): void {
    this.phase = 'result';

    const catBluffed = this.playerDeclare !== this.playerActual;
    const dogBluffed = this.aiDeclare !== this.aiActual;

    // Hide move emojis after a moment
    this.time.delayedCall(200, () => {
      this.catMoveEmoji.setVisible(false);
      this.dogMoveEmoji.setVisible(false);
    });

    if (outcome === 'player_win') {
      this.playerScore++;
      this.resultText.setText('🎉 你赢了！').setColor('#44ff88');
      this.tweens.killTweensOf(this.cat);
      this.cat.setTexture('cat_victory');
      this.tweens.add({
        targets: this.cat, y: PET_Y - 20, duration: 300, yoyo: true, ease: 'Back.easeOut',
        onComplete: () => { this.cat.setTexture('cat_idle'); this.startIdleBobbing(); },
      });
    } else if (outcome === 'player_lose') {
      this.aiScore++;
      this.resultText.setText('😵 小狗赢了！').setColor('#ff6666');
      this.tweens.killTweensOf(this.cat);
      this.cat.setTexture('cat_defeated');
      this.tweens.add({
        targets: this.cat, y: PET_Y + 10, duration: 400, ease: 'Bounce.easeOut',
        onComplete: () => { this.cat.setTexture('cat_idle'); this.startIdleBobbing(); },
      });
      this.tweens.killTweensOf(this.dog);
      this.dog.setTexture('dog_victory');
      this.tweens.add({
        targets: this.dog, y: PET_Y - 20, duration: 300, yoyo: true, ease: 'Back.easeOut',
        onComplete: () => { this.dog.setTexture('dog_idle'); },
      });
    } else {
      this.resultText.setText('🤝 平局！').setColor('#ffcc44');
    }

    this.scoreText.setText(`猫猫 ${this.playerScore} - ${this.aiScore} 小狗`);
    this.resultText.setVisible(true);

    // Detail: show declared → actual for both sides
    const playerDeclareText = `${RPS_EMOJI[this.playerDeclare!]}${RPS_NAME[this.playerDeclare!]}`;
    const playerActualText = `${RPS_EMOJI[this.playerActual!]}${RPS_NAME[this.playerActual!]}`;
    const aiDeclareText = `${RPS_EMOJI[this.aiDeclare!]}${RPS_NAME[this.aiDeclare!]}`;
    const aiActualText = `${RPS_EMOJI[this.aiActual!]}${RPS_NAME[this.aiActual!]}`;

    let detailStr = '';
    if (!catBluffed && !dogBluffed) {
      detailStr = `双方诚实：你出 ${playerActualText}  vs  小狗出 ${aiActualText}`;
    } else {
      detailStr = `你：宣称${playerDeclareText} → 实际${playerActualText}\n小狗：宣称${aiDeclareText} → 实际${aiActualText}`;
    }
    this.detailText.setText(detailStr).setVisible(true);

    let bluffMsg = '';
    if (catBluffed && dogBluffed) bluffMsg = '🃏 两边都骗人了！';
    else if (catBluffed) bluffMsg = '🎭 你骗人成功了！';
    else if (dogBluffed) bluffMsg = '🐕 小狗骗了你！';
    else bluffMsg = '😇 诚实对决！';
    this.bluffText.setText(bluffMsg).setVisible(true);

    if (this.catHP <= 0 || this.dogHP <= 0) {
      this.time.delayedCall(2000, () => this.endGame());
    } else {
      this.time.delayedCall(2500, () => {
        this.resultText.setVisible(false);
        this.detailText.setVisible(false);
        this.bluffText.setVisible(false);
        this.startDeclarePhase();
      });
    }
  }

  // ============================================================
  // GAME OVER
  // ============================================================

  private endGame(): void {
    this.phase = 'game_over';
    this.phaseLabel.setText('');

    if (this.dogHP <= 0) {
      this.cat.setTexture('cat_victory');
      this.dog.setTexture('dog_defeated');
      this.resultText.setText('🏆 胜利！').setColor('#ffdd44').setVisible(true);
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      this.time.delayedCall(1500, () => {
        this.scene.start('VictoryScene', { playerScore: this.playerScore, aiScore: this.aiScore, rounds: this.roundNum });
      });
    } else {
      this.cat.setTexture('cat_defeated');
      this.dog.setTexture('dog_victory');
      this.resultText.setText('💀 失败...').setColor('#ff4444').setVisible(true);
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      this.time.delayedCall(1500, () => {
        this.scene.start('DefeatScene', { playerScore: this.playerScore, aiScore: this.aiScore, rounds: this.roundNum });
      });
    }
  }
}
