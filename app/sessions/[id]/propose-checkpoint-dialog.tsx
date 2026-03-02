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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProposedCheckpoint } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProposeCheckpointDialogProps {
  sessionId: string;
  areas: any[];
  topics: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposeCheckpointDialog({
  sessionId,
  areas,
  topics,
  open,
  onOpenChange,
}: ProposeCheckpointDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetType, setTargetType] = useState<'area' | 'topic'>('area');
  const [targetId, setTargetId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a checkpoint description');
      return;
    }

    if (!targetId) {
      toast.error('Please select a target area or topic');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProposedCheckpoint({
        sessionId,
        description: description.trim(),
        category: category.trim() || null,
        targetType,
        targetAreaId: targetType === 'area' ? targetId : null,
        targetTopicId: targetType === 'topic' ? targetId : null,
      });

      toast.success('Checkpoint proposed successfully');

      // Reset form
      setDescription('');
      setCategory('');
      setTargetId('');

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to propose checkpoint');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetOptions = targetType === 'area' ? areas : topics;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Propose New Checkpoint</DialogTitle>
          <DialogDescription>
            Suggest a checkpoint that should be added to the permanent checklist.
            Session managers will review your proposal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Checkpoint Description *</Label>
            <Textarea
              id="description"
              placeholder="e.g., Test with nested lists in RTL mode"
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

          <div className="space-y-2">
            <Label htmlFor="targetType">Add to *</Label>
            <Select
              value={targetType}
              onValueChange={(value) => {
                setTargetType(value as 'area' | 'topic');
                setTargetId(''); // Reset target selection
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area (General Checklist)</SelectItem>
                <SelectItem value="topic">Topic (Specific Checklist)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">
              {targetType === 'area' ? 'Select Area' : 'Select Topic'} *
            </Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose ${targetType}...`} />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((option: any) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
