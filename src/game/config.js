import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ScenarioScene } from './scenes/ScenarioScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { DebriefScene } from './scenes/DebriefScene';
import { getGameDimensions } from './LayoutModel.js';

export function createGameConfig(parent) {
  const dimensions = getGameDimensions(parent?.clientWidth || window.innerWidth);
  return {
    type: Phaser.AUTO,
    parent,
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: '#f4ead8',
    render: {
      antialias: true,
      pixelArt: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: dimensions.width,
      height: dimensions.height
    },
    scene: [BootScene, ScenarioScene, GameScene, ResultScene, DebriefScene]
  };
}
