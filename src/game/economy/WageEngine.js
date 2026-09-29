import { GameState } from '../GameState.js';

export function getMonthlySalary() {
  return GameState.contract.monthlySalary;
}

export function getExpectedMonthlyHours() {
  return GameState.contract.schedule.expectedHoursPerDay * 26;
}

export function getAnalyticalHourlyEquivalent() {
  return getMonthlySalary() / getExpectedMonthlyHours();
}

// The worker is paid a monthly salary. This function deliberately does not
// turn the contract into an hourly wage; the hourly figure is analytical only.
export function summarizeCompensation(day) {
  const totalWorkHours = (
    day.activeMinutes + day.standbyMinutes + day.onCallMinutes
  ) / 60;
  const analyticalRate = totalWorkHours > 0
    ? GameState.contract.monthlySalary / (26 * totalWorkHours)
    : 0;

  return {
    monthlySalary: getMonthlySalary(),
    expectedMonthlyHours: getExpectedMonthlyHours(),
    analyticalHourlyEquivalent: getAnalyticalHourlyEquivalent(),
    effectiveRateForToday: analyticalRate,
    countedWorkMinutes: totalWorkHours * 60
  };
}
