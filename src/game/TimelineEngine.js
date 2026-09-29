export const DAY_START = 5 * 60 + 30;
export const DAY_END = 29 * 60 + 30;

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

function applyEvent(shift, event) {
  if (shift.clockMinutes >= DAY_END) return null;

  const actualMinutes = Math.min(event.minutes, DAY_END - shift.clockMinutes);
  const activity = event.onCall ? 'onCall' : 'work';

  shift.events.push(event.id);
  shift.lastEvent = event.title;
  if (event.additional) shift.oneMoreThings += 1;
  if (event.interruption) shift.interruptionCount += 1;
  if (event.additional) shift.additionalMinutes += actualMinutes;

  addMinutes(shift, actualMinutes, activity);
  shift.clockMinutes += actualMinutes;
  shift.stamina = Math.max(0, Math.min(100, shift.stamina + event.staminaDelta));

  return { ...event, actualMinutes };
}

/**
 * Advance a shift by a chosen activity duration. Scheduled events are fired at
 * their real clock time, interrupt the activity, and the unspent activity time
 * resumes afterwards. The returned event list is useful for UI presentation.
 */
export function advanceTimeline(shift, minutes, activity, events = []) {
  let remaining = Math.max(0, minutes);
  const triggeredEvents = [];

  while (shift.clockMinutes < DAY_END) {
    const event = nextPendingEvent(shift, events);

    if (event && event.at <= shift.clockMinutes) {
      const triggered = applyEvent(shift, event);
      if (triggered) triggeredEvents.push(triggered);
      continue;
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
    triggeredEvents,
    requestedMinutes: minutes,
    completedMinutes: minutes - remaining,
    uncompletedMinutes: remaining,
    ended: shift.clockMinutes >= DAY_END
  };
}
