// Tests for worker scoring and JSON parsing
const { scoreTasksWithRules } = require('../worker/scorer');

describe('Rule-based task scorer', () => {
  const mockProfile = {
    name: 'Test',
    email: 'test@test.com',
    skills: ['engineering', 'product']
  };
  
  it('should score tasks deterministically', () => {
    const tasks = [
      { id: '1', title: 'ASAP add pricing and revenue system', description: 'critical', effort: 'low' },
      { id: '2', title: 'Write blog post', description: 'SEO content', effort: 'high' }
    ];
    
    const scored = scoreTasksWithRules(tasks, mockProfile);
    
    expect(scored).toHaveLength(2);
    expect(scored[0].impactScore).toBeGreaterThan(scored[1].impactScore);
    expect(scored[0].urgency).toBeGreaterThan(0.5);
    expect(scored[0].revenueLeverage).toBeGreaterThan(0.5);
  });
  
  it('should handle empty tasks', () => {
    const scored = scoreTasksWithRules([], mockProfile);
    expect(scored).toEqual([]);
  });
  
  it('should normalize scores to 0-10 range', () => {
    const tasks = [
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2' },
      { id: '3', title: 'Task 3' }
    ];
    
    const scored = scoreTasksWithRules(tasks, mockProfile);
    
    scored.forEach(task => {
      expect(task.impactScore).toBeGreaterThanOrEqual(0);
      expect(task.impactScore).toBeLessThanOrEqual(10);
    });
  });
});

describe('JSON parsing', () => {
  it('should parse valid JSON plan', () => {
    const validJson = JSON.stringify({
      executiveSummary: 'Test summary',
      topPriorities: [{ rank: 1, taskTitle: 'Test', rationale: 'Because' }],
      schedule: [{ week: 1, focus: 'Test', tasks: [], milestones: [] }],
      risks: [{ type: 'technical', description: 'Test', likelihood: 'low', impact: 'low', mitigation: 'Test' }],
      nextSteps: ['Step 1', 'Step 2']
    });
    
    const parsed = JSON.parse(validJson);
    expect(parsed.executiveSummary).toBe('Test summary');
    expect(parsed.topPriorities).toHaveLength(1);
  });
  
  it('should handle markdown-wrapped JSON', () => {
    const wrappedJson = '```json\n{"executiveSummary":"Test","topPriorities":[],"schedule":[],"risks":[],"nextSteps":[]}\n```';
    
    const cleaned = wrappedJson.replace(/```json\n?/, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(cleaned);
    
    expect(parsed.executiveSummary).toBe('Test');
  });
});

