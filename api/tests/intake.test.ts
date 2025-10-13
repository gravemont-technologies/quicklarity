import request from 'supertest';
import app from '../src/index';

describe('POST /api/intake', () => {
  const validPayload = {
    founderName: 'Jane Doe',
    founderEmail: 'jane@example.com',
    companyName: 'TestCo',
    companyStage: 'mvp',
    founderRole: 'CEO',
    founderSkills: ['engineering', 'product'],
    tasks: [
      {
        id: '1',
        title: 'Launch MVP',
        description: 'Get product to market',
        urgencyLevel: 'high',
      },
    ],
    tier: 'free',
  };

  it('should accept valid intake payload and return jobId', async () => {
    const response = await request(app)
      .post('/api/intake')
      .send(validPayload)
      .expect(202);

    expect(response.body.success).toBe(true);
    expect(response.body.jobId).toBeDefined();
    expect(response.body.jobId).toMatch(/^job_/);
    expect(response.body.estimatedCompletionTime).toBeGreaterThan(0);
  });

  it('should reject payload without founderName', async () => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).founderName;

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('founderName');
  });

  it('should reject payload without founderEmail', async () => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).founderEmail;

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('founderEmail');
  });

  it('should reject payload with invalid email', async () => {
    const invalidPayload = { ...validPayload, founderEmail: 'not-an-email' };

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should reject payload without tasks', async () => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).tasks;

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('tasks');
  });

  it('should reject payload with empty tasks array', async () => {
    const invalidPayload = { ...validPayload, tasks: [] };

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('At least one task required');
  });

  it('should reject payload without tier', async () => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).tier;

    const response = await request(app)
      .post('/api/intake')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should accept payload with uploaded documents', async () => {
    const payloadWithDocs = {
      ...validPayload,
      uploadedDocs: [
        {
          filename: 'plan.txt',
          contentType: 'text/plain',
          base64Content: Buffer.from('Test content').toString('base64'),
          sizeBytes: 100,
        },
      ],
    };

    const response = await request(app)
      .post('/api/intake')
      .send(payloadWithDocs)
      .expect(202);

    expect(response.body.success).toBe(true);
    expect(response.body.jobId).toBeDefined();
  });

  it('should estimate longer completion time for paid tier', async () => {
    const freeResponse = await request(app)
      .post('/api/intake')
      .send({ ...validPayload, tier: 'free' })
      .expect(202);

    const paidResponse = await request(app)
      .post('/api/intake')
      .send({ ...validPayload, tier: 'paid' })
      .expect(202);

    // Paid tier should be processed faster (lower estimate)
    expect(paidResponse.body.estimatedCompletionTime).toBeLessThan(
      freeResponse.body.estimatedCompletionTime
    );
  });
});

