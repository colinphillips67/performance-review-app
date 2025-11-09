import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const { Client } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'performance_review';

  console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
  const answer = await question(`Are you sure you want to reset database "${dbName}"? (yes/no): `);

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Database reset cancelled');
    rl.close();
    process.exit(0);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Terminate all connections to the target database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);

    // Drop the database
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`✅ Database "${dbName}" dropped`);

    // Create the database
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database "${dbName}" created`);

    await client.end();

    console.log('\n🎉 Database reset complete!');
    console.log('\nNext steps:');
    console.log('1. Run "npm run db:migrate" to apply schema');
    console.log('2. Run "npm run db:seed" to add sample data (optional)');

  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetDatabase();
