// Retired manual-use/exploration items stay disabled. Automatic equipment uses auto-items.js.
export const CONSUMABLES_ENABLED = false;

export function strategyResearchPoints(snapshot) {
  return Math.min(1460, 10 + Math.max(0, snapshot.records?.trainingCompleted ?? 0) * 10);
}
