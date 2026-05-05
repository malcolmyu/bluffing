import Phaser from 'phaser';
import { World } from '../ecs/World';
import { C } from '../ecs/Components';
import type { PositionData, SpriteData, HealthData, BluffIntentData, VisualStateData, PlayerTagData, AITagData, IdleBobbingData, PhaseData, RoundData, ScoreData, GraphicsRefData } from '../ecs/Components';
import { PhaseSystem } from '../ecs/systems/PhaseSystem';
import { InputSystem } from '../ecs/systems/InputSystem';
import { AISystem } from '../ecs/systems/AISystem';
import { DeclarationSystem } from '../ecs/systems/DeclarationSystem';
import { CountdownSystem } from '../ecs/systems/CountdownSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import { AnimationSystem } from '../ecs/systems/AnimationSystem';
import { HealthBarSystem } from '../ecs/systems/HealthBarSystem';
import { ResultSystem } from '../ecs/systems/ResultSystem';
import { BobSystem } from '../ecs/systems/BobSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';
import { playerConfig, enemyConfig } from '../gameConfig.json';

const DAODUN_X = 300;
const BIBILABU_X = 870;
const PET_Y = 930;

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.drawBackground(width, height);

    // ==========================================================
    // 1. Create ECS World
    // ==========================================================
    const world = new World();

    // ==========================================================
    // 2. Spawn game state entity
    // ==========================================================
    const game = world.spawn();
    world.add<PhaseData>(game, C.Phase, { current: 'declare', transitioning: false });
    world.add<RoundData>(game, C.Round, { number: 0 });
    world.add<ScoreData>(game, C.Score, { player: 0, ai: 0 });

    // ==========================================================
    // 3. Spawn daodun (player pet)
    // ==========================================================
    const daodun = world.spawn();
    world.add<PositionData>(daodun, C.Position, { x: DAODUN_X, y: PET_Y });
    world.add<SpriteData>(daodun, C.Sprite, { texture: 'daodun_idle', scale: 0.9, flipX: true, depth: 10, visible: true });
    world.add<HealthData>(daodun, C.Health, { current: playerConfig.maxHealth.value, max: playerConfig.maxHealth.value });
    world.add<BluffIntentData>(daodun, C.BluffIntent, { declare: null, actual: null });
    world.add<VisualStateData>(daodun, C.VisualState, { state: 'idle' });
    world.add<PlayerTagData>(daodun, C.PlayerTag, {});
    world.add<IdleBobbingData>(daodun, C.IdleBobbing, { baseY: PET_Y, amplitude: 9, halfDuration: 800 });
    world.add<GraphicsRefData>(daodun, C.GraphicsRef, { obj: this.add.graphics() });

    // ==========================================================
    // 4. Spawn bibilabu (AI pet)
    // ==========================================================
    const bibilabu = world.spawn();
    world.add<PositionData>(bibilabu, C.Position, { x: BIBILABU_X, y: PET_Y });
    world.add<SpriteData>(bibilabu, C.Sprite, { texture: 'bibilabu_idle', scale: 0.9, flipX: false, depth: 10, visible: true });
    world.add<HealthData>(bibilabu, C.Health, { current: enemyConfig.maxHealth.value, max: enemyConfig.maxHealth.value });
    world.add<BluffIntentData>(bibilabu, C.BluffIntent, { declare: null, actual: null });
    world.add<VisualStateData>(bibilabu, C.VisualState, { state: 'idle' });
    world.add<AITagData>(bibilabu, C.AITag, { bluffChance: enemyConfig.bluffChance.value });
    world.add<IdleBobbingData>(bibilabu, C.IdleBobbing, { baseY: PET_Y, amplitude: 9, halfDuration: 900 });
    world.add<GraphicsRefData>(bibilabu, C.GraphicsRef, { obj: this.add.graphics() });

    // ==========================================================
    // 5. Create HP text (direct Phaser objects)
    // ==========================================================
    const hpTextY = 234;
    const daodunHPText = this.add.text(DAODUN_X, hpTextY, '', {
      fontSize: '33px', color: '#3A3630', fontFamily: 'monospace',
    }).setOrigin(0.5);
    const bibilabuHPText = this.add.text(BIBILABU_X, hpTextY, '', {
      fontSize: '33px', color: '#3A3630', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ==========================================================
    // 6. Create hearts (decorative, direct Phaser objects)
    // ==========================================================
    const barW = 240;
    const heartY = 180;
    this.generateHeartIcon();
    this.add.image(DAODUN_X - barW / 2 - 30, heartY, 'heart_icon').setScale(0.9).setDepth(1);
    this.add.image(BIBILABU_X - barW / 2 - 30, heartY, 'heart_icon').setScale(0.9).setDepth(1);

    // ==========================================================
    // 7. Create all systems
    // ==========================================================
    const renderSystem = new RenderSystem(this);
    const bobSystem = new BobSystem();
    const healthBarSystem = new HealthBarSystem();
    const inputSystem = new InputSystem(this, world, game);
    const aiSystem = new AISystem(world);
    const declarationSystem = new DeclarationSystem(this);
    const countdownSystem = new CountdownSystem(this);
    const combatSystem = new CombatSystem(world, game);
    const animationSystem = new AnimationSystem(this, world, (e) => renderSystem.getImage(e));
    const resultSystem = new ResultSystem(this, world, game);
    const phaseSystem = new PhaseSystem(this, world, game, daodun, bibilabu);

    // Wire conductor to all method-driven systems
    phaseSystem.wire({
      input: inputSystem,
      ai: aiSystem,
      decl: declarationSystem,
      countdown: countdownSystem,
      combat: combatSystem,
      anim: animationSystem,
      result: resultSystem,
    });

    // ==========================================================
    // 8. Register per-frame systems (run every tick)
    // ==========================================================
    world.addSystem(bobSystem);
    world.addSystem(healthBarSystem);
    world.addSystem(renderSystem);

    // HealthBarSystem also runs per-frame to update HP text
    // We extend it with a direct update callback
    const updateHPTexts = () => {
      const dh = world.get<HealthData>(daodun, C.Health)!;
      const bh = world.get<HealthData>(bibilabu, C.Health)!;
      daodunHPText.setText(`${dh.current} / ${dh.max}`);
      bibilabuHPText.setText(`${bh.current} / ${bh.max}`);
    };

    // ==========================================================
    // 9. Create UI elements via systems
    // ==========================================================
    inputSystem.createButtons(width, height);
    declarationSystem.createBubbles();
    countdownSystem.create();
    resultSystem.create();

    // ==========================================================
    // 10. Start game loop
    // ==========================================================
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        world.update(16);
        updateHPTexts();
      },
    });

    // ==========================================================
    // 11. Kick off first phase
    // ==========================================================
    this.time.delayedCall(500, () => phaseSystem.startDeclarePhase());
    this.cameras.main.fadeIn(400, 253, 251, 247);
  }

  // ============================================================
  // BACKGROUND
  // ============================================================

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();

    const skyColors = [0xFDFBF7, 0xF8F4ED, 0xF0EDE8, 0xF5F2EC, 0xFDFBF7];
    const bandH = h / skyColors.length;
    skyColors.forEach((color, i) => {
      bg.fillStyle(color, 1);
      bg.fillRect(0, i * bandH, w, bandH + 1);
    });

    bg.fillStyle(0xD8D0C5, 0.45);
    const dotPositions = [
      [120, 80, 2], [340, 150, 1.5], [580, 60, 3], [890, 120, 2], [1050, 90, 2],
      [80, 280, 1.5], [260, 340, 2.5], [500, 220, 1.5], [720, 300, 2], [950, 260, 1.5],
      [1090, 350, 2.5], [180, 180, 1], [650, 140, 1.5], [420, 100, 2], [780, 200, 1],
    ];
    dotPositions.forEach(([sx, sy, sr]) => {
      bg.fillCircle(sx as number, sy as number, sr as number);
    });

    const crossDots = [[200, 120], [600, 80], [1000, 200], [400, 380]] as const;
    bg.fillStyle(0xD0C8BA, 0.4);
    crossDots.forEach(([csx, csy]) => {
      bg.fillCircle(csx, csy, 2);
      bg.fillRect(csx - 4, csy - 0.5, 8, 1);
      bg.fillRect(csx - 0.5, csy - 4, 1, 8);
    });

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

    bg.fillStyle(0xC5BCAE, 0.4);
    for (let x = 40; x < w; x += 80) {
      const t = x / w;
      const curve = Math.sin(t * Math.PI) * 30 + Math.sin(t * Math.PI * 2) * 10;
      bg.fillCircle(x, stageY + curve - 4, 5);
    }

    bg.setDepth(0);
  }

  private generateHeartIcon(): void {
    if (this.textures.exists('heart_icon')) return;
    const g = this.add.graphics();
    g.fillStyle(0xff4466, 1);
    g.fillCircle(8, 8, 6);
    g.fillCircle(18, 8, 6);
    g.fillTriangle(2, 12, 24, 12, 13, 24);
    g.generateTexture('heart_icon', 26, 26);
    g.destroy();
  }
}
