import { scoreTasksWithRules } from '../src/scoring/rule-based-scorer';
import { Task, FounderProfile } from '../../shared/types';

describe('Rule-Based Task Scorer', () => {
  const mockFounderProfile: FounderProfile = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'CEO',
    skills: ['engineering', 'product', 'design'],
    summary: 'Technical founder with product and design skills',
  };

  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Add Stripe payment integration ASAP',
      description: 'Critical revenue blocker, need to enable billing immediately',
      urgencyLevel: 'high',
      estimatedEffort: 'medium',
    },
    {
      id: 't2',
      title: 'Write blog posts for SEO',
      description: 'Long-term content marketing strategy',
      urgencyLevel: 'low',
      estimatedEffort: 'low',
    },
    {
      id: 't3',
      title: 'Build MVP demo for sales calls',
      description: 'Need product prototype for customer demos this week',
      urgencyLevel: 'high',
      estimatedEffort: 'medium',
    },
    {
      id: 't4',
      title: 'Engineering task: refactor database',
      description: 'Technical debt cleanup',
      urgencyLevel: 'medium',
      estimatedEffort: 'high',
    },
  ];

  it('should score all tasks', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    expect(scored).toHaveLength(4);
    scored.forEach(task => {
      expect(task.impactScore).toBeDefined();
      expect(task.impactScore).toBeGreaterThanOrEqual(0);
      expect(task.impactScore).toBeLessThanOrEqual(10);
    });
  });

  it('should prioritize revenue-related tasks', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const stripeTask = scored.find(t => t.id === 't1');
    const blogTask = scored.find(t => t.id === 't2');

    expect(stripeTask!.revenueLeverage).toBeGreaterThan(blogTask!.revenueLeverage);
    expect(stripeTask!.impactScore).toBeGreaterThan(blogTask!.impactScore);
  });

  it('should detect urgency from keywords', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const urgentTask = scored.find(t => t.id === 't1'); // has "ASAP"
    const lowPriorityTask = scored.find(t => t.id === 't2');

    expect(urgentTask!.urgency).toBeGreaterThan(lowPriorityTask!.urgency);
  });

  it('should use explicit urgency levels', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const highUrgency = scored.find(t => t.urgencyLevel === 'high');
    const lowUrgency = scored.find(t => t.urgencyLevel === 'low');

    expect(highUrgency!.urgency).toBeGreaterThan(lowUrgency!.urgency);
  });

  it('should calculate effort from estimated effort field', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const lowEffort = scored.find(t => t.estimatedEffort === 'low');
    const highEffort = scored.find(t => t.estimatedEffort === 'high');

    expect(lowEffort!.effortEstimate).toBeLessThan(highEffort!.effortEstimate);
  });

  it('should match founder skills', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const engineeringTask = scored.find(t => t.id === 't4'); // mentions "engineering"

    expect(engineeringTask!.founderSkillMatch).toBeGreaterThan(0.3);
  });

  it('should sort tasks by impact score descending', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);

    for (let i = 0; i < scored.length - 1; i++) {
      expect(scored[i].impactScore).toBeGreaterThanOrEqual(scored[i + 1].impactScore);
    }
  });

  it('should normalize scores to 0-10 range', () => {
    const scored = scoreTasksWithRules(mockTasks, mockFounderProfile);
    const scores = scored.map(t => t.impactScore);

    const min = Math.min(...scores);
    const max = Math.max(...scores);

    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(10);
  });

  it('should handle tasks with dependencies', () => {
    const tasksWithDeps: Task[] = [
      {
        id: 't1',
        title: 'Task 1',
        dependencies: ['t2', 't3'],
      },
      {
        id: 't2',
        title: 'Task 2',
        dependencies: [],
      },
    ];

    const scored = scoreTasksWithRules(tasksWithDeps, mockFounderProfile);
    const taskWithDeps = scored.find(t => t.id === 't1');

    expect(taskWithDeps!.dependencyCount).toBe(2);
  });

  it('should handle empty skills gracefully', () => {
    const profileNoSkills: FounderProfile = {
      ...mockFounderProfile,
      skills: [],
    };

    const scored = scoreTasksWithRules(mockTasks, profileNoSkills);

    scored.forEach(task => {
      expect(task.founderSkillMatch).toBeDefined();
      expect(task.impactScore).toBeDefined();
    });
  });

  it('should calculate revenue leverage from keywords', () => {
    const revenueTasks: Task[] = [
      {
        id: 't1',
        title: 'Launch product and drive sales revenue',
      },
      {
        id: 't2',
        title: 'Implement checkout and pricing page',
      },
      {
        id: 't3',
        title: 'Refactor internal logging',
      },
    ];

    const scored = scoreTasksWithRules(revenueTasks, mockFounderProfile);

    expect(scored[0].revenueLeverage).toBeGreaterThan(scored[2].revenueLeverage);
    expect(scored[1].revenueLeverage).toBeGreaterThan(scored[2].revenueLeverage);
  });
});

