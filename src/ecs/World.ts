import type { System } from './System';
import { C } from './Components';

export class World {
  private entities = new Set<number>();
  private store = new Map<C, Map<number, unknown>>();
  private systems: System[] = [];
  private systemEntities = new Map<System, number[]>();
  private nextId = 1;

  // ==========================================================
  // Entity lifecycle
  // ==========================================================

  spawn(): number {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  despawn(entity: number): void {
    this.entities.delete(entity);
    for (const comps of this.store.values()) {
      comps.delete(entity);
    }
  }

  // ==========================================================
  // Component CRUD
  // ==========================================================

  add<T>(entity: number, component: C, data: T): void {
    let comps = this.store.get(component);
    if (!comps) {
      comps = new Map();
      this.store.set(component, comps);
    }
    comps.set(entity, data);
  }

  remove(entity: number, component: C): void {
    this.store.get(component)?.delete(entity);
  }

  get<T>(entity: number, component: C): T | undefined {
    return this.store.get(component)?.get(entity) as T | undefined;
  }

  has(entity: number, ...components: C[]): boolean {
    return components.every((c) => this.store.get(c)?.has(entity) ?? false);
  }

  /** Find all entities that have every listed component. */
  query(...components: C[]): number[] {
    if (components.length === 0) return [];
    const [first, ...rest] = components;
    const candidates = this.store.get(first);
    if (!candidates) return [];
    const result: number[] = [];
    for (const eid of candidates.keys()) {
      if (rest.every((c) => this.store.get(c)?.has(eid))) {
        result.push(eid);
      }
    }
    return result;
  }

  /** Get all components on an entity. Returns a Map of C → data. */
  getComponents(entity: number): Map<C, unknown> {
    const result = new Map<C, unknown>();
    for (const [compId, comps] of this.store) {
      if (comps.has(entity)) result.set(compId, comps.get(entity));
    }
    return result;
  }

  // ==========================================================
  // System management
  // ==========================================================

  addSystem(system: System): void {
    this.systems.push(system);
  }

  getSystem<T extends System>(ctor: new (...args: never[]) => T): T {
    const s = this.systems.find((s) => s instanceof ctor);
    if (!s) throw new Error(`System ${ctor.name} not registered`);
    return s as T;
  }

  // ==========================================================
  // Game loop
  // ==========================================================

  update(delta: number): void {
    for (const system of this.systems) {
      const req = system.requiredComponents;
      const entities = req.length > 0 ? this.query(...req) : [];
      system.update(this, entities, delta);
    }
  }
}
