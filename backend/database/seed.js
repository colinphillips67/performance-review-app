import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'performance_review'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const seedsDir = join(__dirname, 'seeds');
    const seedFiles = readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Files are named with numeric prefixes (01_, 02_, etc.)

    for (const file of seedFiles) {
      console.log(`\nRunning seed: ${file}`);
      const seedPath = join(seedsDir, file);
      const sql = readFileSync(seedPath, 'utf8');

      await client.query(sql);
      console.log(`✅ ${file} completed`);
    }

    await client.end();
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample users created:');
    console.log('- admin@example.com (Admin) - Password: Password123!');
    console.log('- ceo@example.com (CEO) - Password: Password123!');
    console.log('- vp.eng@example.com (VP Engineering) - Password: Password123!');
    console.log('- vp.product@example.com (VP Product) - Password: Password123!');
    console.log('- engineer1@example.com (Engineer) - Password: Password123!');
    console.log('- engineer2@example.com (Engineer) - Password: Password123!');
    console.log('- pm1@example.com (Product Manager) - Password: Password123!');
    console.log('- pm2@example.com (Product Manager) - Password: Password123!');
    console.log('- designer@example.com (Designer) - Password: Password123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
