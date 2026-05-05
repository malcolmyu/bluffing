import Phaser from 'phaser';
import type { World } from '../World';
import { C } from '../Components';
import type { PositionData, VisualStateData, RPS, Outcome } from '../Components';

type PetName = 'daodun' | 'bibilabu';

/**
 * Triggers Phaser tweens for attack, hit, victory, and defeated animations.
 * Reads CombatEvent to know what happened, then drives sprite textures and tweens.
 */
export class AnimationSystem {
  readonly requiredComponents = [C.Position] as const;

  private scene: Phaser.Scene;
  private world: World;
  private getImage: (entity: number) => Phaser.GameObjects.Image | undefined;

  constructor(scene: Phaser.Scene, world: World, getImage: (entity: number) => Phaser.GameObjects.Image | undefined) {
    this.scene = scene;
    this.world = world;
    this.getImage = getImage;
  }

  // Not per-frame — called explicitly by the orchestrator during attack/result phases.

  playAttack(entity: number, pet: PetName): void {
    const img = this.getImage(entity);
    if (!img) return;
    const pos = this.world.get<PositionData>(entity, C.Position)!;
    const vs = this.world.get<VisualStateData>(entity, C.VisualState);
    const startX = pos.x;
    const dir = pet === 'daodun' ? -1 : 1;

    if (vs) vs.state = 'attack';
    this.scene.tweens.killTweensOf(img);
    img.setTexture(`${pet}_attack`);
    this.scene.tweens.add({
      targets: img,
      x: startX + dir * 150,
      duration: 200,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        img.x = startX;
        img.setTexture(`${pet}_idle`);
        pos.x = startX;
        if (vs) vs.state = 'idle';
      },
    });
  }

  playHit(
    entity: number,
    pet: PetName,
    isCrit: boolean,
    onComplete?: () => void,
  ): void {
    const img = this.getImage(entity);
    if (!img) return;
    const pos = this.world.get<PositionData>(entity, C.Position)!;
    const vs = this.world.get<VisualStateData>(entity, C.VisualState);
    const startX = pos.x;
    const dir = pet === 'daodun' ? -1 : 1;
    const shakeDist = isCrit ? 60 : 45;
    const shakeRepeat = isCrit ? 5 : 3;

    if (vs) vs.state = 'hit';
    this.scene.tweens.killTweensOf(img);
    img.setTexture(`${pet}_hit`);
    this.scene.tweens.add({
      targets: img,
      x: startX + dir * shakeDist,
      duration: 60,
      yoyo: true,
      repeat: shakeRepeat,
      onComplete: () => {
        img.x = startX;
        pos.x = startX;
        img.setTint(isCrit ? 0xff8800 : 0xff4444);
        this.scene.time.delayedCall(150, () => {
          img.clearTint();
          img.setTexture(`${pet}_idle`);
          if (vs) vs.state = 'idle';
          onComplete?.();
        });
      },
    });
  }

  playVictory(entity: number, pet: PetName, onComplete?: () => void): void {
    const img = this.getImage(entity);
    if (!img) return;
    const vs = this.world.get<VisualStateData>(entity, C.VisualState);
    if (vs) vs.state = 'victory';
    img.setTexture(`${pet}_victory`);
    this.scene.tweens.add({
      targets: img,
      y: img.y - 60,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        img.setTexture(`${pet}_idle`);
        if (vs) vs.state = 'idle';
        onComplete?.();
      },
    });
  }

  playDefeated(entity: number, pet: PetName, onComplete?: () => void): void {
    const img = this.getImage(entity);
    if (!img) return;
    const vs = this.world.get<VisualStateData>(entity, C.VisualState);
    if (vs) vs.state = 'defeated';
    img.setTexture(`${pet}_defeated`);
    this.scene.tweens.add({
      targets: img,
      y: img.y + 30,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        img.setTexture(`${pet}_idle`);
        if (vs) vs.state = 'idle';
        onComplete?.();
      },
    });
  }

  showCritText(entity: number): void {
    const img = this.getImage(entity);
    if (!img) return;
    const crit = this.scene.add.text(img.x, img.y - 60, '💥 暴击！', {
      fontSize: '54px',
      color: '#C05030',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.scene.tweens.add({
      targets: crit,
      y: crit.y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => crit.destroy(),
    });
  }
}
