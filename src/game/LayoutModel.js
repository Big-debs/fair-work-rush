export const MOBILE_SCENE_BREAKPOINT = 600;
export const SIMULATION_DAY_MINUTES = 24 * 60;
export const SIMULATION_START_MINUTES = 5 * 60 + 30;

const clampPercent = (value) => Math.max(0, Math.min(100, value));

export function getGameDimensions(parentWidth = 800) {
  return parentWidth < MOBILE_SCENE_BREAKPOINT
    ? { width: 390, height: 720, compact: true }
    : { width: 800, height: 600, compact: false };
}

export function getTimelineModel({ expectedMinutes = 0, totalWorkMinutes = 0, clockMinutes = SIMULATION_START_MINUTES }) {
  return {
    expectedPercent: clampPercent((expectedMinutes / SIMULATION_DAY_MINUTES) * 100),
    actualPercent: clampPercent((totalWorkMinutes / SIMULATION_DAY_MINUTES) * 100),
    elapsedPercent: clampPercent(((clockMinutes - SIMULATION_START_MINUTES) / SIMULATION_DAY_MINUTES) * 100)
  };
}
