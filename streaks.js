export function updateStreak(currentStreak, won) {
  if (!won) return 0;
  return currentStreak + 1;
}

export function getStreakMultiplier(streak) {
  if (streak < 2) return 1;
  const bonusSteps = streak - 1;
  return 1 + bonusSteps * 0.1;
}

export function getStreakLabel(streak) {
  if (streak < 2) return null;
  const percent = Math.round((getStreakMultiplier(streak) - 1) * 100);
  return `${streak}-win streak (+${percent}%)`;
}