# MERN Education Platform

A comprehensive Learning Management System (LMS) built with MongoDB, Express.js, React, and Node.js.

## Project Structure

```
mern-education-platform/
├── backend/          # Express.js API server
├── frontend/         # React application
└── package.json      # Root package.json for monorepo
```

## Getting Started

**📖 [Complete Setup Guide](./HOW_TO_RUN.md)** - Follow this guide to get the platform running in 5 minutes!

### Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

cd ../frontend
npm install

# 2. Set up environment (see HOW_TO_RUN.md for details)
cd ../backend
cp .env.example .env
# Edit .env with your MongoDB Atlas and Redis credentials

# 3. Start backend (Terminal 1)
npm run dev

# 4. Start frontend (Terminal 2 - open new terminal)
cd ../frontend
npm run dev
```

The backend will run at `http://localhost:5000` and frontend at `http://localhost:3000`.

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)
- Redis (local or cloud instance)

For detailed setup instructions, troubleshooting, and configuration, see **[HOW_TO_RUN.md](./HOW_TO_RUN.md)**.

## Architecture

The system follows a three-tier architecture:
- **Frontend**: React with Redux Toolkit for state management
- **Backend**: Express.js RESTful API with MVC pattern
- **Database**: MongoDB Atlas with replica sets

## Features

- **User Management** - Students, Instructors, and Admins with role-based access
- **Course Management** - Create courses with modules, lessons, and attachments
- **Quiz & Assessment** - Timed quizzes with automatic grading
- **Payment Processing** - Stripe integration for course purchases
- **Certificate Generation** - Automatic certificates upon course completion
- **Real-time Notifications** - In-app notifications for important events
- **Analytics Dashboards** - Instructor and admin analytics with charts
- **Student Dashboard** - Track enrolled courses, progress, and certificates

## Documentation

### Quick Start Guides
- **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** - Complete setup guide (start here!)
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Track your setup progress
- **[GENERATE_SECRETS.md](./GENERATE_SECRETS.md)** - Generate secure JWT and session secrets

### Detailed Documentation
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend application guide
- **[.kiro/specs/](./kiro/specs/mern-education-platform/)** - Project specifications

## Technology Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js for REST API
- MongoDB Atlas with Mongoose
- Redis for caching and sessions
- JWT authentication
- Stripe for payments

### Frontend
- React 18 with TypeScript
- Redux Toolkit for state management
- Material-UI (MUI) components
- React Router for navigation
- Vite for build tooling

## Project Status

This project is actively under development. See `.kiro/specs/mern-education-platform/tasks.md` for current progress.

## License

MIT
