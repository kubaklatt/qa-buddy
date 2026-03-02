'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getTopics(areaId: string) {
  const supabase = await createClient();

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .eq('area_id', areaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  // Fetch checkpoint count for each topic
  const topicsWithCounts = await Promise.all(
    topics.map(async (topic) => {
      const { count } = await supabase
        .from('checkpoints')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id)
        .is('area_id', null);

      return {
        ...topic,
        checkpoint_count: count || 0,
      };
    })
  );

  return topicsWithCounts;
}

export async function getTopic(topicId: string) {
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from('topics')
    .select('*, areas(*)')
    .eq('id', topicId)
    .single();

  if (error) {
    console.error('Error fetching topic:', error);
    return null;
  }

  return topic;
}

export async function createTopic(areaId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('topics')
    .insert({
      area_id: areaId,
      name,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating topic:', error);
    throw new Error('Failed to create topic');
  }

  revalidatePath(`/areas/${areaId}`);
  return data;
}

export async function updateTopic(topicId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('topics')
    .update({
      name,
      description: description || null,
    })
    .eq('id', topicId)
    .select('*, areas(*)')
    .single();

  if (error) {
    console.error('Error updating topic:', error);
    throw new Error('Failed to update topic');
  }

  revalidatePath(`/areas/${data.areas.id}`);
  revalidatePath(`/areas/${data.areas.id}/topics/${topicId}`);
  return data;
}

export async function deleteTopic(areaId: string, topicId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) {
    console.error('Error deleting topic:', error);
    throw new Error('Failed to delete topic');
  }

  revalidatePath(`/areas/${areaId}`);
}
