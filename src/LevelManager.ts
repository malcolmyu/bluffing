export class LevelManager {
  static readonly LEVEL_ORDER: string[] = ['BattleScene'];

  static getNextLevelScene(currentSceneKey: string): string | null {
    const currentIndex = LevelManager.LEVEL_ORDER.indexOf(currentSceneKey);
    if (currentIndex === -1 || currentIndex >= LevelManager.LEVEL_ORDER.length - 1) {
      return null;
    }
    return LevelManager.LEVEL_ORDER[currentIndex + 1];
  }

  static isLastLevel(currentSceneKey: string): boolean {
    const currentIndex = LevelManager.LEVEL_ORDER.indexOf(currentSceneKey);
    return currentIndex === LevelManager.LEVEL_ORDER.length - 1;
  }

  static getFirstLevelScene(): string | null {
    return LevelManager.LEVEL_ORDER.length > 0 ? LevelManager.LEVEL_ORDER[0] : null;
  }

  static getLevelNumber(currentSceneKey: string): number {
    const index = LevelManager.LEVEL_ORDER.indexOf(currentSceneKey);
    return index >= 0 ? index + 1 : 0;
  }

  static getTotalLevels(): number {
    return LevelManager.LEVEL_ORDER.length;
  }

  static isLevelScene(sceneKey: string): boolean {
    return LevelManager.LEVEL_ORDER.includes(sceneKey);
  }
}
