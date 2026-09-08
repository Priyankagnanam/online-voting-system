const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb+srv://gpriyankacluster:Priyanka12345@cluster0.lnofsdk.mongodb.net/onlinevoting?retryWrites=true&w=majority');
  
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ role: 'admin' }).toArray();
  console.log("Admin Users:", users.map(u => ({ email: u.email, role: u.role, isVerified: u.isVerified })));

  const attempts = await db.collection('loginattempts').find().sort({timestamp: -1}).limit(5).toArray();
  console.log("Recent Login Attempts:", attempts.map(a => ({ email: a.email, success: a.success, timestamp: a.timestamp })));
  
  process.exit(0);
}
test();
