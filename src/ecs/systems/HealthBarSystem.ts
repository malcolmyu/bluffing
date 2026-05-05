import type { World } from '../World';
import { C } from '../Components';
import type { HealthData, GraphicsRefData } from '../Components';

/**
 * Reads Health components and redraws the associated health bar graphics.
 * Pure rendering logic — no game rules.
 */
export class HealthBarSystem {
  readonly requiredComponents = [C.Health, C.GraphicsRef] as const;

  private barW = 240;
  private barH = 30;
  private barY = 165;
  private barXLeft = 300;   // daodun
  private barXRight = 870;  // bibilabu

  update(_world: World, entities: number[]): void {
    for (const e of entities) {
      const health = _world.get<HealthData>(e, C.Health)!;
      const gfx = _world.get<GraphicsRefData>(e, C.GraphicsRef)!;
      const flipped = !_world.has(e, C.PlayerTag); // bibilabu = not player = flipped
      const x = flipped ? this.barXRight : this.barXLeft;
      this.drawOneBar(gfx.obj, x, health.current / health.max, flipped);
    }
  }

  /** Draw a single health bar. Can also be called directly with explicit entity info. */
  drawOneBar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    ratio: number,
    flipped: boolean,
  ): void {
    const { barW, barH, barY } = this;
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
  }
}
