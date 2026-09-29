import Phaser from 'phaser';
import { SCENARIOS, getWorkerProfile } from '../../data/scenarios.js';
import { GameState } from '../GameState.js';

const PROFILE_COLORS = { ada: 0xb95739, mariam: 0x287d78, chika: 0x76538f };

function arrangementLabel(contractId) {
  return contractId.startsWith('live-out') ? 'LIVE-OUT' : 'LIVE-IN';
}

export class ScenarioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ScenarioScene' });
  }

  create() {
    this.width = this.scale.width;
    this.height = this.scale.height;
    this.compact = this.width < 600;
    this.cameras.main.setBackgroundColor('#f4ead8');
    this.drawHeader();
    SCENARIOS.forEach((scenario, index) => this.createScenarioCard(scenario, index));

    const resetY = this.compact ? this.height - 25 : 570;
    this.add.text(this.width / 2, resetY, 'RESET JOURNEY', {
      fontSize: '11px', color: '#596274', backgroundColor: '#e1d4c3', padding: { x: 14, y: 8 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        GameState.resetJourney();
        this.scene.restart();
      });

    this.game.events.emit('RESET_ACTIVITY_LOG');
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
      totalWorkMinutes: 0,
      expectedMinutes: 0,
      clock: '—',
      clockMinutes: 5 * 60 + 30,
      scenarioTitle: 'Choose a situation',
      profileName: 'Journey map',
      status: 'Choose a situation. Your relationship history will carry into it.'
    });
  }

  drawHeader() {
    this.add.rectangle(this.width / 2, this.compact ? 51 : 52, this.width, this.compact ? 102 : 104, 0x253d59);
    this.add.text(this.compact ? 15 : 24, 15, 'THE NEXT DAY', {
      fontSize: '10px', color: '#f2c078', fontStyle: 'bold'
    });
    this.add.text(this.compact ? 15 : 24, 34, 'Choose a situation', {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '24px' : '28px', color: '#ffffff', fontStyle: 'bold'
    });
    this.add.text(this.compact ? 15 : 24, this.compact ? 68 : 72,
      `Trust ${Math.round(GameState.session.householdTrust)}% · pressure ${Math.round(GameState.session.boundaryPressure)}% · confidence ${Math.round(GameState.session.confidence)}%`,
      { fontSize: this.compact ? '10px' : '12px', color: '#d7e0ea' }
    );
  }

  createScenarioCard(scenario, index) {
    const profile = getWorkerProfile(scenario.profileId);
    const completed = GameState.session.completedScenarioIds.includes(scenario.id);
    let x;
    let y;
    let width;
    let height;
    if (this.compact) {
      x = this.width / 2;
      y = 145 + index * 87;
      width = this.width - 24;
      height = 76;
    } else {
      x = index % 2 ? 590 : 210;
      y = 170 + Math.floor(index / 2) * 126;
      width = 350;
      height = 108;
    }

    const fill = completed ? 0xe1eee5 : 0xfffaf1;
    const stroke = completed ? 0x3f8f72 : 0xc8b8a3;
    const background = this.add.rectangle(0, 0, width, height, fill)
      .setStrokeStyle(completed ? 2 : 1, stroke)
      .setInteractive({ useHandCursor: true });
    const portraitX = -width / 2 + (this.compact ? 32 : 38);
    const portrait = this.add.circle(portraitX, 0, this.compact ? 20 : 24, PROFILE_COLORS[profile.id] || PROFILE_COLORS.ada);
    const portraitHead = this.add.circle(portraitX, this.compact ? -5 : -7, this.compact ? 8 : 10, 0x7a422d);
    const portraitBody = this.add.rectangle(portraitX, this.compact ? 12 : 15, this.compact ? 22 : 28, this.compact ? 14 : 18, 0xf2c078);
    const textX = -width / 2 + (this.compact ? 64 : 78);
    const tag = `${scenario.tag} · ${arrangementLabel(scenario.contractId)}${completed ? ' · DONE' : ''}`;
    const tagText = this.add.text(textX, -height / 2 + 9, tag, {
      fontSize: this.compact ? '8px' : '9px', color: completed ? '#287157' : '#a34e2e', fontStyle: 'bold'
    });
    const title = this.add.text(textX, this.compact ? -17 : -22, scenario.title, {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '15px' : '18px', color: '#172238', fontStyle: 'bold'
    });
    const body = this.add.text(textX, this.compact ? 4 : 5, scenario.brief, {
      fontSize: this.compact ? '9px' : '11px', color: '#596274', wordWrap: { width: width - (this.compact ? 78 : 100) }, lineSpacing: 2
    });
    const worker = this.add.text(width / 2 - 10, height / 2 - 8, `${profile.name} · ${scenario.expectedHours}h`, {
      fontSize: this.compact ? '8px' : '9px', color: '#756e65', fontStyle: 'bold'
    }).setOrigin(1, 1);
    const card = this.add.container(x, y, [background, portrait, portraitHead, portraitBody, tagText, title, body, worker]);

    const choose = () => this.startScenario(scenario.id);
    [background, portrait, portraitHead, portraitBody, tagText, title, body, worker].forEach((item) => {
      item.setInteractive?.({ useHandCursor: true });
      item.on?.('pointerdown', choose);
    });
    background.on('pointerover', () => card.setScale(1.012));
    background.on('pointerout', () => card.setScale(1));
  }

  startScenario(scenarioId) {
    GameState.startScenario(scenarioId);
    this.scene.start('GameScene');
  }
}
