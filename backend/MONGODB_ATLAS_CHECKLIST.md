# MongoDB Atlas Setup Checklist

Use this checklist to track your MongoDB Atlas setup progress.

## Pre-Setup

- [ ] Read `MONGODB_ATLAS_QUICKSTART.md` for quick overview
- [ ] Read `MONGODB_ATLAS_SETUP.md` for detailed instructions
- [ ] Prepare email address for account creation
- [ ] Have credit card ready (required even for free tier)

## Account Setup

- [ ] Create MongoDB Atlas account
- [ ] Verify email address
- [ ] Complete welcome questionnaire (optional)
- [ ] Log in to Atlas dashboard

## Cluster Creation

- [ ] Click "Build a Database"
- [ ] Select cluster tier:
  - [ ] M0 Free (development)
  - [ ] M10+ (production)
- [ ] Choose cloud provider (AWS recommended)
- [ ] Select region closest to users
- [ ] Name cluster: `mern-education-platform`
- [ ] Click "Create" and wait for deployment (3-10 minutes)
- [ ] Verify cluster is running

## Database User Configuration

- [ ] Navigate to "Database Access"
- [ ] Click "Add New Database User"
- [ ] Set username: `mern-education-admin` (or your choice)
- [ ] Generate secure password
- [ ] **IMPORTANT**: Copy and save password securely
- [ ] Select "Read and write to any database"
- [ ] Click "Add User"
- [ ] Verify user appears in list

## Network Access Configuration

### Development Setup
- [ ] Navigate to "Network Access"
- [ ] Click "Add IP Address"
- [ ] Click "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Add comment: "Development"
- [ ] Click "Confirm"

### Production Setup (when ready)
- [ ] Add specific server IP addresses
- [ ] Remove "0.0.0.0/0" entry
- [ ] Configure VPC peering (optional)
- [ ] Test connection from production servers

## Connection String Setup

- [ ] Navigate to "Database" → Click "Connect"
- [ ] Choose "Connect your application"
- [ ] Select "Node.js" driver
- [ ] Copy connection string
- [ ] Replace `<username>` with your database username
- [ ] Replace `<password>` with your database password
- [ ] Add database name: `/mern-education-platform`
- [ ] Add connection pool parameters:
  ```
  ?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100&maxIdleTimeMS=60000&serverSelectionTimeoutMS=5000
  ```

## Environment Configuration

- [ ] Open `backend/.env` file
- [ ] Update `DATABASE_URL` with your connection string
- [ ] Verify no spaces or line breaks in connection string
- [ ] Save file
- [ ] **IMPORTANT**: Verify `.env` is in `.gitignore`
- [ ] Never commit `.env` to version control

## Connection Verification

- [ ] Run `cd backend && npm run dev`
- [ ] Look for successful connection message
- [ ] Check MongoDB Atlas dashboard for active connections
- [ ] Verify connection pool is working

## Optional: Production Configuration

### Backup Configuration (M10+ only)
- [ ] Navigate to "Backup" tab
- [ ] Enable "Continuous Backup" or "Snapshot Backup"
- [ ] Configure snapshot frequency (6-24 hours)
- [ ] Set retention period (7-30 days)
- [ ] Enable point-in-time recovery
- [ ] Test backup restoration

### Security Hardening
- [ ] Enable encryption at rest (M10+)
- [ ] Configure audit logging
- [ ] Set up monitoring alerts
- [ ] Review and restrict user permissions
- [ ] Configure VPC peering (optional)
- [ ] Enable field-level encryption for PII

### Monitoring and Alerts
- [ ] Set up CPU usage alert (>80%)
- [ ] Set up memory usage alert (>80%)
- [ ] Set up connection count alert
- [ ] Set up replication lag alert
- [ ] Set up disk space alert (>80%)
- [ ] Configure alert notification channels

### Performance Optimization
- [ ] Review Performance Advisor recommendations
- [ ] Create necessary indexes (Task 2.x)
- [ ] Configure read preference (secondaryPreferred)
- [ ] Enable profiling for slow queries
- [ ] Set up auto-scaling (if needed)

## Documentation Review

- [ ] Bookmark MongoDB Atlas dashboard
- [ ] Save connection string securely (password manager)
- [ ] Document cluster configuration
- [ ] Share setup guide with team
- [ ] Review troubleshooting section

## Next Steps

- [ ] Proceed to Task 1.4.2: Configure Mongoose connection
- [ ] Proceed to Task 1.4.3: Implement connection pooling
- [ ] Proceed to Task 1.4.4: Create health check endpoint

## Troubleshooting

If you encounter issues, check:

- [ ] Connection string format is correct
- [ ] Username and password are correct
- [ ] Special characters in password are URL-encoded
- [ ] IP address is whitelisted
- [ ] Cluster is running (not paused)
- [ ] Firewall isn't blocking port 27017
- [ ] `.env` file is loaded correctly

## Quick Reference

### Connection String Format
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?options
```

### Required Connection Pool Options
```
minPoolSize=10&maxPoolSize=100&maxIdleTimeMS=60000&serverSelectionTimeoutMS=5000
```

### Common Commands
```bash
# Test connection
cd backend && npm run dev

# View environment variables
cat backend/.env

# Check MongoDB Atlas status
# Visit: https://cloud.mongodb.com/
```

## Support Resources

- [ ] Bookmark: [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [ ] Bookmark: [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [ ] Bookmark: [Mongoose Documentation](https://mongoosejs.com/docs/connections.html)
- [ ] Join: [MongoDB Community Forums](https://www.mongodb.com/community/forums/)

## Completion

- [ ] All checklist items completed
- [ ] Connection verified successfully
- [ ] Documentation reviewed
- [ ] Team members informed
- [ ] Ready for Task 1.4.2

---

**Status**: Task 1.4.1 - Create MongoDB Atlas cluster

**Date Completed**: _______________

**Cluster Name**: _______________

**Region**: _______________

**Tier**: _______________

**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________
