# MongoDB Atlas Cluster Setup Guide

## Overview

This guide walks you through setting up a MongoDB Atlas cluster for the MERN Education Platform. MongoDB Atlas is a fully-managed cloud database service that provides high availability, automatic backups, and replica sets.

## Prerequisites

- A MongoDB Atlas account (free tier available)
- Email address for account verification
- Credit card (required even for free tier, but won't be charged)

## Step 1: Create MongoDB Atlas Account

1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up using one of these methods:
   - Email and password
   - Google account
   - GitHub account
3. Verify your email address
4. Complete the welcome questionnaire (optional)

## Step 2: Create a New Cluster

### 2.1 Start Cluster Creation

1. Click **"Build a Database"** or **"Create"** button
2. Choose your deployment type:
   - **Recommended for Development**: **M0 Sandbox (Free)**
     - 512 MB storage
     - Shared RAM
     - No credit card charges
   - **Recommended for Production**: **M10 or higher**
     - Dedicated resources
     - Auto-scaling capabilities
     - Enhanced performance

### 2.2 Configure Cluster Settings

#### Cloud Provider & Region
1. **Cloud Provider**: Choose one of:
   - AWS (Amazon Web Services) - Recommended
   - Google Cloud Platform
   - Microsoft Azure

2. **Region**: Select the region closest to your users
   - For Ethiopian users: Consider **eu-central-1 (Frankfurt)** or **me-south-1 (Bahrain)**
   - For US users: **us-east-1 (N. Virginia)** or **us-west-2 (Oregon)**
   - For global users: **us-east-1** (most services available)

#### Cluster Tier (Production Only)
- **M10**: Good for small production apps (2GB RAM, 10GB storage)
- **M20**: Medium production apps (4GB RAM, 20GB storage)
- **M30+**: Large production apps (8GB+ RAM, 40GB+ storage)

#### Additional Settings
1. **Cluster Name**: `mern-education-platform` (or your preferred name)
2. **MongoDB Version**: Use latest stable version (7.0 or higher)
3. **Backup**: Enable automated backups (recommended for production)

### 2.3 Replica Set Configuration

MongoDB Atlas automatically configures replica sets for high availability:
- **Free Tier (M0)**: 3-node replica set (shared infrastructure)
- **Paid Tiers**: 3-node replica set (dedicated infrastructure)
- **Production**: Consider enabling **Multi-Region** for disaster recovery

Click **"Create Cluster"** and wait 3-10 minutes for deployment.

## Step 3: Configure Database Access

### 3.1 Create Database User

1. Navigate to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **Authentication Method**: Password
4. Configure user:
   - **Username**: `mern-education-admin` (or your choice)
   - **Password**: Generate a strong password (click "Autogenerate Secure Password")
   - **IMPORTANT**: Copy and save this password securely!
5. **Database User Privileges**: Select **"Read and write to any database"**
6. **Temporary User**: Leave unchecked
7. Click **"Add User"**

### 3.2 Security Best Practices

- Use strong, unique passwords (minimum 16 characters)
- Never commit passwords to version control
- Use different credentials for development and production
- Consider using AWS IAM authentication for production

## Step 4: Configure Network Access

### 4.1 Add IP Addresses

1. Navigate to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Choose one of these options:

#### Option A: Development (Allow from Anywhere)
- Click **"Allow Access from Anywhere"**
- IP Address: `0.0.0.0/0`
- **WARNING**: Only use this for development! Not secure for production.

#### Option B: Production (Specific IPs)
- Enter your server's IP address
- Add multiple IPs if you have multiple servers
- Add your local development IP for testing

#### Option C: Cloud Provider (AWS, Azure, GCP)
- Use VPC Peering or Private Endpoints for enhanced security
- Configure in the **Peering** tab

4. Add a comment: `Development Server` or `Production Server`
5. Click **"Confirm"**

## Step 5: Get Connection String

### 5.1 Retrieve Connection String

1. Navigate to **Database** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copy the connection string (looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5.2 Configure Connection String

1. Replace `<username>` with your database username
2. Replace `<password>` with your database password
3. Add database name after `.net/`: `/mern-education-platform`
4. Final format:
   ```
   mongodb+srv://mern-education-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mern-education-platform?retryWrites=true&w=majority
   ```

### 5.3 Add to Environment Variables

1. Open `backend/.env` file
2. Update the `DATABASE_URL` variable:
   ```env
   DATABASE_URL=mongodb+srv://mern-education-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mern-education-platform?retryWrites=true&w=majority
   ```
3. **IMPORTANT**: Never commit this file to version control!

## Step 6: Configure Connection Pooling

MongoDB Atlas automatically handles connection pooling, but you can optimize it:

### 6.1 Connection String Options

Add these parameters to your connection string for optimal performance:

```
mongodb+srv://username:password@cluster.mongodb.net/mern-education-platform?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100&maxIdleTimeMS=60000&serverSelectionTimeoutMS=5000
```

**Parameters Explained**:
- `minPoolSize=10`: Minimum 10 connections in pool (per requirement 2.1.3)
- `maxPoolSize=100`: Maximum 100 connections in pool (per requirement 2.1.3)
- `maxIdleTimeMS=60000`: Close idle connections after 60 seconds
- `serverSelectionTimeoutMS=5000`: Timeout for server selection (5 seconds)
- `retryWrites=true`: Automatically retry failed write operations
- `w=majority`: Write concern (wait for majority of replica set)

### 6.2 Mongoose Configuration

The connection pooling will be configured in Task 1.4.3 using Mongoose options:

```typescript
mongoose.connect(DATABASE_URL, {
  minPoolSize: 10,
  maxPoolSize: 100,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## Step 7: Verify Connection

### 7.1 Test Connection

Once Task 1.4.2 is complete, you can test the connection:

```bash
cd backend
npm run dev
```

Look for successful connection message in the console.

### 7.2 MongoDB Atlas Dashboard

Monitor your cluster in the Atlas dashboard:
1. **Metrics**: View real-time performance metrics
2. **Collections**: Browse your database collections
3. **Performance Advisor**: Get optimization recommendations
4. **Alerts**: Set up alerts for issues

## Step 8: Configure Replica Set (Automatic)

MongoDB Atlas automatically configures replica sets with these features:

### 8.1 High Availability
- **3-node replica set**: 1 primary + 2 secondary nodes
- **Automatic failover**: If primary fails, a secondary is elected
- **Read preference**: Configure in application code

### 8.2 Read Scaling

Configure read preference in your application (Task 1.4.2):

```typescript
// Read from secondary nodes for read-heavy operations
mongoose.connect(DATABASE_URL, {
  readPreference: 'secondaryPreferred',
});
```

**Read Preference Options**:
- `primary`: Read from primary only (default)
- `primaryPreferred`: Read from primary, fallback to secondary
- `secondary`: Read from secondary only
- `secondaryPreferred`: Read from secondary, fallback to primary (recommended)
- `nearest`: Read from node with lowest latency

## Step 9: Enable Backups (Production)

### 9.1 Automated Backups

For production clusters (M10+):

1. Navigate to **Backup** tab
2. Enable **Continuous Backup** (recommended) or **Snapshot Backup**
3. Configure backup schedule:
   - **Snapshot frequency**: Every 6-24 hours
   - **Retention**: 7-30 days (per requirement 2.3.4)
   - **Point-in-time recovery**: Enable for critical data

### 9.2 Backup Best Practices

- Store backups in a different geographic region
- Test backup restoration quarterly (per requirement 2.3.4)
- Enable encryption at rest for backups
- Set up backup alerts

## Step 10: Security Hardening (Production)

### 10.1 Enable Encryption

1. **Encryption at Rest**: Enabled by default on M10+
2. **Encryption in Transit**: TLS 1.2+ enabled by default
3. **Field-Level Encryption**: Configure for sensitive data (PII)

### 10.2 Enable Auditing

For production clusters:
1. Navigate to **Security** → **Database Auditing**
2. Enable auditing for:
   - Authentication attempts
   - Authorization failures
   - DDL operations (create/drop database/collection)
   - DML operations on sensitive collections

### 10.3 Configure Alerts

1. Navigate to **Alerts**
2. Set up alerts for:
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - Connection count approaching limit
   - Replication lag
   - Disk space usage (>80%)

## Connection String Examples

### Development
```env
DATABASE_URL=mongodb+srv://dev-user:dev-password@cluster0.xxxxx.mongodb.net/mern-education-dev?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=50
```

### Staging
```env
DATABASE_URL=mongodb+srv://staging-user:staging-password@cluster0.xxxxx.mongodb.net/mern-education-staging?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=75
```

### Production
```env
DATABASE_URL=mongodb+srv://prod-user:prod-password@cluster0.xxxxx.mongodb.net/mern-education-platform?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100&readPreference=secondaryPreferred
```

## Troubleshooting

### Connection Issues

**Problem**: "MongoServerError: bad auth"
- **Solution**: Verify username and password are correct
- Check that password special characters are URL-encoded

**Problem**: "MongooseServerSelectionError: connection timed out"
- **Solution**: Check IP whitelist in Network Access
- Verify firewall isn't blocking port 27017

**Problem**: "MongooseServerSelectionError: ENOTFOUND"
- **Solution**: Check connection string format
- Verify cluster is deployed and running

### Performance Issues

**Problem**: Slow queries
- **Solution**: Create appropriate indexes (Task 2.x)
- Use MongoDB Performance Advisor
- Enable profiling in Atlas

**Problem**: Connection pool exhausted
- **Solution**: Increase `maxPoolSize` in connection string
- Check for connection leaks in application code

## Cost Optimization

### Free Tier (M0)
- **Cost**: $0/month
- **Limitations**: 512MB storage, shared resources
- **Best for**: Development, testing, small projects

### Production Tiers
- **M10**: ~$57/month (AWS, us-east-1)
- **M20**: ~$140/month
- **M30**: ~$280/month

### Cost-Saving Tips
1. Use free tier for development
2. Enable auto-scaling for variable workloads
3. Use data archiving for old data
4. Monitor and optimize queries
5. Consider reserved capacity for predictable workloads

## Next Steps

After completing this setup:

1. ✅ **Task 1.4.1**: Create MongoDB Atlas cluster (COMPLETE)
2. ⏭️ **Task 1.4.2**: Configure Mongoose connection with retry logic
3. ⏭️ **Task 1.4.3**: Implement connection pooling configuration
4. ⏭️ **Task 1.4.4**: Create database connection health check

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

## Support

If you encounter issues:
1. Check MongoDB Atlas status page
2. Review Atlas documentation
3. Contact MongoDB support (available for paid tiers)
4. Check application logs for detailed error messages

---

**Status**: ✅ Task 1.4.1 Complete - MongoDB Atlas cluster setup guide created

**Note**: This is a manual setup process. Follow the steps above to create your cluster, then update the `DATABASE_URL` in your `.env` file with the connection string.
