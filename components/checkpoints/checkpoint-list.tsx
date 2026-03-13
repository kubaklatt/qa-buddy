'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCheckpoint, updateCheckpoint, deleteCheckpoint } from '@/lib/actions/checkpoints';
import { toast } from 'sonner';
import type { CheckpointWithUser } from '@/lib/types';

interface CheckpointListProps {
  checkpoints: CheckpointWithUser[];
  areaId: string;
}

export function CheckpointList({ checkpoints, areaId }: CheckpointListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<CheckpointWithUser | null>(null);
  const [deletingCheckpointId, setDeletingCheckpointId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const toggleHint = (id: string) => {
    setExpandedHints(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('area_id', areaId);

    try {
      await createCheckpoint(formData);
      toast.success('Checkpoint added successfully');
      setAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add checkpoint');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCheckpoint) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await updateCheckpoint(editingCheckpoint.id, formData);
      toast.success('Checkpoint updated successfully');
      setEditDialogOpen(false);
      setEditingCheckpoint(null);
    } catch (error) {
      toast.error('Failed to update checkpoint');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCheckpointId) return;

    try {
      await deleteCheckpoint(deletingCheckpointId, areaId);
      toast.success('Checkpoint deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingCheckpointId(null);
    } catch (error) {
      toast.error('Failed to delete checkpoint');
      console.error(error);
    }
  };

  // Group checkpoints by category
  const grouped = checkpoints.reduce((acc, checkpoint) => {
    const category = checkpoint.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(checkpoint);
    return acc;
  }, {} as Record<string, CheckpointWithUser[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Checkpoints</h3>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Checkpoint
        </Button>
      </div>

      {checkpoints.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No checkpoints yet</p>
          <Button variant="link" onClick={() => setAddDialogOpen(true)}>
            Add your first checkpoint
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
              <div className="space-y-2">
                {items.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {checkpoint.hint && (
                          <button
                            onClick={() => toggleHint(checkpoint.id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            {expandedHints.has(checkpoint.id)
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                        )}
                        {!checkpoint.hint && <span className="w-4 flex-shrink-0" />}
                        <p className="text-sm">{checkpoint.description}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCheckpoint(checkpoint);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingCheckpointId(checkpoint.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {checkpoint.hint && expandedHints.has(checkpoint.id) && (
                      <div className="px-9 pb-3 text-sm text-muted-foreground bg-muted/30 border-t">
                        <p className="pt-2">{checkpoint.hint}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add Checkpoint</DialogTitle>
              <DialogDescription>
                Add a new checkpoint to this checklist
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g. RTL support, Paste from Word"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Paste, Edge cases, Interactions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hint">Hint (optional)</Label>
                <Input
                  id="hint"
                  name="hint"
                  placeholder="e.g. Check table formatting, merged cells, header styles"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Checkpoint'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Checkpoint</DialogTitle>
              <DialogDescription>
                Update the checkpoint description and category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingCheckpoint?.description}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category (optional)</Label>
                <Input
                  id="edit-category"
                  name="category"
                  defaultValue={editingCheckpoint?.category || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hint">Hint (optional)</Label>
                <Input
                  id="edit-hint"
                  name="hint"
                  defaultValue={editingCheckpoint?.hint || ''}
                  placeholder="e.g. Check table formatting, merged cells, header styles"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Checkpoint"
        description="Are you sure you want to delete this checkpoint? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
