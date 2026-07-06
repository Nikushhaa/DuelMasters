// src/systems/economy.js
// Handles all money-related rules: base round rewards and applying the
// win-streak multiplier on top of them.

export const ECONOMY_CONFIG = {
  startingMoney: 800,
  winReward: 3000,
  lossReward: 1400,
  maxMoney: 16000,
};

export function calculateRoundReward(won, streakMultiplier = 1) {
  const base = won ? ECONOMY_CONFIG.winReward : ECONOMY_CONFIG.lossReward;
  const finalAmount = won ? base * streakMultiplier : base;
  return Math.round(finalAmount);
}

export function applyReward(currentMoney, reward) {
  return Math.min(ECONOMY_CONFIG.maxMoney, currentMoney + reward);
}

export function canAfford(money, price) {
  return money >= price;
}