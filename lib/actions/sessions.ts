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
      session_topics (
        topics (id, name, area_id)
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
    .select('id, github_username, display_name, avatar_url, default_browsers, created_at, updated_at')
    .order('github_username', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return users;
}

export async function getAreasWithTopics() {
  const supabase = await createClient();

  const { data: areas, error } = await supabase
    .from('areas')
    .select(`
      id,
      name,
      description,
      created_at,
      created_by,
      topics (id, area_id, name, description, created_at, created_by)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching areas with topics:', error);
    return [];
  }

  return areas;
}

export async function getCheckpointCounts(areaIds: string[], topicIds: string[]) {
  const supabase = await createClient();

  const counts: Record<string, { general: number; topics: Record<string, number> }> = {};

  for (const areaId of areaIds) {
    // Get general checkpoints for the area
    const { count: generalCount } = await supabase
      .from('checkpoints')
      .select('*', { count: 'exact', head: true })
      .eq('area_id', areaId)
      .is('topic_id', null);

    counts[areaId] = {
      general: generalCount || 0,
      topics: {},
    };
  }

  // Get topic-specific checkpoints
  for (const topicId of topicIds) {
    const { data: topic } = await supabase
      .from('topics')
      .select('area_id')
      .eq('id', topicId)
      .single();

    if (topic) {
      const { count: topicCount } = await supabase
        .from('checkpoints')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (!counts[topic.area_id]) {
        counts[topic.area_id] = { general: 0, topics: {} };
      }
      counts[topic.area_id].topics[topicId] = topicCount || 0;
    }
  }

  return counts;
}

interface CreateSessionData {
  name: string;
  description: string | null;
  branch: string | null;
  external_link: string | null;
  area_ids: string[];
  topic_ids: string[];
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
  }

  // Create session_topics associations
  if (data.topic_ids.length > 0) {
    const { error: topicsError } = await supabase
      .from('session_topics')
      .insert(
        data.topic_ids.map((topic_id) => ({
          session_id: session.id,
          topic_id,
        }))
      );

    if (topicsError) {
      console.error('Error creating session topics:', topicsError);
      throw new Error('Failed to associate topics with session');
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

// Get all checkpoints for a session based on selected areas and topics
export async function getSessionCheckpoints(sessionId: string) {
  const supabase = await createClient();

  // Get session areas and topics
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      session_areas (area_id),
      session_topics (topic_id)
    `)
    .eq('id', sessionId)
    .single();

  if (!session) {
    return {
      areaCheckpoints: [],
      topicCheckpoints: [],
    };
  }

  const areaIds = session.session_areas?.map((sa: any) => sa.area_id) || [];
  const topicIds = session.session_topics?.map((st: any) => st.topic_id) || [];

  // Get general checkpoints for selected areas
  const { data: areaCheckpoints } = await supabase
    .from('checkpoints')
    .select(`
      *,
      areas (id, name)
    `)
    .in('area_id', areaIds)
    .is('topic_id', null)
    .order('created_at', { ascending: true });

  // Get topic-specific checkpoints
  const { data: topicCheckpoints } = await supabase
    .from('checkpoints')
    .select(`
      *,
      topics (id, name, area_id)
    `)
    .in('topic_id', topicIds)
    .order('created_at', { ascending: true });

  return {
    areaCheckpoints: areaCheckpoints || [],
    topicCheckpoints: topicCheckpoints || [],
  };
}

// Get session results for the current user
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

// Update or create a session result
export async function updateSessionResult(data: {
  sessionId: string;
  checkpointId: string;
  status: 'passed' | 'bug' | 'skipped' | 'not_applicable';
  bugLink?: string | null;
  bugDescription?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: result, error } = await supabase
    .from('session_results')
    .upsert({
      session_id: data.sessionId,
      checkpoint_id: data.checkpointId,
      user_id: user.id,
      status: data.status,
      bug_link: data.bugLink || null,
      bug_description: data.bugDescription || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'session_id,checkpoint_id,user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating session result:', error);
    throw new Error('Failed to update session result');
  }

  revalidatePath(`/sessions/${data.sessionId}`);
  return result;
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

// Create a proposed checkpoint
export async function createProposedCheckpoint(data: {
  sessionId: string;
  description: string;
  category?: string | null;
  targetType: 'area' | 'topic';
  targetAreaId?: string | null;
  targetTopicId?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: proposal, error } = await supabase
    .from('proposed_checkpoints')
    .insert({
      session_id: data.sessionId,
      proposed_by: user.id,
      description: data.description,
      category: data.category || null,
      target_type: data.targetType,
      target_area_id: data.targetAreaId || null,
      target_topic_id: data.targetTopicId || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating proposed checkpoint:', error);
    throw new Error('Failed to create proposal');
  }

  revalidatePath(`/sessions/${data.sessionId}`);
  return proposal;
}

// Get proposed checkpoints for a session
export async function getProposedCheckpoints(sessionId: string) {
  const supabase = await createClient();

  const { data: proposals, error } = await supabase
    .from('proposed_checkpoints')
    .select(`
      *,
      proposed_by_user:users!proposed_by (github_username, display_name),
      target_area:areas!target_area_id (name),
      target_topic:topics!target_topic_id (name)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proposed checkpoints:', error);
    return [];
  }

  return proposals;
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
async function getSessionCoverage(sessionId: string) {
  const supabase = await createClient();

  // Get total checkpoints count
  const { areaCheckpoints, topicCheckpoints } = await getSessionCheckpoints(sessionId);
  const totalCheckpoints = areaCheckpoints.length + topicCheckpoints.length;

  if (totalCheckpoints === 0) {
    return 0;
  }

  // Get total results marked (any status)
  const { count } = await supabase
    .from('session_results')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const markedCheckpoints = count || 0;

  // Coverage is based on unique checkpoints marked (not total marks from all testers)
  const { data: uniqueCheckpoints } = await supabase
    .from('session_results')
    .select('checkpoint_id')
    .eq('session_id', sessionId);

  const uniqueMarked = new Set(uniqueCheckpoints?.map(r => r.checkpoint_id) || []).size;

  return Math.round((uniqueMarked / totalCheckpoints) * 100);
}

// Get bug count for a session
async function getSessionBugCount(sessionId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from('session_results')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'bug');

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
    .from('session_results')
    .select('session_id', { count: 'exact', head: true })
    .eq('status', 'bug')
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
