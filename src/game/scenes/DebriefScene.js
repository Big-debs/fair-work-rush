import Phaser from 'phaser';
import { DEBRIEF_CHOICES, GameState } from '../GameState.js';
import { getWorkerProfile } from '../../data/scenarios.js';

export class DebriefScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DebriefScene' });
  }

  create(data) {
    this.shift = data.shift;
    this.resolved = false;
    this.width = this.scale.width;
    this.height = this.scale.height;
    this.compact = this.width < 600;
    this.cameras.main.setBackgroundColor('#f4ead8');
    if (!this.shift) {
      this.scene.start('ScenarioScene');
      return;
    }

    const profile = getWorkerProfile(GameState.currentScenario?.profileId);
    this.add.rectangle(this.width / 2, this.compact ? 61 : 62, this.width, this.compact ? 122 : 124, 0x253d59);
    this.add.text(this.compact ? 16 : 30, 16, 'AFTER THE WORK', { fontSize: '10px', color: '#f2c078', fontStyle: 'bold' });
    this.add.text(this.compact ? 16 : 30, 36, 'The conversation', {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '25px' : '29px', color: '#fff', fontStyle: 'bold'
    });
    this.add.text(this.compact ? 16 : 30, this.compact ? 74 : 80,
      this.shift.recordedRequests > 0
        ? `${profile.name} recorded ${this.shift.recordedRequests} request${this.shift.recordedRequests === 1 ? '' : 's'}. Specific details can support what comes next.`
        : `${profile.name} has no written record, but can still name the pattern of the day.`,
      { fontSize: this.compact ? '10px' : '12px', color: '#d7e0ea', wordWrap: { width: this.width - (this.compact ? 32 : 60) }, lineSpacing: 3 }
    );

    this.add.text(this.width / 2, this.compact ? 147 : 151, 'How do you raise the issue?', {
      fontSize: '11px', color: '#a34e2e', fontStyle: 'bold'
    }).setOrigin(.5);

    DEBRIEF_CHOICES.forEach((choice, index) => this.createChoice(choice, index));
    this.outcome = this.add.text(this.width / 2, this.compact ? 521 : 493, '', {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '14px' : '16px', color: '#225d4a', align: 'center',
      wordWrap: { width: this.width - (this.compact ? 38 : 130) }, lineSpacing: 5
    }).setOrigin(.5);
    this.nextButton = this.add.text(this.width / 2, this.compact ? this.height - 52 : 558, 'CONTINUE THE JOURNEY', {
      fontSize: this.compact ? '14px' : '15px', color: '#fff', backgroundColor: '#a34e2e', padding: { x: 22, y: 13 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true }).setVisible(false)
      .on('pointerdown', () => {
        const nextId = GameState.nextScenarioId();
        GameState.startScenario(nextId);
        this.scene.start('GameScene');
      });
  }

  createChoice(choice, index) {
    const y = (this.compact ? 208 : 213) + index * (this.compact ? 94 : 90);
    const width = this.width - (this.compact ? 24 : 120);
    const height = this.compact ? 76 : 72;
    const background = this.add.rectangle(0, 0, width, height, 0xfffaf1)
      .setStrokeStyle(2, 0xc8b8a3)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(-width / 2 + 14, -22, choice.label, {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '16px' : '18px', color: '#172238', fontStyle: 'bold'
    });
    const detail = this.add.text(-width / 2 + 14, 3, choice.detail, {
      fontSize: this.compact ? '10px' : '12px', color: '#596274', wordWrap: { width: width - 28 }, lineSpacing: 3
    });
    const card = this.add.container(this.width / 2, y, [background, label, detail]);
    const choose = () => this.choose(choice.id);
    [background, label, detail].forEach((item) => {
      item.setInteractive?.({ useHandCursor: true });
      item.on?.('pointerdown', choose);
    });
    background.on('pointerover', () => background.setFillStyle(0xfff1dc));
    background.on('pointerout', () => background.setFillStyle(0xfffaf1));
    return card;
  }

  choose(choiceId) {
    if (this.resolved) return;
    this.resolved = true;
    const result = GameState.applyDebriefChoice(choiceId, this.shift);
    const recordLine = result.evidenceBonus ? ' The written record made the issue harder to dismiss.' : '';
    this.outcome.setText(
      `${result.choice.label}: trust ${Math.round(result.session.householdTrust)}% · pressure ${Math.round(result.session.boundaryPressure)}% · confidence ${Math.round(result.session.confidence)}%.${recordLine}`
    );
    this.nextButton.setVisible(true);
    this.game.events.emit('LOG_ACTIVITY', { time: 'AFTER', message: `${result.choice.label} shaped the next day.`, tone: 'boundary' });
    this.game.events.emit('UPDATE_HUD', {
      householdTrust: result.session.householdTrust,
      boundaryPressure: result.session.boundaryPressure,
      confidence: result.session.confidence,
      status: 'The conversation becomes part of the next day’s relationship.'
    });
  }
}
