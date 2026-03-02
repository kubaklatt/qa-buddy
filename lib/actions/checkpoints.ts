'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getCheckpoints(params: { areaId?: string; topicId?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('checkpoints')
    .select('*, users:created_by(id, github_username, avatar_url)')
    .order('created_at', { ascending: true });

  if (params.areaId) {
    query = query.eq('area_id', params.areaId).is('topic_id', null);
  } else if (params.topicId) {
    query = query.eq('topic_id', params.topicId).is('area_id', null);
  }

  const { data: checkpoints, error } = await query;

  if (error) {
    console.error('Error fetching checkpoints:', error);
    return [];
  }

  return checkpoints;
}

export async function createCheckpoint(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const areaId = formData.get('area_id') as string | null;
  const topicId = formData.get('topic_id') as string | null;

  const { data, error } = await supabase
    .from('checkpoints')
    .insert({
      description,
      category: category || null,
      area_id: areaId || null,
      topic_id: topicId || null,
      created_by: user.id,
    })
    .select('*, users:created_by(id, github_username, avatar_url)')
    .single();

  if (error) {
    console.error('Error creating checkpoint:', error);
    throw new Error('Failed to create checkpoint');
  }

  if (areaId) {
    revalidatePath(`/areas/${areaId}`);
  } else if (topicId) {
    // Fetch the topic to get the area_id for revalidation
    const { data: topic } = await supabase
      .from('topics')
      .select('area_id')
      .eq('id', topicId)
      .single();
    if (topic) {
      revalidatePath(`/areas/${topic.area_id}/topics/${topicId}`);
    }
  }

  return data;
}

export async function updateCheckpoint(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const description = formData.get('description') as string;
  const category = formData.get('category') as string;

  const { data, error } = await supabase
    .from('checkpoints')
    .update({
      description,
      category: category || null,
    })
    .eq('id', id)
    .select('*, users:created_by(id, github_username, avatar_url)')
    .single();

  if (error) {
    console.error('Error updating checkpoint:', error);
    throw new Error('Failed to update checkpoint');
  }

  // Revalidate the appropriate path
  if (data.area_id) {
    revalidatePath(`/areas/${data.area_id}`);
  } else if (data.topic_id) {
    const { data: topic } = await supabase
      .from('topics')
      .select('area_id')
      .eq('id', data.topic_id)
      .single();
    if (topic) {
      revalidatePath(`/areas/${topic.area_id}/topics/${data.topic_id}`);
    }
  }

  return data;
}

export async function deleteCheckpoint(id: string, areaId?: string, topicId?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('checkpoints')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting checkpoint:', error);
    throw new Error('Failed to delete checkpoint');
  }

  // Revalidate the appropriate path
  if (areaId) {
    revalidatePath(`/areas/${areaId}`);
  } else if (topicId) {
    const { data: topic } = await supabase
      .from('topics')
      .select('area_id')
      .eq('id', topicId)
      .single();
    if (topic) {
      revalidatePath(`/areas/${topic.area_id}/topics/${topicId}`);
    }
  }
}
