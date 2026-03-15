# Setup Checklist

Use this checklist to track your setup progress.

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (optional, for cloning)

## Backend Setup

### 1. Installation
- [ ] Navigate to `backend/` directory
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`

### 2. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create a cluster (free M0 tier)
- [ ] Create database user with password
- [ ] Whitelist IP address (0.0.0.0/0 for dev)
- [ ] Get connection string
- [ ] Add connection string to `.env` as `DATABASE_URL`
- [ ] Test connection: `npm run test:db`

**Detailed guide:** `backend/MONGODB_ATLAS_QUICKSTART.md`

### 3. Redis Setup
- [ ] Install Redis (Windows: Chocolatey, macOS: Homebrew, Linux: apt)
- [ ] Start Redis service
- [ ] Test Redis: `redis-cli ping` (should return "PONG")
- [ ] Add `REDIS_URL=redis://localhost:6379` to `.env`

**Detailed guide:** `backend/REDIS_QUICKSTART.md`

### 4. Environment Variables
- [ ] Generate JWT_SECRET (see GENERATE_SECRETS.md)
- [ ] Generate REFRESH_TOKEN_SECRET
- [ ] Generate SESSION_SECRET
- [ ] Set CORS_ORIGIN to `http://localhost:3000`
- [ ] Verify all required variables are set

### 5. Start Backend
- [ ] Run `npm run dev`
- [ ] Verify server starts on port 5000
- [ ] Test health endpoint: `curl http://localhost:5000/api/health`


## Frontend Setup

### 1. Installation
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`

### 2. Start Frontend
- [ ] Run `npm run dev`
- [ ] Verify server starts on port 3000
- [ ] Open browser to `http://localhost:3000`
- [ ] Verify application loads

## Optional Services (for full functionality)

### Stripe Payment Processing
- [ ] Create Stripe account
- [ ] Get test API keys from dashboard
- [ ] Add `STRIPE_SECRET_KEY` to `.env`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env`

### AWS S3 File Storage
- [ ] Create AWS account
- [ ] Create S3 bucket
- [ ] Create IAM user with S3 access
- [ ] Add `AWS_ACCESS_KEY_ID` to `.env`
- [ ] Add `AWS_SECRET_ACCESS_KEY` to `.env`
- [ ] Add `AWS_S3_BUCKET` to `.env`
- [ ] Add `AWS_REGION` to `.env`

### Email Service
- [ ] Choose email service (AWS SES or SendGrid)
- [ ] Get API key
- [ ] Add `EMAIL_SERVICE_API_KEY` to `.env`
- [ ] Add `EMAIL_FROM` to `.env`

## Verification

### Backend Verification
- [ ] Backend runs without errors
- [ ] Health check endpoint responds: `http://localhost:5000/api/health`
- [ ] MongoDB connection successful (check logs)
- [ ] Redis connection successful (check logs)
- [ ] No TypeScript compilation errors

### Frontend Verification
- [ ] Frontend runs without errors
- [ ] Application loads in browser
- [ ] No console errors in browser
- [ ] Can navigate between pages

### Integration Verification
- [ ] Frontend can communicate with backend
- [ ] API calls work (check Network tab in browser)
- [ ] CORS is configured correctly

## Troubleshooting

If you encounter issues, check:

- [ ] All environment variables are set correctly
- [ ] MongoDB Atlas IP whitelist includes your IP
- [ ] Redis is running (`redis-cli ping`)
- [ ] Ports 5000 and 3000 are not in use
- [ ] Node.js version is 18 or higher

**See HOW_TO_RUN.md for detailed troubleshooting guide.**

## Next Steps

Once setup is complete:

- [ ] Create a test user account
- [ ] Explore the application features
- [ ] Review project documentation
- [ ] Check `.kiro/specs/` for project requirements

## Quick Reference

| Resource | Purpose |
|----------|---------|
| [HOW_TO_RUN.md](./HOW_TO_RUN.md) | Complete setup guide |
| [GENERATE_SECRETS.md](./GENERATE_SECRETS.md) | Generate secure secrets |
| [backend/README.md](./backend/README.md) | Backend documentation |
| [frontend/README.md](./frontend/README.md) | Frontend documentation |
| [backend/MONGODB_ATLAS_QUICKSTART.md](./backend/MONGODB_ATLAS_QUICKSTART.md) | MongoDB quick setup |
| [backend/REDIS_QUICKSTART.md](./backend/REDIS_QUICKSTART.md) | Redis quick setup |

---

**Estimated Setup Time:** 20-30 minutes (with MongoDB Atlas and Redis setup)

**Need Help?** See [HOW_TO_RUN.md](./HOW_TO_RUN.md) for detailed instructions and troubleshooting.
