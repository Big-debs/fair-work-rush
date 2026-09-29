import Phaser from 'phaser';
import { SCENARIOS, getWorkerProfile } from '../../data/scenarios.js';
import { GameState } from '../GameState.js';

function arrangementLabel(contractId) {
  return contractId.startsWith('live-out') ? 'LIVE-OUT' : 'LIVE-IN';
}

export class ScenarioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScenarioScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#07111f');
    this.add.text(400, 28, 'CHOOSE THE NEXT DAY', {
      fontSize: '26px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(.5);
    this.add.text(400, 58,
      `Relationship memory · trust ${Math.round(GameState.session.householdTrust)}% · pressure ${Math.round(GameState.session.boundaryPressure)}% · confidence ${Math.round(GameState.session.confidence)}%`,
      { fontSize: '13px', color: '#94a3b8' }
    ).setOrigin(.5);

    SCENARIOS.forEach((scenario, index) => this.createScenarioCard(scenario, index));

    this.add.text(400, 570, 'RESET JOURNEY', {
      fontSize: '12px', color: '#94a3b8', backgroundColor: '#1e293b', padding: { x: 14, y: 8 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        GameState.resetJourney();
        this.scene.restart();
      });

    this.game.events.emit('UPDATE_HUD', {
      householdTrust: GameState.session.householdTrust,
      boundaryPressure: GameState.session.boundaryPressure,
      confidence: GameState.session.confidence,
      wellbeing: 100,
      stamina: 100,
      stress: 0,
      shiftHours: 0,
      additionalMinutes: 0,
      personalMinutes: 0,
      clock: '—',
      status: 'Choose a situation. Your relationship history will carry into it.'
    });
  }

  createScenarioCard(scenario, index) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = column ? 590 : 210;
    const y = 132 + row * 142;
    const completed = GameState.session.completedScenarioIds.includes(scenario.id);
    const profile = getWorkerProfile(scenario.profileId);
    const background = this.add.rectangle(x, y, 350, 122, completed ? 0x132d2b : 0x0f172a)
      .setStrokeStyle(1, completed ? 0x34d399 : 0x334155)
      .setInteractive({ useHandCursor: true });
    const tag = `${scenario.tag} · ${arrangementLabel(scenario.contractId)}${completed ? ' · COMPLETED' : ''}`;
    const tagText = this.add.text(x - 155, y - 48, tag, {
      fontSize: '10px', color: completed ? '#6ee7b7' : '#60a5fa', fontStyle: 'bold'
    });
    const title = this.add.text(x - 155, y - 27, scenario.title, {
      fontSize: '18px', color: '#f8fafc', fontStyle: 'bold'
    });
    const body = this.add.text(x - 155, y + 1, scenario.brief, {
      fontSize: '12px', color: '#cbd5e1', wordWrap: { width: 305 }, lineSpacing: 3
    });
    const worker = this.add.text(x - 155, y + 43, `${profile.name} · ${scenario.expectedHours}h agreed today`, {
      fontSize: '11px', color: '#94a3b8'
    });

    [background, tagText, title, body, worker].forEach((item) => {
      item.setInteractive?.({ useHandCursor: true });
      item.on?.('pointerdown', () => this.startScenario(scenario.id));
    });
    background.on('pointerover', () => background.setStrokeStyle(2, 0x60a5fa));
    background.on('pointerout', () => background.setStrokeStyle(1, completed ? 0x34d399 : 0x334155));
  }

  startScenario(scenarioId) {
    GameState.startScenario(scenarioId);
    this.scene.start('GameScene');
  }
}
