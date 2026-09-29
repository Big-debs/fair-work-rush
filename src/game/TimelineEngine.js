export const DAY_START = 5 * 60 + 30;
export const DAY_END = 29 * 60 + 30;
import { applyChoiceMetrics, getDecisionOptions } from './DecisionModel.js';

const MINUTE_BUCKETS = {
  work: 'activeMinutes',
  standby: 'standbyMinutes',
  personal: 'personalMinutes',
  sleep: 'sleepMinutes',
  onCall: 'onCallMinutes'
};

function addMinutes(shift, minutes, activity) {
  const bucket = MINUTE_BUCKETS[activity];
  if (!bucket || minutes <= 0) return;
  shift[bucket] += minutes;
}

function nextPendingEvent(shift, events) {
  return events
    .filter((event) => !shift.events.includes(event.id))
    .sort((a, b) => a.at - b.at)[0];
}

/**
 * Advance only until the next unresolved request. The game can pause here,
 * collect a player decision, then resume the unspent activity time.
 */
export function advanceUntilDecision(shift, minutes, activity, events = []) {
  let remaining = Math.max(0, minutes);

  while (shift.clockMinutes < DAY_END) {
    const event = nextPendingEvent(shift, events);

    if (event && event.at <= shift.clockMinutes) {
      return {
        pendingEvent: event,
        requestedMinutes: minutes,
        completedMinutes: minutes - remaining,
        uncompletedMinutes: remaining,
        ended: false
      };
    }

    if (remaining <= 0) break;

    const untilEvent = event ? event.at - shift.clockMinutes : Infinity;
    const availableToday = DAY_END - shift.clockMinutes;
    const step = Math.min(remaining, untilEvent, availableToday);

    addMinutes(shift, step, activity);
    shift.clockMinutes += step;
    remaining -= step;

    if (step === 0 && (!event || event.at > shift.clockMinutes)) break;
  }

  return {
    pendingEvent: null,
    requestedMinutes: minutes,
    completedMinutes: minutes - remaining,
    uncompletedMinutes: remaining,
    ended: shift.clockMinutes >= DAY_END
  };
}

export function resolveEventDecision(shift, event, decisionId = 'accept') {
  if (!event || shift.events.includes(event.id) || shift.clockMinutes >= DAY_END) return null;

  const choices = getDecisionOptions(event, shift);
  const choice = choices.find((option) => option.id === decisionId) || choices[0];
  const actualMinutes = Math.min(choice.minutes, DAY_END - shift.clockMinutes);
  const activity = event.onCall ? 'onCall' : 'work';

  shift.events.push(event.id);
  shift.lastEvent = event.title;
  if (event.additional) {
    shift.oneMoreThings += 1;
    shift.additionalMinutes += event.minutes;
  }
  if (event.interruption) shift.interruptionCount += 1;

  addMinutes(shift, actualMinutes, activity);
  shift.clockMinutes += actualMinutes;
  applyChoiceMetrics(shift, choice);

  if (choice.id === 'accept') shift.acceptedRequests += 1;
  if (choice.id === 'negotiate') shift.negotiatedRequests += 1;
  if (choice.id === 'decline') shift.declinedRequests += 1;
  if (choice.recorded) shift.recordedRequests += 1;

  const decision = {
    eventId: event.id,
    eventTitle: event.title,
    decisionId: choice.id,
    decisionLabel: choice.label,
    requestedMinutes: event.minutes,
    workedMinutes: actualMinutes,
    clockMinutes: shift.clockMinutes
  };
  shift.decisions.push(decision);

  return { ...event, choice, actualMinutes, decision };
}

/**
 * Compatibility helper for simulations and tests. It automatically accepts
 * requests while preserving the same pause-and-resume rules used by the UI.
 */
export function advanceTimeline(shift, minutes, activity, events = []) {
  let remaining = Math.max(0, minutes);
  const triggeredEvents = [];

  while (shift.clockMinutes < DAY_END) {
    const progress = advanceUntilDecision(shift, remaining, activity, events);
    remaining = progress.uncompletedMinutes;

    if (!progress.pendingEvent) break;
    const resolved = resolveEventDecision(shift, progress.pendingEvent, 'accept');
    if (resolved) triggeredEvents.push(resolved);
  }

  return {
    triggeredEvents,
    requestedMinutes: minutes,
    completedMinutes: minutes - remaining,
    uncompletedMinutes: remaining,
    ended: shift.clockMinutes >= DAY_END
  };
}
