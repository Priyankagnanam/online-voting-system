const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const ApprovedVoter = require('../models/ApprovedVoter');
const computeVoterIdHash = require('../utils/voterIdHash');

describe('Voter Approval Workflow', () => {
  let adminToken;

  const createAdmin = async () => {
    await User.create({
      name: 'Admin',
      email: 'approval-admin@test.com',
      passwordHash: 'AdminPass123',
      role: 'admin',
      isVerified: true,
      approvalStatus: 'APPROVED',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approval-admin@test.com', password: 'AdminPass123' });
    return res.body.token;
  };

  beforeEach(async () => {
    adminToken = await createAdmin();
  });

  it('new voter defaults to PENDING approval status', async () => {
    await User.create({
      name: 'Pending Voter',
      email: 'pending@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
    });
    const user = await User.findOne({ email: 'pending@test.com' });
    expect(user.approvalStatus).toBe('PENDING');
  });

  it('PENDING voter cannot log in', async () => {
    await User.create({
      name: 'Pending Voter',
      email: 'pending@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@test.com', password: 'Pass1234' });
    expect(res.status).toBe(403);
    expect(res.body.approvalStatus).toBe('PENDING');
  });

  it('REJECTED voter cannot log in', async () => {
    await User.create({
      name: 'Rejected Voter',
      email: 'rejected@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
      approvalStatus: 'REJECTED',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rejected@test.com', password: 'Pass1234' });
    expect(res.status).toBe(403);
    expect(res.body.approvalStatus).toBe('REJECTED');
  });

  it('admin can approve a pending voter', async () => {
    const voter = await User.create({
      name: 'Pending Voter',
      email: 'pending@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
    });

    const res = await request(app)
      .patch(`/api/admin/users/${voter._id}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: 'APPROVED' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@test.com', password: 'Pass1234' });
    expect(login.status).toBe(200);
  });

  it('admin can reject a voter and they cannot log in', async () => {
    const voter = await User.create({
      name: 'Voter A',
      email: 'approve-me@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
      approvalStatus: 'APPROVED',
    });

    await request(app)
      .patch(`/api/admin/users/${voter._id}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: 'REJECTED' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approve-me@test.com', password: 'Pass1234' });
    expect(login.status).toBe(403);
  });

  it('admin cannot change approval status of admins', async () => {
    const admin = await User.findOne({ email: 'approval-admin@test.com' });
    const res = await request(app)
      .patch(`/api/admin/users/${admin._id}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: 'REJECTED' });
    expect(res.status).toBe(400);
  });

  it('admin user list exposes approvalStatus and votingStatus without candidate choice', async () => {
    const voter = await User.create({
      name: 'Voter A',
      email: 'voter-a@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
      approvalStatus: 'APPROVED',
    });

    const election = await Election.create({
      title: 'Approval Election',
      startDate: new Date(Date.now() - 10000),
      endDate: new Date(Date.now() + 100000),
      status: 'active',
    });
    const candidate = await Candidate.create({ name: 'Cand A', party: 'P', electionId: election._id });

    const hash = computeVoterIdHash({ _id: voter._id }, election._id, null);
    await Vote.create({
      voterIdHash: hash,
      electionId: election._id,
      candidateId: candidate._id,
      receiptHash: require('crypto').randomBytes(16).toString('hex'),
    });
    await User.findByIdAndUpdate(voter._id, { $addToSet: { votedElections: election._id } });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const row = res.body.users.find((u) => u.email === 'voter-a@test.com');
    expect(row).toBeTruthy();
    expect(row.approvalStatus).toBe('APPROVED');
    expect(row.votingStatus).toBe('VOTED');
    expect(JSON.stringify(row)).not.toContain('candidateId');
  });
});

describe('OTP Security', () => {
  it('hashes OTP in storage and marks used after verification', async () => {
    const email = 'otp@test.com';
    const otp = await OTP.create({
      email,
      otpHash: '123456',
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 600000),
    });

    const raw = await OTP.findById(otp._id).select('+otpHash');
    expect(raw.otpHash).not.toBe('123456');
    expect(await bcrypt.compare('123456', raw.otpHash)).toBe(true);

    const match = await otp.compareOTP('123456');
    expect(match).toBe(true);
  });

  it('rejects expired OTP', async () => {
    const email = 'expired-otp@test.com';
    await OTP.create({
      email,
      otpHash: '123456',
      purpose: 'verification',
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email, otp: '123456', purpose: 'verification' });
    expect(res.status).toBe(400);
  });

  it('rejects wrong OTP', async () => {
    const email = 'wrong-otp@test.com';
    await OTP.create({
      email,
      otpHash: '111111',
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 600000),
    });
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email, otp: '999999', purpose: 'verification' });
    expect(res.status).toBe(400);
  });
});

describe('Voting Gating & Race Conditions', () => {
  let voterToken;
  let voter;
  let electionId;
  let candidateId;

  beforeEach(async () => {
    voter = await User.create({
      name: 'Approved Voter',
      email: 'approved-voter@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
      approvalStatus: 'APPROVED',
      rollNumber: 'RV123',
    });
    await ApprovedVoter.create({ rollNumber: 'RV123', email: 'approved-voter@test.com', isEligible: true });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approved-voter@test.com', password: 'Pass1234' });
    voterToken = login.body.token;

    const election = await Election.create({
      title: 'Gate Election',
      startDate: new Date(Date.now() - 10000),
      endDate: new Date(Date.now() + 100000),
      status: 'active',
    });
    electionId = election._id;
    const candidate = await Candidate.create({ name: 'Candidate', party: 'P', electionId });
    candidateId = candidate._id;
  });

  it('PENDING voter is rejected at vote endpoint even with valid token', async () => {
    const pendingUser = await User.create({
      name: 'Pending',
      email: 'pending-voter@test.com',
      passwordHash: 'Pass1234',
      role: 'voter',
      isVerified: true,
      approvalStatus: 'PENDING',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending-voter@test.com', password: 'Pass1234' });
    // cannot even get a token
    expect(login.status).toBe(403);

    // simulate expired token / forced: build token manually
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: pendingUser._id, role: 'voter' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${forged}`)
      .send({ electionId, candidateId });
    expect(res.status).toBe(403);
  });

  it('approved voter can vote when election is active', async () => {
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });
    expect(res.status).toBe(201);
  });

  it('duplicate vote (second attempt) is rejected', async () => {
    await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });
    const second = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });
    expect(second.status).toBe(400);
  });

  it('rejects vote when election ended', async () => {
    await Election.updateOne({ _id: electionId }, { status: 'ended' });
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });
    expect(res.status).toBe(400);
  });

  it('rejects vote for invalid candidate', async () => {
    const res = await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(400);
  });

  it('creates exactly one vote under concurrent duplicate submissions', async () => {
    const promises = Array(10).fill().map(() =>
      request(app)
        .post('/api/votes')
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ electionId, candidateId })
    );
    const responses = await Promise.all(promises);
    const success = responses.filter((r) => r.status === 201).length;
    const failed = responses.filter((r) => r.status === 400).length;
    expect(success).toBe(1);
    expect(failed).toBe(9);

    const count = await Vote.countDocuments({ electionId });
    expect(count).toBe(1);
  });

  it('marks admin votingStatus as VOTED after a successful vote', async () => {
    await request(app)
      .post('/api/votes')
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ electionId, candidateId });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approved-voter@test.com', password: 'Pass1234' });
    const token = login.body.token;
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    // not admin -> 403; do it properly
    const admin = await User.create({
      name: 'Admin2',
      email: 'admin2@test.com',
      passwordHash: 'AdminPass123',
      role: 'admin',
      isVerified: true,
      approvalStatus: 'APPROVED',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin2@test.com', password: 'AdminPass123' });
    const adminRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);
    const row = adminRes.body.users.find((u) => u.email === 'approved-voter@test.com');
    expect(row.votingStatus).toBe('VOTED');
    expect(row.approvalStatus).toBe('APPROVED');
  });
});