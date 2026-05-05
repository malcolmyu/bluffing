import type { C } from './Components';
import type { World } from './World';

export interface System {
  /** Entities passed to update() must have ALL these components. */
  readonly requiredComponents: readonly C[];
  /** Called every frame with pre-filtered entity list. */
  update(world: World, entities: number[], delta: number): void;
}
