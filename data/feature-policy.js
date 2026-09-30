// Retain legacy save fields while removing retired features from active play.
export const CONSUMABLES_ENABLED = false;

export function strategyResearchPoints(snapshot) {
  return Math.min(1460, 10 + Math.max(0, snapshot.records?.trainingCompleted ?? 0) * 10);
}
