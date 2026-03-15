# MongoDB Local Installation Guide (Windows)

## Quick Setup - 15 Minutes

### Step 1: Download MongoDB (2 minutes)

1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version**: Latest (7.0 or higher)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### Step 2: Install MongoDB (5 minutes)

1. Run the downloaded `.msi` installer
2. Choose **Complete** installation
3. **Important**: Check "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Data Directory: `C:\Program Files\MongoDB\Server\7.0\data`
   - Log Directory: `C:\Program Files\MongoDB\Server\7.0\log`
4. **Optional**: Uncheck "Install MongoDB Compass" (GUI tool, not needed for now)
5. Click **Install** and wait for completion
6. Click **Finish**

### Step 3: Verify Installation (2 minutes)

Open a new PowerShell or Command Prompt window and run:

```bash
mongosh --version
```

You should see version information like:
```
2.x.x
```

### Step 4: Check MongoDB Service (1 minute)

Verify MongoDB is running:

```bash
mongosh --eval "db.version()"
```

You should see the MongoDB version (e.g., `7.0.x`).

### Step 5: Test Connection (2 minutes)

Connect to MongoDB:

```bash
mongosh
```

You should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
Using MongoDB: 7.0.x
```

Type `exit` to quit the MongoDB shell.

### Step 6: Start Backend Server (3 minutes)

Your `.env` file is already configured for local MongoDB:
```env
DATABASE_URL=mongodb://localhost:27017/mern-education-platform
```

Now start the backend:

```bash
cd backend
npm run dev
```

Look for: **"✅ MongoDB connected successfully"**

## Troubleshooting

### MongoDB Service Not Running

If you get connection errors, start the MongoDB service:

**Option 1: Using Services (GUI)**
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "MongoDB" in the list
3. Right-click → Start

**Option 2: Using Command Line (Admin)**
```bash
net start MongoDB
```

### MongoDB Not Found

If `mongosh` command is not recognized:

1. Add MongoDB to PATH:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit" → "New"
   - Add: `C:\Program Files\MongoDB\Server\7.0\bin`
   - Click OK on all windows
2. Close and reopen your terminal

### Port Already in Use

If port 27017 is already in use:

```bash
# Check what's using the port
netstat -ano | findstr :27017

# Stop the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## MongoDB Compass (Optional GUI)

If you want a visual interface for MongoDB:

1. Download from [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Install and open
3. Connect to: `mongodb://localhost:27017`
4. You'll see your `mern-education-platform` database after the backend creates it

## Next Steps

After MongoDB is running:

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1
   - Health Check: http://localhost:5000/health

## Useful MongoDB Commands

```bash
# Connect to MongoDB shell
mongosh

# Show all databases
show dbs

# Use your database
use mern-education-platform

# Show collections
show collections

# View users
db.users.find().pretty()

# View courses
db.courses.find().pretty()

# Exit MongoDB shell
exit
```

## Production Notes

For production deployment:
- Use MongoDB Atlas (cloud) instead of local installation
- Enable authentication
- Configure firewall rules
- Set up automated backups
- Monitor performance and logs

---

**Quick Reference**: MongoDB runs on `localhost:27017` by default. Your backend is already configured to connect to it.
