import Phaser from 'phaser';
import type { World } from '../World';
import { C } from '../Components';
import type { PositionData, SpriteData, VisualStateData } from '../Components';

/**
 * Bridges ECS Position + Sprite components to Phaser Image objects.
 * On first encounter, creates the Phaser Image. On subsequent frames,
 * syncs texture, scale, flipX, and visible.
 *
 * Position is only synced when the entity is idle — during animations,
 * the AnimationSystem controls image position via tweens.
 */
export class RenderSystem {
  readonly requiredComponents = [C.Position, C.Sprite] as const;

  private scene: Phaser.Scene;
  /** entity id → Phaser Image */
  private images = new Map<number, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(_world: World, entities: number[]): void {
    for (const e of entities) {
      const pos = _world.get<PositionData>(e, C.Position)!;
      const spr = _world.get<SpriteData>(e, C.Sprite)!;

      let img = this.images.get(e);
      if (!img) {
        img = this.scene.add.image(pos.x, pos.y, spr.texture);
        img.setScale(spr.scale);
        img.setFlipX(spr.flipX);
        img.setDepth(spr.depth);
        img.setVisible(spr.visible);
        this.images.set(e, img);
      }

      if (!spr.visible) {
        img.setVisible(false);
        continue;
      }

      // Only sync position when idle — animations control position via tweens
      const vs = _world.get<VisualStateData>(e, C.VisualState);
      if (!vs || vs.state === 'idle') {
        img.setPosition(pos.x, pos.y);
      }

      if (img.texture.key !== spr.texture) {
        img.setTexture(spr.texture);
      }
      img.setScale(spr.scale);
      img.setFlipX(spr.flipX);
      img.setVisible(spr.visible);
    }
  }

  /** Get the Phaser Image for an entity (for tweens, etc.) */
  getImage(entity: number): Phaser.GameObjects.Image | undefined {
    return this.images.get(entity);
  }

  /** Remove tracked image when entity is despawned */
  removeImage(entity: number): void {
    const img = this.images.get(entity);
    if (img) {
      img.destroy();
      this.images.delete(entity);
    }
  }
}
