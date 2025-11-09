import { beforeAll, afterAll } from 'vitest';
import { pool } from '../src/config/database.js';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  console.log('📊 Database: %s@%s:%s/%s',
    process.env.DB_USER,
    process.env.DB_HOST,
    process.env.DB_PORT,
    process.env.DB_NAME
  );

  // Ensure we're using test database
  if (!process.env.DB_NAME || !process.env.DB_NAME.includes('test')) {
    console.warn('⚠️  Warning: DB_NAME should include "test" for safety');
  }

  // Check database connection
  try {
    const result = await pool.query('SELECT current_database() as db');
    console.log('✅ Database connection established to:', result.rows[0].db);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await pool.end();
  console.log('✅ Test cleanup complete');
});
