// Tests for POST /intake endpoint
const request = require('supertest');
const app = require('../server');

describe('POST /intake', () => {
  const validPayload = {
    name: 'Test Founder',
    email: 'test@example.com',
    company: 'TestCo',
    stage: 'mvp',
    founder_experience_years: 5,
    top_goals: ['Launch MVP', 'Get users'],
    tasks: [
      {
        id: 't1',
        title: 'Launch MVP',
        description: 'Get product to market',
        effort: 'high'
      }
    ],
    biggest_unknowns: ['Market fit'],
    guest: true
  };
  
  it('should accept valid intake payload', async () => {
    const res = await request(app)
      .post('/intake')
      .send(validPayload)
      .expect(202);
    
    expect(res.body.jobId).toBeDefined();
    expect(res.body.eta_seconds).toBeGreaterThan(0);
  });
  
  it('should reject missing name', async () => {
    const payload = { ...validPayload };
    delete payload.name;
    
    await request(app)
      .post('/intake')
      .send(payload)
      .expect(500);
  });
  
  it('should reject missing email', async () => {
    const payload = { ...validPayload };
    delete payload.email;
    
    await request(app)
      .post('/intake')
      .send(payload)
      .expect(500);
  });
  
  it('should reject invalid email format', async () => {
    const payload = { ...validPayload, email: 'notanemail' };
    
    await request(app)
      .post('/intake')
      .send(payload)
      .expect(500);
  });
  
  it('should reject empty tasks array', async () => {
    const payload = { ...validPayload, tasks: [] };
    
    await request(app)
      .post('/intake')
      .send(payload)
      .expect(500);
  });
  
  it('should accept payload without optional fields', async () => {
    const minimalPayload = {
      name: 'Minimal Test',
      email: 'minimal@test.com',
      tasks: [{ id: '1', title: 'Task 1' }],
      guest: true
    };
    
    const res = await request(app)
      .post('/intake')
      .send(minimalPayload)
      .expect(202);
    
    expect(res.body.jobId).toBeDefined();
  });
});

