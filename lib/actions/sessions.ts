'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getSessions() {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_areas (
        areas (id, name)
      ),
      session_testers (
        id,
        users (id, github_username, avatar_url)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return sessions;
}

export async function getSession(id: string) {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_areas (
        areas (id, name)
      ),
      session_testers (
        id,
        browsers,
        tester_status,
        notes,
        users (id, github_username, display_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return session;
}

export async function getAllUsers() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, github_username, display_name, avatar_url, created_at, updated_at')
    .order('github_username', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return users;
}

export async function getAllAreas() {
  const supabase = await createClient();

  const { data: areas, error } = await supabase
    .from('areas')
    .select('id, name, description, created_at, created_by')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching areas:', error);
    return [];
  }

  return areas;
}

export async function getCheckpointCounts(areaIds: string[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('checkpoints')
    .select('area_id')
    .in('area_id', areaIds);

  if (error) {
    console.error('Error fetching checkpoint counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.area_id] = (counts[row.area_id] || 0) + 1;
  }

  return counts;
}

interface CreateSessionData {
  name: string;
  description: string | null;
  branch: string | null;
  external_link: string | null;
  area_ids: string[];
  testers: Array<{
    user_id: string;
    browsers: string[];
  }>;
}

export async function createSession(data: CreateSessionData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Create the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      name: data.name,
      description: data.description,
      branch: data.branch,
      external_link: data.external_link,
      status: 'active',
      created_by: user.id,
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Error creating session:', sessionError);
    throw new Error('Failed to create session');
  }

  // Create session_areas associations
  if (data.area_ids.length > 0) {
    const { error: areasError } = await supabase
      .from('session_areas')
      .insert(
        data.area_ids.map((area_id) => ({
          session_id: session.id,
          area_id,
        }))
      );

    if (areasError) {
      console.error('Error creating session areas:', areasError);
      throw new Error('Failed to associate areas with session');
    }

    // Snapshot permanent checkpoints from selected areas into session_checkpoints
    const { data: checkpoints, error: checkpointsError } = await supabase
      .from('checkpoints')
      .select('*')
      .in('area_id', data.area_ids);

    if (checkpointsError) {
      console.error('Error fetching checkpoints:', checkpointsError);
      throw new Error('Failed to fetch checkpoints');
    }

    if (checkpoints && checkpoints.length > 0) {
      const { error: sessionCheckpointsError } = await supabase
        .from('session_checkpoints')
        .insert(
          checkpoints.map((checkpoint) => ({
            session_id: session.id,
            checkpoint_id: checkpoint.id,
            description: checkpoint.description,
            category: checkpoint.category,
            source: 'permanent',
            area_id: checkpoint.area_id,
            created_by: checkpoint.created_by,
            created_at: checkpoint.created_at,
          }))
        );

      if (sessionCheckpointsError) {
        console.error('Error creating session checkpoints:', sessionCheckpointsError);
        throw new Error('Failed to snapshot checkpoints');
      }
    }
  }

  // Create session_testers assignments
  if (data.testers.length > 0) {
    const { error: testersError } = await supabase
      .from('session_testers')
      .insert(
        data.testers.map((tester) => ({
          session_id: session.id,
          user_id: tester.user_id,
          browsers: tester.browsers,
          tester_status: 'in_progress',
        }))
      );

    if (testersError) {
      console.error('Error creating session testers:', testersError);
      throw new Error('Failed to assign testers to session');
    }
  }

  revalidatePath('/sessions');
  return session;
}

export async function updateSession(id: string, data: Partial<CreateSessionData>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .update({
      name: data.name,
      description: data.description,
      branch: data.branch,
      external_link: data.external_link,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update session');
  }

  revalidatePath('/sessions');
  revalidatePath(`/sessions/${id}`);
  return session;
}

export async function deleteSession(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting session:', error);
    throw new Error('Failed to delete session');
  }

  revalidatePath('/sessions');
}

// Get all checkpoints for a session from the session_checkpoints snapshot
export async function getSessionCheckpoints(sessionId: string) {
  const supabase = await createClient();

  const [permanentResult, sessionOnlyResult] = await Promise.all([
    supabase
      .from('session_checkpoints')
      .select(`*, skipped_by_user:users!skipped_by(id, github_username, display_name, avatar_url)`)
      .eq('session_id', sessionId)
      .eq('source', 'permanent')
      .order('created_at', { ascending: true }),
    supabase
      .from('session_checkpoints')
      .select(`*, skipped_by_user:users!skipped_by(id, github_username, display_name, avatar_url)`)
      .eq('session_id', sessionId)
      .eq('source', 'session_only')
      .order('created_at', { ascending: true }),
  ]);

  if (permanentResult.error) {
    console.error('Error fetching permanent checkpoints:', permanentResult.error);
  }
  if (sessionOnlyResult.error) {
    console.error('Error fetching session-only checkpoints:', sessionOnlyResult.error);
  }

  return {
    permanentCheckpoints: permanentResult.data || [],
    sessionOnlyCheckpoints: sessionOnlyResult.data || [],
  };
}

// Get session results (OK marks) for the current user
export async function getSessionResults(sessionId: string, userId: string) {
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from('session_results')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching session results:', error);
    return [];
  }

  return results;
}

// Get all session results (OK marks) from all testers
export async function getAllSessionResults(sessionId: string) {
  const supabase = await createClient();

  const { data: results, error } = await supabase
    .from('session_results')
    .select('session_checkpoint_id, user_id, status')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching all session results:', error);
    return [];
  }

  return results;
}

// Get all bugs for a session (all testers)
export async function getSessionBugs(sessionId: string) {
  const supabase = await createClient();

  const { data: bugs, error } = await supabase
    .from('session_bugs')
    .select('*, users (id, github_username, display_name, avatar_url)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session bugs:', error);
    return [];
  }

  return bugs;
}

// Mark a checkpoint as OK
export async function markCheckpointOk(sessionId: string, checkpointId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_results')
    .upsert({
      session_id: sessionId,
      session_checkpoint_id: checkpointId,
      user_id: user.id,
      status: 'ok',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,session_checkpoint_id,user_id' });

  if (error) {
    console.error('Error marking checkpoint OK:', error);
    throw new Error('Failed to mark checkpoint OK');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Unmark a checkpoint (remove OK status)
export async function unmarkCheckpointOk(sessionId: string, checkpointId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_results')
    .delete()
    .eq('session_id', sessionId)
    .eq('session_checkpoint_id', checkpointId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unmarking checkpoint:', error);
    throw new Error('Failed to unmark checkpoint');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Skip a checkpoint globally (visible to all testers)
export async function skipCheckpoint(sessionId: string, checkpointId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_checkpoints')
    .update({ skipped_by: user.id, skipped_at: new Date().toISOString() })
    .eq('id', checkpointId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error skipping checkpoint:', error);
    throw new Error('Failed to skip checkpoint');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Undo a global skip
export async function unskipCheckpoint(sessionId: string, checkpointId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_checkpoints')
    .update({ skipped_by: null, skipped_at: null })
    .eq('id', checkpointId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error unskipping checkpoint:', error);
    throw new Error('Failed to undo skip');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Add a bug report to a checkpoint
export async function addBug(data: {
  sessionId: string;
  sessionCheckpointId: string;
  description: string;
  link?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_bugs')
    .insert({
      session_id: data.sessionId,
      session_checkpoint_id: data.sessionCheckpointId,
      user_id: user.id,
      description: data.description,
      link: data.link || null,
    });

  if (error) {
    console.error('Error adding bug:', error);
    throw new Error('Failed to add bug');
  }

  revalidatePath(`/sessions/${data.sessionId}`);
}

// Delete a bug report (own bugs only)
export async function deleteBug(bugId: string, sessionId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('session_bugs')
    .delete()
    .eq('id', bugId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting bug:', error);
    throw new Error('Failed to delete bug');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Update tester notes
export async function updateTesterNotes(sessionId: string, notes: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('session_testers')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating tester notes:', error);
    throw new Error('Failed to update notes');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Update tester status (mark as completed)
export async function updateTesterStatus(sessionId: string, status: 'in_progress' | 'completed') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('session_testers')
    .update({ tester_status: status, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating tester status:', error);
    throw new Error('Failed to update status');
  }

  revalidatePath(`/sessions/${sessionId}`);
}

// Add a checkpoint during a session
export async function addSessionCheckpoint(data: {
  sessionId: string;
  description: string;
  category?: string | null;
  addToPermanent: boolean;
  areaId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // If adding to permanent checklist, create checkpoint first
  let permanentCheckpointId = null;
  if (data.addToPermanent && data.areaId) {
    const { data: permanentCheckpoint, error: permanentError } = await supabase
      .from('checkpoints')
      .insert({
        area_id: data.areaId,
        description: data.description,
        category: data.category || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (permanentError) {
      console.error('Error creating permanent checkpoint:', permanentError);
      throw new Error('Failed to create permanent checkpoint');
    }

    permanentCheckpointId = permanentCheckpoint.id;
  }

  // Always create session checkpoint
  const { data: sessionCheckpoint, error: sessionError } = await supabase
    .from('session_checkpoints')
    .insert({
      session_id: data.sessionId,
      checkpoint_id: permanentCheckpointId,
      description: data.description,
      category: data.category || null,
      source: 'session_only',
      area_id: data.areaId || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Error creating session checkpoint:', sessionError);
    throw new Error('Failed to create session checkpoint');
  }

  revalidatePath(`/sessions/${data.sessionId}`);
  return sessionCheckpoint;
}

// Dashboard data fetching functions

// Get active sessions with coverage stats
export async function getActiveSessions() {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_areas (
        areas (id, name)
      ),
      session_testers (
        id,
        user_id,
        tester_status,
        users (id, github_username, avatar_url)
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }

  // Return sessions without heavy coverage calculations for dashboard performance
  // Coverage will be calculated on individual session pages where needed
  return sessions || [];
}

// Get recent completed sessions
export async function getRecentCompletedSessions(limit: number = 5) {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_areas (
        areas (id, name)
      )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent completed sessions:', error);
    return [];
  }

  // Return sessions without heavy stats calculations for dashboard performance
  // Stats will be calculated on individual session pages where needed
  return sessions || [];
}

// Calculate coverage percentage for a session
// A checkpoint is "covered" if at least one tester marked OK or reported a bug
async function getSessionCoverage(sessionId: string) {
  const supabase = await createClient();

  const [checkpointsResult, resultsResult, bugsResult] = await Promise.all([
    supabase
      .from('session_checkpoints')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId),
    supabase
      .from('session_results')
      .select('session_checkpoint_id')
      .eq('session_id', sessionId),
    supabase
      .from('session_bugs')
      .select('session_checkpoint_id')
      .eq('session_id', sessionId),
  ]);

  const totalCheckpoints = checkpointsResult.count || 0;
  if (totalCheckpoints === 0) {
    return 0;
  }

  const coveredSet = new Set([
    ...(resultsResult.data?.map(r => r.session_checkpoint_id) || []),
    ...(bugsResult.data?.map(b => b.session_checkpoint_id) || []),
  ]);

  return Math.round((coveredSet.size / totalCheckpoints) * 100);
}

// Get bug count for a session
async function getSessionBugCount(sessionId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from('session_bugs')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  return count || 0;
}

// Get dashboard stats
export async function getDashboardStats() {
  const supabase = await createClient();

  // Get start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Total sessions this month
  const { count: sessionsThisMonth } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);

  // Total bugs found this month
  const { count: bugsThisMonth } = await supabase
    .from('session_bugs')
    .select('session_id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);

  // Most active areas (by session count this month)
  const { data: sessionsWithAreas } = await supabase
    .from('sessions')
    .select(`
      id,
      session_areas (
        areas (id, name)
      )
    `)
    .gte('created_at', startOfMonth);

  // Count areas
  const areaCounts: Record<string, { name: string; count: number }> = {};
  sessionsWithAreas?.forEach((session) => {
    session.session_areas?.forEach((sa: any) => {
      const area = sa.areas;
      if (area) {
        if (!areaCounts[area.id]) {
          areaCounts[area.id] = { name: area.name, count: 0 };
        }
        areaCounts[area.id].count++;
      }
    });
  });

  // Get top 3 areas
  const mostActiveAreas = Object.entries(areaCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .map(([id, data]) => ({ id, name: data.name, count: data.count }));

  return {
    sessionsThisMonth: sessionsThisMonth || 0,
    bugsThisMonth: bugsThisMonth || 0,
    mostActiveAreas,
  };
}
