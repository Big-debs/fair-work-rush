import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // No external assets are required in this prototype.
    // Keeping BootScene asset-free makes the first playable build
    // much harder to break with a missing/corrupt texture.
    this.scene.start('GameScene');
  }
}
