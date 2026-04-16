import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import * as redis from './config/redis.config';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function findOtp() {
  const email = 'eyowituyehan@gmail.com';
  
  try {
    // 1. Check MongoDB for Email Verification Code
    if (DATABASE_URL) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(DATABASE_URL);
      
      const UserSchema = new mongoose.Schema({
        email: String,
        emailVerificationCode: String,
      }, { collection: 'users' });
      
      const User = mongoose.models.User || mongoose.model('User', UserSchema);
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user && user.emailVerificationCode) {
        console.log(`\n[MONGODB] Email Verification Code: ${user.emailVerificationCode}`);
      } else {
        console.log('\n[MONGODB] No email verification code found for this user.');
      }
      await mongoose.disconnect();
    }

    // 2. Check Redis for Password Reset Code
    console.log('\nConnecting to Redis/Memory Fallback...');
    await redis.connectRedis();
    
    // The prefix used in AuthService is 'password:reset:code:'
    const resetCodeKey = `password:reset:code:${email.toLowerCase()}`;
    const code = await redis.get(resetCodeKey);
    
    if (code) {
      console.log(`[REDIS] Password Reset Code: ${code}`);
    } else {
      console.log('[REDIS] No password reset code found in Redis.');
      
      // List all keys just in case
      const allKeys = await redis.getOptionalRedisClient()?.keys('*');
      if (allKeys && allKeys.length > 0) {
        console.log('Available keys in Redis:', allKeys);
      }
    }
    
    await redis.disconnectRedis();
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

findOtp().then(() => process.exit(0));
