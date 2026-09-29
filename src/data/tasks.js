export const TASKS = [
  { id: 'breakfast', name: 'Prepare breakfast', minutes: 60, staminaDelta: -10, type: 'work' },
  { id: 'clean', name: 'House cleaning', minutes: 90, staminaDelta: -20, type: 'work' },
  { id: 'laundry', name: 'Laundry & ironing', minutes: 90, staminaDelta: -22, type: 'work' },
  { id: 'rest', name: 'Take a break', minutes: 30, staminaDelta: 12, type: 'personal' },
  { id: 'sleep', name: 'Sleep', minutes: 420, staminaDelta: 45, type: 'sleep' }
];

export const LIVE_IN_EVENTS = [
  { id: 'children', at: 7 * 60, title: 'The children need help', body: 'School preparation is taking longer than expected.', minutes: 45, staminaDelta: -8, additional: false },
  { id: 'guest-room', at: 9 * 60, title: 'One more thing', body: 'A guest is arriving. Please quickly prepare the guest room.', minutes: 45, staminaDelta: -10, additional: true },
  { id: 'break-interrupted', at: 11 * 60 + 30, title: 'Your break is interrupted', body: '“Please just help me with this before you rest.”', minutes: 20, staminaDelta: -5, additional: true, interruption: true },
  { id: 'evening-guests', at: 18 * 60, title: 'Evening guests', body: 'There are visitors tonight. The kitchen needs extra attention.', minutes: 75, staminaDelta: -16, additional: true },
  { id: 'late-gate', at: 25 * 60 + 10, title: 'You are still here', body: 'A late-night gate request arrives at 1:10 AM.', minutes: 20, staminaDelta: -6, additional: true, interruption: true, onCall: true }
];
