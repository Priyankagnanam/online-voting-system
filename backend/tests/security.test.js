const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Security', () => {
  describe('Health endpoints', () => {
    it('GET /health should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /ready should return ready status', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('Authorization', () => {
    let voterToken;
    let adminToken;

    beforeEach(async () => {
      await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        passwordHash: 'AdminPass123',
        role: 'admin',
        isVerified: true,
        approvalStatus: 'APPROVED',
      });
      await User.create({
        name: 'Voter',
        email: 'voter@test.com',
        passwordHash: 'VoterPass123',
        role: 'voter',
        isVerified: true,
        approvalStatus: 'APPROVED',
      });

      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminPass123' });
      adminToken = adminRes.body.token;

      const voterRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'voter@test.com', password: 'VoterPass123' });
      voterToken = voterRes.body.token;
    });

    it('voter should not access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${voterToken}`);
      expect(res.status).toBe(403);
    });

    it('voter should not create elections', async () => {
      const res = await request(app)
        .post('/api/elections')
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ title: 'Test', startDate: new Date().toISOString(), endDate: new Date().toISOString() });
      expect(res.status).toBe(403);
    });

    it('voter should not access user list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${voterToken}`);
      expect(res.status).toBe(403);
    });

    it('voter should not delete other users', async () => {
      const res = await request(app)
        .delete('/api/admin/users/000000000000000000000000')
        .set('Authorization', `Bearer ${voterToken}`);
      expect(res.status).toBe(403);
    });

    it('voter should not create candidates', async () => {
      const res = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ name: 'C', electionId: '000000000000000000000000' });
      expect(res.status).toBe(403);
    });

    it('wrong password returns 401 even for unverified/approved-unspecified accounts (no account enumeration)', async () => {
      await User.create({
        name: 'Raw Voter',
        email: 'raw@test.com',
        passwordHash: 'RawPass123',
        role: 'voter',
        isVerified: false,
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'raw@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid ObjectId in URL', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        passwordHash: 'AdminPass123',
        role: 'admin',
        isVerified: true,
        approvalStatus: 'APPROVED',
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminPass123' });

      const res = await request(app)
        .get('/api/elections/not-a-valid-id')
        .set('Authorization', `Bearer ${loginRes.body.token}`);
      expect(res.status).toBe(400);
    });

    it('should handle NoSQL injection attempt', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: { $gt: '' } });
      expect(res.status).toBe(400);
    });
  });
});
