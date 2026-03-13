-- QA Buddy Database Schema Migration
-- Run this in your Supabase SQL Editor
--
-- WARNING: This script will DROP all existing tables and recreate them
-- All existing data will be lost!
--

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables in reverse dependency order (CASCADE will handle foreign keys)
-- This allows you to run the migration multiple times without errors
DROP TABLE IF EXISTS session_bugs CASCADE;
DROP TABLE IF EXISTS session_results CASCADE;
DROP TABLE IF EXISTS session_checkpoints CASCADE;
DROP TABLE IF EXISTS session_testers CASCADE;
DROP TABLE IF EXISTS session_areas CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop trigger function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Users table
-- Stores user information from GitHub OAuth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Areas table
-- Represents broad product areas like "Lists", "Tables", "AI", etc.
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Checkpoints table
-- Permanent checklist items that belong to an area's permanent checklist
-- These get snapshotted into sessions when a session is created with the area
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  hint TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
-- Test sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  branch TEXT,
  external_link TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Session areas junction table
-- Many-to-many relationship between sessions and areas
CREATE TABLE session_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  UNIQUE(session_id, area_id)
);

-- Session testers table
-- Assignment of testers to sessions with their browsers
CREATE TABLE session_testers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  browsers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  tester_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (tester_status IN ('in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Session checkpoints table
-- Snapshot of checkpoints for a specific session
-- Contains both permanent checkpoints (copied from areas) and session-only checkpoints (created during session)
CREATE TABLE session_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE SET NULL, -- NULL for session-only checkpoints
  description TEXT NOT NULL,
  category TEXT,
  hint TEXT,
  source TEXT NOT NULL CHECK (source IN ('permanent', 'session_only')),
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL, -- For grouping permanent checkpoints by area
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Global skip state: set by one tester, visible to all
  skipped_by UUID REFERENCES users(id) ON DELETE SET NULL,
  skipped_at TIMESTAMPTZ
);

-- Session results table
-- Tracks when a tester marks a checkpoint as OK (passed)
-- Bugs are tracked separately in session_bugs
CREATE TABLE session_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_checkpoint_id UUID NOT NULL REFERENCES session_checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, session_checkpoint_id, user_id)
);

-- Session bugs table
-- Multiple bugs can be reported per checkpoint per tester
CREATE TABLE session_bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_checkpoint_id UUID NOT NULL REFERENCES session_checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_checkpoints_area_id ON checkpoints(area_id);
CREATE INDEX idx_session_areas_session_id ON session_areas(session_id);
CREATE INDEX idx_session_areas_area_id ON session_areas(area_id);
CREATE INDEX idx_session_testers_session_id ON session_testers(session_id);
CREATE INDEX idx_session_testers_user_id ON session_testers(user_id);
CREATE INDEX idx_session_checkpoints_session_id ON session_checkpoints(session_id);
CREATE INDEX idx_session_checkpoints_checkpoint_id ON session_checkpoints(checkpoint_id);
CREATE INDEX idx_session_checkpoints_area_id ON session_checkpoints(area_id);
CREATE INDEX idx_session_checkpoints_source ON session_checkpoints(source);
CREATE INDEX idx_session_results_session_id ON session_results(session_id);
CREATE INDEX idx_session_results_session_checkpoint_id ON session_results(session_checkpoint_id);
CREATE INDEX idx_session_results_user_id ON session_results(user_id);
CREATE INDEX idx_session_bugs_session_id ON session_bugs(session_id);
CREATE INDEX idx_session_bugs_session_checkpoint_id ON session_bugs(session_checkpoint_id);
CREATE INDEX idx_session_bugs_user_id ON session_bugs(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bugs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for areas table
CREATE POLICY "Anyone can view areas" ON areas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create areas" ON areas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update areas" ON areas
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete areas" ON areas
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for checkpoints table
CREATE POLICY "Anyone can view checkpoints" ON checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create checkpoints" ON checkpoints
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checkpoints" ON checkpoints
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete checkpoints" ON checkpoints
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for sessions table
CREATE POLICY "Anyone can view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sessions" ON sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sessions" ON sessions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_areas table
CREATE POLICY "Anyone can view session_areas" ON session_areas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_areas" ON session_areas
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_testers table
CREATE POLICY "Anyone can view session_testers" ON session_testers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_testers" ON session_testers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_checkpoints table
CREATE POLICY "Anyone can view session_checkpoints" ON session_checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_checkpoints" ON session_checkpoints
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_results table
CREATE POLICY "Anyone can view session_results" ON session_results
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_results" ON session_results
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_bugs table
CREATE POLICY "Anyone can view session_bugs" ON session_bugs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_bugs" ON session_bugs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_testers_updated_at BEFORE UPDATE ON session_testers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_results_updated_at BEFORE UPDATE ON session_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
