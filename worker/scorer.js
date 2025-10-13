// Rule-based task scoring (deterministic, ZERO LLM cost)
function scoreTasksWithRules(tasks, profile) {
  if (!tasks || tasks.length === 0) return [];
  
  const scoredTasks = tasks.map(task => {
    const urgency = calculateUrgency(task);
    const revenueLeverage = calculateRevenueLeverage(task);
    const effortEstimate = calculateEffort(task);
    const founderSkillMatch = calculateSkillMatch(task, profile);
    
    // Formula: 0.45*revenue + 0.25*urgency + 0.15*(1-effort) + 0.15*skillMatch
    const rawScore = 
      (0.45 * revenueLeverage) +
      (0.25 * urgency) +
      (0.15 * (1 - effortEstimate)) +
      (0.15 * founderSkillMatch);
    
    return {
      ...task,
      urgency,
      revenueLeverage,
      effortEstimate,
      founderSkillMatch,
      rawScore,
      impactScore: 0 // Will be normalized
    };
  });
  
  // Normalize to 0-10 scale
  const scores = scoredTasks.map(t => t.rawScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;
  
  scoredTasks.forEach(task => {
    task.impactScore = ((task.rawScore - minScore) / range) * 10;
  });
  
  // Sort by impact score descending
  scoredTasks.sort((a, b) => b.impactScore - a.impactScore);
  
  return scoredTasks;
}

function calculateUrgency(task) {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  const urgentKeywords = ['asap', 'urgent', 'today', 'tomorrow', 'deadline', 'critical', 'now', 'immediately'];
  
  let score = 0.3;
  for (const keyword of urgentKeywords) {
    if (text.includes(keyword)) score += 0.12;
  }
  
  if (task.due && new Date(task.due) < new Date(Date.now() + 7 * 86400000)) {
    score += 0.2; // Due within 7 days
  }
  
  return Math.min(score, 1.0);
}

function calculateRevenueLeverage(task) {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  const revenueKeywords = [
    'revenue', 'sale', 'sales', 'pricing', 'checkout', 'billing',
    'payment', 'monetize', 'customer', 'launch', 'mvp', 'product'
  ];
  
  let score = 0.2;
  for (const keyword of revenueKeywords) {
    if (text.includes(keyword)) score += 0.12;
  }
  
  return Math.min(score, 1.0);
}

function calculateEffort(task) {
  const effortMap = { 'low': 0.2, 'med': 0.5, 'medium': 0.5, 'high': 0.9 };
  if (task.effort && effortMap[task.effort.toLowerCase()]) {
    return effortMap[task.effort.toLowerCase()];
  }
  
  const descLength = (task.description || '').length;
  if (descLength < 50) return 0.3;
  if (descLength < 150) return 0.5;
  return 0.7;
}

function calculateSkillMatch(task, profile) {
  const skills = profile?.skills || [];
  if (skills.length === 0) return 0.5;
  
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  let matches = 0;
  
  for (const skill of skills) {
    if (text.includes(skill.toLowerCase())) matches++;
  }
  
  return Math.min((matches / skills.length) + 0.3, 1.0);
}

module.exports = { scoreTasksWithRules };

