import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Use test database
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'performance_review_test',
    user: 'postgres',
    password: 'testpass123'
  });

  const client = await pool.connect();

  try {
    console.log('Starting database migration on TEST database...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_update_review_cycles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('Migration completed successfully on TEST database!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
