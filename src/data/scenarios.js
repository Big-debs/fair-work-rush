const request = (id, at, title, body, minutes, staminaDelta, extras = {}) => ({
  id,
  at,
  title,
  body,
  minutes,
  staminaDelta,
  additional: true,
  ...extras
});

export const WORKER_PROFILES = {
  ada: {
    id: 'ada',
    name: 'Ada',
    role: 'Live-in household worker',
    note: 'Ada lives where she works, so availability can easily be mistaken for working time.'
  },
  mariam: {
    id: 'mariam',
    name: 'Mariam',
    role: 'Live-out household worker',
    note: 'Mariam has a defined journey home, making late requests visible in a different way.'
  },
  chika: {
    id: 'chika',
    name: 'Chika',
    role: 'Live-in caregiver and household worker',
    note: 'Chika balances care work with household tasks, where urgency is often assumed.'
  }
};

export const SCENARIOS = [
  {
    id: 'ordinary-day',
    title: 'An ordinary day',
    tag: 'BASELINE',
    profileId: 'ada',
    contractId: 'live-in-domestic-basic',
    expectedHours: 8,
    brief: 'A familiar schedule slowly expands through small requests.',
    openingNote: 'The agreement says eight hours. The household expects flexibility.',
    events: [
      request('ordinary-school', 7 * 60, 'School run pressure', 'Breakfast ran late and the children still need help getting ready.', 35, -7),
      request('ordinary-guest-room', 10 * 60, 'One more room', 'A relative may stay over. The guest room should be prepared.', 45, -10),
      request('ordinary-late-gate', 25 * 60 + 10, 'You are still here', 'A late-night gate request arrives at 1:10 AM.', 20, -6, { interruption: true, onCall: true })
    ],
    variants: [
      request('ordinary-delivery', 14 * 60 + 30, 'Wait for a delivery', 'Someone needs to remain available for an uncertain delivery window.', 40, -5, { onCall: true }),
      request('ordinary-ironing', 16 * 60, 'Clothes for tomorrow', 'An outfit is needed early tomorrow and must be ironed tonight.', 30, -7)
    ]
  },
  {
    id: 'unexpected-visitors',
    title: 'Unexpected visitors',
    tag: 'SURGE DAY',
    profileId: 'ada',
    contractId: 'live-in-domestic-basic',
    expectedHours: 8,
    brief: 'A casual visit creates a second shift of invisible work.',
    openingNote: 'No one planned for guests, but the extra preparation lands somewhere.',
    events: [
      request('visitors-shopping', 9 * 60, 'Quick market trip', 'More food is needed before the visitors arrive.', 60, -12),
      request('visitors-serving', 17 * 60 + 30, 'Please stay to serve', 'The visit has moved into the evening and plates keep returning.', 90, -18),
      request('visitors-cleanup', 21 * 60, 'Clean up before bed', 'The household wants the sitting room reset tonight.', 60, -13, { interruption: true })
    ],
    variants: [
      request('visitors-extra-room', 12 * 60, 'They may stay over', 'Now the spare room and fresh linen are needed too.', 50, -11),
      request('visitors-children', 13 * 60, 'More children arrive', 'The guests brought children who need food and supervision.', 45, -10)
    ]
  },
  {
    id: 'sick-child',
    title: 'A child is unwell',
    tag: 'CARE DAY',
    profileId: 'chika',
    contractId: 'live-in-domestic-basic',
    expectedHours: 8,
    brief: 'Real care needs collide with rest, routine, and unclear responsibility.',
    openingNote: 'Care is urgent. That does not make its time or emotional load disappear.',
    events: [
      request('sick-monitor', 8 * 60, 'Stay close and monitor', 'The child needs regular checks while the rest of the work continues.', 75, -12, { onCall: true }),
      request('sick-pharmacy', 13 * 60, 'Go to the pharmacy', 'A prescription is ready, but collecting it interrupts lunch.', 50, -10, { interruption: true }),
      request('sick-night-check', 24 * 60, 'Check again at midnight', 'You are asked to wake up and check the child once more.', 30, -8, { interruption: true, onCall: true })
    ],
    variants: [
      request('sick-laundry', 15 * 60, 'Change all the bedding', 'The bedding needs another wash and the room needs airing.', 55, -12),
      request('sick-meal', 16 * 60, 'Prepare a separate meal', 'A special meal is requested in addition to dinner.', 40, -8)
    ]
  },
  {
    id: 'interrupted-day-off',
    title: 'The interrupted day off',
    tag: 'REST DAY',
    profileId: 'ada',
    contractId: 'live-in-domestic-basic',
    expectedHours: 0,
    brief: 'Being at home makes a protected day feel negotiable.',
    openingNote: 'Today is the agreed weekly day off. Every work request is outside the day’s agreement.',
    events: [
      request('off-breakfast', 8 * 60, 'Just make breakfast first', 'The family asks for one small task before your day off begins.', 45, -9, { interruption: true }),
      request('off-laundry', 12 * 60, 'Since you are here', 'The washing machine is free, so laundry is framed as convenient.', 70, -14, { interruption: true }),
      request('off-evening', 19 * 60, 'Help with dinner', 'Dinner is running late and you are asked to step in.', 60, -13, { interruption: true })
    ],
    variants: [
      request('off-errand', 15 * 60, 'A quick errand', 'A household item is needed and the request sounds too small to refuse.', 35, -8),
      request('off-door', 17 * 60, 'Please wait for someone', 'Your plans are delayed while you wait for a visitor.', 50, -5, { onCall: true })
    ]
  },
  {
    id: 'late-night-demands',
    title: 'Late-night demands',
    tag: 'ON-CALL',
    profileId: 'chika',
    contractId: 'live-in-domestic-basic',
    expectedHours: 8,
    brief: 'A completed shift blurs into overnight availability.',
    openingNote: 'The day has an end time. Living on site makes that boundary difficult to see.',
    events: [
      request('night-dinner', 19 * 60, 'Dinner is delayed', 'A late return means dinner service starts after the normal workday.', 70, -14),
      request('night-kitchen', 22 * 60, 'Reset the kitchen', 'The kitchen should be ready before morning.', 50, -11),
      request('night-door', 26 * 60, 'Open the gate', 'A car arrives at 2:00 AM and you are expected to hear it.', 20, -7, { interruption: true, onCall: true })
    ],
    variants: [
      request('night-water', 23 * 60 + 30, 'Bring water upstairs', 'A small request wakes you just as you settle down.', 15, -5, { interruption: true, onCall: true }),
      request('night-phone', 24 * 60 + 15, 'Answer the household phone', 'A call is redirected to you after midnight.', 20, -5, { interruption: true, onCall: true })
    ]
  },
  {
    id: 'salary-conversation',
    title: 'Pay and responsibilities',
    tag: 'LIVE-OUT',
    profileId: 'mariam',
    contractId: 'live-out-domestic-basic',
    expectedHours: 8,
    brief: 'A live-out arrangement tests whether changed duties change the agreement.',
    openingNote: 'The role has grown. Today offers evidence for a salary and responsibilities conversation.',
    events: [
      request('salary-childcare', 10 * 60, 'Add school pickup', 'Childcare is introduced as a regular addition to cleaning duties.', 60, -12),
      request('salary-shopping', 14 * 60, 'Manage household shopping', 'Planning and purchasing are added without changing the role description.', 70, -13),
      request('salary-stay-late', 16 * 60, 'Stay until they return', 'Leaving on time would leave the house unattended.', 75, -12, { onCall: true })
    ],
    variants: [
      request('salary-key', 12 * 60, 'Take responsibility for the keys', 'A new responsibility is presented as a sign of trust.', 25, -4, { onCall: true }),
      request('salary-weekend', 15 * 60, 'Can you come on Saturday?', 'A recurring weekend request is raised during the workday.', 45, -8)
    ]
  }
];

export function getScenario(scenarioId) {
  return SCENARIOS.find((scenario) => scenario.id === scenarioId) || SCENARIOS[0];
}

export function getWorkerProfile(profileId) {
  return WORKER_PROFILES[profileId] || WORKER_PROFILES.ada;
}

// One controlled variation is selected per run. The selection is predictable
// for a given run number, which keeps tests and comparisons reproducible.
export function selectScenarioEvents(scenario, runNumber = 0) {
  if (!scenario.variants?.length) return [...scenario.events];
  const variant = scenario.variants[Math.abs(runNumber) % scenario.variants.length];
  return [...scenario.events, variant].sort((a, b) => a.at - b.at);
}
