'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Bug, SkipForward, Minus } from "lucide-react";
import { updateSessionResult } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CheckpointRowProps {
  checkpoint: any;
  sessionId: string;
  result?: any;
}

type CheckpointStatus = 'passed' | 'bug' | 'skipped' | 'not_applicable' | null;

export function CheckpointRow({ checkpoint, sessionId, result }: CheckpointRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<CheckpointStatus>(result?.status || null);
  const [bugLink, setBugLink] = useState(result?.bug_link || '');
  const [bugDescription, setBugDescription] = useState(result?.bug_description || '');
  const [isSavingBug, setIsSavingBug] = useState(false);

  const handleStatusClick = async (newStatus: CheckpointStatus) => {
    if (!newStatus) return;

    // Optimistic update
    setStatus(newStatus);

    try {
      await updateSessionResult({
        sessionId,
        checkpointId: checkpoint.id,
        status: newStatus,
        bugLink: newStatus === 'bug' ? bugLink : null,
        bugDescription: newStatus === 'bug' ? bugDescription : null,
      });

      startTransition(() => {
        router.refresh();
      });

      // Clear bug details if not bug status
      if (newStatus !== 'bug') {
        setBugLink('');
        setBugDescription('');
      }
    } catch (error) {
      // Revert on error
      setStatus(result?.status || null);
      toast.error('Failed to update checkpoint');
      console.error(error);
    }
  };

  const handleSaveBugDetails = async () => {
    if (status !== 'bug') return;

    setIsSavingBug(true);
    try {
      await updateSessionResult({
        sessionId,
        checkpointId: checkpoint.id,
        status: 'bug',
        bugLink,
        bugDescription,
      });

      toast.success('Bug details saved');
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error('Failed to save bug details');
      console.error(error);
    } finally {
      setIsSavingBug(false);
    }
  };

  const isMarked = status !== null;

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        isMarked ? "bg-muted/30 opacity-60" : "bg-white hover:border-purple-300"
      )}
    >
      {/* Checkpoint Description */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className={cn("text-sm flex-1", isMarked && "line-through text-muted-foreground")}>
          {checkpoint.description}
        </p>
        {checkpoint.category && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded shrink-0">
            {checkpoint.category}
          </span>
        )}
      </div>

      {/* Status Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={status === 'passed' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('passed')}
          disabled={isPending}
          className={cn(
            "text-xs h-7",
            status === 'passed' && "bg-green-600 hover:bg-green-700 border-green-600"
          )}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          OK
        </Button>
        <Button
          size="sm"
          variant={status === 'bug' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('bug')}
          disabled={isPending}
          className={cn(
            "text-xs h-7",
            status === 'bug' && "bg-red-600 hover:bg-red-700 border-red-600"
          )}
        >
          <Bug className="h-3 w-3 mr-1" />
          Bug
        </Button>
        <Button
          size="sm"
          variant={status === 'skipped' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('skipped')}
          disabled={isPending}
          className={cn(
            "text-xs h-7",
            status === 'skipped' && "bg-amber-600 hover:bg-amber-700 border-amber-600"
          )}
        >
          <SkipForward className="h-3 w-3 mr-1" />
          Skip
        </Button>
        <Button
          size="sm"
          variant={status === 'not_applicable' ? 'default' : 'outline'}
          onClick={() => handleStatusClick('not_applicable')}
          disabled={isPending}
          className={cn(
            "text-xs h-7",
            status === 'not_applicable' && "bg-gray-600 hover:bg-gray-700 border-gray-600"
          )}
        >
          <Minus className="h-3 w-3 mr-1" />
          N/A
        </Button>
      </div>

      {/* Bug Details (expanded when Bug is selected) */}
      {status === 'bug' && (
        <div className="mt-3 space-y-2 pt-3 border-t">
          <div>
            <label className="text-xs font-medium mb-1 block">Bug Link (GitHub Issue URL)</label>
            <Input
              placeholder="https://github.com/..."
              value={bugLink}
              onChange={(e) => setBugLink(e.target.value)}
              onBlur={handleSaveBugDetails}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Bug Description</label>
            <Textarea
              placeholder="Brief description of the bug..."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              onBlur={handleSaveBugDetails}
              className="text-sm min-h-[60px]"
            />
          </div>
          {isSavingBug && (
            <p className="text-xs text-muted-foreground">Saving...</p>
          )}
        </div>
      )}
    </div>
  );
}
