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

export const LIVE_OUT_DOMESTIC_CONTRACT = {
  id: 'live-out-domestic-basic',
  role: 'Household Worker',
  payType: 'monthly',
  monthlySalary: 120000,
  schedule: {
    expectedHoursPerDay: 8,
    expectedDaysPerWeek: 5,
    dayOffLabel: '2 days off each week'
  },
  livingArrangement: 'live_out',
  benefits: {
    accommodation: false,
    meals: false
  },
  boundaries: {
    normalStart: 8,
    normalEnd: 16,
    nightWorkRequiresRequest: true
  }
};

export const CONTRACTS = {
  [LIVE_IN_DOMESTIC_CONTRACT.id]: LIVE_IN_DOMESTIC_CONTRACT,
  [LIVE_OUT_DOMESTIC_CONTRACT.id]: LIVE_OUT_DOMESTIC_CONTRACT
};

export function getContract(contractId) {
  return CONTRACTS[contractId] || LIVE_IN_DOMESTIC_CONTRACT;
}
