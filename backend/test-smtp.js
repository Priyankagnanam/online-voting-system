const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'gpriyanka17052006@gmail.com',
      pass: 'zhsyrhrgrlyreodj'
    }
  });
  
  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified!");
    
    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: 'gpriyanka17052006@gmail.com',
      to: 'gpriyanka17052006@gmail.com',
      subject: 'Test Email',
      text: 'This is a test.'
    });
    console.log("Email sent! " + info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
