/**
 * Fix broken users:
 * 1. Delete and recreate admin@example.com with correct passwordHash
 * 2. Optionally re-activate rejected instructors
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const col = mongoose.connection.db.collection('users');

  // Fix admin@example.com — delete the broken record and recreate it
  await col.deleteOne({ email: 'admin@example.com' });
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  await col.insertOne({
    email: 'admin@example.com',
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    isApproved: true,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✅ admin@example.com recreated — password: Admin@1234');

  // Re-activate rejected instructors (optional — comment out if intentional)
  const result = await col.updateMany(
    { role: 'instructor', isActive: false },
    { $set: { isActive: true, isApproved: true, updatedAt: new Date() } }
  );
  console.log(`✅ Reactivated ${result.modifiedCount} rejected instructor(s)`);

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
