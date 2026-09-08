const mongoose = require('mongoose');

async function getOTP() {
  await mongoose.connect('mongodb+srv://gpriyankacluster:Priyanka12345@cluster0.lnofsdk.mongodb.net/onlinevoting?retryWrites=true&w=majority');
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'manishabharath8152@gmail.com' });
  if (user) {
    console.log("OTP for " + user.email + " is: " + user.verificationToken);
  } else {
    console.log("User not found");
  }
  process.exit(0);
}
getOTP();
