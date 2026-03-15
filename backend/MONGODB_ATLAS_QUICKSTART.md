# MongoDB Atlas Quick Start Guide

## TL;DR - Get Started in 10 Minutes

This is a condensed version of the full setup guide. For detailed instructions, see [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md).

## Quick Setup Steps

### 1. Create Account (2 minutes)
1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google/GitHub
3. Verify your email

### 2. Create Cluster (3 minutes)
1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select **AWS** as provider
4. Choose region closest to you:
   - Ethiopia/Africa: **eu-central-1 (Frankfurt)**
   - US: **us-east-1 (N. Virginia)**
5. Name it: `mern-education-platform`
6. Click **"Create"** (wait 3-5 minutes)

### 3. Create Database User (1 minute)
1. Go to **Database Access** → **Add New Database User**
2. Username: `mern-education-admin`
3. Click **"Autogenerate Secure Password"** → **Copy it!**
4. Select **"Read and write to any database"**
5. Click **"Add User"**

### 4. Allow Network Access (1 minute)
1. Go to **Network Access** → **Add IP Address**
2. Click **"Allow Access from Anywhere"** (development only!)
3. Click **"Confirm"**

### 5. Get Connection String (2 minutes)
1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Select **Node.js** driver
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials
6. Add database name: `/mern-education-platform` after `.net`

### 6. Update .env File (1 minute)
```env
DATABASE_URL=mongodb+srv://mern-education-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mern-education-platform?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100
```

## Example Connection String

```
mongodb+srv://mern-education-admin:MySecurePass123@cluster0.abc123.mongodb.net/mern-education-platform?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100
```

## Verify Setup

```bash
cd backend
npm run dev
```

Look for: "✅ MongoDB connected successfully"

## Common Issues

### "Bad auth" error
- Double-check username and password
- URL-encode special characters in password

### "Connection timeout" error
- Check IP whitelist (Network Access)
- Verify cluster is running

### "ENOTFOUND" error
- Check connection string format
- Ensure cluster deployment is complete

## Production Checklist

When moving to production:

- [ ] Upgrade to M10+ cluster (paid tier)
- [ ] Change IP whitelist from "0.0.0.0/0" to specific IPs
- [ ] Create separate production database user
- [ ] Enable automated backups
- [ ] Set up monitoring alerts
- [ ] Enable encryption at rest
- [ ] Configure multi-region replica set (optional)

## Need More Details?

See the comprehensive guide: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

## Next Tasks

After setup:
- ⏭️ Task 1.4.2: Configure Mongoose connection
- ⏭️ Task 1.4.3: Implement connection pooling
- ⏭️ Task 1.4.4: Create health check endpoint

---

**Quick Reference**: Keep your connection string secure and never commit it to Git!
