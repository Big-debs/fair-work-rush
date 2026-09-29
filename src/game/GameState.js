import { LIVE_IN_DOMESTIC_CONTRACT } from './Contract.js';
import { DAY_START } from './TimelineEngine.js';

export const GameState = {
  day: 1,
  reputation: 100,
  wallet: 0,
  skills: { negotiator: 0, pacingExpert: 0, rapidRecovery: 0 },
  contract: LIVE_IN_DOMESTIC_CONTRACT,

  resetDay() {
    return {
      clockMinutes: DAY_START,
      stamina: 100,
      activeMinutes: 0,
      standbyMinutes: 0,
      personalMinutes: 0,
      sleepMinutes: 0,
      onCallMinutes: 0,
      additionalMinutes: 0,
      interruptionCount: 0,
      oneMoreThings: 0,
      tasksCompleted: 0,
      events: [],
      lastEvent: null,
      ended: false
    };
  },

  effectiveHourlyRate() {
    const c = this.contract;
    const expectedMonthlyHours = c.schedule.expectedHoursPerDay * 26;
    return c.monthlySalary / expectedMonthlyHours;
  },

  summarize(day) {
    const expected = this.contract.schedule.expectedHoursPerDay * 60;
    const activeWorkMinutes = day.activeMinutes + day.onCallMinutes;
    const availabilityMinutes = day.standbyMinutes + day.onCallMinutes;
    const totalWorkMinutes = day.activeMinutes + day.standbyMinutes + day.onCallMinutes;
    return {
      expectedWorkMinutes: expected,
      activeWorkMinutes,
      availabilityMinutes,
      totalWorkMinutes,
      requestedAdditionalMinutes: day.additionalMinutes,
      workBeyondAgreementMinutes: Math.max(0, totalWorkMinutes - expected),
      effectiveRate: totalWorkMinutes > 0
        ? this.contract.monthlySalary / (26 * (totalWorkMinutes / 60))
        : 0
    };
  }
};
