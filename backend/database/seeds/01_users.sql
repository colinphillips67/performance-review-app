-- Sample users for development
-- Password for all users: "Password123!"
-- Hash generated with bcrypt, cost factor 12

-- Admin user
INSERT INTO users (email, first_name, last_name, job_title, password_hash, is_admin)
VALUES (
  'admin@example.com',
  'Admin',
  'User',
  'System Administrator',
  '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- CEO (root of org chart)
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'ceo@example.com',
  'Jane',
  'Smith',
  'Chief Executive Officer',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
);

-- VP Engineering
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'vp.eng@example.com',
  'John',
  'Doe',
  'VP of Engineering',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
);

-- VP Product
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'vp.product@example.com',
  'Sarah',
  'Johnson',
  'VP of Product',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
);

-- Engineers
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES
  (
    'engineer1@example.com',
    'Bob',
    'Wilson',
    'Senior Software Engineer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
  ),
  (
    'engineer2@example.com',
    'Alice',
    'Brown',
    'Software Engineer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
  );

-- Product Managers
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES
  (
    'pm1@example.com',
    'Michael',
    'Davis',
    'Senior Product Manager',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
  ),
  (
    'pm2@example.com',
    'Emily',
    'Taylor',
    'Product Manager',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
  );

-- Designer
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'designer@example.com',
  'Lisa',
  'Martinez',
  'UX Designer',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewohCd8v8Mz8Jv4.'
);
