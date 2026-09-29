import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ScenarioScene } from './scenes/ScenarioScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { DebriefScene } from './scenes/DebriefScene';

export function createGameConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    backgroundColor: '#0b1220',
    render: {
      antialias: true,
      pixelArt: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600
    },
    scene: [BootScene, ScenarioScene, GameScene, ResultScene, DebriefScene]
  };
}
