import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { TASKS, LIVE_IN_EVENTS } from '../../data/tasks.js';
import { getDecisionOptions } from '../DecisionModel.js';
import { advanceUntilDecision, resolveEventDecision } from '../TimelineEngine.js';

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
    this.currentAction = null;

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
    this.createDecisionPanel();
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
    this.taskButtons = [];
    TASKS.forEach((task, i) => {
      const x = 80 + i * 160;
      const button = this.add.text(x, 455, `${task.name}\n${durationLabel(task.minutes)}`, {
        fontSize: '14px', color: '#fff', backgroundColor: task.type === 'personal' ? '#334155' : '#1d4ed8',
        padding: { x: 12, y: 10 }, align: 'center', fixedWidth: 135
      }).setOrigin(.5).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setStyle({ backgroundColor: '#2563eb' }));
      button.on('pointerout', () => button.setStyle({ backgroundColor: task.type === 'personal' ? '#334155' : '#1d4ed8' }));
      button.on('pointerdown', () => this.executeTask(task));
      this.taskButtons.push(button);
    });
  }

  createEventPanel() {
    this.eventPanel = this.add.rectangle(400, 530, 700, 82, 0x0f172a).setStrokeStyle(1, 0x334155);
    this.eventTitle = this.add.text(400, 510, '', { fontSize: '16px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(.5);
    this.eventBody = this.add.text(400, 542, '', { fontSize: '13px', color: '#cbd5e1', align: 'center', wordWrap: { width: 640 } }).setOrigin(.5);
  }

  createDecisionPanel() {
    const background = this.add.rectangle(0, 0, 730, 338, 0x111827, 0.98)
      .setStrokeStyle(2, 0x475569);
    this.decisionTitle = this.add.text(0, -135, '', {
      fontSize: '21px', color: '#f8fafc', fontStyle: 'bold', align: 'center'
    }).setOrigin(.5);
    this.decisionBody = this.add.text(0, -96, '', {
      fontSize: '14px', color: '#cbd5e1', align: 'center', wordWrap: { width: 650 }
    }).setOrigin(.5);
    this.decisionPrompt = this.add.text(0, -58, 'How do you respond?', {
      fontSize: '12px', color: '#60a5fa', fontStyle: 'bold'
    }).setOrigin(.5);
    this.choiceLayer = this.add.container(0, 0);
    this.decisionMetrics = this.add.text(0, 142, '', {
      fontSize: '12px', color: '#94a3b8', align: 'center'
    }).setOrigin(.5);

    this.decisionContainer = this.add.container(400, 300, [
      background,
      this.decisionTitle,
      this.decisionBody,
      this.decisionPrompt,
      this.choiceLayer,
      this.decisionMetrics
    ]).setDepth(20).setVisible(false);
  }

  executeTask(task) {
    if (this.actionLocked) return;
    if (this.shift.stamina + task.staminaDelta < 0) {
      this.flash('Too tired. You need recovery before taking this task.');
      return;
    }

    this.actionLocked = true;
    this.currentAction = {
      task,
      activity: task.type === 'personal' ? 'personal' : task.type,
      remainingMinutes: task.minutes
    };
    this.continueAction();
  }

  continueAction() {
    const action = this.currentAction;
    if (!action) return;

    const result = advanceUntilDecision(
      this.shift,
      action.remainingMinutes,
      action.activity,
      LIVE_IN_EVENTS
    );
    action.remainingMinutes = result.uncompletedMinutes;
    this.updateDisplay();

    if (result.pendingEvent) {
      this.showDecision(result.pendingEvent);
    } else if (result.ended) {
      this.endDay();
    } else {
      this.completeAction();
    }
  }

  completeAction() {
    const { task } = this.currentAction;
    this.shift.stamina = Phaser.Math.Clamp(this.shift.stamina + task.staminaDelta, 0, 100);
    if (task.type === 'work') this.shift.stress = Phaser.Math.Clamp(this.shift.stress + 2, 0, 100);
    if (task.type === 'personal') this.shift.stress = Phaser.Math.Clamp(this.shift.stress - 6, 0, 100);
    if (task.type === 'sleep') this.shift.stress = Phaser.Math.Clamp(this.shift.stress - 18, 0, 100);
    this.shift.tasksCompleted += 1;
    this.shift.lastEvent = task.name;
    this.currentAction = null;
    this.actionLocked = false;
    this.updateDisplay();
    this.emit(`${task.name} completed.`);
  }

  showDecision(event) {
    const choices = getDecisionOptions(event, this.shift);
    this.choiceLayer.removeAll(true);
    this.decisionTitle.setText(event.title);
    this.decisionBody.setText(`${event.body} · Requested ${durationLabel(event.minutes)}`);
    this.decisionMetrics.setText(
      `Trust ${Math.round(this.shift.householdTrust)}%  ·  Boundary pressure ${Math.round(this.shift.boundaryPressure)}%  ·  Stress ${Math.round(this.shift.stress)}%`
    );

    choices.forEach((choice, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column ? 182 : -182;
      const y = row ? 75 : 5;
      const button = this.add.text(x, y, `${choice.label}\n${choice.detail}`, {
        fontSize: '13px', color: '#f8fafc', backgroundColor: choice.id === 'decline' ? '#7f1d1d' : '#1e3a8a',
        padding: { x: 12, y: 10 }, align: 'center', fixedWidth: 315
      }).setOrigin(.5).setInteractive({ useHandCursor: true });
      button.on('pointerover', () => button.setStyle({ backgroundColor: choice.id === 'decline' ? '#991b1b' : '#1d4ed8' }));
      button.on('pointerout', () => button.setStyle({ backgroundColor: choice.id === 'decline' ? '#7f1d1d' : '#1e3a8a' }));
      button.on('pointerdown', () => this.chooseResponse(event, choice.id));
      this.choiceLayer.add(button);
    });

    this.decisionContainer.setVisible(true);
    this.emit(`${event.title}: choose how to respond.`);
  }

  chooseResponse(event, decisionId) {
    const outcome = resolveEventDecision(this.shift, event, decisionId);
    if (!outcome) return;

    this.decisionContainer.setVisible(false);
    this.eventTitle.setText(`${event.title} · ${outcome.choice.label}`);
    this.eventBody.setText(outcome.choice.message);
    this.updateDisplay();
    this.emit(`${outcome.choice.label}: ${outcome.choice.message}`);

    this.time.delayedCall(750, () => {
      if (this.shift.clockMinutes >= 29 * 60 + 30) this.endDay();
      else this.continueAction();
    });
  }

  updateDisplay() {
    this.clockText.setText(clockLabel(this.shift.clockMinutes));
    this.stateText.setText(
      `Wellbeing ${GameState.wellbeing(this.shift)}% · trust ${Math.round(this.shift.householdTrust)}% · boundary pressure ${Math.round(this.shift.boundaryPressure)}%`
    );
  }

  flash(message) {
    this.emit(message);
    this.time.delayedCall(1500, () => this.emit('Choose what to do next.'));
  }

  emit(status = 'Choose what to do next.') {
    const summary = GameState.summarize(this.shift);
    this.game.events.emit('UPDATE_HUD', {
      stamina: this.shift.stamina,
      wellbeing: summary.wellbeing,
      householdTrust: this.shift.householdTrust,
      boundaryPressure: this.shift.boundaryPressure,
      stress: this.shift.stress,
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
