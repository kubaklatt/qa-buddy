-- QA Buddy Database Schema Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Topics table
-- Specific themes within an area
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Checkpoints table
-- Checklist items - can belong to either an area (general) or topic (specific)
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checkpoint_belongs_to_area_or_topic CHECK (
    (area_id IS NOT NULL AND topic_id IS NULL) OR
    (area_id IS NULL AND topic_id IS NOT NULL)
  )
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

-- Session topics junction table
-- Many-to-many relationship between sessions and topics
CREATE TABLE session_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE(session_id, topic_id)
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

-- Session results table
-- Checkpoint outcomes per tester
CREATE TABLE session_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('passed', 'bug', 'skipped', 'not_applicable')),
  bug_link TEXT,
  bug_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, checkpoint_id, user_id)
);

-- Proposed checkpoints table
-- Suggestions from testers during a session
CREATE TABLE proposed_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('area', 'topic')),
  target_area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  target_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT proposed_checkpoint_target CHECK (
    (target_type = 'area' AND target_area_id IS NOT NULL AND target_topic_id IS NULL) OR
    (target_type = 'topic' AND target_topic_id IS NOT NULL AND target_area_id IS NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_topics_area_id ON topics(area_id);
CREATE INDEX idx_checkpoints_area_id ON checkpoints(area_id);
CREATE INDEX idx_checkpoints_topic_id ON checkpoints(topic_id);
CREATE INDEX idx_session_areas_session_id ON session_areas(session_id);
CREATE INDEX idx_session_areas_area_id ON session_areas(area_id);
CREATE INDEX idx_session_topics_session_id ON session_topics(session_id);
CREATE INDEX idx_session_topics_topic_id ON session_topics(topic_id);
CREATE INDEX idx_session_testers_session_id ON session_testers(session_id);
CREATE INDEX idx_session_testers_user_id ON session_testers(user_id);
CREATE INDEX idx_session_results_session_id ON session_results(session_id);
CREATE INDEX idx_session_results_user_id ON session_results(user_id);
CREATE INDEX idx_proposed_checkpoints_session_id ON proposed_checkpoints(session_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_checkpoints ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for topics table
CREATE POLICY "Anyone can view topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update topics" ON topics
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete topics" ON topics
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

-- RLS Policies for session_topics table
CREATE POLICY "Anyone can view session_topics" ON session_topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_topics" ON session_topics
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_testers table
CREATE POLICY "Anyone can view session_testers" ON session_testers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_testers" ON session_testers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for session_results table
CREATE POLICY "Anyone can view session_results" ON session_results
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage session_results" ON session_results
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for proposed_checkpoints table
CREATE POLICY "Anyone can view proposed_checkpoints" ON proposed_checkpoints
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage proposed_checkpoints" ON proposed_checkpoints
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
