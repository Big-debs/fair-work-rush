const task = (id, name, shortName, context, minutes, staminaDelta, type, accent, availableFrom, availableUntil, extras = {}) => ({
  id,
  name,
  shortName,
  context,
  minutes,
  staminaDelta,
  type,
  accent,
  availableFrom,
  availableUntil,
  ...extras
});

export const TASK_LIBRARY = {
  breakfast: task('breakfast', 'Prepare and serve breakfast', 'Breakfast prep', 'KITCHEN', 60, -10, 'work', 0xd97745, 330, 660),
  schoolPrep: task('school-prep', 'Bathe and dress the children for school', 'School prep', 'CHILDCARE', 40, -8, 'work', 0xb95739, 330, 540),
  schoolRun: task('school-run', 'Take the children to school', 'School run', 'TRANSPORT', 50, -9, 'work', 0x526d9f, 390, 540),
  diaper: task('diaper-change', 'Change the baby and settle them', 'Diaper change', 'INFANT CARE', 20, -5, 'work', 0x9b6b43, 330, 1260, { repeatable: true, cooldownMinutes: 120 }),
  dishes: task('morning-dishes', 'Wash breakfast dishes and reset the kitchen', 'Wash dishes', 'KITCHEN', 35, -7, 'work', 0x287d78, 420, 780),
  makeBeds: task('make-beds', 'Make beds and air the bedrooms', 'Make the beds', 'BEDROOMS', 40, -7, 'work', 0x76538f, 330, 780),
  cleanRooms: task('clean-rooms', 'Sweep, mop, and dust the main rooms', 'Clean rooms', 'HOUSE', 75, -16, 'work', 0x4f7c78, 450, 1020),
  bathrooms: task('clean-bathrooms', 'Scrub and restock the bathrooms', 'Bathrooms', 'CLEANING', 55, -13, 'work', 0x357d86, 480, 1020),
  laundry: task('laundry', 'Wash and hang the household laundry', 'Do laundry', 'UTILITY', 80, -18, 'work', 0x526d9f, 480, 1020),
  ironing: task('ironing', 'Iron and put away clean clothes', 'Iron clothes', 'UTILITY', 70, -15, 'work', 0x65558f, 780, 1200),
  market: task('market-run', 'Buy food and household supplies at the market', 'Market run', 'ERRAND', 100, -17, 'work', 0xb66a35, 510, 960),
  lunch: task('lunch-prep', 'Prepare and serve lunch', 'Lunch prep', 'KITCHEN', 70, -12, 'work', 0xd97745, 630, 930),
  snack: task('snack-prep', 'Prepare the children’s afternoon snack', 'Snack prep', 'CHILDCARE', 30, -6, 'work', 0xd59a43, 780, 1080),
  schoolPickup: task('school-pickup', 'Collect the children from school', 'School pickup', 'TRANSPORT', 55, -10, 'work', 0x526d9f, 750, 1020),
  homework: task('homework-help', 'Supervise homework and school bags', 'Homework help', 'CHILDCARE', 50, -9, 'work', 0xb95739, 900, 1170),
  dinner: task('dinner-prep', 'Prepare the household dinner', 'Dinner prep', 'KITCHEN', 90, -17, 'work', 0xd97745, 930, 1260),
  serveDinner: task('serve-dinner', 'Serve dinner and clear the table', 'Serve dinner', 'DINING', 50, -10, 'work', 0xa65b3a, 1050, 1320),
  kitchenClose: task('kitchen-close', 'Wash up and close the kitchen', 'Kitchen close', 'KITCHEN', 60, -13, 'work', 0x287d78, 1110, 1380),
  childBedtime: task('child-bedtime', 'Bathe the children and prepare them for bed', 'Children’s bedtime', 'CHILDCARE', 60, -12, 'work', 0xb95739, 1080, 1320),
  nextDayPrep: task('next-day-prep', 'Set out uniforms and prepare for tomorrow', 'Prepare tomorrow', 'PLANNING', 40, -7, 'work', 0x65558f, 1170, 1410),

  guestRoom: task('prepare-guest-room', 'Prepare the guest room and fresh linen', 'Guest room', 'VISITORS', 65, -14, 'work', 0x76538f, 480, 1080),
  visitorMarket: task('visitor-market-run', 'Buy extra food and drinks for visitors', 'Extra market run', 'ERRAND', 110, -19, 'work', 0xb66a35, 480, 1020),
  guestServing: task('serve-visitors', 'Serve drinks and food to the visitors', 'Serve visitors', 'HOSPITALITY', 70, -14, 'work', 0xa65b3a, 900, 1320, { repeatable: true, cooldownMinutes: 90 }),
  guestCleanup: task('guest-cleanup', 'Clear plates and reset the sitting room', 'Guest cleanup', 'HOSPITALITY', 75, -16, 'work', 0x4f7c78, 1080, 1440),

  temperature: task('temperature-check', 'Check and record the child’s temperature', 'Temperature check', 'CARE', 20, -5, 'work', 0xb95739, 330, 1380, { repeatable: true, cooldownMinutes: 120 }),
  medicine: task('give-medicine', 'Give prescribed medicine and note the time', 'Give medicine', 'CARE', 20, -4, 'work', 0x526d9f, 420, 1260, { repeatable: true, cooldownMinutes: 240 }),
  specialMeal: task('special-meal', 'Prepare a separate light meal for the child', 'Special meal', 'CARE', 50, -9, 'work', 0xd97745, 600, 1140),
  sickBedding: task('sick-bedding', 'Change and wash the child’s bedding', 'Change bedding', 'CARE', 60, -13, 'work', 0x287d78, 480, 1080),
  monitorChild: task('monitor-child', 'Stay nearby and monitor the child', 'Monitor child', 'ON-CALL CARE', 60, -7, 'standby', 0x76538f, 330, 1440, { repeatable: true, cooldownMinutes: 60 }),

  stockList: task('stock-list', 'Check supplies and prepare a shopping list', 'Check supplies', 'PLANNING', 40, -6, 'work', 0x65558f, 480, 960),
  employerErrand: task('employer-errand', 'Collect an item for the household', 'Household errand', 'ERRAND', 70, -12, 'work', 0xb66a35, 540, 1080),
  commuteHome: task('commute-home', 'Leave work and travel home', 'Travel home', 'PERSONAL', 60, -5, 'personal', 0x3f8f72, 960, 1320, { repeatable: true }),

  personalVisit: task('personal-visit', 'Visit family or friends', 'Visit family', 'DAY OFF', 120, -4, 'personal', 0x3f8f72, 480, 1140),
  personalMarket: task('personal-market', 'Shop for personal food and supplies', 'Personal shopping', 'DAY OFF', 90, -8, 'personal', 0x287d78, 480, 1080),
  callFamily: task('call-family', 'Call family and catch up', 'Call family', 'DAY OFF', 45, 5, 'personal', 0x526d9f, 420, 1260, { repeatable: true }),
  attendService: task('attend-service', 'Attend a service or community gathering', 'Go out', 'DAY OFF', 150, -5, 'personal', 0x76538f, 420, 1080),

  break: task('rest', 'Take a protected break', 'Take a break', 'RECOVERY', 30, 12, 'personal', 0x3f8f72, 330, 1500, { repeatable: true }),
  mealBreak: task('meal-break', 'Sit down and eat your own meal', 'Eat your meal', 'RECOVERY', 35, 10, 'personal', 0x3f8f72, 660, 1200, { repeatable: true }),
  sleep: task('sleep', 'Sleep and recover', 'Sleep', 'RECOVERY', 420, 45, 'sleep', 0x65558f, 1200, 1770, { repeatable: true })
};

const COMMON_WORKDAY = [
  'breakfast', 'schoolPrep', 'schoolRun', 'diaper', 'dishes', 'makeBeds', 'cleanRooms', 'bathrooms',
  'laundry', 'ironing', 'market', 'lunch', 'snack', 'schoolPickup', 'homework', 'dinner', 'serveDinner',
  'kitchenClose', 'childBedtime', 'nextDayPrep', 'break', 'mealBreak', 'sleep'
];

export const SCENARIO_TASK_IDS = {
  'ordinary-day': COMMON_WORKDAY,
  'unexpected-visitors': [
    'breakfast', 'schoolPrep', 'dishes', 'cleanRooms', 'guestRoom', 'visitorMarket', 'lunch', 'snack',
    'guestServing', 'dinner', 'serveDinner', 'guestCleanup', 'kitchenClose', 'break', 'mealBreak', 'sleep'
  ],
  'sick-child': [
    'breakfast', 'diaper', 'temperature', 'medicine', 'monitorChild', 'specialMeal', 'sickBedding',
    'laundry', 'lunch', 'snack', 'dinner', 'kitchenClose', 'break', 'mealBreak', 'sleep'
  ],
  'interrupted-day-off': [
    'personalVisit', 'personalMarket', 'callFamily', 'attendService', 'break', 'mealBreak', 'sleep'
  ],
  'late-night-demands': [
    'breakfast', 'schoolRun', 'cleanRooms', 'laundry', 'market', 'lunch', 'schoolPickup', 'snack',
    'dinner', 'serveDinner', 'kitchenClose', 'childBedtime', 'nextDayPrep', 'break', 'mealBreak', 'sleep'
  ],
  'salary-conversation': [
    'breakfast', 'cleanRooms', 'bathrooms', 'laundry', 'stockList', 'market', 'employerErrand', 'lunch',
    'schoolPickup', 'snack', 'dinner', 'commuteHome', 'break', 'mealBreak', 'sleep'
  ]
};

// Kept as a compatibility export for simulations that still use the original
// Phase 1 event fixture.
export const LIVE_IN_EVENTS = [
  { id: 'children', at: 7 * 60, title: 'The children need help', body: 'School preparation is taking longer than expected.', minutes: 45, staminaDelta: -8, additional: false },
  { id: 'guest-room', at: 9 * 60, title: 'One more thing', body: 'A guest is arriving. Please quickly prepare the guest room.', minutes: 45, staminaDelta: -10, additional: true },
  { id: 'break-interrupted', at: 11 * 60 + 30, title: 'Your break is interrupted', body: '“Please just help me with this before you rest.”', minutes: 20, staminaDelta: -5, additional: true, interruption: true },
  { id: 'evening-guests', at: 18 * 60, title: 'Evening guests', body: 'There are visitors tonight. The kitchen needs extra attention.', minutes: 75, staminaDelta: -16, additional: true },
  { id: 'late-gate', at: 25 * 60 + 10, title: 'You are still here', body: 'A late-night gate request arrives at 1:10 AM.', minutes: 20, staminaDelta: -6, additional: true, interruption: true, onCall: true }
];

function scoreTask(item, clockMinutes, completedTaskIds) {
  const midpoint = (item.availableFrom + item.availableUntil) / 2;
  const freshness = completedTaskIds.includes(item.id) ? 10000 : 0;
  return freshness + Math.abs(clockMinutes - midpoint);
}

export function getAvailableTasks(scenarioId, clockMinutes, completedTaskIds = [], limit = 6, lastTaskCompletionMinutes = {}) {
  const ids = SCENARIO_TASK_IDS[scenarioId] || COMMON_WORKDAY;
  const available = ids
    .map((id) => TASK_LIBRARY[id])
    .filter(Boolean)
    .filter((item) => clockMinutes >= item.availableFrom && clockMinutes < item.availableUntil)
    .filter((item) => item.repeatable || !completedTaskIds.includes(item.id))
    .filter((item) => lastTaskCompletionMinutes[item.id] === undefined ||
      clockMinutes - lastTaskCompletionMinutes[item.id] >= (item.cooldownMinutes || 0))
    .sort((a, b) => scoreTask(a, clockMinutes, completedTaskIds) - scoreTask(b, clockMinutes, completedTaskIds));

  return available.slice(0, limit);
}

export const TASKS = Object.values(TASK_LIBRARY);
