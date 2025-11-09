# Backend Tests

Comprehensive test suite for the Performance Review System backend.

## Test Structure

```
tests/
├── setup.js              # Global test setup and teardown
├── auth.test.js          # Integration tests for authentication endpoints
├── authService.test.js   # Unit tests for authentication service
└── userModel.test.js     # Unit tests for user model
```

## Test Coverage

### Authentication Tests (`auth.test.js`)
Integration tests for all authentication endpoints:

- **Login (`POST /api/auth/login`)**
  - ✅ Successful login with valid credentials
  - ✅ Failed login with invalid email
  - ✅ Failed login with invalid password
  - ✅ Failed login with missing credentials
  - ✅ Token generation and response structure

- **Logout (`POST /api/auth/logout`)**
  - ✅ Successful logout with valid token
  - ✅ Failed logout without token
  - ✅ Session invalidation

- **Session Validation (`GET /api/auth/session`)**
  - ✅ Valid session with valid token
  - ✅ Invalid session with invalid token
  - ✅ Failed validation without token

- **Password Reset (`POST /api/auth/reset-password`)**
  - ✅ Successful password change
  - ✅ Failed with incorrect current password
  - ✅ Failed with weak new password
  - ✅ Session invalidation after password change

- **Forgot Password (`POST /api/auth/forgot-password`)**
  - ✅ Security: Same response for existing/non-existing emails
  - ✅ Input validation

- **2FA Setup (`POST /api/auth/setup-2fa`)**
  - ✅ Generate secret and QR code
  - ✅ Authentication required

- **2FA Disable (`POST /api/auth/disable-2fa`)**
  - ✅ Disable with correct password
  - ✅ Failed with incorrect password
  - ✅ Session invalidation after disable

### User Registration Tests
- **Create User (`POST /api/users`)**
  - ✅ Successful user creation
  - ✅ Duplicate email rejection
  - ✅ Email format validation
  - ✅ Password strength validation
  - ✅ Required fields validation

### Auth Service Tests (`authService.test.js`)
Unit tests for authentication business logic:

- **Password Hashing**
  - ✅ Hash generation
  - ✅ Password comparison
  - ✅ Salt uniqueness

- **JWT Token Management**
  - ✅ Token generation
  - ✅ Token verification
  - ✅ Invalid token handling

- **User Authentication**
  - ✅ Credential validation
  - ✅ Session creation
  - ✅ Error handling

- **User Registration**
  - ✅ User creation
  - ✅ Duplicate prevention
  - ✅ Password hashing

- **Password Management**
  - ✅ Password change
  - ✅ Session invalidation
  - ✅ Validation

- **2FA Management**
  - ✅ Secret generation
  - ✅ Enable 2FA with TOTP verification
  - ✅ Disable 2FA with password confirmation
  - ✅ 2FA authentication flow

### User Model Tests (`userModel.test.js`)
Unit tests for database operations:

- **User Lookup**
  - ✅ Find by email
  - ✅ Find by ID
  - ✅ Null handling for non-existent users

- **User Creation**
  - ✅ Create with all fields
  - ✅ Admin user creation
  - ✅ Default values

- **User Updates**
  - ✅ Update last login timestamp
  - ✅ Update password
  - ✅ Update 2FA settings

- **User Management**
  - ✅ Get all active users
  - ✅ Deactivate user (soft delete)
  - ✅ Activate user
  - ✅ Exclude inactive users from listings

- **Data Validation**
  - ✅ UUID format
  - ✅ Email format
  - ✅ Timestamp validity
  - ✅ Boolean field types

## Running Tests

### Prerequisites

1. **PostgreSQL Database**
   ```bash
   # Create test database
   createdb performance_review_test
   ```

2. **Environment Setup**
   Create a `.env.test` file in the backend directory:
   ```env
   NODE_ENV=test
   PORT=5001

   # Test Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=performance_review_test
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration (use different secret for tests)
   JWT_SECRET=test-secret-key-for-testing-only
   JWT_EXPIRES_IN=2h
   ```

3. **Setup Test Database Schema**
   ```bash
   # Run schema on test database
   psql -U postgres -d performance_review_test -f database/schema.sql
   ```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test auth.test.js
npm test authService.test.js
npm test userModel.test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Best Practices

### 1. Isolation
Each test file creates its own test data and cleans up after itself. Tests should not depend on each other.

### 2. Setup and Teardown
- `beforeAll`: Create test data once before all tests
- `afterAll`: Clean up test data after all tests
- `beforeEach`: Reset state before each test
- `afterEach`: Clean up after each test

### 3. Database Cleanup
Always delete test data in `afterAll` or `afterEach`:
```javascript
afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%']);
  await pool.end();
});
```

### 4. Assertions
Use descriptive expect statements:
```javascript
expect(response.body).toHaveProperty('token');
expect(response.body.user.email).toBe('test@example.com');
```

### 5. Error Testing
Test both success and failure cases:
```javascript
await expect(someFunction()).rejects.toThrow('ERROR_CODE');
```

## Debugging Tests

### Enable Query Logging
Set in `.env.test`:
```env
LOG_QUERIES=true
```

### Run Single Test
```bash
npm test -- -t "should login successfully"
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  env:
    DB_HOST: localhost
    DB_NAME: performance_review_test
    DB_USER: postgres
    DB_PASSWORD: postgres
  run: |
    npm test
```

## Future Test Additions

### Planned Test Coverage
- [ ] Middleware tests (auth, error handling, rate limiting)
- [ ] Email service tests (when implemented)
- [ ] PDF generation tests (when implemented)
- [ ] Review cycle tests
- [ ] Org chart tests
- [ ] Admin dashboard tests

### Performance Testing
- [ ] Load testing for authentication endpoints
- [ ] Database query performance tests
- [ ] Concurrent session handling

### Security Testing
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF token validation
- [ ] Rate limiting tests

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d performance_review_test -c "SELECT 1"
```

### Port Already in Use
If tests fail with "Port already in use":
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill
```

### Test Database Reset
If tests are failing due to data issues:
```bash
# Drop and recreate test database
dropdb performance_review_test
createdb performance_review_test
psql -U postgres -d performance_review_test -f database/schema.sql
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain test coverage above 80%
4. Update this README with new test descriptions
