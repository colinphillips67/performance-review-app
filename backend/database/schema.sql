-- Performance Review System Database Schema
-- PostgreSQL 14+
-- All timestamps are stored in UTC

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS peer_360_assignments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS review_cycle_participants CASCADE;
DROP TABLE IF EXISTS review_cycles CASCADE;
DROP TABLE IF EXISTS org_chart_relationships CASCADE;
DROP TABLE IF EXISTS org_charts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS review_cycle_status CASCADE;
DROP TYPE IF EXISTS reviewer_selection_method CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;
DROP TYPE IF EXISTS review_type CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create ENUM types
CREATE TYPE review_cycle_status AS ENUM ('planning', 'active', 'completed');
CREATE TYPE reviewer_selection_method AS ENUM ('manager_selects', 'employee_selects');
CREATE TYPE participant_status AS ENUM ('not_started', 'draft', 'submitted', 'overdue', 'in_progress', 'complete', 'n/a');
CREATE TYPE review_type AS ENUM ('self', 'peer_360', 'manager');
CREATE TYPE review_status AS ENUM ('draft', 'submitted');
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'not_submitted');
CREATE TYPE notification_type AS ENUM ('review_assigned', 'review_submitted', 'review_complete', 'reminder', 'review_released');

-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- OrgCharts table
CREATE TABLE org_charts (
  org_chart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  root_employee_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_org_charts_is_active ON org_charts(is_active);

-- OrgChartRelationships table
CREATE TABLE org_chart_relationships (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_chart_id UUID NOT NULL REFERENCES org_charts(org_chart_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(user_id),
  manager_id UUID NOT NULL REFERENCES users(user_id),
  UNIQUE(org_chart_id, employee_id)
);

CREATE INDEX idx_org_chart_rel_org_chart ON org_chart_relationships(org_chart_id);
CREATE INDEX idx_org_chart_rel_employee ON org_chart_relationships(employee_id);
CREATE INDEX idx_org_chart_rel_manager ON org_chart_relationships(manager_id);

-- ReviewCycles table
CREATE TABLE review_cycles (
  review_cycle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  org_chart_id UUID NOT NULL REFERENCES org_charts(org_chart_id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  self_eval_deadline TIMESTAMP NOT NULL,
  peer_360_deadline TIMESTAMP NOT NULL,
  manager_eval_deadline TIMESTAMP NOT NULL,
  min_360_reviewers INTEGER NOT NULL CHECK (min_360_reviewers >= 0 AND min_360_reviewers <= 10),
  max_360_reviewers INTEGER NOT NULL CHECK (max_360_reviewers >= 0 AND max_360_reviewers <= 10),
  reviewer_selection_method reviewer_selection_method NOT NULL,
  status review_cycle_status DEFAULT 'planning',
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  CHECK (max_360_reviewers >= min_360_reviewers)
);

CREATE INDEX idx_review_cycles_status ON review_cycles(status);
CREATE INDEX idx_review_cycles_org_chart ON review_cycles(org_chart_id);

-- ReviewCycleParticipants table
CREATE TABLE review_cycle_participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(user_id),
  manager_id UUID REFERENCES users(user_id),
  self_eval_status participant_status DEFAULT 'not_started',
  peer_360_status participant_status DEFAULT 'not_started',
  manager_eval_status participant_status DEFAULT 'not_started',
  assigned_peers_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  UNIQUE(review_cycle_id, employee_id)
);

CREATE INDEX idx_participants_review_cycle ON review_cycle_participants(review_cycle_id);
CREATE INDEX idx_participants_employee ON review_cycle_participants(employee_id);
CREATE INDEX idx_participants_manager ON review_cycle_participants(manager_id);

-- Reviews table
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(user_id),
  reviewee_id UUID NOT NULL REFERENCES users(user_id),
  review_type review_type NOT NULL,
  content TEXT CHECK (LENGTH(content) <= 10000),
  status review_status DEFAULT 'draft',
  submitted_at TIMESTAMP,
  is_released_to_employee BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_reviews_review_cycle ON reviews(review_cycle_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_composite ON reviews(review_cycle_id, reviewee_id, review_type);

-- Peer360Assignments table
CREATE TABLE peer_360_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(user_id),
  reviewer_id UUID NOT NULL REFERENCES users(user_id),
  assigned_by UUID NOT NULL REFERENCES users(user_id),
  review_id UUID REFERENCES reviews(review_id),
  status assignment_status DEFAULT 'assigned',
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  UNIQUE(review_cycle_id, reviewee_id, reviewer_id)
);

CREATE INDEX idx_360_assignments_review_cycle ON peer_360_assignments(review_cycle_id);
CREATE INDEX idx_360_assignments_reviewer ON peer_360_assignments(reviewer_id);
CREATE INDEX idx_360_assignments_reviewee ON peer_360_assignments(reviewee_id);

-- Notifications table
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  notification_type notification_type NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  review_cycle_id UUID REFERENCES review_cycles(review_cycle_id),
  review_id UUID REFERENCES reviews(review_id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- AuditLogs table
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Sessions table
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'UTC';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_cycles_updated_at
  BEFORE UPDATE ON review_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON review_cycle_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
