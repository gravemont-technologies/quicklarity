// Tests for GET /status/:jobId endpoint
const request = require('supertest');
const app = require('../server');

describe('GET /status/:jobId', () => {
  it('should return 404 for non-existent job', async () => {
    const res = await request(app)
      .get('/status/nonexistent-job-id')
      .expect(404);
    
    expect(res.body.error).toContain('not found');
  });
  
  it('should return status for valid job', async () => {
    // First create a job
    const intakeRes = await request(app)
      .post('/intake')
      .send({
        name: 'Status Test',
        email: 'status@test.com',
        tasks: [{ id: '1', title: 'Test' }],
        guest: true
      })
      .expect(202);
    
    const jobId = intakeRes.body.jobId;
    
    // Then check status
    const statusRes = await request(app)
      .get(`/status/${jobId}`)
      .expect(200);
    
    expect(statusRes.body.status).toBeDefined();
    expect(['queued', 'running', 'done', 'errored']).toContain(statusRes.body.status);
  });
});

