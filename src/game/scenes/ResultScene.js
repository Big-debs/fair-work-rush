import Phaser from 'phaser';
import { GameState } from '../GameState';
import { summarizeCompensation } from '../economy/WageEngine';

function fmt(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m ? `${m}m` : ''}`.trim();
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
    this.add.text(400, 78, 'Your contract stayed monthly. This screen measures what the day actually demanded.', {
      fontSize: '14px', color: '#94a3b8'
    }).setOrigin(.5);

    const rows = [
      ['Monthly salary', `₦${GameState.contract.monthlySalary.toLocaleString()}`],
      ['Agreed workday', `${GameState.contract.schedule.expectedHoursPerDay}h`],
      ['Active work today', fmt(s.activeMinutes)],
      ['Standby / on-call', fmt(s.standbyMinutes + s.onCallMinutes)],
      ['Extra requests received', fmt(summary.requestedAdditionalMinutes)],
      ['Work beyond agreed hours', fmt(summary.workBeyondAgreementMinutes)],
      ['“One more thing” requests', String(s.oneMoreThings)],
      ['Interrupted moments', String(s.interruptionCount)],
      ['Personal time recorded', fmt(s.personalMinutes)],
      ['Analytical rate', `₦${Math.round(compensation.effectiveRateForToday).toLocaleString()}/counted work hr`]
    ];

    rows.forEach((row, i) => {
      const y = 125 + i * 32;
      this.add.text(160, y, row[0], { fontSize: '15px', color: '#94a3b8' });
      this.add.text(640, y, row[1], { fontSize: '15px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(1, 0);
    });

    this.add.text(400, 475,
      `You were not necessarily asked to work all day.\nBut your day could become structured around being available.`,
      { fontSize: '17px', color: '#cbd5e1', align: 'center', lineSpacing: 8 }
    ).setOrigin(.5);

    this.add.text(400, 550, 'EXPERIENCE ANOTHER DAY', {
      fontSize: '17px', color: '#fff', backgroundColor: '#16a34a', padding: { x: 24, y: 12 }
    }).setOrigin(.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene'));
  }
}
