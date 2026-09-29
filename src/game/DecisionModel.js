function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scaledStamina(delta, factor) {
  return Math.round(delta * factor);
}

export function getDecisionOptions(event, shift) {
  const pressureOverhang = Math.max(0, shift.boundaryPressure - 40);
  const expectationMultiplier = 1 + pressureOverhang / 200;
  const acceptMinutes = Math.round(event.minutes * expectationMultiplier);
  const negotiatedMinutes = Math.max(10, Math.round(event.minutes * 0.6));

  return [
    {
      id: 'accept',
      label: 'Do it now',
      detail: `${acceptMinutes}m · keeps the peace`,
      minutes: acceptMinutes,
      staminaDelta: scaledStamina(event.staminaDelta, expectationMultiplier),
      householdTrustDelta: 5,
      boundaryPressureDelta: 9,
      stressDelta: 6,
      message: 'You absorbed the request. It may be easier for the next request to feel automatic.'
    },
    {
      id: 'negotiate',
      label: 'Negotiate the timing',
      detail: `${negotiatedMinutes}m · some tension`,
      minutes: negotiatedMinutes,
      staminaDelta: scaledStamina(event.staminaDelta, 0.6),
      householdTrustDelta: -1,
      boundaryPressureDelta: -4,
      stressDelta: 2,
      message: 'You reduced the immediate demand and made the boundary visible.'
    },
    {
      id: 'decline',
      label: 'Set a boundary',
      detail: '0m · protects your time',
      minutes: 0,
      staminaDelta: 0,
      householdTrustDelta: -8,
      boundaryPressureDelta: -9,
      stressDelta: 5,
      message: 'You protected your time, but the refusal created immediate tension.'
    },
    {
      id: 'record',
      label: 'Accept and record it',
      detail: `${event.minutes}m · creates a record`,
      minutes: event.minutes,
      staminaDelta: event.staminaDelta,
      householdTrustDelta: 3,
      boundaryPressureDelta: 5,
      stressDelta: 3,
      recorded: true,
      message: 'You completed the request and logged it for a later conversation.'
    }
  ];
}

export function applyChoiceMetrics(shift, choice) {
  shift.householdTrust = clamp(shift.householdTrust + choice.householdTrustDelta);
  shift.boundaryPressure = clamp(shift.boundaryPressure + choice.boundaryPressureDelta);
  shift.stress = clamp(shift.stress + choice.stressDelta);
  shift.stamina = clamp(shift.stamina + choice.staminaDelta);
}
