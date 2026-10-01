const step = (id, label, instruction, object, color) => ({ id, label, instruction, object, color });

export const ACTIVITY_FAMILIES = {
  preparation: {
    id: 'preparation',
    title: 'Prepare and serve',
    environment: 'kitchen',
    steps: [
      step('prepare', 'Prepare the workspace', 'Select the work surface and gather what you need.', 'counter', 0xc8834b),
      step('make', 'Complete the preparation', 'Work through the main preparation carefully.', 'pot', 0xb95739),
      step('serve', 'Finish and serve', 'Move the finished items to the serving area.', 'plate', 0xf2c078)
    ]
  },
  cleaning: {
    id: 'cleaning', title: 'Clean the area', environment: 'room',
    steps: [
      step('clear', 'Clear the area', 'Move loose items away from the work zone.', 'basket', 0x9b6b43),
      step('clean', 'Clean every section', 'Work across the highlighted surfaces.', 'brush', 0x287d78),
      step('reset', 'Return the room to order', 'Replace supplies and reset the space.', 'shelf', 0x4f7c78)
    ]
  },
  sorting: {
    id: 'sorting', title: 'Sort and organise', environment: 'utility',
    steps: [
      step('separate', 'Separate the items', 'Sort the items into the correct groups.', 'basket', 0x526d9f),
      step('process', 'Work through each group', 'Handle the selected group before moving on.', 'machine', 0x287d78),
      step('store', 'Put everything away', 'Finish by returning the items to their place.', 'shelf', 0x76538f)
    ]
  },
  shopping: {
    id: 'shopping', title: 'Complete the errand', environment: 'market',
    steps: [
      step('list', 'Check the list', 'Review what the household needs before buying.', 'list', 0xf2c078),
      step('select', 'Find the required items', 'Choose the right items from the market stalls.', 'stall', 0xd97745),
      step('budget', 'Check the money', 'Confirm the total and make any necessary substitutions.', 'coins', 0x3f8f72),
      step('return', 'Return with the supplies', 'Pack the purchases and complete the journey.', 'bag', 0x526d9f)
    ]
  },
  transport: {
    id: 'transport', title: 'Make the journey', environment: 'street',
    steps: [
      step('prepare', 'Prepare to leave', 'Check the destination and gather what must travel.', 'door', 0x9b6b43),
      step('route', 'Choose the route', 'Select a route that balances time and safety.', 'route', 0x526d9f),
      step('arrive', 'Reach the destination', 'Complete the handoff before returning.', 'gate', 0x3f8f72)
    ]
  },
  care: {
    id: 'care', title: 'Complete the care routine', environment: 'care-room',
    steps: [
      step('prepare', 'Prepare a clean space', 'Wash your hands and make the area ready.', 'sink', 0x287d78),
      step('supplies', 'Gather the supplies', 'Bring everything needed within reach.', 'care-bag', 0xf2c078),
      step('care', 'Complete the care step', 'Follow the routine calmly and attentively.', 'care-mat', 0xb95739),
      step('settle', 'Clean up and settle the child', 'Dispose of waste, wash your hands and restore comfort.', 'cot', 0x76538f)
    ]
  },
  supervision: {
    id: 'supervision', title: 'Give focused attention', environment: 'family-room',
    steps: [
      step('observe', 'Understand what is needed', 'Check the situation before acting.', 'chair', 0x526d9f),
      step('support', 'Provide support', 'Stay present while the task or care continues.', 'table', 0xd97745),
      step('confirm', 'Check the outcome', 'Confirm that the person is settled or the work is complete.', 'notebook', 0x3f8f72)
    ]
  },
  hospitality: {
    id: 'hospitality', title: 'Prepare for guests', environment: 'sitting-room',
    steps: [
      step('arrange', 'Arrange the space', 'Prepare the room for the household’s visitors.', 'sofa', 0x76538f),
      step('serve', 'Serve the guests', 'Carry the requested items to the serving area.', 'tray', 0xd97745),
      step('clear', 'Clear and reset', 'Collect used items and restore the room.', 'basket', 0x287d78)
    ]
  },
  recovery: {
    id: 'recovery', title: 'Protect recovery time', environment: 'bedroom',
    steps: [
      step('pause', 'Step away from work', 'Move to a place where the break can begin.', 'chair', 0x3f8f72),
      step('recover', 'Rest and recover', 'Let time pass without taking on another task.', 'bed', 0x65558f),
      step('return', 'Decide what happens next', 'Return only when the recovery period is complete.', 'clock', 0xf2c078)
    ]
  }
};

const FAMILY_BY_TASK = {
  breakfast: 'preparation', 'lunch-prep': 'preparation', 'snack-prep': 'preparation', 'dinner-prep': 'preparation',
  'special-meal': 'preparation', 'serve-dinner': 'hospitality',
  'morning-dishes': 'cleaning', 'clean-rooms': 'cleaning', 'clean-bathrooms': 'cleaning', 'make-beds': 'cleaning',
  'kitchen-close': 'cleaning', 'guest-cleanup': 'cleaning', 'sick-bedding': 'cleaning',
  laundry: 'sorting', ironing: 'sorting', 'next-day-prep': 'sorting', 'stock-list': 'sorting',
  'market-run': 'shopping', 'visitor-market-run': 'shopping', 'employer-errand': 'shopping', 'personal-market': 'shopping',
  'school-run': 'transport', 'school-pickup': 'transport', 'commute-home': 'transport', 'personal-visit': 'transport',
  'diaper-change': 'care', 'temperature-check': 'care', 'give-medicine': 'care',
  'school-prep': 'care', 'child-bedtime': 'care',
  'homework-help': 'supervision', 'monitor-child': 'supervision', 'call-family': 'supervision',
  'prepare-guest-room': 'hospitality', 'serve-visitors': 'hospitality', 'attend-service': 'hospitality',
  rest: 'recovery', 'meal-break': 'recovery', sleep: 'recovery'
};

const FLAGSHIP_STEPS = {
  breakfast: [
    step('wash', 'Wash hands and clear the counter', 'Tap the sink to prepare a clean workspace.', 'sink', 0x287d78),
    step('ingredients', 'Gather the breakfast ingredients', 'Tap the bowl and bring the ingredients together.', 'bowl', 0xf2c078),
    step('cook', 'Cook and watch the heat', 'Tap the pot when the food is ready to move off the heat.', 'pot', 0xb95739),
    step('serve', 'Plate and serve breakfast', 'Tap the plates to finish the meal service.', 'plate', 0xd97745)
  ],
  'market-run': [
    step('list', 'Check the household list', 'Tap the list before entering the market.', 'list', 0xf2c078),
    step('staples', 'Select the food items', 'Tap the market stall to collect the required staples.', 'stall', 0xd97745),
    step('budget', 'Count the remaining money', 'Tap the coins and check whether substitutions are needed.', 'coins', 0x3f8f72),
    step('pack', 'Pack and return home', 'Tap the market bag to complete the errand.', 'bag', 0x526d9f)
  ],
  'diaper-change': ACTIVITY_FAMILIES.care.steps
};

export function getActivityDefinition(task) {
  if (!task) return null;
  const familyId = FAMILY_BY_TASK[task.id] || (task.type === 'personal' || task.type === 'sleep' ? 'recovery' : 'supervision');
  const family = ACTIVITY_FAMILIES[familyId];
  return {
    id: `${task.id}-activity`,
    taskId: task.id,
    familyId,
    title: task.name,
    context: task.context,
    environment: family.environment,
    steps: FLAGSHIP_STEPS[task.id] || family.steps
  };
}

export function getActivityStepMinutes(taskMinutes, stepCount, stepIndex) {
  if (stepCount <= 0 || stepIndex < 0 || stepIndex >= stepCount) return 0;
  const base = Math.floor(taskMinutes / stepCount);
  return stepIndex === stepCount - 1 ? taskMinutes - base * (stepCount - 1) : base;
}
