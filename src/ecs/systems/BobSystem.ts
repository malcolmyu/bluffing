import type { World } from '../World';
import { C } from '../Components';
import type { PositionData, IdleBobbingData } from '../Components';

/**
 * Per-frame system: oscillates pet Y positions for idle animation.
 * Replaces the old Phaser tween-based bobbing (yoyo, repeat: -1).
 */
export class BobSystem {
  readonly requiredComponents = [C.Position, C.IdleBobbing] as const;

  private elapsed = 0;

  update(_world: World, entities: number[], delta: number): void {
    this.elapsed += delta;

    for (const e of entities) {
      const pos = _world.get<PositionData>(e, C.Position)!;
      const bob = _world.get<IdleBobbingData>(e, C.IdleBobbing)!;

      // Only bob when idle
      const vs = _world.get<{ state: string }>(e, C.VisualState);
      if (vs && vs.state !== 'idle') continue;

      const t = (this.elapsed % (bob.halfDuration * 2)) / bob.halfDuration;
      const offset = Math.sin(t * Math.PI) * bob.amplitude;
      pos.y = bob.baseY - bob.amplitude + offset;
    }
  }
}
