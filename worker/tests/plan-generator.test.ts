import { generateStrategicPlan } from '../src/pipeline/plan-generator';
import { FounderProfile, ScoredTask, DocumentSummary } from '../../shared/types';

// Mock LLM client
jest.mock('../src/utils/llm-client', () => ({
  callLLM: jest.fn().mockResolvedValue({
    content: JSON.stringify({
      executiveSummary: 'Focus on revenue-generating tasks first.',
      topPriorities: [
        {
          rank: 1,
          taskId: 't1',
          taskTitle: 'Add payment processing',
          impactScore: 9.5,
          rationale: 'Critical for revenue generation',
          preworkRequired: ['Set up Stripe account'],
          estimatedDuration: '1 week',
          successMetrics: ['First paid customer'],
        },
      ],
      schedule: [
        {
          week: 1,
          focus: 'Revenue infrastructure',
          tasks: ['t1'],
          milestones: ['Billing live'],
          risksToWatch: ['Integration complexity'],
        },
      ],
      risks: [
        {
          type: 'technical',
          description: 'API integration may be complex',
          likelihood: 'medium',
          impact: 'medium',
          mitigation: 'Use Stripe Checkout for simplicity',
        },
      ],
      nextSteps: [
        'Set up Stripe account today',
        'Read integration docs',
        'Implement checkout flow',
      ],
    }),
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCostUSD: 0.015,
    },
    finishReason: 'stop',
  }),
}));

describe('Plan Generator', () => {
  const mockProfile: FounderProfile = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'TestCo',
    stage: 'mvp',
    role: 'CEO',
    skills: ['engineering', 'product'],
    summary: 'Technical founder building B2B SaaS',
  };

  const mockScoredTasks: ScoredTask[] = [
    {
      id: 't1',
      title: 'Add payment processing',
      description: 'Integrate Stripe for billing',
      impactScore: 9.5,
      urgency: 0.9,
      revenueLeverage: 0.95,
      dependencyCount: 0,
      effortEstimate: 0.5,
      founderSkillMatch: 0.8,
      rawScore: 0.85,
    },
    {
      id: 't2',
      title: 'Write blog posts',
      description: 'SEO content',
      impactScore: 5.2,
      urgency: 0.3,
      revenueLeverage: 0.4,
      dependencyCount: 0,
      effortEstimate: 0.3,
      founderSkillMatch: 0.5,
      rawScore: 0.45,
    },
  ];

  const mockDocSummaries: DocumentSummary[] = [
    {
      filename: 'business-plan.pdf',
      summary: 'B2B SaaS targeting small businesses',
      keyInsights: ['Target market: 10-50 employee companies', 'Pricing: $99/mo'],
      tokenCount: 150,
    },
  ];

  it('should generate a valid strategic plan', async () => {
    const result = await generateStrategicPlan(
      mockProfile,
      mockScoredTasks,
      mockDocSummaries,
      'Need revenue quickly',
      'free'
    );

    expect(result.plan).toBeDefined();
    expect(result.cost).toBeDefined();
    expect(result.cost).toBeGreaterThan(0);
  });

  it('should include all required plan fields', async () => {
    const result = await generateStrategicPlan(
      mockProfile,
      mockScoredTasks,
      [],
      undefined,
      'free'
    );

    expect(result.plan.executiveSummary).toBeDefined();
    expect(result.plan.topPriorities).toBeDefined();
    expect(Array.isArray(result.plan.topPriorities)).toBe(true);
    expect(result.plan.schedule).toBeDefined();
    expect(Array.isArray(result.plan.schedule)).toBe(true);
    expect(result.plan.risks).toBeDefined();
    expect(Array.isArray(result.plan.risks)).toBe(true);
    expect(result.plan.nextSteps).toBeDefined();
    expect(Array.isArray(result.plan.nextSteps)).toBe(true);
  });

  it('should include metadata', async () => {
    const result = await generateStrategicPlan(
      mockProfile,
      mockScoredTasks,
      [],
      undefined,
      'paid'
    );

    expect(result.plan.metadata).toBeDefined();
    expect(result.plan.metadata.founderName).toBe('Jane Doe');
    expect(result.plan.metadata.totalTasks).toBe(2);
    expect(result.plan.metadata.generatedAt).toBeDefined();
    expect(result.plan.metadata.confidence).toBe('high'); // paid tier
  });

  it('should respect tier for token limits', async () => {
    // The actual token limit is passed to the LLM call
    // We verify by checking the mock was called with correct params
    const { callLLM } = require('../src/utils/llm-client');

    await generateStrategicPlan(mockProfile, mockScoredTasks, [], undefined, 'free');
    expect(callLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 1200, // free tier limit
      })
    );

    await generateStrategicPlan(mockProfile, mockScoredTasks, [], undefined, 'paid');
    expect(callLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 2000, // paid tier limit
      })
    );
  });

  it('should limit tasks to top 15', async () => {
    const manyTasks: ScoredTask[] = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i}`,
      title: `Task ${i}`,
      impactScore: 10 - i * 0.1,
      urgency: 0.5,
      revenueLeverage: 0.5,
      dependencyCount: 0,
      effortEstimate: 0.5,
      founderSkillMatch: 0.5,
      rawScore: 0.5,
    }));

    const { callLLM } = require('../src/utils/llm-client');
    await generateStrategicPlan(mockProfile, manyTasks, [], undefined, 'free');

    const callArgs = callLLM.mock.calls[callLLM.mock.calls.length - 1][0];
    const contextJson = JSON.parse(
      callArgs.userPrompt.match(/Context:\n([\s\S]*?)\n\nGenerate/)[1]
    );

    expect(contextJson.tasks.length).toBe(15);
  });

  it('should throw error if LLM returns invalid JSON', async () => {
    const { callLLM } = require('../src/utils/llm-client');
    callLLM.mockResolvedValueOnce({
      content: 'This is not JSON',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUSD: 0.001 },
      finishReason: 'stop',
    });

    await expect(
      generateStrategicPlan(mockProfile, mockScoredTasks, [], undefined, 'free')
    ).rejects.toThrow('invalid JSON');
  });

  it('should handle markdown-wrapped JSON', async () => {
    const { callLLM } = require('../src/utils/llm-client');
    callLLM.mockResolvedValueOnce({
      content: '```json\n{"executiveSummary":"test","topPriorities":[],"schedule":[],"risks":[],"nextSteps":[]}\n```',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCostUSD: 0.001 },
      finishReason: 'stop',
    });

    const result = await generateStrategicPlan(
      mockProfile,
      mockScoredTasks,
      [],
      undefined,
      'free'
    );

    expect(result.plan.executiveSummary).toBe('test');
  });
});

