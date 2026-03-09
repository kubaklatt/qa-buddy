'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSessionCheckpoint } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddCheckpointDialogProps {
  sessionId: string;
  areas: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCheckpointDialog({
  sessionId,
  areas,
  open,
  onOpenChange,
}: AddCheckpointDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [addType, setAddType] = useState<'session_only' | 'permanent'>('session_only');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a checkpoint description');
      return;
    }

    const effectiveAreaId = selectedAreaId || defaultAreaId;

    if (addType === 'permanent' && !effectiveAreaId) {
      toast.error('Please select an area for the permanent checklist');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSessionCheckpoint({
        sessionId,
        description: description.trim(),
        category: category.trim() || null,
        addToPermanent: addType === 'permanent',
        areaId: addType === 'permanent' ? effectiveAreaId : null,
      });

      const message = addType === 'permanent'
        ? 'Checkpoint added to session and permanent checklist'
        : 'Checkpoint added to this session';
      toast.success(message);

      // Reset form
      setDescription('');
      setCategory('');
      setAddType('session_only');
      setSelectedAreaId('');

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to add checkpoint');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-select first area if there's only one
  const defaultAreaId = areas.length === 1 ? areas[0].id : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Checkpoint</DialogTitle>
          <DialogDescription>
            Add a new checkpoint to test during this session. You can optionally add it to an area's permanent checklist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Checkpoint Description *</Label>
            <Textarea
              id="description"
              placeholder="e.g., Tab/Shift+Tab changes indentation by 40px"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Edge cases, Interactions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Where to add this checkpoint? *</Label>
            <RadioGroup value={addType} onValueChange={(value) => setAddType(value as 'session_only' | 'permanent')}>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="session_only" id="session_only" className="mt-0.5" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="session_only" className="cursor-pointer font-medium">
                    This session only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Checkpoint will only appear in this session
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="permanent" id="permanent" className="mt-0.5" />
                <div className="space-y-1 leading-none flex-1">
                  <Label htmlFor="permanent" className="cursor-pointer font-medium">
                    This session + add to permanent checklist
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Checkpoint will appear in this session AND be added to an area's permanent checklist
                  </p>

                  {addType === 'permanent' && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="area" className="text-xs">Select Area *</Label>
                      <Select
                        value={selectedAreaId || defaultAreaId}
                        onValueChange={setSelectedAreaId}
                        disabled={areas.length === 0}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choose area..." />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area: any) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Checkpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
