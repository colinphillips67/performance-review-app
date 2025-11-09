-- Migration: Update review_cycles table for simplified implementation
-- This migration adapts the existing schema to support the current implementation

-- Add 'cancelled' status to review_cycle_status enum
ALTER TYPE review_cycle_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cycles' AND column_name = 'description'
  ) THEN
    ALTER TABLE review_cycles ADD COLUMN description TEXT;
  END IF;
END $$;

-- Rename review_cycle_id to cycle_id for consistency with models
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cycles' AND column_name = 'review_cycle_id'
  ) THEN
    ALTER TABLE review_cycles RENAME COLUMN review_cycle_id TO cycle_id;
  END IF;
END $$;

-- Make org_chart_id nullable (optional for now)
ALTER TABLE review_cycles ALTER COLUMN org_chart_id DROP NOT NULL;

-- Make created_by nullable (optional for now)
ALTER TABLE review_cycles ALTER COLUMN created_by DROP NOT NULL;

-- Make deadline columns nullable (optional for simplified version)
ALTER TABLE review_cycles ALTER COLUMN self_eval_deadline DROP NOT NULL;
ALTER TABLE review_cycles ALTER COLUMN peer_360_deadline DROP NOT NULL;
ALTER TABLE review_cycles ALTER COLUMN manager_eval_deadline DROP NOT NULL;

-- Make reviewer count columns nullable with defaults
ALTER TABLE review_cycles ALTER COLUMN min_360_reviewers DROP NOT NULL;
ALTER TABLE review_cycles ALTER COLUMN min_360_reviewers SET DEFAULT 0;
ALTER TABLE review_cycles ALTER COLUMN max_360_reviewers DROP NOT NULL;
ALTER TABLE review_cycles ALTER COLUMN max_360_reviewers SET DEFAULT 5;

-- Make reviewer_selection_method nullable with default
ALTER TABLE review_cycles ALTER COLUMN reviewer_selection_method DROP NOT NULL;
ALTER TABLE review_cycles ALTER COLUMN reviewer_selection_method SET DEFAULT 'manager_selects';

-- Update review_cycle_participants table
-- Rename review_cycle_id column if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cycle_participants' AND column_name = 'cycle_id'
  ) THEN
    ALTER TABLE review_cycle_participants RENAME COLUMN review_cycle_id TO cycle_id;
  END IF;
END $$;

-- Drop old foreign key constraint on employee_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_employee_id_fkey'
  ) THEN
    ALTER TABLE review_cycle_participants
    DROP CONSTRAINT review_cycle_participants_employee_id_fkey;
  END IF;
END $$;

-- Rename employee_id to user_id for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cycle_participants' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE review_cycle_participants RENAME COLUMN employee_id TO user_id;
  END IF;
END $$;

-- Add foreign key constraint for user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_user_id_fkey'
  ) THEN
    ALTER TABLE review_cycle_participants
    ADD CONSTRAINT review_cycle_participants_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add assigned_peers_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cycle_participants' AND column_name = 'assigned_peers_count'
  ) THEN
    ALTER TABLE review_cycle_participants ADD COLUMN assigned_peers_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Drop status columns that aren't used yet (can be re-added later)
ALTER TABLE review_cycle_participants DROP COLUMN IF EXISTS self_eval_status;
ALTER TABLE review_cycle_participants DROP COLUMN IF EXISTS peer_360_status;
ALTER TABLE review_cycle_participants DROP COLUMN IF EXISTS manager_eval_status;

-- Recreate foreign key constraint with new column name if needed
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_review_cycle_id_fkey'
  ) THEN
    ALTER TABLE review_cycle_participants
    DROP CONSTRAINT review_cycle_participants_review_cycle_id_fkey;
  END IF;

  -- Add new constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_cycle_id_fkey'
  ) THEN
    ALTER TABLE review_cycle_participants
    ADD CONSTRAINT review_cycle_participants_cycle_id_fkey
    FOREIGN KEY (cycle_id) REFERENCES review_cycles(cycle_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update unique constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_review_cycle_id_employee_id_key'
  ) THEN
    ALTER TABLE review_cycle_participants
    DROP CONSTRAINT review_cycle_participants_review_cycle_id_employee_id_key;
  END IF;

  -- Add new constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_cycle_participants_cycle_id_user_id_key'
  ) THEN
    ALTER TABLE review_cycle_participants
    ADD CONSTRAINT review_cycle_participants_cycle_id_user_id_key
    UNIQUE (cycle_id, user_id);
  END IF;
END $$;
