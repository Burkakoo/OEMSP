require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const users = await mongoose.connection.db.collection('users')
    .find({ role: { $in: ['admin', 'instructor'] } })
    .toArray();

  users.forEach(u => {
    console.log({
      email: u.email,
      role: u.role,
      isApproved: u.isApproved,
      isActive: u.isActive,
      hasPasswordHash: !!u.passwordHash,
    });
  });

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
