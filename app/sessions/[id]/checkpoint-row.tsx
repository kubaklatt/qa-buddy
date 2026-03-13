'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Bug, SkipForward, Plus, Trash2, X } from "lucide-react";
import {
  markCheckpointOk,
  unmarkCheckpointOk,
  skipCheckpoint,
  unskipCheckpoint,
  addBug,
  deleteBug,
} from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BugEntry {
  id: string;
  description: string;
  link: string | null;
  user_id: string;
  users?: { id: string; github_username: string; display_name: string | null; avatar_url: string };
}

interface CheckpointRowProps {
  checkpoint: {
    id: string;
    description: string;
    category: string | null;
    skipped_by: string | null;
    skipped_at: string | null;
    skipped_by_user: { id: string; github_username: string; display_name: string | null; avatar_url: string } | null;
  };
  sessionId: string;
  myResult?: { id: string; status: string } | null;
  myBugs: BugEntry[];
  allOkResults: { session_checkpoint_id: string; user_id: string }[];
  allBugs: BugEntry[];
  sessionTesters: {
    users: { id: string; github_username: string; display_name: string | null; avatar_url: string };
    browsers: string[];
  }[];
  currentUserId: string;
}

export function CheckpointRow({
  checkpoint,
  sessionId,
  myResult,
  myBugs,
  allOkResults,
  allBugs,
  sessionTesters,
  currentUserId,
}: CheckpointRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugLink, setBugLink] = useState('');
  const [isSavingBug, setIsSavingBug] = useState(false);

  const isSkipped = !!checkpoint.skipped_by;
  const isOk = !!myResult;
  const hasBugs = myBugs.length > 0;
  const isTouched = isOk || hasBugs;

  // Other testers (excluding current user)
  const otherTesters = sessionTesters.filter((t) => t.users.id !== currentUserId);

  const refresh = () => startTransition(() => router.refresh());

  const handleToggleOk = async () => {
    try {
      if (isOk) {
        await unmarkCheckpointOk(sessionId, checkpoint.id);
      } else {
        await markCheckpointOk(sessionId, checkpoint.id);
      }
      refresh();
    } catch {
      toast.error('Failed to update checkpoint');
    }
  };

  const handleSkip = async () => {
    try {
      await skipCheckpoint(sessionId, checkpoint.id);
      refresh();
    } catch {
      toast.error('Failed to skip checkpoint');
    }
  };

  const handleUnskip = async () => {
    try {
      await unskipCheckpoint(sessionId, checkpoint.id);
      refresh();
    } catch {
      toast.error('Failed to undo skip');
    }
  };

  const handleAddBug = async () => {
    if (!bugDescription.trim()) {
      toast.error('Bug description is required');
      return;
    }
    setIsSavingBug(true);
    try {
      await addBug({
        sessionId,
        sessionCheckpointId: checkpoint.id,
        description: bugDescription.trim(),
        link: bugLink.trim() || null,
      });
      setBugDescription('');
      setBugLink('');
      setShowBugForm(false);
      refresh();
    } catch {
      toast.error('Failed to add bug');
    } finally {
      setIsSavingBug(false);
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    try {
      await deleteBug(bugId, sessionId);
      refresh();
    } catch {
      toast.error('Failed to delete bug');
    }
  };

  const getOtherTesterStatus = (testerId: string) => {
    const hasOk = allOkResults.some((r) => r.user_id === testerId);
    const testerBugs = allBugs.filter((b) => b.user_id === testerId);
    if (hasOk) return { type: 'ok' as const };
    if (testerBugs.length > 0) return { type: 'bug' as const, count: testerBugs.length };
    return { type: 'none' as const };
  };

  const getInitials = (user: { github_username: string; display_name: string | null }) => {
    const name = user.display_name || user.github_username;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        isTouched ? "bg-muted/30 opacity-70" : "bg-white hover:border-purple-300",
        isSkipped && "opacity-50"
      )}
    >
      {/* Description */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className={cn("text-sm flex-1", isTouched && "line-through text-muted-foreground")}>
          {checkpoint.description}
        </p>
        {checkpoint.category && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded shrink-0">
            {checkpoint.category}
          </span>
        )}
      </div>

      {/* Global skip banner */}
      {isSkipped && checkpoint.skipped_by_user && (
        <div className="flex items-center justify-between mb-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <span>
            <SkipForward className="h-3 w-3 inline mr-1" />
            Skipped by {checkpoint.skipped_by_user.display_name || checkpoint.skipped_by_user.github_username}
          </span>
          <button
            onClick={handleUnskip}
            disabled={isPending}
            className="text-amber-600 hover:text-amber-800 underline ml-2"
          >
            Undo
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={isOk ? 'default' : 'outline'}
          onClick={handleToggleOk}
          disabled={isPending}
          className={cn(
            "text-xs h-7",
            isOk && "bg-green-600 hover:bg-green-700 border-green-600"
          )}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          OK
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowBugForm((v) => !v)}
          disabled={isPending}
          className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Bug
        </Button>

        {!isSkipped && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkip}
            disabled={isPending}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-3 w-3 mr-1" />
            Skip
          </Button>
        )}
      </div>

      {/* Inline Add Bug form */}
      {showBugForm && (
        <div className="mt-3 space-y-2 pt-3 border-t border-dashed border-red-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-red-600">Report Bug</span>
            <button onClick={() => setShowBugForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          <Textarea
            placeholder="Describe the bug..."
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            className="text-sm min-h-[60px]"
            autoFocus
          />
          <Input
            placeholder="Bug link (GitHub issue, optional)"
            value={bugLink}
            onChange={(e) => setBugLink(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddBug}
              disabled={isSavingBug || !bugDescription.trim()}
              className="bg-red-600 hover:bg-red-700 text-xs h-7"
            >
              <Bug className="h-3 w-3 mr-1" />
              {isSavingBug ? 'Saving...' : 'Save Bug'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowBugForm(false); setBugDescription(''); setBugLink(''); }}
              className="text-xs h-7"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* My bugs list */}
      {myBugs.length > 0 && (
        <div className="mt-3 space-y-1 pt-3 border-t">
          {myBugs.map((bug) => (
            <div key={bug.id} className="flex items-start gap-2 text-xs bg-red-50 border border-red-100 rounded px-2 py-1.5">
              <Bug className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-800">{bug.description}</p>
                {bug.link && (
                  <a
                    href={bug.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block"
                  >
                    {bug.link}
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDeleteBug(bug.id)}
                disabled={isPending}
                className="text-red-300 hover:text-red-500 shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Other testers' statuses */}
      {otherTesters.length > 0 && (
        <div className="mt-3 pt-2 border-t flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Others:</span>
          {otherTesters.map((tester) => {
            const status = getOtherTesterStatus(tester.users.id);
            return (
              <div key={tester.users.id} className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={tester.users.avatar_url} />
                  <AvatarFallback className="text-[8px]">{getInitials(tester.users)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {tester.users.display_name || tester.users.github_username}
                </span>
                {status.type === 'ok' && <span className="text-green-600 text-xs">✓</span>}
                {status.type === 'bug' && <span className="text-red-500 text-xs">🐛×{status.count}</span>}
                {status.type === 'none' && <span className="text-gray-300 text-xs">—</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
