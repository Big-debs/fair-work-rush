import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { DAY_END, advanceTimeline } from '../src/game/TimelineEngine.js';
import { summarizeCompensation } from '../src/game/economy/WageEngine.js';
import { LIVE_IN_EVENTS } from '../src/data/tasks.js';

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
  assert.equal(shift.onCallMinutes, 20);
  assert.equal(shift.oneMoreThings, 4);
});
