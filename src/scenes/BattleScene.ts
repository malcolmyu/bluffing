import Phaser from 'phaser';
import { playerConfig, enemyConfig } from '../gameConfig.json';

type RPS = 'rock' | 'scissors' | 'paper';
type Phase = 'declare' | 'wait_ai_declare' | 'reveal' | 'countdown' | 'attack' | 'result' | 'game_over';

const RPS_EMOJI: Record<RPS, string> = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_NAME: Record<RPS, string> = { rock: '石头', scissors: '剪刀', paper: '布' };
const RPS_WINS_AGAINST: Record<RPS, RPS> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

const DAODUN_START_X = 300;
const BIBILABU_START_X = 870;
const PET_Y = 930;

export class BattleScene extends Phaser.Scene {
  private daodun!: Phaser.GameObjects.Image;
  private bibilabu!: Phaser.GameObjects.Image;

  private daodunHP = playerConfig.maxHealth.value;
  private bibilabuHP = enemyConfig.maxHealth.value;
  private daodunHPBar!: Phaser.GameObjects.Graphics;
  private bibilabuHPBar!: Phaser.GameObjects.Graphics;
  private daodunHPText!: Phaser.GameObjects.Text;
  private bibilabuHPText!: Phaser.GameObjects.Text;

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

  private daodunBubble!: Phaser.GameObjects.Container;
  private bibilabuBubble!: Phaser.GameObjects.Container;
  private countdownText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private detailText!: Phaser.GameObjects.Text;
  private bluffText!: Phaser.GameObjects.Text;

  private daodunMoveEmoji!: Phaser.GameObjects.Text;
  private bibilabuMoveEmoji!: Phaser.GameObjects.Text;

  private roundNum = 0;
  private transitioning = false;

  private daodunHeart!: Phaser.GameObjects.Image;
  private bibilabuHeart!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.daodunHP = playerConfig.maxHealth.value;
    this.bibilabuHP = enemyConfig.maxHealth.value;
    this.playerScore = 0;
    this.aiScore = 0;
    this.roundNum = 0;
    this.phase = 'declare';
    this.transitioning = false;
    this.playerDeclare = null;
    this.playerActual = null;
    this.aiDeclare = null;
    this.aiActual = null;

    this.declareButtons = [];
    this.revealButtons = [];

    this.drawBackground(width, height);

    this.daodun = this.add.image(DAODUN_START_X, PET_Y, 'daodun_idle').setScale(0.9).setFlipX(true);
    this.bibilabu = this.add.image(BIBILABU_START_X, PET_Y, 'bibilabu_idle').setScale(0.9);
    this.startIdleBobbing();

    const barW = 240; const barH = 30;
    this.daodunHPBar = this.add.graphics();
    this.bibilabuHPBar = this.add.graphics();
    const heartX1 = DAODUN_START_X - barW / 2 - 30;
    const heartX2 = BIBILABU_START_X - barW / 2 - 30;
    const heartY = 180;
    this.daodunHeart = this.add.image(heartX1, heartY, 'heart_icon').setScale(0.9).setDepth(1);
    this.bibilabuHeart = this.add.image(heartX2, heartY, 'heart_icon').setScale(0.9).setDepth(1);
    this.drawHealthBars();

    const hpTextY = 234;
    this.daodunHPText = this.add.text(DAODUN_START_X, hpTextY, `${this.daodunHP} / ${playerConfig.maxHealth.value}`, {
      fontSize: '33px', color: '#3A3630', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.bibilabuHPText = this.add.text(BIBILABU_START_X, hpTextY, `${this.bibilabuHP} / ${enemyConfig.maxHealth.value}`, {
      fontSize: '33px', color: '#3A3630', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(width / 2, 30, `刀盾 ${this.playerScore} - ${this.aiScore} 比比拉布`, {
      fontSize: '42px', color: '#5A5550', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.phaseLabel = this.add.text(width / 2, 90, '📢 宣称阶段', {
      fontSize: '54px', color: '#8A8070', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.roundLabel = this.add.text(width / 2, 300, '', {
      fontSize: '36px', color: '#8A8580', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.daodunBubble = this.createSpeechBubble(DAODUN_START_X, PET_Y - 270, '');
    this.daodunBubble.setVisible(false);
    this.bibilabuBubble = this.createSpeechBubble(BIBILABU_START_X, PET_Y - 270, '');
    this.bibilabuBubble.setVisible(false);

    this.countdownText = this.add.text(width / 2, height / 2 - 60, '', {
      fontSize: '192px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    const resultBaseY = PET_Y + 330;
    this.resultText = this.add.text(width / 2, resultBaseY, '', {
      fontSize: '84px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.detailText = this.add.text(width / 2, resultBaseY + 84, '', {
      fontSize: '39px', color: '#6A6560', fontFamily: 'monospace',
      align: 'center', wordWrap: { width: 1020 },
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.bluffText = this.add.text(width / 2, resultBaseY + 174, '', {
      fontSize: '42px', color: '#A08850', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false).setDepth(90);

    this.daodunMoveEmoji = this.add.text(DAODUN_START_X, PET_Y - 330, '', {
      fontSize: '126px',
    }).setOrigin(0.5).setVisible(false).setDepth(80);

    this.bibilabuMoveEmoji = this.add.text(BIBILABU_START_X, PET_Y - 330, '', {
      fontSize: '126px',
    }).setOrigin(0.5).setVisible(false).setDepth(80);

    this.createButtons(width, height);

    this.time.delayedCall(500, () => this.startDeclarePhase());
    this.cameras.main.fadeIn(400, 253, 251, 247);
  }

  // ============================================================
  // BACKGROUND
  // ============================================================

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();

    // Warm cream gradient background
    const skyColors = [0xFDFBF7, 0xF8F4ED, 0xF0EDE8, 0xF5F2EC, 0xFDFBF7];
    const bandH = h / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, w, bandH + 1);
    });

    // Subtle warm dots
    bg.fillStyle(0xD8D0C5, 0.45);
    const dotPositions = [
      [120, 80, 2], [340, 150, 1.5], [580, 60, 3], [890, 120, 2], [1050, 90, 2],
      [80, 280, 1.5], [260, 340, 2.5], [500, 220, 1.5], [720, 300, 2], [950, 260, 1.5],
      [1090, 350, 2.5], [180, 180, 1], [650, 140, 1.5], [420, 100, 2], [780, 200, 1],
    ];
    dotPositions.forEach(([sx, sy, sr]) => {
      bg.fillCircle(sx as number, sy as number, sr as number);
    });

    // Subtle cross accents
    const crossDots = [[200, 120], [600, 80], [1000, 200], [400, 380]] as const;
    bg.fillStyle(0xD0C8BA, 0.4);
    crossDots.forEach(([csx, csy]) => {
      bg.fillCircle(csx, csy, 2);
      bg.fillRect(csx - 4, csy - 0.5, 8, 1);
      bg.fillRect(csx - 0.5, csy - 4, 1, 8);
    });

    // Curved stage platform (light warm beige)
    const stageY = PET_Y + 195;
    bg.fillStyle(0xE8E0D5, 1);
    bg.beginPath();
    bg.moveTo(0, stageY + 40);
    for (let x = 0; x <= w; x += 20) {
      const t = x / w;
      const curve = Math.sin(t * Math.PI) * 30 + Math.sin(t * Math.PI * 2) * 10;
      bg.lineTo(x, stageY + curve);
    }
    bg.lineTo(w, h);
    bg.lineTo(0, h);
    bg.closePath();
    bg.fillPath();

    // Stage highlight
    bg.fillStyle(0xF0EBE2, 0.6);
    bg.beginPath();
    bg.moveTo(0, stageY + 42);
    for (let x = 0; x <= w; x += 20) {
      const t = x / w;
      const curve = Math.sin(t * Math.PI) * 20;
      bg.lineTo(x, stageY + 8 + curve);
    }
    bg.lineTo(w, h);
    bg.lineTo(0, h);
    bg.closePath();
    bg.fillPath();

    // Decorative dots along stage edge
    bg.fillStyle(0xC5BCAE, 0.4);
    for (let x = 40; x < w; x += 80) {
      const t = x / w;
      const curve = Math.sin(t * Math.PI) * 30 + Math.sin(t * Math.PI * 2) * 10;
      bg.fillCircle(x, stageY + curve - 4, 5);
    }

    bg.setDepth(0);
  }

  // ============================================================
  // IDLE
  // ============================================================

  private startIdleBobbing(): void {
    this.tweens.add({ targets: this.daodun, y: PET_Y - 9, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.bibilabu, y: PET_Y - 9, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ============================================================
  // HEALTH
  // ============================================================

  private drawHealthBars(): void {
    const barW = 240; const barH = 30;
    const barY = 165;

    const drawOneBar = (g: Phaser.GameObjects.Graphics, x: number, ratio: number, flipped: boolean) => {
      g.clear();
      // Soft shadow
      g.fillStyle(0x000000, 0.06);
      g.fillRoundedRect(x - barW / 2 + 2, barY + 2, barW, barH, 10);
      // Background
      g.fillStyle(0xE8E3DA, 1);
      g.fillRoundedRect(x - barW / 2, barY, barW, barH, 10);
      // Health fill (soft pastels)
      const color = ratio > 0.5 ? 0x7ECB8A : ratio > 0.25 ? 0xF0C060 : 0xE87870;
      if (ratio > 0) {
        g.fillStyle(color, 1);
        if (flipped) {
          g.fillRoundedRect(x + barW / 2 - barW * ratio, barY, barW * ratio, barH, 8);
        } else {
          g.fillRoundedRect(x - barW / 2, barY, barW * ratio, barH, 8);
        }
      }
      // Border
      g.lineStyle(2, 0xC5BDB0, 1);
      g.strokeRoundedRect(x - barW / 2, barY, barW, barH, 10);
    };

    const daodunRatio = this.daodunHP / playerConfig.maxHealth.value;
    drawOneBar(this.daodunHPBar, DAODUN_START_X, daodunRatio, false);
    const bibilabuRatio = this.bibilabuHP / enemyConfig.maxHealth.value;
    drawOneBar(this.bibilabuHPBar, BIBILABU_START_X, bibilabuRatio, true);
  }

  // ============================================================
  // SPEECH BUBBLE
  // ============================================================

  private createSpeechBubble(x: number, y: number, text: string): Phaser.GameObjects.Container {
    const bubbleW = 300; const bubbleH = 96;
    const g = this.add.graphics();
    // Soft shadow
    g.fillStyle(0x000000, 0.05);
    g.fillRoundedRect(-bubbleW / 2 + 3, -bubbleH / 2 + 3, bubbleW, bubbleH, 24);
    // Main bubble
    g.fillStyle(0xFFFEFA, 0.98);
    g.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 24);
    // Thin border
    g.lineStyle(2, 0xD0CCC5, 1);
    g.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 24);
    // Tail
    g.fillStyle(0xFFFEFA, 0.98);
    g.fillTriangle(-16, bubbleH / 2, 16, bubbleH / 2, 0, bubbleH / 2 + 20);
    g.lineStyle(2, 0xD0CCC5, 1);
    g.beginPath();
    g.moveTo(-16, bubbleH / 2);
    g.lineTo(0, bubbleH / 2 + 20);
    g.lineTo(16, bubbleH / 2);
    g.strokePath();

    const txt = this.add.text(0, 0, text, {
      fontSize: '30px', color: '#3A3630', fontFamily: 'monospace', fontStyle: 'bold', align: 'center',
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

    this.declareLabel = this.add.text(w / 2, labelY, '📢 宣称你要出的招式  (可以骗人哦！)', {
      fontSize: '33px', color: '#8A80A0', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.revealLabel = this.add.text(w / 2, labelY, '🎯 选择你真正要出的招式！', {
      fontSize: '33px', color: '#A08040', fontFamily: 'monospace',
    }).setOrigin(0.5).setVisible(false);
  }

  private createSingleButton(x: number, y: number, emoji: string, label: string, callback: () => void): Phaser.GameObjects.Container {
    const btnW = 255; const btnH = 144;
    const bg = this.add.graphics();
    const drawNormal = () => {
      bg.clear();
      // Soft shadow
      bg.fillStyle(0x000000, 0.06);
      bg.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 4, btnW, btnH, 32);
      // Main fill
      bg.fillStyle(0xF5F0EB, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 32);
      // Subtle border
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

    const icon = this.add.text(0, -12, emoji, { fontSize: '66px' }).setOrigin(0.5);
    const lbl = this.add.text(0, 48, label, {
      fontSize: '33px', color: '#4A4540', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, icon, lbl]);
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
    this.phaseLabel.setText('📢 宣称阶段').setColor('#A89850');

    this.declareButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.revealButtons.forEach((b) => b.setVisible(false));
    this.declareLabel.setVisible(true);
    this.revealLabel.setVisible(false);
    this.daodunBubble.setVisible(false);
    this.bibilabuBubble.setVisible(false);
    this.daodunMoveEmoji.setVisible(false);
    this.bibilabuMoveEmoji.setVisible(false);
  }

  private onDeclareClick(move: RPS): void {
    if (this.phase !== 'declare' || this.transitioning) return;
    this.transitioning = true;
    this.playerDeclare = move;
    this.declareButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
    this.showBubble(this.daodunBubble, `我要出${RPS_EMOJI[move]}${RPS_NAME[move]}！`);
    this.phaseLabel.setText(`你宣称：${RPS_EMOJI[move]} ${RPS_NAME[move]}`).setColor('#6090B0');
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

    this.showBubble(this.bibilabuBubble, `我要出${RPS_EMOJI[this.aiDeclare!]}${RPS_NAME[this.aiDeclare!]}！`);
    this.phaseLabel.setText(`比比拉布宣称：${RPS_EMOJI[this.aiDeclare!]} ${RPS_NAME[this.aiDeclare!]}`).setColor('#B08050');
    this.time.delayedCall(1000, () => this.startRevealPhase());
  }

  // ============================================================
  // REVEAL
  // ============================================================

  private startRevealPhase(): void {
    this.phase = 'reveal';
    this.transitioning = false;
    this.phaseLabel.setText('🎯 出招阶段').setColor('#5090A0');

    this.declareButtons.forEach((b) => b.setVisible(false));
    this.revealButtons.forEach((b) => { b.setVisible(true); b.setInteractive(true); b.setAlpha(1); });
    this.declareLabel.setVisible(false);
    this.revealLabel.setVisible(true);
    this.daodunBubble.setVisible(false);
    this.bibilabuBubble.setVisible(false);
  }

  private onRevealClick(move: RPS): void {
    if (this.phase !== 'reveal' || this.transitioning) return;
    this.transitioning = true;
    this.playerActual = move;
    this.revealButtons.forEach((b) => b.setInteractive(false).setAlpha(0.5));
    this.phaseLabel.setText(`你出招：${RPS_EMOJI[move]} ${RPS_NAME[move]}`).setColor('#509A60');
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
      this.countdownText.setColor(step === '开始！' ? '#A89830' : '#3A3630');
      this.countdownText.setScale(1.5);
      this.tweens.add({ targets: this.countdownText, scale: 1, duration: 300, ease: 'Back.easeOut' });
      idx++;
      this.time.delayedCall(step === '开始！' ? 500 : 500, showNext);
    };
    showNext();
  }

  private revealMoves(): void {
    this.daodunMoveEmoji.setText(RPS_EMOJI[this.playerActual!]).setVisible(true).setAlpha(0).setScale(0.3);
    this.tweens.add({ targets: this.daodunMoveEmoji, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut' });

    this.bibilabuMoveEmoji.setText(RPS_EMOJI[this.aiActual!]).setVisible(true).setAlpha(0).setScale(0.3);
    this.tweens.add({ targets: this.bibilabuMoveEmoji, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut' });
  }

  // ============================================================
  // ATTACK
  // ============================================================

  private executeAttack(): void {
    this.phase = 'attack';
    const daodunMove = this.playerActual!;
    const bibilabuMove = this.aiActual!;
    const daodunWins = RPS_WINS_AGAINST[daodunMove] === bibilabuMove;
    const bibilabuWins = RPS_WINS_AGAINST[bibilabuMove] === daodunMove;
    const isDraw = daodunMove === bibilabuMove;

    if (isDraw) {
      this.playAttackAnim(this.daodun, DAODUN_START_X, -1, 'daodun');
      this.playAttackAnim(this.bibilabu, BIBILABU_START_X, 1, 'bibilabu');
      this.time.delayedCall(500, () => {
        this.playHitAnim(this.daodun, DAODUN_START_X, 'daodun');
        this.playHitAnim(this.bibilabu, BIBILABU_START_X, 'bibilabu');
      });
      this.time.delayedCall(1200, () => this.showResult('draw'));
    } else if (daodunWins) {
      const isCrit = this.playerDeclare === this.playerActual;
      const dmg = isCrit ? 2 : 1;
      this.playAttackAnim(this.daodun, DAODUN_START_X, -1, 'daodun');
      this.time.delayedCall(200, () => {
        this.bibilabuHP = Math.max(0, this.bibilabuHP - dmg);
        this.drawHealthBars();
        this.bibilabuHPText.setText(`${this.bibilabuHP} / ${enemyConfig.maxHealth.value}`);
        this.playHitAnim(this.bibilabu, BIBILABU_START_X, 'bibilabu', isCrit);
        if (isCrit) this.showCritText(BIBILABU_START_X, PET_Y);
      });
      this.time.delayedCall(1200, () => this.showResult('player_win'));
    } else {
      this.playAttackAnim(this.bibilabu, BIBILABU_START_X, 1, 'bibilabu');
      this.time.delayedCall(200, () => {
        this.daodunHP = Math.max(0, this.daodunHP - 1);
        this.drawHealthBars();
        this.daodunHPText.setText(`${this.daodunHP} / ${playerConfig.maxHealth.value}`);
        this.playHitAnim(this.daodun, DAODUN_START_X, 'daodun');
      });
      this.time.delayedCall(1200, () => this.showResult('player_lose'));
    }
  }

  private showCritText(x: number, y: number): void {
    const crit = this.add.text(x, y - 60, '💥 暴击！', {
      fontSize: '54px', color: '#C05030', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: crit, y: crit.y - 60, alpha: 0, duration: 1000, ease: 'Quad.easeOut',
      onComplete: () => crit.destroy(),
    });
  }

  private playAttackAnim(sprite: Phaser.GameObjects.Image, startX: number, dir: number, pet: 'daodun' | 'bibilabu'): void {
    this.tweens.killTweensOf(sprite);
    sprite.setTexture(`${pet}_attack`);
    this.tweens.add({
      targets: sprite, x: startX + dir * 150, duration: 200, ease: 'Quad.easeOut', yoyo: true,
      onComplete: () => {
        sprite.x = startX;
        sprite.setTexture(`${pet}_idle`);
      },
    });
  }

  private playHitAnim(sprite: Phaser.GameObjects.Image, startX: number, pet: 'daodun' | 'bibilabu', isCrit = false): void {
    this.tweens.killTweensOf(sprite);
    sprite.setTexture(`${pet}_hit`);
    const dir = pet === 'daodun' ? -1 : 1;
    const shakeDist = isCrit ? 60 : 45;
    const shakeRepeat = isCrit ? 5 : 3;
    this.tweens.add({
      targets: sprite, x: startX + dir * shakeDist, duration: 60, yoyo: true, repeat: shakeRepeat,
      onComplete: () => {
        sprite.x = startX;
        sprite.setTint(isCrit ? 0xff8800 : 0xff4444);
        this.time.delayedCall(150, () => {
          sprite.clearTint();
          sprite.setTexture(`${pet}_idle`);
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

    const daodunBluffed = this.playerDeclare !== this.playerActual;
    const bibilabuBluffed = this.aiDeclare !== this.aiActual;

    this.time.delayedCall(200, () => {
      this.daodunMoveEmoji.setVisible(false);
      this.bibilabuMoveEmoji.setVisible(false);
    });

    if (outcome === 'player_win') {
      this.playerScore++;
      const isCrit = !daodunBluffed;
      this.resultText.setText(isCrit ? '💥 暴击！' : '🎉 你赢了！').setColor(isCrit ? '#B06030' : '#4A9A5A');
      this.tweens.killTweensOf(this.daodun);
      this.daodun.setTexture('daodun_victory');
      this.tweens.add({
        targets: this.daodun, y: PET_Y - 60, duration: 300, yoyo: true, ease: 'Back.easeOut',
        onComplete: () => { this.daodun.setTexture('daodun_idle'); this.startIdleBobbing(); },
      });
    } else if (outcome === 'player_lose') {
      this.aiScore++;
      this.resultText.setText('😵 比比拉布赢了！').setColor('#B04040');
      this.tweens.killTweensOf(this.daodun);
      this.daodun.setTexture('daodun_defeated');
      this.tweens.add({
        targets: this.daodun, y: PET_Y + 30, duration: 400, ease: 'Bounce.easeOut',
        onComplete: () => { this.daodun.setTexture('daodun_idle'); this.startIdleBobbing(); },
      });
      this.tweens.killTweensOf(this.bibilabu);
      this.bibilabu.setTexture('bibilabu_victory');
      this.tweens.add({
        targets: this.bibilabu, y: PET_Y - 60, duration: 300, yoyo: true, ease: 'Back.easeOut',
        onComplete: () => { this.bibilabu.setTexture('bibilabu_idle'); },
      });
    } else {
      this.resultText.setText('🤝 平局！').setColor('#A89830');
    }

    this.scoreText.setText(`刀盾 ${this.playerScore} - ${this.aiScore} 比比拉布`);
    this.resultText.setVisible(true);

    const playerDeclareText = `${RPS_EMOJI[this.playerDeclare!]}${RPS_NAME[this.playerDeclare!]}`;
    const playerActualText = `${RPS_EMOJI[this.playerActual!]}${RPS_NAME[this.playerActual!]}`;
    const aiDeclareText = `${RPS_EMOJI[this.aiDeclare!]}${RPS_NAME[this.aiDeclare!]}`;
    const aiActualText = `${RPS_EMOJI[this.aiActual!]}${RPS_NAME[this.aiActual!]}`;

    let detailStr = '';
    if (!daodunBluffed && !bibilabuBluffed) {
      detailStr = `双方诚实：你出 ${playerActualText}  vs  比比拉布出 ${aiActualText}`;
    } else {
      detailStr = `你：宣称${playerDeclareText} → 实际${playerActualText}\n比比拉布：宣称${aiDeclareText} → 实际${aiActualText}`;
    }
    this.detailText.setText(detailStr).setVisible(true);

    let bluffMsg = '';
    if (outcome === 'player_win') {
      if (!daodunBluffed) {
        bluffMsg = '💥 诚实暴击！扣 2 分！';
      } else if (bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗人了，但你还是赢了！';
      } else {
        bluffMsg = '🎭 骗人成功，你赢了！';
      }
    } else if (outcome === 'player_lose') {
      if (daodunBluffed && bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗了，但你输了...';
      } else if (daodunBluffed) {
        bluffMsg = '😞 骗人失败了...';
      } else if (bibilabuBluffed) {
        bluffMsg = '🐕 比比拉布骗了你，你输了！';
      } else {
        bluffMsg = '😔 诚实对决，但比比拉布赢了...';
      }
    } else {
      // draw
      if (daodunBluffed && bibilabuBluffed) {
        bluffMsg = '🃏 两边都骗人了，打个平手！';
      } else if (daodunBluffed) {
        bluffMsg = '🎭 你骗人了，但打了个平局';
      } else if (bibilabuBluffed) {
        bluffMsg = '🐕 比比拉布骗了你，不过平局！';
      } else {
        bluffMsg = '😇 诚实对决，平局！';
      }
    }
    this.bluffText.setText(bluffMsg).setVisible(true);

    if (this.daodunHP <= 0 || this.bibilabuHP <= 0) {
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

    if (this.bibilabuHP <= 0) {
      this.daodun.setTexture('daodun_victory');
      this.bibilabu.setTexture('bibilabu_defeated');
      this.resultText.setText('🏆 胜利！').setColor('#A89830').setVisible(true);
      this.cameras.main.fadeOut(1500, 253, 251, 247);
      this.time.delayedCall(1500, () => {
        this.scene.start('VictoryScene', { playerScore: this.playerScore, aiScore: this.aiScore, rounds: this.roundNum });
      });
    } else {
      this.daodun.setTexture('daodun_defeated');
      this.bibilabu.setTexture('bibilabu_victory');
      this.resultText.setText('💀 失败...').setColor('#B04040').setVisible(true);
      this.cameras.main.fadeOut(1500, 253, 251, 247);
      this.time.delayedCall(1500, () => {
        this.scene.start('DefeatScene', { playerScore: this.playerScore, aiScore: this.aiScore, rounds: this.roundNum });
      });
    }
  }
}
