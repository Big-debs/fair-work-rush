import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import {
  DAY_END,
  advanceTimeline,
  advanceUntilDecision,
  resolveEventDecision
} from '../src/game/TimelineEngine.js';
import { summarizeCompensation } from '../src/game/economy/WageEngine.js';
import { LIVE_IN_EVENTS, TASKS, getAvailableTasks } from '../src/data/tasks.js';
import { SCENARIOS, getScenario, selectScenarioEvents } from '../src/data/scenarios.js';
import { getGameDimensions, getTimelineModel } from '../src/game/LayoutModel.js';

const events = [
  { id: 'interrupt', at: 7 * 60, title: 'Interruption', body: '', minutes: 20, staminaDelta: -5, additional: true, interruption: true },
  { id: 'night-call', at: 25 * 60 + 10, title: 'Night call', body: '', minutes: 20, staminaDelta: -5, additional: true, interruption: true, onCall: true }
];

test('an event interrupts a task at its scheduled time and the task resumes', () => {
  const shift = GameState.resetDay();
  const result = advanceTimeline(shift, 120, 'work', events);

  assert.equal(shift.clockMinutes, 470);
  assert.equal(shift.activeMinutes, 140);
  assert.equal(shift.additionalMinutes, 20);
  assert.deepEqual(shift.events, ['interrupt']);
  assert.equal(result.completedMinutes, 120);
});

test('an on-call event interrupts sleep without counting the call as sleep', () => {
  const shift = GameState.resetDay();
  shift.clockMinutes = 24 * 60 + 50;
  shift.events = ['interrupt'];

  advanceTimeline(shift, 60, 'sleep', events);

  assert.equal(shift.clockMinutes, 24 * 60 + 50 + 80);
  assert.equal(shift.sleepMinutes, 60);
  assert.equal(shift.onCallMinutes, 20);
  assert.deepEqual(shift.events, ['interrupt', 'night-call']);
});

test('time is clipped at the end of the simulation day', () => {
  const shift = GameState.resetDay();
  shift.clockMinutes = DAY_END - 15;
  shift.events = events.map((event) => event.id);

  const result = advanceTimeline(shift, 60, 'personal', events);

  assert.equal(shift.clockMinutes, DAY_END);
  assert.equal(shift.personalMinutes, 15);
  assert.equal(result.uncompletedMinutes, 45);
  assert.equal(result.ended, true);
  assert.equal(shift.ended, false);
});

test('all scheduled events crossed by a long activity are processed once', () => {
  const shift = GameState.resetDay();
  const clusteredEvents = [
    { id: 'first', at: 360, title: 'First', body: '', minutes: 10, staminaDelta: 0 },
    { id: 'second', at: 370, title: 'Second', body: '', minutes: 15, staminaDelta: 0 }
  ];

  const result = advanceTimeline(shift, 60, 'personal', clusteredEvents);

  assert.deepEqual(shift.events, ['first', 'second']);
  assert.equal(result.triggeredEvents.length, 2);
  assert.equal(shift.personalMinutes, 60);
  assert.equal(shift.activeMinutes, 25);
  assert.equal(shift.clockMinutes, 415);
});

test('summary distinguishes requested extras from work beyond the agreement', () => {
  const shift = GameState.resetDay();
  shift.activeMinutes = 450;
  shift.onCallMinutes = 60;
  shift.additionalMinutes = 20;

  const summary = GameState.summarize(shift);

  assert.equal(summary.totalWorkMinutes, 510);
  assert.equal(summary.requestedAdditionalMinutes, 20);
  assert.equal(summary.workBeyondAgreementMinutes, 30);
});

test('effective analytical rate includes active, standby, and on-call time', () => {
  const shift = GameState.resetDay();
  shift.activeMinutes = 420;
  shift.standbyMinutes = 30;
  shift.onCallMinutes = 30;

  const compensation = summarizeCompensation(shift);

  assert.equal(compensation.countedWorkMinutes, 480);
  assert.equal(Math.round(compensation.effectiveRateForToday), 481);
});

test('a complete day processes every scenario event before results', () => {
  const shift = GameState.resetDay();
  const result = advanceTimeline(shift, 24 * 60, 'work', LIVE_IN_EVENTS);

  assert.equal(result.ended, true);
  assert.equal(shift.clockMinutes, DAY_END);
  assert.deepEqual(shift.events, LIVE_IN_EVENTS.map((event) => event.id));
  assert.equal(shift.onCallMinutes, 22);
  assert.equal(shift.oneMoreThings, 4);
  assert.ok(shift.decisions.at(-1).workedMinutes > shift.decisions.at(-1).requestedMinutes);
});

test('interactive progression pauses at the exact request time', () => {
  const shift = GameState.resetDay();
  const result = advanceUntilDecision(shift, 120, 'personal', events);

  assert.equal(shift.clockMinutes, 420);
  assert.equal(shift.personalMinutes, 90);
  assert.equal(result.pendingEvent.id, 'interrupt');
  assert.equal(result.uncompletedMinutes, 30);
  assert.deepEqual(shift.events, []);
});

test('declining protects time and lowers boundary pressure with a trust cost', () => {
  const shift = GameState.resetDay();
  shift.clockMinutes = 420;

  const outcome = resolveEventDecision(shift, events[0], 'decline');

  assert.equal(outcome.actualMinutes, 0);
  assert.equal(shift.activeMinutes, 0);
  assert.equal(shift.clockMinutes, 420);
  assert.equal(shift.boundaryPressure, 11);
  assert.equal(shift.householdTrust, 47);
  assert.equal(shift.declinedRequests, 1);
  assert.equal(shift.additionalMinutes, 20);
});

test('negotiation reduces the request duration and records the decision', () => {
  const shift = GameState.resetDay();
  shift.clockMinutes = 420;

  const outcome = resolveEventDecision(shift, events[0], 'negotiate');

  assert.equal(outcome.actualMinutes, 12);
  assert.equal(shift.activeMinutes, 12);
  assert.equal(shift.negotiatedRequests, 1);
  assert.equal(shift.decisions[0].decisionId, 'negotiate');
  assert.equal(shift.decisions[0].requestedMinutes, 20);
  assert.equal(shift.decisions[0].workedMinutes, 12);
});

test('repeated acceptance increases future boundary pressure', () => {
  const shift = GameState.resetDay();
  shift.clockMinutes = 420;

  resolveEventDecision(shift, events[0], 'accept');

  assert.equal(shift.acceptedRequests, 1);
  assert.equal(shift.boundaryPressure, 29);
  assert.equal(shift.householdTrust, 60);
  assert.ok(GameState.wellbeing(shift) < 95);
});

test('phase 3 offers six reproducible scenario variations', () => {
  assert.equal(SCENARIOS.length, 6);
  const scenario = getScenario('ordinary-day');
  const firstRun = selectScenarioEvents(scenario, 0);
  const repeatedFirstRun = selectScenarioEvents(scenario, 0);
  const secondRun = selectScenarioEvents(scenario, 1);
  const baseEventIds = new Set(scenario.events.map((event) => event.id));
  const firstVariant = firstRun.find((event) => !baseEventIds.has(event.id));
  const secondVariant = secondRun.find((event) => !baseEventIds.has(event.id));

  assert.deepEqual(firstRun, repeatedFirstRun);
  assert.notEqual(firstVariant.id, secondVariant.id);
  assert.equal(firstRun.length, scenario.events.length + 1);
});

test('selecting a scenario switches worker arrangement and contract', () => {
  GameState.resetJourney();
  const scenario = GameState.startScenario('salary-conversation');

  assert.equal(scenario.profileId, 'mariam');
  assert.equal(GameState.contract.livingArrangement, 'live_out');
  assert.equal(GameState.contract.monthlySalary, 120000);
  assert.equal(GameState.currentEvents.length, scenario.events.length + 1);
});

test('the interrupted day off treats every counted minute as beyond agreement', () => {
  GameState.resetJourney();
  GameState.startScenario('interrupted-day-off');
  const shift = GameState.resetDay();
  shift.activeMinutes = 90;

  const summary = GameState.summarize(shift);

  assert.equal(summary.expectedWorkMinutes, 0);
  assert.equal(summary.workBeyondAgreementMinutes, 90);
});

test('finishing a day carries relationship memory forward exactly once', () => {
  GameState.resetJourney();
  GameState.startScenario('ordinary-day');
  const shift = GameState.resetDay();
  shift.householdTrust = 63;
  shift.boundaryPressure = 41;
  shift.negotiatedRequests = 2;

  GameState.completeDay(shift);
  GameState.completeDay(shift);

  assert.equal(GameState.session.householdTrust, 63);
  assert.equal(GameState.session.boundaryPressure, 41);
  assert.equal(GameState.session.confidence, 49);
  assert.equal(GameState.session.runCount, 1);
  assert.deepEqual(GameState.session.completedScenarioIds, ['ordinary-day']);
});

test('recorded requests strengthen an evidence-led debrief', () => {
  GameState.resetJourney();
  GameState.startScenario('ordinary-day');
  const shift = GameState.resetDay();
  shift.recordedRequests = 2;
  GameState.completeDay(shift);

  const result = GameState.applyDebriefChoice('evidence', shift);

  assert.equal(result.evidenceBonus, 4);
  assert.equal(GameState.session.householdTrust, 57);
  assert.equal(GameState.session.boundaryPressure, 4);
  assert.equal(GameState.session.confidence, 61);
  assert.deepEqual(GameState.session.lastDebrief, {
    choiceId: 'evidence', scenarioId: 'ordinary-day', usedRecords: true
  });
});

test('phase 4 uses a native portrait scene on small phones', () => {
  assert.deepEqual(getGameDimensions(390), { width: 390, height: 720, compact: true });
  assert.deepEqual(getGameDimensions(800), { width: 800, height: 600, compact: false });
});

test('agreement and actual work use the same 24-hour timeline scale', () => {
  const timeline = getTimelineModel({
    expectedMinutes: 480,
    totalWorkMinutes: 600,
    clockMinutes: 17 * 60 + 30
  });

  assert.equal(Math.round(timeline.expectedPercent), 33);
  assert.equal(Math.round(timeline.actualPercent), 42);
  assert.equal(timeline.elapsedPercent, 50);
});

test('timeline values stay within visible bounds', () => {
  const timeline = getTimelineModel({ expectedMinutes: 0, totalWorkMinutes: 2000, clockMinutes: 4000 });

  assert.equal(timeline.expectedPercent, 0);
  assert.equal(timeline.actualPercent, 100);
  assert.equal(timeline.elapsedPercent, 100);
});

test('the daily task catalog represents domestic work beyond three chores', () => {
  const taskIds = new Set(TASKS.map((task) => task.id));

  assert.ok(TASKS.length >= 35);
  for (const expectedId of [
    'school-run', 'market-run', 'lunch-prep', 'snack-prep', 'diaper-change',
    'school-pickup', 'homework-help', 'dinner-prep', 'child-bedtime', 'kitchen-close'
  ]) {
    assert.ok(taskIds.has(expectedId), `missing ${expectedId}`);
  }
});

test('ordinary-day task cards rotate with the time of day', () => {
  const morning = getAvailableTasks('ordinary-day', 5 * 60 + 30).map((task) => task.id);
  const midday = getAvailableTasks('ordinary-day', 12 * 60).map((task) => task.id);
  const evening = getAvailableTasks('ordinary-day', 18 * 60).map((task) => task.id);

  assert.ok(morning.includes('breakfast'));
  assert.ok(morning.includes('diaper-change'));
  assert.ok(!morning.includes('school-run'));
  assert.ok(getAvailableTasks('ordinary-day', 7 * 60).some((task) => task.id === 'school-run'));
  assert.ok(midday.includes('market-run'));
  assert.ok(midday.includes('lunch-prep'));
  assert.ok(evening.includes('dinner-prep'));
  assert.ok(evening.includes('child-bedtime'));
  assert.notDeepEqual(morning, midday);
  assert.notDeepEqual(midday, evening);
});

test('scenario task sets reflect care, hospitality, and protected time off', () => {
  const sickDay = getAvailableTasks('sick-child', 10 * 60).map((task) => task.id);
  const visitors = getAvailableTasks('unexpected-visitors', 17 * 60).map((task) => task.id);
  const dayOff = getAvailableTasks('interrupted-day-off', 10 * 60);

  assert.ok(sickDay.includes('temperature-check'));
  assert.ok(sickDay.includes('give-medicine'));
  assert.ok(visitors.includes('serve-visitors'));
  assert.ok(dayOff.every((task) => task.type === 'personal'));
});

test('completed one-time work rotates out while repeatable care remains', () => {
  const tasks = getAvailableTasks('ordinary-day', 8 * 60, ['breakfast', 'diaper-change'], 20);
  const ids = tasks.map((task) => task.id);

  assert.ok(!ids.includes('breakfast'));
  assert.ok(ids.includes('diaper-change'));
});

test('repeatable care respects time between medicine and changes', () => {
  const lastCompleted = { 'give-medicine': 9 * 60, 'diaper-change': 9 * 60 };
  const soon = getAvailableTasks('sick-child', 10 * 60, [], 20, lastCompleted).map((task) => task.id);
  const later = getAvailableTasks('sick-child', 13 * 60, [], 20, lastCompleted).map((task) => task.id);

  assert.ok(!soon.includes('give-medicine'));
  assert.ok(!soon.includes('diaper-change'));
  assert.ok(later.includes('give-medicine'));
  assert.ok(later.includes('diaper-change'));
});

test('live-out scenarios begin at the contracted start time', () => {
  GameState.resetJourney();
  GameState.startScenario('salary-conversation');

  assert.equal(GameState.resetDay().clockMinutes, 8 * 60);
});
