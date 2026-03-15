# How to Run the MERN Education Platform

Quick guide to get the platform running on your local machine.

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** and npm installed ([Download here](https://nodejs.org/))
- **MongoDB Atlas account** (free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- **Redis** installed locally or access to a Redis instance

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
# If you cloned from a repository:
# git clone <repository-url>
# cd mern-education-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Backend Environment

```bash
# In the backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# At minimum, update these variables:
# - DATABASE_URL (MongoDB connection string)
# - JWT_SECRET, REFRESH_TOKEN_SECRET, SESSION_SECRET
#
# To generate secure secrets, see GENERATE_SECRETS.md or run:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up MongoDB Atlas (10 Minutes)

Follow the quick setup guide: `backend/MONGODB_ATLAS_QUICKSTART.md`

**Quick steps:**
1. Create free MongoDB Atlas account
2. Create a cluster (free M0 tier)
3. Create database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and add to `.env` as `DATABASE_URL`

### 4. Set Up Redis (5 Minutes)

Follow the quick setup guide: `backend/REDIS_QUICKSTART.md`

**Quick steps:**

**Windows:**
```bash
# Install via Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

Update `REDIS_URL` in `.env` (default: `redis://localhost:6379`)

### 5. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs at: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`


## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | See GENERATE_SECRETS.md |
| `REFRESH_TOKEN_SECRET` | Refresh token secret (32+ chars) | See GENERATE_SECRETS.md |
| `SESSION_SECRET` | Session secret (32+ chars) | See GENERATE_SECRETS.md |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |

### Optional Variables (for full functionality)

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key | Payment processing |
| `AWS_ACCESS_KEY_ID` | AWS access key | File uploads to S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | File uploads to S3 |
| `AWS_S3_BUCKET` | S3 bucket name | File uploads |
| `EMAIL_SERVICE_API_KEY` | Email service API key | Sending emails |
| `EMAIL_FROM` | Sender email address | Sending emails |

See `backend/.env.example` for complete list and detailed descriptions.

**💡 Tip:** See [GENERATE_SECRETS.md](./GENERATE_SECRETS.md) for easy ways to generate secure secrets for JWT and session variables.

## Available Scripts

### Backend Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production build
npm test                 # Run tests
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
```

### Frontend Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
```

## Project Structure

```
mern-education-platform/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Main server file
│   ├── .env                # Environment variables (create from .env.example)
│   └── package.json
│
└── frontend/               # React application
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── store/          # Redux store
    │   ├── types/          # TypeScript types
    │   ├── App.tsx         # Root component
    │   └── main.tsx        # Entry point
    └── package.json
```

## Common Issues & Troubleshooting

### Backend Issues

**Problem: "Environment configuration validation failed"**
- Check that all required variables in `.env` are set
- Verify JWT secrets are at least 32 characters
- See `backend/ENVIRONMENT_SETUP.md` for details

**Problem: "MongoDB connection failed"**
- Verify `DATABASE_URL` is correct in `.env`
- Check IP whitelist in MongoDB Atlas (add your IP or use 0.0.0.0/0 for dev)
- Ensure database user has correct permissions
- See `backend/MONGODB_ATLAS_SETUP.md` troubleshooting section

**Problem: "Redis connection failed"**
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_URL` in `.env` is correct
- On Windows, ensure Redis service is started
- See `backend/REDIS_SETUP.md` troubleshooting section

**Problem: "Port 5000 already in use"**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
```

**Problem: TypeScript compilation errors**
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version: `npx tsc --version`

### Frontend Issues

**Problem: "Cannot connect to backend API"**
- Verify backend is running on port 5000
- Check `CORS_ORIGIN` in backend `.env` matches frontend URL
- Verify Vite proxy configuration in `frontend/vite.config.ts`

**Problem: "Port 3000 already in use"**
- Change port in `frontend/vite.config.ts`
- Or kill process using port 3000 (same as backend port issue above)

**Problem: Material-UI styling issues**
- Clear browser cache
- Check that `@emotion/react` and `@emotion/styled` are installed
- Verify MUI version compatibility

### Database Issues

**Problem: "Connection pool errors"**
- Check MongoDB Atlas cluster is running
- Verify connection string includes pool settings
- See `backend/CONNECTION_POOLING_VERIFICATION.md`

**Problem: "Authentication failed"**
- Verify database username and password in connection string
- Check user has correct database permissions in MongoDB Atlas
- Ensure password doesn't contain special characters that need URL encoding

## Testing the Setup

### 1. Test Backend Health

```bash
# Backend should be running on port 5000
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend

Open browser to `http://localhost:3000` - you should see the application homepage.

### 3. Test Database Connection

```bash
cd backend
npm run test:db
```

Should show successful MongoDB connection.

### 4. Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

## Next Steps

Once everything is running:

1. **Create an account** - Register as a student or instructor
2. **Explore features** - Browse courses, enroll, take quizzes
3. **Check documentation** - See `backend/README.md` and `frontend/README.md` for detailed info
4. **Review the spec** - See `.kiro/specs/mern-education-platform/` for project requirements and design

## Additional Documentation

### Backend Documentation
- `backend/README.md` - Comprehensive backend guide
- `backend/MONGODB_ATLAS_QUICKSTART.md` - Quick MongoDB setup (10 min)
- `backend/MONGODB_ATLAS_SETUP.md` - Detailed MongoDB setup
- `backend/REDIS_QUICKSTART.md` - Quick Redis setup (5 min)
- `backend/REDIS_SETUP.md` - Detailed Redis setup
- `backend/ENVIRONMENT_SETUP.md` - Environment variables guide

### Frontend Documentation
- `frontend/README.md` - Frontend guide
- `frontend/MUI_SETUP.md` - Material-UI configuration
- `frontend/VITE_ENHANCEMENTS.md` - Vite configuration details

### Project Specifications
- `.kiro/specs/mern-education-platform/requirements.md` - Project requirements
- `.kiro/specs/mern-education-platform/design.md` - System design
- `.kiro/specs/mern-education-platform/tasks.md` - Implementation tasks

## Getting Help

If you encounter issues not covered here:

1. Check the detailed documentation in `backend/` and `frontend/` directories
2. Review MongoDB Atlas and Redis setup guides
3. Check the troubleshooting sections in respective README files
4. Verify all environment variables are correctly set

## Production Deployment

For production deployment:

1. Follow `backend/MONGODB_ATLAS_SETUP.md` for production MongoDB setup
2. Follow `backend/REDIS_SETUP.md` for production Redis setup
3. Set `NODE_ENV=production` in `.env`
4. Use strong secrets (32+ characters) for all JWT and session secrets
5. Configure proper CORS origins (no wildcards)
6. Enable HTTPS/TLS
7. Set up monitoring and logging
8. Configure backups for MongoDB
9. Set up CDN for static assets
10. Implement rate limiting and security headers

See backend documentation for detailed production deployment guide.
