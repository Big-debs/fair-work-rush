import { LIVE_IN_DOMESTIC_CONTRACT, getContract } from './Contract.js';
import { DAY_START } from './TimelineEngine.js';
import { SCENARIOS, getScenario, selectScenarioEvents } from '../data/scenarios.js';

const clamp = (value) => Math.max(0, Math.min(100, value));

const freshSession = () => ({
  householdTrust: 55,
  boundaryPressure: 20,
  confidence: 45,
  completedScenarioIds: [],
  runCount: 0,
  lastDebrief: null
});

export const DEBRIEF_CHOICES = [
  {
    id: 'evidence',
    label: 'Use the record',
    detail: 'Name the extra time and ask to revise the agreement.',
    householdTrustDelta: -2,
    boundaryPressureDelta: -12,
    confidenceDelta: 10
  },
  {
    id: 'informal',
    label: 'Ask informally',
    detail: 'Raise the issue gently and suggest one practical change.',
    householdTrustDelta: 2,
    boundaryPressureDelta: -5,
    confidenceDelta: 4
  },
  {
    id: 'silent',
    label: 'Say nothing',
    detail: 'Avoid tension now and carry the pattern into the next day.',
    householdTrustDelta: 3,
    boundaryPressureDelta: 8,
    confidenceDelta: -5
  }
];

export const GameState = {
  day: 1,
  reputation: 100,
  wallet: 0,
  skills: { negotiator: 0, pacingExpert: 0, rapidRecovery: 0 },
  contract: LIVE_IN_DOMESTIC_CONTRACT,
  currentScenario: null,
  currentEvents: [],
  session: freshSession(),

  resetJourney() {
    this.day = 1;
    this.currentScenario = null;
    this.currentEvents = [];
    this.contract = LIVE_IN_DOMESTIC_CONTRACT;
    this.session = freshSession();
  },

  startScenario(scenarioId = SCENARIOS[0].id) {
    const scenario = getScenario(scenarioId);
    this.currentScenario = scenario;
    this.contract = getContract(scenario.contractId);
    this.currentEvents = selectScenarioEvents(scenario, this.session.runCount);
    return scenario;
  },

  resetDay() {
    return {
      scenarioId: this.currentScenario?.id || null,
      clockMinutes: this.contract.livingArrangement === 'live_out'
        ? this.contract.boundaries.normalStart * 60
        : DAY_START,
      stamina: 100,
      householdTrust: this.session.householdTrust,
      boundaryPressure: this.session.boundaryPressure,
      confidence: this.session.confidence,
      stress: clamp(15 + Math.round(this.session.boundaryPressure / 10) - Math.round(this.session.confidence / 15)),
      activeMinutes: 0,
      standbyMinutes: 0,
      personalMinutes: 0,
      sleepMinutes: 0,
      onCallMinutes: 0,
      additionalMinutes: 0,
      interruptionCount: 0,
      oneMoreThings: 0,
      tasksCompleted: 0,
      completedTaskIds: [],
      lastTaskCompletionMinutes: {},
      decisions: [],
      acceptedRequests: 0,
      negotiatedRequests: 0,
      declinedRequests: 0,
      recordedRequests: 0,
      events: [],
      lastEvent: null,
      ended: false,
      sessionCommitted: false
    };
  },

  effectiveHourlyRate() {
    const c = this.contract;
    const expectedMonthlyHours = c.schedule.expectedHoursPerDay * 26;
    return c.monthlySalary / expectedMonthlyHours;
  },

  wellbeing(day) {
    return Math.round(clamp(day.stamina * 0.65 + (100 - day.stress) * 0.35));
  },

  summarize(day) {
    const expectedHours = this.currentScenario?.expectedHours ?? this.contract.schedule.expectedHoursPerDay;
    const expected = expectedHours * 60;
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
      wellbeing: this.wellbeing(day),
      decisionCounts: {
        accepted: day.acceptedRequests,
        negotiated: day.negotiatedRequests,
        declined: day.declinedRequests,
        recorded: day.recordedRequests
      },
      effectiveRate: totalWorkMinutes > 0
        ? this.contract.monthlySalary / (26 * (totalWorkMinutes / 60))
        : 0
    };
  },

  completeDay(day) {
    if (day.sessionCommitted) return this.session;
    this.session.householdTrust = clamp(day.householdTrust);
    this.session.boundaryPressure = clamp(day.boundaryPressure);
    this.session.confidence = clamp(
      this.session.confidence + day.negotiatedRequests * 2 + day.declinedRequests * 3 + day.recordedRequests
    );
    if (day.scenarioId && !this.session.completedScenarioIds.includes(day.scenarioId)) {
      this.session.completedScenarioIds.push(day.scenarioId);
    }
    this.session.runCount += 1;
    this.day += 1;
    day.sessionCommitted = true;
    return this.session;
  },

  applyDebriefChoice(choiceId, day) {
    const choice = DEBRIEF_CHOICES.find((item) => item.id === choiceId) || DEBRIEF_CHOICES[0];
    const evidenceBonus = choice.id === 'evidence' && day.recordedRequests > 0 ? 4 : 0;
    this.session.householdTrust = clamp(this.session.householdTrust + choice.householdTrustDelta + evidenceBonus);
    this.session.boundaryPressure = clamp(this.session.boundaryPressure + choice.boundaryPressureDelta - evidenceBonus);
    this.session.confidence = clamp(this.session.confidence + choice.confidenceDelta + evidenceBonus);
    this.session.lastDebrief = {
      choiceId: choice.id,
      scenarioId: day.scenarioId,
      usedRecords: day.recordedRequests > 0
    };
    return { choice, evidenceBonus, session: this.session };
  },

  nextScenarioId() {
    const currentIndex = Math.max(0, SCENARIOS.findIndex((scenario) => scenario.id === this.currentScenario?.id));
    return SCENARIOS[(currentIndex + 1) % SCENARIOS.length].id;
  }
};
