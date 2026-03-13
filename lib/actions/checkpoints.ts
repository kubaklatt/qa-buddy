'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getCheckpoints(params: { areaId?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('checkpoints')
    .select('*, users:created_by(id, github_username, avatar_url)')
    .order('created_at', { ascending: true });

  if (params.areaId) {
    query = query.eq('area_id', params.areaId);
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
  const hint = formData.get('hint') as string;
  const areaId = formData.get('area_id') as string;

  const { data, error } = await supabase
    .from('checkpoints')
    .insert({
      description,
      category: category || null,
      hint: hint || null,
      area_id: areaId,
      created_by: user.id,
    })
    .select('*, users:created_by(id, github_username, avatar_url)')
    .single();

  if (error) {
    console.error('Error creating checkpoint:', error);
    throw new Error('Failed to create checkpoint');
  }

  revalidatePath(`/areas/${areaId}`);

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
  const hint = formData.get('hint') as string;

  const { data, error } = await supabase
    .from('checkpoints')
    .update({
      description,
      category: category || null,
      hint: hint || null,
    })
    .eq('id', id)
    .select('*, users:created_by(id, github_username, avatar_url)')
    .single();

  if (error) {
    console.error('Error updating checkpoint:', error);
    throw new Error('Failed to update checkpoint');
  }

  // Revalidate the area path
  if (data.area_id) {
    revalidatePath(`/areas/${data.area_id}`);
  }

  return data;
}

export async function deleteCheckpoint(id: string, areaId: string) {
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

  // Revalidate the area path
  revalidatePath(`/areas/${areaId}`);
}
