import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { summarizeCompensation } from '../economy/WageEngine.js';
import { getWorkerProfile } from '../../data/scenarios.js';

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m ? `${m}m` : ''}`.trim();
}

function decisionPattern(summary, shift) {
  const { accepted, negotiated, declined, recorded } = summary.decisionCounts;
  if (shift.boundaryPressure >= 65) return 'Repeated accommodation made availability feel increasingly expected.';
  if (negotiated + declined > accepted + recorded) return 'You protected more of your time, while carrying some immediate social tension.';
  if (recorded > 0) return 'You kept the household moving while creating evidence for a later conversation.';
  return 'The day was shaped as much by how requests were handled as by the tasks themselves.';
}

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create(data) {
    const s = data.shift;
    const summary = GameState.summarize(s);
    const compensation = summarizeCompensation(s);
    const profile = getWorkerProfile(GameState.currentScenario?.profileId);
    GameState.completeDay(s);
    const compact = this.scale.width < 600;
    const width = this.scale.width;
    this.cameras.main.setBackgroundColor('#f4ead8');

    this.add.rectangle(width / 2, compact ? 56 : 60, width, compact ? 112 : 120, 0x253d59);
    this.add.text(compact ? 16 : 32, 17, 'AGREEMENT / REALITY', {
      fontSize: '10px', color: '#f2c078', fontStyle: 'bold'
    });
    this.add.text(compact ? 16 : 32, 37, GameState.currentScenario?.title || 'Today', {
      fontFamily: 'Georgia, serif', fontSize: compact ? '23px' : '28px', color: '#ffffff', fontStyle: 'bold'
    });
    this.add.text(compact ? 16 : 32, compact ? 73 : 80,
      `${profile.name}'s choices changed both the day and the relationship.`,
      { fontSize: compact ? '10px' : '12px', color: '#d7e0ea' }
    );

    const rows = [
      ['Monthly salary', `₦${GameState.contract.monthlySalary.toLocaleString()}`],
      ['Agreed work today', `${summary.expectedWorkMinutes / 60}h`],
      ['Counted work today', fmt(summary.totalWorkMinutes)],
      ['Standby / on-call', fmt(s.standbyMinutes + s.onCallMinutes)],
      ['Extra requests', fmt(summary.requestedAdditionalMinutes)],
      ['Beyond agreement', fmt(summary.workBeyondAgreementMinutes)],
      ['Personal time', fmt(s.personalMinutes)],
      ['Accepted / recorded', `${summary.decisionCounts.accepted} / ${summary.decisionCounts.recorded}`],
      ['Negotiated / declined', `${summary.decisionCounts.negotiated} / ${summary.decisionCounts.declined}`],
      ['Final wellbeing', `${summary.wellbeing}%`],
      ['Household trust', `${Math.round(s.householdTrust)}%`],
      ['Boundary pressure', `${Math.round(s.boundaryPressure)}%`],
      ['Analytical rate', `₦${Math.round(compensation.effectiveRateForToday).toLocaleString()}/hr`]
    ];

    const startY = compact ? 130 : 134;
    const rowGap = compact ? 27 : 25;
    rows.forEach((row, index) => {
      const y = startY + index * rowGap;
      if (index % 2 === 0) this.add.rectangle(width / 2, y + 8, width - (compact ? 24 : 56), rowGap, 0xfffaf1);
      this.add.text(compact ? 20 : 56, y, row[0], { fontSize: compact ? '11px' : '12px', color: '#6e675f' });
      this.add.text(width - (compact ? 20 : 56), y, row[1], {
        fontSize: compact ? '11px' : '12px', color: '#172238', fontStyle: 'bold'
      }).setOrigin(1, 0);
    });

    const patternY = startY + rows.length * rowGap + (compact ? 15 : 18);
    this.add.text(width / 2, patternY, decisionPattern(summary, s), {
      fontFamily: 'Georgia, serif', fontSize: compact ? '14px' : '16px', color: '#37445a',
      align: 'center', wordWrap: { width: width - (compact ? 38 : 120) }, lineSpacing: 5
    }).setOrigin(.5);

    const buttonY = compact ? this.scale.height - 43 : 554;
    this.add.text(width / 2, buttonY, 'HAVE THE CONVERSATION', {
      fontSize: compact ? '14px' : '16px', color: '#fff', backgroundColor: '#a34e2e', padding: { x: 22, y: 13 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('DebriefScene', { shift: s }));

    this.game.events.emit('LOG_ACTIVITY', {
      time: 'END', message: `${fmt(summary.totalWorkMinutes)} counted against ${fmt(summary.expectedWorkMinutes)} agreed.`, tone: 'neutral'
    });
    this.game.events.emit('UPDATE_HUD', {
      wellbeing: summary.wellbeing,
      householdTrust: s.householdTrust,
      boundaryPressure: s.boundaryPressure,
      totalWorkMinutes: summary.totalWorkMinutes,
      expectedMinutes: summary.expectedWorkMinutes,
      scenarioTitle: GameState.currentScenario?.title,
      profileName: profile.name,
      status: 'The working day is over. The conversation still matters.'
    });
  }
}
