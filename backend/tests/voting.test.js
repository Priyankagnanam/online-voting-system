const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../server');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

describe('Voting Logic and Concurrency', () => {
  let voterToken;
  let voterId;
  let electionId;
  let candidateId;

  beforeEach(async () => {
    const voter = await User.create({
      name: 'Voter1',
      email: 'voter1@test.com',
      passwordHash: 'VoterPass123',
      role: 'voter',
      isVerified: true,
    });
    voterId = voter._id;

    const voterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'voter1@test.com', password: 'VoterPass123' });
    voterToken = voterRes.body.token;

    const election = await Election.create({
      title: 'Concurrency Election',
      description: 'Testing concurrency',
      startDate: new Date(Date.now() - 10000), // active
      endDate: new Date(Date.now() + 100000),
      status: 'active',
    });
    electionId = election._id;

    const candidate = await Candidate.create({
      name: 'Candidate A',
      party: 'Party A',
      electionId,
    });
    candidateId = candidate._id;
  });

  it('should successfully cast a single vote', async () => {
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });
      
    expect(res.status).toBe(201);
    
    const voterIdHash = crypto
      .createHash('sha256')
      .update(voterId.toString() + electionId.toString() + (process.env.JWT_SECRET || 'secret-salt'))
      .digest('hex');
    const voteCount = await Vote.countDocuments({ electionId, voterIdHash });
    expect(voteCount).toBe(1);
  });

  it('should prevent concurrent duplicate voting', async () => {
    // Send 10 concurrent requests
    const promises = Array(10).fill().map(() => 
      request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ electionId, candidateId })
    );

    const responses = await Promise.all(promises);
    
    const successCount = responses.filter(r => r.status === 201).length;
    const failCount = responses.filter(r => r.status === 400).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(9);

    const voterIdHash = crypto
      .createHash('sha256')
      .update(voterId.toString() + electionId.toString() + (process.env.JWT_SECRET || 'secret-salt'))
      .digest('hex');
    const voteCount = await Vote.countDocuments({ electionId, voterIdHash });
    expect(voteCount).toBe(1);
  });
});
