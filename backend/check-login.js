require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const EMAIL = 'burkamuhammed3@gmail.com';
const PASSWORD = 'Burqaaman$12';

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const user = await mongoose.connection.db.collection('users').findOne({ email: EMAIL });

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log('User found:', {
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isApproved: user.isApproved,
    hasPasswordHash: !!user.passwordHash,
  });

  const match = await bcrypt.compare(PASSWORD, user.passwordHash);
  console.log('Password match:', match);

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
