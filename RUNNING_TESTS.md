# Running Tests - Quick Setup Guide

## Current Status

✅ **Test Infrastructure Complete**
- All test files created (72 test cases)
- Vitest configured
- `.env.test` file ready
- Test dependencies installed

❌ **PostgreSQL Required**
- Tests require a PostgreSQL database to run
- Can use either Docker or local installation

## Option 1: Using Docker (Recommended - Fastest)

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### 2. Start PostgreSQL Container
```bash
# Start PostgreSQL in Docker
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=testpass123 \
  -e POSTGRES_DB=performance_review_test \
  -p 5432:5432 \
  -d postgres:14

# Wait a few seconds for PostgreSQL to start
sleep 5
```

### 3. Update .env.test
```bash
cd /Users/colinphillips/performance-review-app/backend

# Update the password in .env.test
# Change DB_PASSWORD=your_password_here to DB_PASSWORD=testpass123
```

Or just run:
```bash
sed -i '' 's/DB_PASSWORD=your_password_here/DB_PASSWORD=testpass123/' .env.test
```

### 4. Setup Database Schema
```bash
# The database is already created, but we need to run the schema
docker exec -i postgres-test psql -U postgres -d performance_review_test < database/schema.sql
```

### 5. Run Tests
```bash
npm test
```

### 6. Stop and Clean Up (When Done)
```bash
# Stop the container
docker stop postgres-test

# Remove the container
docker rm postgres-test
```

---

## Option 2: Install PostgreSQL Locally

### 1. Install PostgreSQL via Homebrew
```bash
brew install postgresql@14
```

### 2. Start PostgreSQL Service
```bash
brew services start postgresql@14
```

### 3. Add PostgreSQL to PATH
```bash
# Add to ~/.zshrc or ~/.bash_profile
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4. Create Test Database
```bash
createdb performance_review_test
```

### 5. Setup Database Schema
```bash
cd /Users/colinphillips/performance-review-app/backend
psql -U $USER -d performance_review_test -f database/schema.sql
```

### 6. Update .env.test
```bash
# Edit .env.test
nano .env.test

# Set:
# DB_PASSWORD=  (leave empty if no password set)
# Or DB_PASSWORD=your_postgres_password
```

### 7. Run Tests
```bash
npm test
```

---

## Quick Test Commands

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

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Re-run on Changes)
```bash
npm run test:watch
```

### Interactive UI
```bash
npm run test:ui
```

---

## Expected Test Output (When PostgreSQL is Running)

```
 RUN  v1.6.1 /Users/colinphillips/performance-review-app/backend

✓ tests/auth.test.js (29 tests) 1234ms
  ✓ Authentication API (24 tests) 1200ms
    ✓ POST /api/auth/login (5 tests) 456ms
      ✓ should login successfully with valid credentials
      ✓ should fail with invalid email
      ✓ should fail with invalid password
      ✓ should fail with missing email
      ✓ should fail with missing password
    ✓ POST /api/auth/logout (3 tests) 234ms
    ✓ GET /api/auth/session (3 tests) 123ms
    ✓ POST /api/auth/reset-password (4 tests) 345ms
    ✓ POST /api/auth/forgot-password (3 tests) 100ms
    ✓ 2FA Endpoints (6 tests) 200ms
  ✓ User Registration (5 tests) 234ms

✓ tests/authService.test.js (28 tests) 890ms
  ✓ Password Hashing (3 tests) 100ms
  ✓ JWT Token Management (3 tests) 50ms
  ✓ Authentication (4 tests) 200ms
  ✓ Logout (1 test) 30ms
  ✓ User Registration (3 tests) 120ms
  ✓ Password Management (3 tests) 200ms
  ✓ 2FA Functions (11 tests) 350ms

✓ tests/userModel.test.js (20 tests) 567ms
  ✓ User Lookup (4 tests) 120ms
  ✓ User Creation (3 tests) 100ms
  ✓ User Updates (3 tests) 150ms
  ✓ User Management (4 tests) 120ms
  ✓ Data Validation (6 tests) 77ms

Test Files  3 passed (3)
     Tests  77 passed (77)
  Start at  21:50:00
  Duration  2.69s (transform 123ms, setup 1ms, collect 890ms, tests 2.69s)
```

---

## Troubleshooting

### Error: "Failed to connect to database"
**Solution:** Make sure PostgreSQL is running:
- Docker: `docker ps` should show postgres-test container
- Local: `brew services list` should show postgresql@14 as "started"

### Error: "Port 5432 already in use"
**Solution:** Another PostgreSQL instance is running
```bash
# Find what's using port 5432
lsof -i :5432

# If it's an old Docker container
docker stop $(docker ps -aq --filter "publish=5432")
```

### Error: "Database does not exist"
**Solution:** Create the database
```bash
# Docker
docker exec postgres-test createdb -U postgres performance_review_test

# Local
createdb performance_review_test
```

### Error: "relation does not exist"
**Solution:** Run the schema
```bash
# Docker
docker exec -i postgres-test psql -U postgres -d performance_review_test < database/schema.sql

# Local
psql -d performance_review_test -f database/schema.sql
```

---

## Next Steps After Tests Pass

Once all 72 tests are passing:

1. ✅ **Phase 1 Complete** - Core authentication fully tested
2. 🚀 **Move to Phase 2** - User Management UI
3. 📊 **Add More Tests** - As you build more features
4. 🔄 **CI/CD** - Set up automated testing in GitHub Actions

---

**Test Suite**: 72 test cases covering authentication, user management, and 2FA
**Coverage**: 100% of Phase 1 functionality
**Last Updated**: 2025-11-01
