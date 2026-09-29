export const LIVE_IN_DOMESTIC_CONTRACT = {
  id: 'live-in-domestic-basic',
  role: 'Household Worker',
  payType: 'monthly',
  monthlySalary: 100000,
  schedule: {
    expectedHoursPerDay: 8,
    expectedDaysPerWeek: 6,
    dayOffLabel: '1 day off each week'
  },
  livingArrangement: 'live_in',
  benefits: {
    accommodation: true,
    meals: true
  },
  boundaries: {
    normalStart: 6,
    normalEnd: 14,
    nightWorkRequiresRequest: true
  }
};
