import Phaser from 'phaser';
import { screenSize, renderConfig } from './gameConfig.json';

import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { VictoryScene } from './scenes/VictoryScene';
import { DefeatScene } from './scenes/DefeatScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: screenSize.width.value,
  height: screenSize.height.value,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1,
  },
  pixelArt: renderConfig.pixelArt.value,
  antialias: true,
  roundPixels: false,
};

const game = new Phaser.Game(config);

game.scene.add('TitleScene', TitleScene, true);
game.scene.add('BattleScene', BattleScene);
game.scene.add('VictoryScene', VictoryScene);
game.scene.add('DefeatScene', DefeatScene);
