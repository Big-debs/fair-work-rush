import Phaser from 'phaser';
import { GameState } from '../GameState.js';
import { getAvailableTasks } from '../../data/tasks.js';
import { getActivityDefinition, getActivityStepMinutes } from '../../data/activities.js';
import { getWorkerProfile } from '../../data/scenarios.js';
import { getDecisionOptions } from '../DecisionModel.js';
import { advanceUntilDecision, resolveEventDecision } from '../TimelineEngine.js';
import { paintHousehold, updateHouseholdMood } from '../ui/ScenePainter.js';

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
    this.width = this.scale.width;
    this.height = this.scale.height;
    this.compact = this.width < 600;
    this.reducedMotion = Boolean(this.registry.get('reducedMotion'));
    this.cameras.main.setBackgroundColor('#f4ead8');
    if (!GameState.currentScenario) GameState.startScenario();
    this.scenario = GameState.currentScenario;
    this.profile = getWorkerProfile(this.scenario.profileId);
    this.shift = GameState.resetDay();
    this.actionLocked = false;
    this.currentAction = null;

    this.buildHeader();
    this.art = paintHousehold(this, {
      profileId: this.profile.id,
      top: this.compact ? 92 : 92,
      bottom: this.compact ? 326 : 365,
      reducedMotion: this.reducedMotion
    });
    this.buildStateRibbon();
    this.createTaskCards();
    this.createEventPanel();
    this.createDecisionPanel();
    this.updateDisplay();

    this.game.events.emit('RESET_ACTIVITY_LOG');
    this.log(`${this.profile.name} begins: ${this.scenario.title}.`, 'neutral');
    this.emit(`${this.profile.name}'s day starts at ${clockLabel(this.shift.clockMinutes)}.`);

    this.game.events.on('ACCESSIBILITY_SETTINGS', this.applyAccessibilitySettings, this);
    this.game.events.on('THREE_ACTIVITY_STEP', this.handleActivityStep, this);
    this.game.events.on('THREE_ACTIVITY_FINISH', this.handleActivityFinish, this);
    this.game.events.on('THREE_ACTIVITY_ABANDON', this.handleActivityAbandon, this);
    this.game.events.on('THREE_ACTIVITY_FALLBACK', this.handleActivityFallback, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ACCESSIBILITY_SETTINGS', this.applyAccessibilitySettings, this);
      this.game.events.off('THREE_ACTIVITY_STEP', this.handleActivityStep, this);
      this.game.events.off('THREE_ACTIVITY_FINISH', this.handleActivityFinish, this);
      this.game.events.off('THREE_ACTIVITY_ABANDON', this.handleActivityAbandon, this);
      this.game.events.off('THREE_ACTIVITY_FALLBACK', this.handleActivityFallback, this);
    });
  }

  buildHeader() {
    const left = this.compact ? 16 : 24;
    this.add.text(left, 13, `${this.scenario.tag} · DAY ${GameState.day}`, {
      fontSize: this.compact ? '10px' : '11px', color: '#a34e2e', fontStyle: 'bold'
    });
    this.add.text(left, this.compact ? 31 : 34, this.scenario.title, {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '21px' : '25px', color: '#172238', fontStyle: 'bold'
    });
    this.add.text(left, this.compact ? 58 : 64, this.scenario.openingNote, {
      fontSize: this.compact ? '10px' : '11px', color: '#635e59',
      wordWrap: { width: this.compact ? 270 : 620 }, lineSpacing: 2
    });

    const clockX = this.compact ? this.width - 50 : this.width - 82;
    this.add.rectangle(clockX, 36, this.compact ? 82 : 116, 48, 0x253d59).setStrokeStyle(2, 0xffffff, .45);
    this.clockText = this.add.text(clockX, 36, '', {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '16px' : '19px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(.5);
  }

  buildStateRibbon() {
    const y = this.compact ? 318 : 356;
    this.add.rectangle(this.width / 2, y, this.width, this.compact ? 34 : 38, 0x253d59);
    this.stateText = this.add.text(this.width / 2, y, '', {
      fontSize: this.compact ? '10px' : '12px', color: '#f7f0e4', align: 'center'
    }).setOrigin(.5);
  }

  createTaskCards() {
    this.taskButtons = [];
    this.taskHeading = this.add.text(this.compact ? 16 : 24, this.compact ? 342 : 381, 'WHAT NEEDS ATTENTION NOW?', {
      fontSize: this.compact ? '10px' : '11px', color: '#6e675f', fontStyle: 'bold'
    });
    this.renderTaskCards();
  }

  renderTaskCards() {
    this.taskButtons.forEach((card) => card.destroy(true));
    this.taskButtons = [];
    const tasks = getAvailableTasks(
      this.scenario.id,
      this.shift.clockMinutes,
      this.shift.completedTaskIds,
      6,
      this.shift.lastTaskCompletionMinutes
    );
    this.taskHeading.setText(`WHAT NEEDS ATTENTION NOW? · ${clockLabel(this.shift.clockMinutes)}`);

    tasks.forEach((task, index) => {
      let x;
      let y;
      let cardWidth;
      let cardHeight;
      if (this.compact) {
        x = index % 2 ? this.width - 101 : 101;
        y = 392 + Math.floor(index / 2) * 82;
        cardWidth = 170;
        cardHeight = 68;
      } else {
        x = 138 + (index % 3) * 262;
        y = 420 + Math.floor(index / 3) * 70;
        cardWidth = 238;
        cardHeight = 58;
      }

      const background = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xfffaf1)
        .setStrokeStyle(2, task.accent)
        .setInteractive({ useHandCursor: true });
      const context = this.add.text(-cardWidth / 2 + 10, -cardHeight / 2 + 8, task.context, {
        fontSize: '9px', color: '#756e65', fontStyle: 'bold'
      });
      const title = this.add.text(-cardWidth / 2 + 10, this.compact ? -7 : -6, task.shortName, {
        fontSize: this.compact ? '14px' : '15px', color: '#172238', fontStyle: 'bold'
      });
      const duration = this.add.text(cardWidth / 2 - 10, cardHeight / 2 - 9, durationLabel(task.minutes), {
        fontSize: '10px', color: '#655f59', fontStyle: 'bold'
      }).setOrigin(1, 1);
      const accent = this.add.rectangle(-cardWidth / 2 + 3, 0, 6, cardHeight - 6, task.accent);
      const card = this.add.container(x, y, [background, accent, context, title, duration]);

      const choose = () => this.executeTask(task);
      [background, context, title, duration].forEach((item) => {
        item.setInteractive?.({ useHandCursor: true });
        item.on?.('pointerdown', choose);
      });
      background.on('pointerover', () => background.setFillStyle(0xfff1dc));
      background.on('pointerout', () => background.setFillStyle(0xfffaf1));
      this.taskButtons.push(card);
    });
  }

  createEventPanel() {
    const y = this.compact ? 674 : 555;
    const width = this.width - (this.compact ? 24 : 48);
    const height = this.compact ? 72 : 70;
    this.eventPanel = this.add.rectangle(this.width / 2, y, width, height, 0xe6d5c0)
      .setStrokeStyle(1, 0xbda990);
    this.eventTitle = this.add.text(this.compact ? 24 : 42, y - 24, 'THE HOUSEHOLD IS QUIET', {
      fontSize: this.compact ? '11px' : '12px', color: '#a34e2e', fontStyle: 'bold'
    });
    this.eventBody = this.add.text(this.compact ? 24 : 42, y - 4, 'Choose an activity. Requests can interrupt it at any time.', {
      fontSize: this.compact ? '11px' : '12px', color: '#3c4655',
      wordWrap: { width: width - 36 }, lineSpacing: 2
    });
  }

  createDecisionPanel() {
    const panelWidth = this.compact ? this.width - 20 : 730;
    const panelHeight = this.compact ? this.height - 20 : 380;
    const centerY = this.height / 2;
    this.decisionBackdrop = this.add.rectangle(this.width / 2, centerY, this.width, this.height, 0x172238, .72)
      .setDepth(20).setVisible(false);
    const background = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xfffaf1, 1)
      .setStrokeStyle(3, 0xd97745);
    const top = -panelHeight / 2;
    this.interruptionTag = this.add.text(0, top + 28, 'INTERRUPTION · A NEW REQUEST', {
      fontSize: '10px', color: '#a34e2e', fontStyle: 'bold'
    }).setOrigin(.5);
    this.decisionTitle = this.add.text(0, top + 62, '', {
      fontFamily: 'Georgia, serif', fontSize: this.compact ? '22px' : '25px', color: '#172238', fontStyle: 'bold', align: 'center'
    }).setOrigin(.5);
    this.decisionBody = this.add.text(0, top + (this.compact ? 112 : 106), '', {
      fontSize: this.compact ? '12px' : '13px', color: '#4f5662', align: 'center',
      wordWrap: { width: panelWidth - 50 }, lineSpacing: 4
    }).setOrigin(.5);
    this.decisionPrompt = this.add.text(0, top + (this.compact ? 164 : 150), 'How do you respond?', {
      fontSize: '11px', color: '#526d9f', fontStyle: 'bold'
    }).setOrigin(.5);
    this.choiceLayer = this.add.container(0, 0);
    this.decisionMetrics = this.add.text(0, panelHeight / 2 - 27, '', {
      fontSize: this.compact ? '10px' : '11px', color: '#6e675f', align: 'center', wordWrap: { width: panelWidth - 30 }
    }).setOrigin(.5);

    this.decisionContainer = this.add.container(this.width / 2, centerY, [
      background,
      this.interruptionTag,
      this.decisionTitle,
      this.decisionBody,
      this.decisionPrompt,
      this.choiceLayer,
      this.decisionMetrics
    ]).setDepth(21).setVisible(false);
  }

  executeTask(task) {
    if (this.actionLocked) return;
    const savedProgress = this.shift.worldState[task.id]?.status === 'unfinished'
      ? this.shift.worldState[task.id]
      : null;
    const remainingStaminaDelta = task.staminaDelta - (savedProgress?.staminaApplied ?? 0);
    if (this.shift.stamina + remainingStaminaDelta < 0) {
      this.flash('Too tired. Choose recovery before taking more work.');
      return;
    }

    this.actionLocked = true;
    this.setTaskCardsEnabled(false);
    const definition = getActivityDefinition(task);
    const interactive = Boolean(this.registry.get('interactiveActivities')) && Boolean(definition);
    const sessionId = interactive
      ? `${task.id}-${this.shift.clockMinutes}-${Math.round(this.time.now)}`
      : null;
    this.currentAction = {
      task,
      activity: task.type === 'personal' ? 'personal' : task.type,
      remainingMinutes: savedProgress?.remainingMinutes ?? task.minutes,
      interactive,
      sessionId,
      definition,
      acknowledgedStep: savedProgress?.acknowledgedStep ?? -1,
      pendingStepIndex: null,
      pendingStepMinutes: 0,
      staminaApplied: savedProgress?.staminaApplied ?? 0,
      stressApplied: savedProgress?.stressApplied ?? 0
    };
    this.log(`${task.name} started.`, ['personal', 'sleep'].includes(task.type) ? 'positive' : 'neutral');
    if (interactive) {
      this.game.events.emit('OPEN_3D_ACTIVITY', {
        sessionId,
        task,
        definition,
        acknowledgedStep: this.currentAction.acknowledgedStep
      });
      this.emit(`${task.name}: complete each physical step. Requests may still interrupt you.`);
    } else {
      this.continueAction();
    }
  }

  continueAction() {
    const action = this.currentAction;
    if (!action) return;
    const result = advanceUntilDecision(this.shift, action.remainingMinutes, action.activity, GameState.currentEvents);
    action.remainingMinutes = result.uncompletedMinutes;
    this.updateDisplay();

    if (result.pendingEvent) this.showDecision(result.pendingEvent);
    else if (result.ended) this.endDay();
    else this.completeAction();
  }

  handleActivityStep({ sessionId, stepIndex } = {}) {
    const action = this.currentAction;
    if (!action?.interactive || action.sessionId !== sessionId || action.pendingStepIndex !== null) return;
    if (stepIndex !== action.acknowledgedStep + 1 || stepIndex >= action.definition.steps.length) return;

    action.pendingStepIndex = stepIndex;
    action.pendingStepMinutes = getActivityStepMinutes(
      action.task.minutes,
      action.definition.steps.length,
      stepIndex
    );
    this.advanceInteractiveStep();
  }

  advanceInteractiveStep() {
    const action = this.currentAction;
    if (!action?.interactive || action.pendingStepIndex === null) return;

    const result = advanceUntilDecision(
      this.shift,
      action.pendingStepMinutes,
      action.activity,
      GameState.currentEvents
    );
    action.pendingStepMinutes = result.uncompletedMinutes;
    action.remainingMinutes = Math.max(0, action.remainingMinutes - result.completedMinutes);
    this.updateDisplay();

    if (result.pendingEvent) {
      this.game.events.emit('PAUSE_3D_ACTIVITY', { sessionId: action.sessionId });
      this.showDecision(result.pendingEvent);
      return;
    }
    if (result.ended) {
      this.game.events.emit('CLOSE_3D_ACTIVITY', { sessionId: action.sessionId });
      this.endDay();
      return;
    }

    action.acknowledgedStep = action.pendingStepIndex;
    action.pendingStepIndex = null;
    action.pendingStepMinutes = 0;
    this.game.events.emit('ACK_3D_ACTIVITY_STEP', {
      sessionId: action.sessionId,
      stepIndex: action.acknowledgedStep
    });
    this.emit(`${action.task.name}: step ${action.acknowledgedStep + 1} of ${action.definition.steps.length} complete.`);
  }

  handleActivityFinish({ sessionId } = {}) {
    const action = this.currentAction;
    if (!action?.interactive || action.sessionId !== sessionId) return;
    if (action.acknowledgedStep !== action.definition.steps.length - 1 || action.remainingMinutes > 0) return;
    this.game.events.emit('CLOSE_3D_ACTIVITY', { sessionId });
    this.completeAction();
  }

  handleActivityAbandon({ sessionId } = {}) {
    const action = this.currentAction;
    if (!action?.interactive || action.sessionId !== sessionId || action.pendingStepIndex !== null) return;
    const completedMinutes = Math.max(0, action.task.minutes - action.remainingMinutes);
    const completionRatio = action.task.minutes > 0 ? completedMinutes / action.task.minutes : 0;
    const staminaTarget = Math.round(action.task.staminaDelta * completionRatio);
    const stressTarget = completedMinutes > 0 && ['work', 'standby'].includes(action.task.type) ? 1 : 0;
    this.shift.stamina = Phaser.Math.Clamp(
      this.shift.stamina + staminaTarget - action.staminaApplied,
      0,
      100
    );
    this.shift.stress = Phaser.Math.Clamp(this.shift.stress + stressTarget - action.stressApplied, 0, 100);
    this.shift.worldState[action.task.id] = {
      status: 'unfinished',
      remainingMinutes: action.remainingMinutes,
      acknowledgedStep: action.acknowledgedStep,
      staminaApplied: staminaTarget,
      stressApplied: stressTarget
    };
    this.shift.lastEvent = `${action.task.name} left unfinished`;
    this.game.events.emit('CLOSE_3D_ACTIVITY', { sessionId });
    this.log(`${action.task.name} left unfinished after ${durationLabel(completedMinutes)}.`, 'interruption');
    this.eventTitle.setText(`${action.task.context} · UNFINISHED`);
    this.eventBody.setText('The work already done remains counted, and the task can return later.');
    this.currentAction = null;
    this.actionLocked = false;
    this.renderTaskCards();
    this.updateDisplay();
    this.emit(`${action.task.name} is unfinished. Choose what needs attention now.`);
  }

  handleActivityFallback({ sessionId } = {}) {
    const action = this.currentAction;
    if (!action?.interactive || action.sessionId !== sessionId) return;
    if (action.pendingStepIndex !== null) {
      action.fallbackAfterDecision = true;
      return;
    }
    this.game.events.emit('CLOSE_3D_ACTIVITY', { sessionId });
    action.interactive = false;
    action.pendingStepIndex = null;
    action.pendingStepMinutes = 0;
    this.log(`${action.task.name} continued in simple mode.`, 'neutral');
    this.emit(`${action.task.name} is continuing in simple mode.`);
    this.continueAction();
  }

  completeAction() {
    const action = this.currentAction;
    const { task } = action;
    const stressTarget = task.type === 'work' ? 2
      : task.type === 'standby' ? 1
        : task.type === 'personal' ? -6
          : task.type === 'sleep' ? -18
            : 0;
    this.shift.stamina = Phaser.Math.Clamp(
      this.shift.stamina + task.staminaDelta - action.staminaApplied,
      0,
      100
    );
    this.shift.stress = Phaser.Math.Clamp(this.shift.stress + stressTarget - action.stressApplied, 0, 100);
    this.shift.tasksCompleted += 1;
    if (!this.shift.completedTaskIds.includes(task.id)) this.shift.completedTaskIds.push(task.id);
    this.shift.lastTaskCompletionMinutes[task.id] = this.shift.clockMinutes;
    this.shift.worldState[task.id] = {
      status: 'complete',
      remainingMinutes: 0,
      acknowledgedStep: (action.definition?.steps.length ?? 0) - 1,
      staminaApplied: task.staminaDelta,
      stressApplied: stressTarget
    };
    this.shift.lastEvent = task.name;
    this.currentAction = null;
    this.actionLocked = false;
    this.renderTaskCards();
    this.eventTitle.setText(`${task.context} · COMPLETED`);
    this.eventBody.setText(`${task.name} finished. The day moved forward by ${durationLabel(task.minutes)}.`);
    this.log(`${task.name} completed.`, ['personal', 'sleep'].includes(task.type) ? 'positive' : 'neutral');
    this.updateDisplay();
    this.emit(`${task.name} completed.`);
  }

  showDecision(event) {
    const choices = getDecisionOptions(event, this.shift);
    const panelHeight = this.compact ? this.height - 20 : 380;
    const top = -panelHeight / 2;
    this.choiceLayer.removeAll(true);
    this.decisionTitle.setText(event.title);
    this.decisionBody.setText(`${event.body}\nRequested time: ${durationLabel(event.minutes)}`);
    this.decisionMetrics.setText(
      `Trust ${Math.round(this.shift.householdTrust)}% · pressure ${Math.round(this.shift.boundaryPressure)}% · stress ${Math.round(this.shift.stress)}%`
    );

    choices.forEach((choice, index) => {
      const compactY = top + 216 + index * 84;
      const desktopX = index % 2 ? 178 : -178;
      const desktopY = index < 2 ? 20 : 92;
      const x = this.compact ? 0 : desktopX;
      const y = this.compact ? compactY : desktopY;
      const width = this.compact ? this.width - 54 : 328;
      const height = this.compact ? 68 : 58;
      const fill = choice.id === 'decline' ? 0x8f3e2d : 0x253d59;
      const background = this.add.rectangle(0, 0, width, height, fill)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(-width / 2 + 13, -17, choice.label, {
        fontSize: this.compact ? '14px' : '13px', color: '#ffffff', fontStyle: 'bold'
      });
      const detail = this.add.text(-width / 2 + 13, 5, choice.detail, {
        fontSize: this.compact ? '11px' : '10px', color: '#e1e8ef'
      });
      const button = this.add.container(x, y, [background, label, detail]);
      const choose = () => this.chooseResponse(event, choice.id);
      [background, label, detail].forEach((item) => {
        item.setInteractive?.({ useHandCursor: true });
        item.on?.('pointerdown', choose);
      });
      background.on('pointerover', () => background.setFillStyle(choice.id === 'decline' ? 0xaa4a34 : 0x345577));
      background.on('pointerout', () => background.setFillStyle(fill));
      this.choiceLayer.add(button);
    });

    this.decisionBackdrop.setVisible(true);
    this.decisionContainer.setVisible(true);
    if (!this.reducedMotion) {
      this.decisionContainer.setScale(.96).setAlpha(0);
      this.tweens.add({ targets: this.decisionContainer, scale: 1, alpha: 1, duration: 180, ease: 'Quad.out' });
    }
    this.log(`${event.title} interrupted the current activity.`, 'interruption');
    this.emit(`${event.title}: choose how to respond.`);
  }

  chooseResponse(event, decisionId) {
    const outcome = resolveEventDecision(this.shift, event, decisionId);
    if (!outcome) return;
    this.decisionBackdrop.setVisible(false);
    this.decisionContainer.setVisible(false);
    this.eventTitle.setText(`${event.title} · ${outcome.choice.label}`);
    this.eventBody.setText(outcome.choice.message);
    const tone = decisionId === 'decline' || decisionId === 'negotiate' ? 'boundary' : 'neutral';
    this.log(`${outcome.choice.label}: ${event.title}.`, tone);
    this.updateDisplay();
    this.emit(`${outcome.choice.label}: ${outcome.choice.message}`);

    this.time.delayedCall(this.reducedMotion ? 0 : 550, () => {
      if (this.shift.clockMinutes >= 29 * 60 + 30) this.endDay();
      else if (this.currentAction?.fallbackAfterDecision) {
        this.currentAction.fallbackAfterDecision = false;
        this.currentAction.pendingStepIndex = null;
        this.currentAction.pendingStepMinutes = 0;
        this.handleActivityFallback({ sessionId: this.currentAction.sessionId });
      }
      else if (this.currentAction?.interactive && this.currentAction.pendingStepIndex !== null) {
        this.advanceInteractiveStep();
      } else {
        this.continueAction();
      }
    });
  }

  updateDisplay() {
    const summary = GameState.summarize(this.shift);
    const wellbeing = summary.wellbeing;
    this.clockText.setText(clockLabel(this.shift.clockMinutes));
    this.stateText.setText(
      `${this.profile.name} · wellbeing ${wellbeing}% · trust ${Math.round(this.shift.householdTrust)}% · pressure ${Math.round(this.shift.boundaryPressure)}%`
    );
    updateHouseholdMood(this.art, wellbeing, this.shift.boundaryPressure);
  }

  setTaskCardsEnabled(enabled) {
    this.taskButtons.forEach((card) => card.setAlpha(enabled ? 1 : .48));
  }

  applyAccessibilitySettings(settings) {
    this.reducedMotion = Boolean(settings.reducedMotion);
    if (this.reducedMotion && this.art?.idleTween) {
      this.art.idleTween.stop();
      this.art.worker.setScale(1).setY(this.art.worker.y + 2);
      this.art.idleTween = null;
    }
  }

  flash(message) {
    this.emit(message);
    this.time.delayedCall(this.reducedMotion ? 0 : 1200, () => this.emit('Choose what to do next.'));
  }

  log(message, tone = 'neutral') {
    this.game.events.emit('LOG_ACTIVITY', { time: clockLabel(this.shift.clockMinutes), message, tone });
  }

  emit(status = 'Choose what to do next.') {
    const summary = GameState.summarize(this.shift);
    this.game.events.emit('UPDATE_HUD', {
      stamina: this.shift.stamina,
      wellbeing: summary.wellbeing,
      householdTrust: this.shift.householdTrust,
      boundaryPressure: this.shift.boundaryPressure,
      confidence: this.shift.confidence,
      stress: this.shift.stress,
      shiftHours: this.shift.activeMinutes / 60,
      clock: clockLabel(this.shift.clockMinutes),
      clockMinutes: this.shift.clockMinutes,
      monthlySalary: GameState.contract.monthlySalary,
      additionalMinutes: this.shift.additionalMinutes,
      personalMinutes: this.shift.personalMinutes,
      totalWorkMinutes: summary.totalWorkMinutes,
      expectedMinutes: summary.expectedWorkMinutes,
      scenarioTitle: this.scenario.title,
      profileName: this.profile.name,
      status
    });
  }

  endDay() {
    if (this.shift.ended) return;
    if (this.currentAction?.sessionId) {
      this.game.events.emit('CLOSE_3D_ACTIVITY', { sessionId: this.currentAction.sessionId });
    }
    this.shift.ended = true;
    this.scene.start('ResultScene', { shift: this.shift });
  }
}
