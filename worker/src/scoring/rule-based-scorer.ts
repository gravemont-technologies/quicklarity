import { Task, ScoredTask, FounderProfile } from '../../../shared/types';

/**
 * Rule-based task scoring (ZERO LLM cost)
 * 
 * Computes deterministic scores based on:
 * - Urgency (time-sensitive keywords)
 * - Revenue leverage (revenue-related keywords)
 * - Dependency count (tasks blocking others)
 * - Effort estimate (low/medium/high)
 * - Founder skill match
 * 
 * Formula: impactScore = (0.45 * revenueLeverage) + (0.25 * urgency) + 
 *                        (0.15 * (1 - effort)) + (0.15 * skillMatch)
 * Then normalize to 0-10 scale.
 */
export function scoreTasksWithRules(
  tasks: Task[],
  founderProfile: FounderProfile,
  contextNotes?: string
): ScoredTask[] {
  
  const scoredTasks: ScoredTask[] = tasks.map(task => {
    const urgency = calculateUrgency(task);
    const revenueLeverage = calculateRevenueLeverage(task);
    const dependencyCount = task.dependencies?.length || 0;
    const effortEstimate = calculateEffort(task);
    const founderSkillMatch = calculateSkillMatch(task, founderProfile);
    
    // Weighted formula
    const rawScore = 
      (0.45 * revenueLeverage) +
      (0.25 * urgency) +
      (0.15 * (1 - effortEstimate)) +
      (0.15 * founderSkillMatch);
    
    return {
      ...task,
      urgency,
      revenueLeverage,
      dependencyCount,
      effortEstimate,
      founderSkillMatch,
      rawScore,
      impactScore: 0, // Will normalize after
    };
  });
  
  // Normalize to 0-10 scale
  const minScore = Math.min(...scoredTasks.map(t => t.rawScore));
  const maxScore = Math.max(...scoredTasks.map(t => t.rawScore));
  const range = maxScore - minScore || 1; // Avoid division by zero
  
  scoredTasks.forEach(task => {
    task.impactScore = ((task.rawScore - minScore) / range) * 10;
  });
  
  // Sort by impact score (descending)
  scoredTasks.sort((a, b) => b.impactScore - a.impactScore);
  
  return scoredTasks;
}

/**
 * Calculate urgency (0-1) based on time-sensitive keywords
 */
function calculateUrgency(task: Task): number {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  
  // Explicit urgency level
  if (task.urgencyLevel === 'high') return 1.0;
  if (task.urgencyLevel === 'medium') return 0.6;
  if (task.urgencyLevel === 'low') return 0.2;
  
  // Keyword detection
  const urgentKeywords = [
    'asap', 'urgent', 'immediately', 'today', 'tomorrow', 'this week',
    'due', 'deadline', 'critical', 'emergency', 'now', 'quick'
  ];
  
  let score = 0.3; // Base score
  
  for (const keyword of urgentKeywords) {
    if (text.includes(keyword)) {
      score += 0.15;
    }
  }
  
  return Math.min(score, 1.0);
}

/**
 * Calculate revenue leverage (0-1) based on revenue keywords
 */
function calculateRevenueLeverage(task: Task): number {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  
  const revenueKeywords = [
    'revenue', 'sale', 'sales', 'pricing', 'price', 'monetize', 'payment',
    'checkout', 'billing', 'subscription', 'customer', 'demo', 'onboard',
    'conversion', 'funnel', 'launch', 'mvp', 'product', 'market'
  ];
  
  let score = 0.2; // Base score
  
  for (const keyword of revenueKeywords) {
    if (text.includes(keyword)) {
      score += 0.15;
    }
  }
  
  return Math.min(score, 1.0);
}

/**
 * Calculate effort (0-1, where 0=low effort, 1=high effort)
 */
function calculateEffort(task: Task): number {
  // Explicit estimate
  if (task.estimatedEffort === 'low') return 0.2;
  if (task.estimatedEffort === 'medium') return 0.5;
  if (task.estimatedEffort === 'high') return 0.9;
  
  // Heuristic based on description length
  const descLength = (task.description || '').length;
  
  if (descLength < 50) return 0.3; // Short = simple
  if (descLength < 150) return 0.5; // Medium
  return 0.7; // Long description = complex
}

/**
 * Calculate founder skill match (0-1)
 */
function calculateSkillMatch(task: Task, profile: FounderProfile): number {
  if (!profile.skills || profile.skills.length === 0) {
    return 0.5; // Neutral if no skills specified
  }
  
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  const skills = profile.skills.map(s => s.toLowerCase());
  
  let matches = 0;
  for (const skill of skills) {
    if (text.includes(skill)) {
      matches++;
    }
  }
  
  // If task owner matches founder role/name, boost score
  if (task.owner && profile.name.toLowerCase().includes(task.owner.toLowerCase())) {
    matches += 1;
  }
  
  const matchRatio = matches / Math.max(skills.length, 1);
  return Math.min(matchRatio + 0.3, 1.0); // Base 0.3 + matches
}

