import Phaser from 'phaser';
import { GameState } from '../GameState';
import { summarizeCompensation } from '../economy/WageEngine';

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m ? `${m}m` : ''}`.trim();
}

function decisionPattern(summary, shift) {
  const { accepted, negotiated, declined, recorded } = summary.decisionCounts;
  if (shift.boundaryPressure >= 65) {
    return 'Repeated accommodation made availability feel increasingly expected.';
  }
  if (negotiated + declined > accepted + recorded) {
    return 'You protected more of your time, but some of that protection carried social tension.';
  }
  if (recorded > 0) {
    return 'You kept the household moving while creating evidence for a later conversation.';
  }
  return 'The day was shaped as much by how requests were handled as by the tasks themselves.';
}

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create(data) {
    const s = data.shift;
    const summary = GameState.summarize(s);
    const compensation = summarizeCompensation(s);

    this.cameras.main.setBackgroundColor('#07111f');
    this.add.text(400, 42, 'AGREEMENT VS REALITY', {
      fontSize: '30px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(.5);
    this.add.text(400, 78, 'The same requests can produce very different days depending on the choices made.', {
      fontSize: '14px', color: '#94a3b8'
    }).setOrigin(.5);

    const rows = [
      ['Monthly salary', `₦${GameState.contract.monthlySalary.toLocaleString()}`],
      ['Agreed workday', `${GameState.contract.schedule.expectedHoursPerDay}h`],
      ['Counted work today', fmt(summary.totalWorkMinutes)],
      ['Standby / on-call', fmt(s.standbyMinutes + s.onCallMinutes)],
      ['Extra requests received', fmt(summary.requestedAdditionalMinutes)],
      ['Work beyond agreed hours', fmt(summary.workBeyondAgreementMinutes)],
      ['Personal time recorded', fmt(s.personalMinutes)],
      ['Accepted / recorded', `${summary.decisionCounts.accepted} / ${summary.decisionCounts.recorded}`],
      ['Negotiated / declined', `${summary.decisionCounts.negotiated} / ${summary.decisionCounts.declined}`],
      ['Final wellbeing', `${summary.wellbeing}%`],
      ['Household trust', `${Math.round(s.householdTrust)}%`],
      ['Boundary pressure', `${Math.round(s.boundaryPressure)}%`],
      ['Analytical rate', `₦${Math.round(compensation.effectiveRateForToday).toLocaleString()}/counted work hr`]
    ];

    rows.forEach((row, i) => {
      const y = 108 + i * 25;
      this.add.text(160, y, row[0], { fontSize: '14px', color: '#94a3b8' });
      this.add.text(640, y, row[1], { fontSize: '14px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(1, 0);
    });

    this.add.text(400, 454,
      decisionPattern(summary, s),
      { fontSize: '16px', color: '#cbd5e1', align: 'center', wordWrap: { width: 650 }, lineSpacing: 6 }
    ).setOrigin(.5);

    this.add.text(400, 550, 'EXPERIENCE ANOTHER DAY', {
      fontSize: '17px', color: '#fff', backgroundColor: '#16a34a', padding: { x: 24, y: 12 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene'));
  }
}
