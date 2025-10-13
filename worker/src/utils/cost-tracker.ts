import { BUDGETS, UserTier } from '../../../shared/types';

/**
 * Track and enforce LLM cost budgets
 */

export function checkBudget(currentCost: number, tier: UserTier): void {
  const budget = tier === 'paid' ? BUDGETS.PAID_TIER_MAX : BUDGETS.FREE_TIER_MAX;
  
  if (currentCost > budget) {
    throw new Error(
      `Budget exceeded: $${currentCost.toFixed(4)} > $${budget.toFixed(2)} (${tier} tier)`
    );
  }
  
  // Warn at 80%
  if (currentCost > budget * 0.8) {
    console.warn(`⚠️  Cost warning: $${currentCost.toFixed(4)} (${((currentCost/budget)*100).toFixed(0)}% of budget)`);
  }
}

export function trackCost(operation: string, cost: number): void {
  console.log(`💰 ${operation}: $${cost.toFixed(4)}`);
}

export function getRemainingBudget(currentCost: number, tier: UserTier): number {
  const budget = tier === 'paid' ? BUDGETS.PAID_TIER_MAX : BUDGETS.FREE_TIER_MAX;
  return Math.max(0, budget - currentCost);
}

