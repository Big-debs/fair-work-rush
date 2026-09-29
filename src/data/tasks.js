export const TASKS = [
  { id: 'breakfast', name: 'Prepare breakfast', shortName: 'Breakfast', context: 'KITCHEN', minutes: 60, staminaDelta: -10, type: 'work', accent: 0xd97745 },
  { id: 'clean', name: 'House cleaning', shortName: 'Clean rooms', context: 'HOUSE', minutes: 90, staminaDelta: -20, type: 'work', accent: 0x4f7c78 },
  { id: 'laundry', name: 'Laundry & ironing', shortName: 'Laundry', context: 'UTILITY', minutes: 90, staminaDelta: -22, type: 'work', accent: 0x526d9f },
  { id: 'rest', name: 'Take a break', shortName: 'Take a break', context: 'PERSONAL', minutes: 30, staminaDelta: 12, type: 'personal', accent: 0x3f8f72 },
  { id: 'sleep', name: 'Sleep', shortName: 'Sleep', context: 'RECOVERY', minutes: 420, staminaDelta: 45, type: 'sleep', accent: 0x65558f }
];

export const LIVE_IN_EVENTS = [
  { id: 'children', at: 7 * 60, title: 'The children need help', body: 'School preparation is taking longer than expected.', minutes: 45, staminaDelta: -8, additional: false },
  { id: 'guest-room', at: 9 * 60, title: 'One more thing', body: 'A guest is arriving. Please quickly prepare the guest room.', minutes: 45, staminaDelta: -10, additional: true },
  { id: 'break-interrupted', at: 11 * 60 + 30, title: 'Your break is interrupted', body: '“Please just help me with this before you rest.”', minutes: 20, staminaDelta: -5, additional: true, interruption: true },
  { id: 'evening-guests', at: 18 * 60, title: 'Evening guests', body: 'There are visitors tonight. The kitchen needs extra attention.', minutes: 75, staminaDelta: -16, additional: true },
  { id: 'late-gate', at: 25 * 60 + 10, title: 'You are still here', body: 'A late-night gate request arrives at 1:10 AM.', minutes: 20, staminaDelta: -6, additional: true, interruption: true, onCall: true }
];
