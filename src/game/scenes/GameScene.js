import Phaser from 'phaser';
import { GameState } from '../GameState';
import { TASKS, LIVE_IN_EVENTS } from '../../data/tasks';
import { advanceTimeline } from '../TimelineEngine';

function clockLabel(minutes) {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, '0')} ${suffix}`;
}

function durationLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#07111f');
    this.shift = GameState.resetDay();
    this.actionLocked = false;

    this.add.text(400, 34, 'LIVE-IN HOUSEHOLD · DAY 1', {
      fontSize: '22px', color: '#e2e8f0', fontStyle: 'bold'
    }).setOrigin(.5);
    this.add.text(400, 65, 'Being on the premises does not automatically mean being at work.', {
      fontSize: '14px', color: '#94a3b8'
    }).setOrigin(.5);

    this.clockText = this.add.text(400, 105, '', {
      fontSize: '34px', color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(.5);

    this.stateText = this.add.text(400, 140, '', {
      fontSize: '14px', color: '#60a5fa'
    }).setOrigin(.5);

    this.drawWorker();
    this.createTaskButtons();
    this.createEventPanel();
    this.updateDisplay();
    this.emit('Your day starts at 5:30 AM.');
  }

  drawWorker() {
    const g = this.add.graphics();
    g.fillStyle(0x3b82f6, 1);
    g.fillCircle(400, 210, 28);
    g.fillRoundedRect(365, 240, 70, 75, 16);
    g.fillRect(375, 315, 18, 42);
    g.fillRect(407, 315, 18, 42);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(390, 205, 4);
    g.fillCircle(410, 205, 4);
    this.add.text(400, 375, 'HOUSEHOLD WORKER', {
      fontSize: '12px', color: '#64748b', fontStyle: 'bold'
    }).setOrigin(.5);
  }

  createTaskButtons() {
    TASKS.forEach((task, i) => {
      const x = 80 + i * 160;
      const button = this.add.text(x, 455, `${task.name}\n${durationLabel(task.minutes)}`, {
        fontSize: '14px', color: '#fff', backgroundColor: task.type === 'personal' ? '#334155' : '#1d4ed8',
        padding: { x: 12, y: 10 }, align: 'center', fixedWidth: 135
      }).setOrigin(.5).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setStyle({ backgroundColor: '#2563eb' }));
      button.on('pointerout', () => button.setStyle({ backgroundColor: task.type === 'personal' ? '#334155' : '#1d4ed8' }));
      button.on('pointerdown', () => this.executeTask(task));
    });
  }

  createEventPanel() {
    this.eventPanel = this.add.rectangle(400, 530, 700, 82, 0x0f172a).setStrokeStyle(1, 0x334155);
    this.eventTitle = this.add.text(400, 510, '', { fontSize: '16px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(.5);
    this.eventBody = this.add.text(400, 542, '', { fontSize: '13px', color: '#cbd5e1', align: 'center', wordWrap: { width: 640 } }).setOrigin(.5);
  }

  executeTask(task) {
    if (this.actionLocked) return;
    if (this.shift.stamina + task.staminaDelta < 0) {
      this.flash('Too tired. You need recovery before taking this task.');
      return;
    }

    const activity = task.type === 'personal' ? 'personal' : task.type;
    const result = advanceTimeline(this.shift, task.minutes, activity, LIVE_IN_EVENTS);
    this.shift.stamina = Phaser.Math.Clamp(this.shift.stamina + task.staminaDelta, 0, 100);
    this.shift.tasksCompleted += 1;
    this.shift.lastEvent = task.name;
    this.updateDisplay();

    if (result.triggeredEvents.length) {
      this.presentEvents(result.triggeredEvents, () => {
        if (result.ended) this.endDay();
        else this.emit(`${task.name} completed.`);
      });
    } else if (result.ended) {
      this.endDay();
    } else {
      this.emit(`${task.name} completed.`);
    }
  }

  updateDisplay() {
    this.clockText.setText(clockLabel(this.shift.clockMinutes));
    this.stateText.setText(`Stamina ${Math.round(this.shift.stamina)}% · ${this.shift.oneMoreThings} “one more thing” requests`);
  }

  presentEvents(events, onComplete) {
    this.actionLocked = true;
    const [event, ...remaining] = events;
    this.eventTitle.setText(event.title);
    this.eventBody.setText(`${event.body}  ·  ${durationLabel(event.actualMinutes)}`);
    this.emit(`${event.title}: ${event.body}`);

    this.time.delayedCall(1300, () => {
      if (remaining.length) {
        this.presentEvents(remaining, onComplete);
      } else {
        this.actionLocked = false;
        onComplete();
      }
    });
  }

  flash(message) {
    this.emit(message);
    this.time.delayedCall(1500, () => this.emit('Choose what to do next.'));
  }

  emit(status = 'Choose what to do next.') {
    const summary = GameState.summarize(this.shift);
    this.game.events.emit('UPDATE_HUD', {
      stamina: this.shift.stamina,
      shiftHours: this.shift.activeMinutes / 60,
      earnings: 0,
      reputation: GameState.reputation,
      clock: clockLabel(this.shift.clockMinutes),
      monthlySalary: GameState.contract.monthlySalary,
      additionalMinutes: this.shift.additionalMinutes,
      personalMinutes: this.shift.personalMinutes,
      sleepMinutes: this.shift.sleepMinutes,
      status,
      expectedHours: summary.expectedWorkMinutes / 60
    });
  }

  endDay() {
    if (this.shift.ended) return;
    this.shift.ended = true;
    this.scene.start('ResultScene', { shift: this.shift });
  }
}
