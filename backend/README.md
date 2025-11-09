# Performance Review Backend API

Express.js backend API for the Performance Review Management System.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT with bcrypt
- **Email**: AWS SES via Nodemailer
- **2FA**: Speakeasy (TOTP)
- **PDF Generation**: PDFKit

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, JWT)
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models (future)
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app configuration
│   └── server.js       # Server entry point
├── database/
│   ├── migrations/     # Database migration scripts
│   └── seeds/          # Database seed data
├── tests/              # Test files
├── .env.example        # Environment variables template
├── package.json
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update with your configuration:
- Database credentials
- JWT secret (use a strong random string)
- AWS SES credentials
- Other settings

### 3. Set Up Database

Make sure PostgreSQL is running, then:

```bash
npm run db:setup    # Create database
npm run db:migrate  # Run migrations
npm run db:seed     # (Optional) Seed with sample data
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix code
- `npm run db:setup` - Create database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:reset` - Reset database (drop and recreate)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /setup-2fa` - Setup 2FA
- `POST /verify-2fa` - Verify 2FA code
- `POST /disable-2fa` - Disable 2FA
- `GET /session` - Validate current session

### Users (`/api/users`)
- `GET /` - Get all users (admin)
- `POST /` - Create user (admin)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user (admin)
- `DELETE /:id` - Soft delete user (admin)
- `POST /:id/reset-password` - Admin reset password (admin)
- `GET /:id/login-history` - Get login history (admin)

### Org Chart (`/api/org-chart`)
- `GET /` - Get active org chart
- `GET /tree` - Get org chart tree structure
- `GET /my-chain` - Get current user's reporting chain
- `GET /:id` - Get specific org chart version
- `POST /` - Create new org chart (admin)
- `PUT /:id` - Update org chart (admin)
- `POST /relationships` - Add employee-manager relationship (admin)
- `DELETE /relationships/:id` - Remove relationship (admin)
- `GET /validate` - Validate org chart structure (admin)

### Review Cycles (`/api/review-cycles`)
- `GET /active` - Get active review cycle
- `GET /` - Get all cycles (admin)
- `POST /` - Create new cycle (admin)
- `GET /:id` - Get cycle by ID (admin)
- `PUT /:id` - Update cycle (admin)
- `POST /:id/launch` - Launch cycle (admin)
- `POST /:id/cancel` - Cancel cycle (admin)
- `GET /:id/status` - Get cycle status (admin)
- `GET /:id/participants` - Get participants (admin)
- `POST /:id/participants` - Add participants (admin)
- `GET /:id/360-reviewers/:employeeId` - Get assigned 360 reviewers
- `POST /:id/360-reviewers/:employeeId` - Assign 360 reviewers
- `GET /:id/eligible-360-reviewers/:employeeId` - Get eligible reviewers

### Reviews (`/api/reviews`)
- `GET /my-reviews` - Get current user's reviews
- `GET /pending` - Get pending reviews for current user
- `GET /:id` - Get review by ID
- `POST /` - Create new review
- `PUT /:id` - Update review draft
- `POST /:id/submit` - Submit review
- `POST /:id/release` - Release manager review to employee (manager)
- `POST /:id/revert` - Revert to draft (admin)
- `GET /:id/export-pdf` - Export review to PDF

### Team Reviews (`/api/team-reviews`)
- `GET /` - Get all subordinates' reviews
- `GET /direct-reports` - Get direct reports only
- `GET /:employeeId` - Get all reviews for employee
- `GET /:employeeId/cycle/:cycleId` - Get employee's review for specific cycle

### Admin (`/api/admin`)
- `GET /dashboard` - Get dashboard statistics
- `GET /overdue-reviews` - Get overdue reviews
- `GET /upcoming-deadlines` - Get reviews with upcoming deadlines
- `POST /send-reminder` - Send manual reminder
- `POST /extend-deadline` - Extend deadline for user
- `GET /reports/completion` - Get completion report

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `DUPLICATE_ENTRY` - Unique constraint violation
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Development

### Adding a New Endpoint

1. Create/update route in `src/routes/`
2. Create controller function in `src/controllers/`
3. Add validation middleware if needed
4. Test the endpoint

### Database Queries

Use the query helper from `src/config/database.js`:

```javascript
import { query } from '../config/database.js';

const result = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
```

For transactions:

```javascript
import { getClient } from '../config/database.js';

const client = await getClient();
try {
  await client.query('BEGIN');
  // Your queries here
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Security

- All passwords are hashed with bcrypt (cost factor 12)
- JWT tokens for session management
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- Helmet.js for security headers
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Test files should be placed in the `tests/` directory.

## License

MIT
