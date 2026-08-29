require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const logger = require('./utils/logger');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    logger.info('Example:');
    logger.info('  ADMIN_EMAIL=admin@yourdomain.com');
    logger.info('  ADMIN_PASSWORD=YourSecurePassword123!');
    process.exit(1);
  }

  if (password.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
      }
      existingAdmin.passwordHash = password; // Will be hashed by pre-save hook
      await existingAdmin.save();
      logger.info(`Admin already exists. Password updated for: ${email}`);
      process.exit(0);
    }

    await User.create({
      name: 'Administrator',
      email: email,
      passwordHash: password,
      role: 'admin',
      isVerified: true,
    });

    logger.info('Admin user created successfully');
    logger.info(`  Email: ${email}`);
    logger.info('  Password: [set from ADMIN_PASSWORD env var]');
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', { error: error.message });
    process.exit(1);
  }
};

seedAdmin();
