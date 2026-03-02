'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getAreas() {
  const supabase = await createClient();

  // Fetch areas with counts in a single query using aggregation
  const { data: areas, error } = await supabase
    .from('areas')
    .select(`
      *,
      checkpoints:checkpoints!area_id(count),
      topics:topics(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching areas:', error);
    return [];
  }

  // Transform the data to match expected format
  const areasWithCounts = areas.map((area: any) => ({
    id: area.id,
    name: area.name,
    description: area.description,
    created_by: area.created_by,
    created_at: area.created_at,
    checkpoint_count: area.checkpoints?.[0]?.count || 0,
    topic_count: area.topics?.[0]?.count || 0,
  }));

  return areasWithCounts;
}

export async function getArea(id: string) {
  const supabase = await createClient();

  const { data: area, error } = await supabase
    .from('areas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching area:', error);
    return null;
  }

  return area;
}

export async function createArea(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('areas')
    .insert({
      name,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating area:', error);
    throw new Error('Failed to create area');
  }

  revalidatePath('/areas');
  return data;
}

export async function updateArea(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('areas')
    .update({
      name,
      description: description || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating area:', error);
    throw new Error('Failed to update area');
  }

  revalidatePath('/areas');
  revalidatePath(`/areas/${id}`);
  return data;
}

export async function deleteArea(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('areas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting area:', error);
    throw new Error('Failed to delete area');
  }

  revalidatePath('/areas');
}
