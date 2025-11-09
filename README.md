# Performance Review Management System

A comprehensive web-based application for managing performance reviews, including self-evaluations, 360-degree feedback, and manager evaluations.

## Technology Stack

- **Frontend**: React 18+ with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL 14+
- **Authentication**: JWT with bcrypt
- **Email**: AWS SES (via Nodemailer)

## Project Structure

```
performance-review-app/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── package.json       # Root package.json for workspace management
└── README.md         # This file
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- AWS account (for SES email service)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd performance-review-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `frontend/` and `backend/` directories
   - Update the values with your configuration

4. **Set up the database**
   ```bash
   cd backend
   npm run db:setup
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start both the backend (on port 5000) and frontend (on port 5173) concurrently.

## Development

### Backend Development
```bash
npm run dev:backend
```

### Frontend Development
```bash
npm run dev:frontend
```

### Run Tests
```bash
npm run test
```

### Lint Code
```bash
npm run lint
```

## Build for Production

```bash
npm run build
```

## Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./backend/docs/API.md)
- [Requirements Document](./docs/performance-review-requirements-v1.md)

## License

MIT
