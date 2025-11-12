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
  '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
);

-- VP Engineering
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'vp.eng@example.com',
  'John',
  'Doe',
  'VP of Engineering',
  '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
);

-- VP Product
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'vp.product@example.com',
  'Sarah',
  'Johnson',
  'VP of Product',
  '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
);

-- Engineers
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES
  (
    'engineer1@example.com',
    'Bob',
    'Wilson',
    'Senior Software Engineer',
    '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
  ),
  (
    'engineer2@example.com',
    'Alice',
    'Brown',
    'Software Engineer',
    '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
  );

-- Product Managers
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES
  (
    'pm1@example.com',
    'Michael',
    'Davis',
    'Senior Product Manager',
    '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
  ),
  (
    'pm2@example.com',
    'Emily',
    'Taylor',
    'Product Manager',
    '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
  );

-- Designer
INSERT INTO users (email, first_name, last_name, job_title, password_hash)
VALUES (
  'designer@example.com',
  'Lisa',
  'Martinez',
  'UX Designer',
  '$2b$12$zHaz3klrIOw2Fmn8oo8.MeIF0Ixjz5U.6oZkmFrdTRB3Eeypmzqui'
);
