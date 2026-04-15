# MERN Education Platform - Backend

Express.js RESTful API server for the MERN Education Platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# See ENVIRONMENT_SETUP.md for details

# Run development server
npm run dev
```

## Deploy On Render

This backend is now set up for Render web services and includes a `render.yaml` blueprint at the repo root.

### Fastest path

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and point it to this repository.
3. Render will detect `render.yaml` and create the `oemsp-backend` web service.
4. Fill in the prompted environment variables:
   - `DATABASE_URL`
   - `CORS_ORIGIN`
5. Deploy.

### Notes

- Health check path: `/health/live`
- Redis is optional on Render now. If `REDIS_URL` is not set, the API uses in-memory fallback storage.
- On Render free instances, that in-memory fallback is temporary because free web services spin down after 15 minutes idle and can restart at any time.
- `PUBLIC_BASE_URL` is optional on Render because the app can fall back to `RENDER_EXTERNAL_URL`.
- If you are not ready to deploy the frontend yet, you can temporarily set `CORS_ORIGIN=*` and tighten it later.
- Render free web services do not support normal SMTP delivery for Gmail-based Nodemailer flows, so signup OTP and password-reset emails need a different email provider or a paid setup.

## Documentation

### Setup Guides

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) | Environment variable configuration | Initial setup, configuration reference |
| [MONGODB_ATLAS_QUICKSTART.md](./MONGODB_ATLAS_QUICKSTART.md) | Quick MongoDB Atlas setup (10 min) | First-time MongoDB Atlas setup |
| [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) | Comprehensive MongoDB Atlas guide | Production setup, detailed configuration |
| [MONGODB_ATLAS_CHECKLIST.md](./MONGODB_ATLAS_CHECKLIST.md) | Setup progress tracker | Track MongoDB Atlas setup steps |
| [REDIS_QUICKSTART.md](./REDIS_QUICKSTART.md) | Quick Redis setup (5 min) | First-time Redis setup |
| [REDIS_SETUP.md](./REDIS_SETUP.md) | Comprehensive Redis guide | Production setup, detailed configuration |
| [REDIS_CHECKLIST.md](./REDIS_CHECKLIST.md) | Redis setup progress tracker | Track Redis setup steps |
| [DATABASE_SETUP_SUMMARY.md](./DATABASE_SETUP_SUMMARY.md) | Task 1.4.1 completion summary | Reference, verification |
| [CONNECTION_POOLING_VERIFICATION.md](./CONNECTION_POOLING_VERIFICATION.md) | Connection pooling verification (Task 1.4.3) | Verify pooling configuration, performance planning |

### Configuration Guides

- **Environment Variables**: See [src/config/README.md](./src/config/README.md)
- **Database Connection**: See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- **Redis Cache**: See [REDIS_SETUP.md](./REDIS_SETUP.md)
- **Connection Pooling**: See [CONNECTION_POOLING_VERIFICATION.md](./CONNECTION_POOLING_VERIFICATION.md)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.config.ts       # Environment configuration
│   │   └── README.md           # Config documentation
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Environment Configuration

### Required Environment Variables

See [.env.example](./.env.example) for a complete list. Key variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db?options

# JWT
JWT_SECRET=your-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-secret-min-32-chars

# Payment
STRIPE_SECRET_KEY=sk_test_...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Email
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
EMAIL_FROM=your@gmail.com

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

For detailed configuration instructions, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).

## Database Setup

### Quick Setup (Development)

**MongoDB Atlas:**
1. Follow the [MongoDB Quick Start Guide](./MONGODB_ATLAS_QUICKSTART.md) (10 minutes)
2. Update `DATABASE_URL` in `.env`

**Redis:**
1. Follow the [Redis Quick Start Guide](./REDIS_QUICKSTART.md) (5 minutes)
2. Update `REDIS_URL` in `.env`

3. Run `npm run dev`

### Production Setup

**MongoDB Atlas:**
1. Follow the [Comprehensive MongoDB Setup Guide](./MONGODB_ATLAS_SETUP.md)
2. Configure security settings
3. Enable backups and monitoring
4. Update production `.env`

**Redis:**
1. Follow the [Comprehensive Redis Setup Guide](./REDIS_SETUP.md)
2. Configure security and TLS
3. Set up monitoring and alerts
4. Update production `.env`

### Setup Checklists

- MongoDB: [MONGODB_ATLAS_CHECKLIST.md](./MONGODB_ATLAS_CHECKLIST.md)
- Redis: [REDIS_CHECKLIST.md](./REDIS_CHECKLIST.md)

## Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build            # Compile TypeScript to JavaScript
npm run start            # Run compiled JavaScript (production)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing (coming soon)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Mongoose
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Security**: Helmet.js, CORS
- **File Upload**: Multer
- **Payment**: Stripe
- **Email**: Gmail SMTP (Nodemailer)
- **Storage**: AWS S3

## API Documentation

API documentation will be available at `/api/docs` once Swagger is configured (Task 22.1).

## Development Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd mern-education-platform/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up MongoDB Atlas
# Follow MONGODB_ATLAS_QUICKSTART.md

# Set up Redis
# Follow REDIS_QUICKSTART.md
```

### 2. Daily Development

```bash
# Start development server
npm run dev

# In another terminal, run linting
npm run lint

# Format code before committing
npm run format
```

### 3. Before Committing

```bash
# Check code quality
npm run lint
npm run format:check

# Run tests (when available)
npm test

# Build to verify compilation
npm run build
```

## Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets (min 32 characters)
- ✅ Keep dependencies updated
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Validate all inputs
- ✅ Sanitize user data
- ✅ Use parameterized queries
- ✅ Enable CORS with whitelist
- ✅ Set security headers with Helmet

## Troubleshooting

### Common Issues

**Problem**: "Environment configuration validation failed"
- **Solution**: Check `.env` file has all required variables
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for details

**Problem**: "MongoDB connection failed"
- **Solution**: Verify `DATABASE_URL` is correct
- Check IP whitelist in MongoDB Atlas
- See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) troubleshooting section

**Problem**: "Redis connection failed"
- **Solution**: Verify `REDIS_URL` is correct
- Check Redis is running: `redis-cli ping`
- See [REDIS_SETUP.md](./REDIS_SETUP.md) troubleshooting section

**Problem**: "Port already in use"
- **Solution**: Change `PORT` in `.env` or kill process using port
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Problem**: TypeScript compilation errors
- **Solution**: Check `tsconfig.json` configuration
- Ensure all dependencies are installed
- Run `npm run build` to see detailed errors

## Project Status

### Completed Tasks

- ✅ 1.1.1: Create monorepo structure
- ✅ 1.1.2: Initialize Node.js with TypeScript
- ✅ 1.1.3: Configure ESLint and Prettier
- ✅ 1.1.4: Set up Git repository
- ✅ 1.2.1: Install Express.js
- ✅ 1.2.2: Configure TypeScript for backend
- ✅ 1.2.3: Set up environment variables
- ✅ 1.2.4: Create environment template
- ✅ 1.4.1: MongoDB Atlas setup documentation
- ✅ 1.4.2: Configure Mongoose connection with retry logic
- ✅ 1.4.3: Connection pooling configuration verified
- ✅ 1.5.1: Redis setup documentation

### In Progress

- 🔄 1.4.4: Create health check endpoint
- 🔄 1.5.2: Configure ioredis client

### Upcoming Tasks

- 1.5.3: Implement cache utility functions
- 1.5.4: Set up session storage in Redis

See [.kiro/specs/mern-education-platform/tasks.md](../.kiro/specs/mern-education-platform/tasks.md) for full task list.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## Support

For issues and questions:
- Check documentation in this directory
- Review [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)
- Check [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- Review project requirements in `.kiro/specs/`

## License

[Add your license here]

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
