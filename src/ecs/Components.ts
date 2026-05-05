import type Phaser from 'phaser';

// ============================================================
// RPS game type aliases (shared with BattleScene)
// ============================================================
export type RPS = 'rock' | 'scissors' | 'paper';
export type Phase = 'declare' | 'reveal' | 'countdown' | 'attack' | 'result' | 'game_over';
export type PetState = 'idle' | 'attack' | 'hit' | 'victory' | 'defeated';
export type Outcome = 'player_win' | 'player_lose' | 'draw';

// ============================================================
// Component enum — each value is a unique numeric ID
// ============================================================
export const enum C {
  Position,
  Sprite,
  Phase,
  Round,
  Score,
  Health,
  BluffIntent,
  VisualState,
  PlayerTag,
  AITag,
  IdleBobbing,
  TextRef,
  GraphicsRef,
  ContainerRef,
  CombatEvent,
  ImageRef,
}

// ============================================================
// Component data interfaces — pure data, no methods
// ============================================================

export interface PositionData {
  x: number;
  y: number;
}

export interface SpriteData {
  texture: string;
  scale: number;
  flipX: boolean;
  depth: number;
  visible: boolean;
}

export interface PhaseData {
  current: Phase;
  transitioning: boolean;
}

export interface RoundData {
  number: number;
}

export interface ScoreData {
  player: number;
  ai: number;
}

export interface HealthData {
  current: number;
  max: number;
}

export interface BluffIntentData {
  declare: RPS | null;
  actual: RPS | null;
}

export interface VisualStateData {
  state: PetState;
}

export interface PlayerTagData {
  // marker component — presence is the only data
}

export interface AITagData {
  bluffChance: number;
}

export interface IdleBobbingData {
  baseY: number;
  amplitude: number;
  halfDuration: number; // ms for one half-cycle
}

export interface TextRefData {
  obj: Phaser.GameObjects.Text;
}

export interface GraphicsRefData {
  obj: Phaser.GameObjects.Graphics;
}

export interface ContainerRefData {
  obj: Phaser.GameObjects.Container;
}

export interface CombatEventData {
  outcome: Outcome;
  isCrit: boolean;
}

export interface ImageRefData {
  obj: Phaser.GameObjects.Image;
}
