import Phaser from 'phaser';
import { DEBRIEF_CHOICES, GameState } from '../GameState.js';

export class DebriefScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DebriefScene' });
  }

  create(data) {
    this.shift = data.shift;
    this.resolved = false;
    this.cameras.main.setBackgroundColor('#07111f');

    if (!this.shift) {
      this.scene.start('ScenarioScene');
      return;
    }

    this.add.text(400, 52, 'THE CONVERSATION AFTER WORK', {
      fontSize: '27px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(.5);
    this.add.text(400, 94,
      this.shift.recordedRequests > 0
        ? `You recorded ${this.shift.recordedRequests} request${this.shift.recordedRequests === 1 ? '' : 's'}. The details can support what you say next.`
        : 'You have no written record from today, but you can still name the pattern you experienced.',
      { fontSize: '14px', color: '#cbd5e1', align: 'center', wordWrap: { width: 650 }, lineSpacing: 5 }
    ).setOrigin(.5);

    this.add.text(400, 140, 'How do you raise the issue?', {
      fontSize: '13px', color: '#60a5fa', fontStyle: 'bold'
    }).setOrigin(.5);

    DEBRIEF_CHOICES.forEach((choice, index) => {
      const y = 205 + index * 92;
      const button = this.add.rectangle(400, y, 640, 72, 0x172554)
        .setStrokeStyle(1, 0x3b82f6)
        .setInteractive({ useHandCursor: true });
      this.add.text(105, y - 21, choice.label, {
        fontSize: '17px', color: '#f8fafc', fontStyle: 'bold'
      }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(choice.id));
      this.add.text(105, y + 4, choice.detail, {
        fontSize: '13px', color: '#cbd5e1', wordWrap: { width: 560 }
      }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(choice.id));
      button.on('pointerdown', () => this.choose(choice.id));
      button.on('pointerover', () => button.setFillStyle(0x1e3a8a));
      button.on('pointerout', () => button.setFillStyle(0x172554));
    });

    this.outcome = this.add.text(400, 497, '', {
      fontSize: '15px', color: '#d1fae5', align: 'center', wordWrap: { width: 650 }, lineSpacing: 5
    }).setOrigin(.5);
    this.nextButton = this.add.text(400, 558, 'CONTINUE TO NEXT SITUATION', {
      fontSize: '15px', color: '#fff', backgroundColor: '#16a34a', padding: { x: 20, y: 11 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true }).setVisible(false)
      .on('pointerdown', () => {
        const nextId = GameState.nextScenarioId();
        GameState.startScenario(nextId);
        this.scene.start('GameScene');
      });
  }

  choose(choiceId) {
    if (this.resolved) return;
    this.resolved = true;
    const result = GameState.applyDebriefChoice(choiceId, this.shift);
    const recordLine = result.evidenceBonus
      ? ' Because you recorded requests, the conversation is more specific.'
      : '';
    this.outcome.setText(
      `${result.choice.label}: trust ${Math.round(result.session.householdTrust)}% · pressure ${Math.round(result.session.boundaryPressure)}% · confidence ${Math.round(result.session.confidence)}%.${recordLine}`
    );
    this.nextButton.setVisible(true);
    this.game.events.emit('UPDATE_HUD', {
      householdTrust: result.session.householdTrust,
      boundaryPressure: result.session.boundaryPressure,
      confidence: result.session.confidence,
      status: 'The conversation becomes part of the next day’s relationship.'
    });
  }
}
