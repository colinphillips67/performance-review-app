import pg from 'pg';
import dotenv from 'dotenv';

// Load appropriate env file based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'performance_review',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can be idle before being removed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Log pool creation in test mode
if (process.env.NODE_ENV === 'test') {
  console.log('[database.js] Pool created with config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user
  });
}

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.LOG_QUERIES === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }

  return res;
};

// Helper function to get a client from the pool (for transactions)
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Export pool as default
export default pool;
