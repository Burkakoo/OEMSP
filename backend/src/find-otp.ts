import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function findOtp() {
  const email = 'eyowituyehan@gmail.com';
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env');
    return;
  }

  console.log('Attempting to connect to MongoDB...');
  
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Successfully connected to database');
    
    console.log(`Searching for user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('--- USER FOUND ---');
      console.log(`Email: ${user.email}`);
      console.log(`Verification Code: ${user.emailVerificationCode}`);
      console.log(`Expires At: ${user.emailVerificationCodeExpiresAt}`);
      console.log('------------------');
    } else {
      console.log(`\nUser with email ${email} not found in the database.`);
      
      // Let's list all users to see what's there
      const count = await User.countDocuments();
      console.log(`Total users in database: ${count}`);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from database');
  } catch (error: any) {
    console.error('DATABASE ERROR:', error.message);
  }
}

findOtp().then(() => {
  console.log('Script execution finished');
  process.exit(0);
}).catch(err => {
  console.error('SCRIPT FATAL ERROR:', err);
  process.exit(1);
});
