// Database types

export interface User {
  id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Checkpoint {
  id: string;
  area_id: string;
  description: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SessionCheckpoint {
  id: string;
  session_id: string;
  checkpoint_id: string | null; // NULL for session-only checkpoints
  description: string;
  category: string | null;
  source: 'permanent' | 'session_only';
  area_id: string | null; // For grouping permanent checkpoints by area
  created_by: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  name: string;
  description: string | null;
  branch: string | null;
  external_link: string | null;
  status: 'active' | 'completed';
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

// Extended types with relations
export interface AreaWithStats extends Area {
  checkpoint_count: number;
}

export interface CheckpointWithUser extends Checkpoint {
  users: Pick<User, 'id' | 'github_username' | 'avatar_url'> | null;
}

export interface SessionCheckpointWithUser extends SessionCheckpoint {
  users: Pick<User, 'id' | 'github_username' | 'avatar_url'> | null;
}

export interface SessionTester {
  id: string;
  session_id: string;
  user_id: string;
  browsers: string[];
  tester_status: 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionArea {
  id: string;
  session_id: string;
  area_id: string;
}

export interface SessionWithRelations extends Session {
  session_areas?: Array<{
    areas: Pick<Area, 'id' | 'name'>;
  }>;
  session_testers?: Array<SessionTester & {
    users: Pick<User, 'id' | 'github_username' | 'display_name' | 'avatar_url'>;
  }>;
}

export interface SessionResult {
  id: string;
  session_id: string;
  session_checkpoint_id: string;
  user_id: string;
  status: 'passed' | 'bug' | 'skipped' | 'not_applicable';
  bug_link: string | null;
  bug_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionResultWithUser extends SessionResult {
  users: Pick<User, 'id' | 'github_username' | 'avatar_url'> | null;
}
