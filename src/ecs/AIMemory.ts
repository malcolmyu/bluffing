import type { RPS, Outcome } from './Components';

const RPS_WINS_AGAINST: Record<RPS, RPS> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const MOVES: RPS[] = ['rock', 'scissors', 'paper'];
const STORAGE_KEY = 'bluffing_ai_memory';

export interface RoundRecord {
  round: number;
  playerDeclare: RPS;
  playerActual: RPS;
  aiDeclare: RPS;
  aiActual: RPS;
  outcome: Outcome;
}

/**
 * Tracks player behavior across rounds and predicts their next move.
 * Persists history to sessionStorage so the AI improves within a tab session.
 *
 * Pure logic — zero Phaser or ECS dependencies.
 */
export class AIMemory {
  private history: RoundRecord[] = [];

  // ==========================================================
  // Persistence
  // ==========================================================

  /** Load history from sessionStorage. Called at the start of each round. */
  load(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.history = JSON.parse(raw) as RoundRecord[];
      }
    } catch {
      this.history = [];
    }
  }

  /** Persist current history to sessionStorage. */
  save(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch {
      // sessionStorage full or unavailable — silently drop
    }
  }

  /** Clear all stored history (called on first page load). */
  clear(): void {
    this.history = [];
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // ==========================================================
  // Recording
  // ==========================================================

  /** Record a completed round. */
  record(rec: RoundRecord): void {
    this.history.push(rec);
    this.save();
  }

  // ==========================================================
  // Basic statistics
  // ==========================================================

  getHistory(): readonly RoundRecord[] {
    return this.history;
  }

  getRoundCount(): number {
    return this.history.length;
  }

  /** Overall probability the player bluffed (declare !== actual). */
  getBluffRate(): number {
    if (this.history.length === 0) return 0;
    const bluffs = this.history.filter((r) => r.playerDeclare !== r.playerActual).length;
    return bluffs / this.history.length;
  }

  // ==========================================================
  // Conditional probability
  // ==========================================================

  /**
   * Given what the player just declared, estimate the probability
   * distribution of what they'll actually play.
   *
   * Returns { rock: 0.3, scissors: 0.5, paper: 0.2 } etc.
   */
  getConditionalProbs(playerDeclare: RPS): Record<RPS, number> {
    const counts: Record<RPS, number> = { rock: 0, scissors: 0, paper: 0 };
    let total = 0;

    for (const r of this.history) {
      if (r.playerDeclare === playerDeclare) {
        counts[r.playerActual]++;
        total++;
      }
    }

    if (total === 0) {
      // No data for this declare — return uniform
      return { rock: 1 / 3, scissors: 1 / 3, paper: 1 / 3 };
    }

    return {
      rock: counts.rock / total,
      scissors: counts.scissors / total,
      paper: counts.paper / total,
    };
  }

  // ==========================================================
  // Prediction
  // ==========================================================

  /**
   * Predict the best counter-move against what the player is
   * likely to actually play, given their current declaration.
   *
   * Strategy:
   * 1. Compute P(actual | declare) from history
   * 2. If one actual has >40% probability (well above uniform 33%), target it
   * 3. Otherwise fall back to the globally most frequent actual move
   * 4. Return the move that beats the predicted actual
   */
  predictBestCounter(playerDeclare: RPS): RPS {
    const probs = this.getConditionalProbs(playerDeclare);

    // Find the most likely actual move given this declaration
    let bestMove: RPS = 'rock';
    let bestProb = probs.rock;

    for (const move of MOVES) {
      if (probs[move] > bestProb) {
        bestProb = probs[move];
        bestMove = move;
      }
    }

    // Confidence threshold: if the top prediction isn't strong enough,
    // fall back to the global most-played actual move
    if (bestProb <= 0.4 && this.history.length > 0) {
      bestMove = this.getGlobalMostFrequentActual();
    }

    // Return the move that beats the predicted actual
    return RPS_WINS_AGAINST[bestMove];
  }

  /** The actual move the player uses most often across all declarations. */
  private getGlobalMostFrequentActual(): RPS {
    const counts: Record<RPS, number> = { rock: 0, scissors: 0, paper: 0 };
    for (const r of this.history) {
      counts[r.playerActual]++;
    }
    let best: RPS = 'rock';
    for (const move of MOVES) {
      if (counts[move] > counts[best]) best = move;
    }
    return best;
  }

  // ==========================================================
  // Pattern detection
  // ==========================================================

  /** How often the player switches their actual move after a loss. */
  getLossSwitchRate(): number {
    let losses = 0;
    let switches = 0;

    for (let i = 1; i < this.history.length; i++) {
      if (this.history[i - 1].outcome === 'player_lose') {
        losses++;
        if (this.history[i].playerActual !== this.history[i - 1].playerActual) {
          switches++;
        }
      }
    }

    return losses > 0 ? switches / losses : 0;
  }

  /** Longest streak of the player using the same actual move. */
  getMaxSameMoveStreak(): number {
    if (this.history.length === 0) return 0;
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < this.history.length; i++) {
      if (this.history[i].playerActual === this.history[i - 1].playerActual) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }
}
