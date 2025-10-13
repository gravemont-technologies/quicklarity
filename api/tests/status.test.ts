import request from 'supertest';
import app from '../src/index';
import { supabase } from '../src/utils/supabase';

describe('GET /api/status/:jobId', () => {
  const mockJobId = 'job_test123456789';

  beforeEach(async () => {
    // Clean up test data
    await supabase.from('intake_submissions').delete().eq('job_id', mockJobId);
  });

  afterEach(async () => {
    // Clean up test data
    await supabase.from('intake_submissions').delete().eq('job_id', mockJobId);
  });

  it('should return 404 for non-existent jobId', async () => {
    const response = await request(app)
      .get('/api/status/job_nonexistent')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });

  it('should return pending status for new job', async () => {
    // Create test job
    await supabase.from('intake_submissions').insert({
      job_id: mockJobId,
      status: 'pending',
      tier: 'free',
      founder_name: 'Test User',
      founder_email: 'test@example.com',
      tasks: [{ id: '1', title: 'Test task' }],
      llm_cost_usd: 0,
    });

    const response = await request(app)
      .get(`/api/status/${mockJobId}`)
      .expect(200);

    expect(response.body.jobId).toBe(mockJobId);
    expect(response.body.status).toBe('pending');
    expect(response.body.progress).toBe(5);
    expect(response.body.createdAt).toBeDefined();
  });

  it('should return processing status with progress', async () => {
    await supabase.from('intake_submissions').insert({
      job_id: mockJobId,
      status: 'processing',
      tier: 'free',
      founder_name: 'Test User',
      founder_email: 'test@example.com',
      tasks: [{ id: '1', title: 'Test task' }],
      llm_cost_usd: 0,
    });

    const response = await request(app)
      .get(`/api/status/${mockJobId}`)
      .expect(200);

    expect(response.body.status).toBe('processing');
    expect(response.body.progress).toBe(50);
  });

  it('should return completed status with results', async () => {
    const mockNotionUrl = 'https://notion.so/test-page';
    const mockEvents = [
      {
        title: 'Test Event',
        description: 'Test',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    ];

    await supabase.from('intake_submissions').insert({
      job_id: mockJobId,
      status: 'completed',
      tier: 'free',
      founder_name: 'Test User',
      founder_email: 'test@example.com',
      tasks: [{ id: '1', title: 'Test task' }],
      notion_url: mockNotionUrl,
      calendar_events: mockEvents,
      llm_cost_usd: 0.02,
      processing_duration_ms: 5000,
      completed_at: new Date().toISOString(),
    });

    const response = await request(app)
      .get(`/api/status/${mockJobId}`)
      .expect(200);

    expect(response.body.status).toBe('completed');
    expect(response.body.progress).toBe(100);
    expect(response.body.notionUrl).toBe(mockNotionUrl);
    expect(response.body.calendarEvents).toHaveLength(1);
    expect(response.body.icsDownloadUrls).toBeDefined();
    expect(response.body.completedAt).toBeDefined();
    expect(response.body.processingDurationMs).toBe(5000);
  });

  it('should return failed status with error message', async () => {
    const errorMessage = 'LLM API error: Rate limit exceeded';

    await supabase.from('intake_submissions').insert({
      job_id: mockJobId,
      status: 'failed',
      tier: 'free',
      founder_name: 'Test User',
      founder_email: 'test@example.com',
      tasks: [{ id: '1', title: 'Test task' }],
      error_message: errorMessage,
      llm_cost_usd: 0,
    });

    const response = await request(app)
      .get(`/api/status/${mockJobId}`)
      .expect(200);

    expect(response.body.status).toBe('failed');
    expect(response.body.progress).toBe(0);
    expect(response.body.errorMessage).toBe(errorMessage);
  });
});

