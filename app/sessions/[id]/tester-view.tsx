'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, CheckCircle } from "lucide-react";
import { CheckpointSection } from "./checkpoint-section";
import { ExplorationNotes } from "./exploration-notes";
import { AddCheckpointDialog } from "./add-checkpoint-dialog";
import { useState, useMemo, useEffect } from "react";
import { updateTesterStatus } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TesterViewProps {
  session: any;
  checkpoints: {
    permanentCheckpoints: any[];
    sessionOnlyCheckpoints: any[];
  };
  myResults: any[];
  allResults: any[];
  allBugs: any[];
  testerInfo: any;
  currentUserId: string;
}

export function TesterView({ session, checkpoints, myResults, allResults, allBugs, testerInfo, currentUserId }: TesterViewProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [confirmCompleteDialogOpen, setConfirmCompleteDialogOpen] = useState(false);

  // Auto-refresh every 60 seconds to pick up other testers' updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  // All testers in this session
  const sessionTesters = session.session_testers || [];

  // Organize permanent checkpoints by area
  const permanentSections = useMemo(() => {
    const sections: Array<{
      type: 'permanent';
      id: string;
      name: string;
      checkpoints: any[];
    }> = [];
    const areas = session.session_areas?.map((sa: any) => sa.areas) || [];

    areas.forEach((area: any) => {
      const areaCheckpointsList = checkpoints.permanentCheckpoints.filter(
        (cp: any) => cp.area_id === area.id
      );
      if (areaCheckpointsList.length > 0) {
        sections.push({
          type: 'permanent' as const,
          id: area.id,
          name: area.name,
          checkpoints: areaCheckpointsList,
        });
      }
    });

    return sections;
  }, [session, checkpoints.permanentCheckpoints]);

  // Session-only checkpoints
  const sessionOnlySection = useMemo(() => {
    if (checkpoints.sessionOnlyCheckpoints.length === 0) {
      return null;
    }
    return {
      type: 'session_only' as const,
      id: 'session_only',
      name: 'Session Checkpoints',
      checkpoints: checkpoints.sessionOnlyCheckpoints,
    };
  }, [checkpoints.sessionOnlyCheckpoints]);

  // Calculate my progress: checkpoints I've touched (OK or has bugs)
  const totalCheckpoints = checkpoints.permanentCheckpoints.length + checkpoints.sessionOnlyCheckpoints.length;

  const completedCheckpoints = useMemo(() => {
    const okSet = new Set(myResults.map((r: any) => r.session_checkpoint_id));
    const bugSet = new Set(allBugs.filter((b: any) => b.user_id === currentUserId).map((b: any) => b.session_checkpoint_id));
    return new Set([...okSet, ...bugSet]).size;
  }, [myResults, allBugs, currentUserId]);

  const progressPercentage = totalCheckpoints > 0
    ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
    : 0;

  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      await updateTesterStatus(session.id, 'completed');
      toast.success('Testing marked as completed');
      setConfirmCompleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const isCompleted = testerInfo.tester_status === 'completed';

  const commonSectionProps = {
    sessionId: session.id,
    myResults,
    allResults,
    allBugs,
    sessionTesters,
    currentUserId,
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Testing Progress</CardTitle>
              <CardDescription>
                {completedCheckpoints} of {totalCheckpoints} checkpoints marked
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Checkpoint
              </Button>
              {!isCompleted && (
                <Button
                  size="sm"
                  onClick={() => setConfirmCompleteDialogOpen(true)}
                  disabled={isMarkingComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as Completed
                </Button>
              )}
              {isCompleted && (
                <Button
                  size="sm"
                  disabled
                  className="bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progressPercentage}% complete</span>
              <span>{totalCheckpoints - completedCheckpoints} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
          <CardDescription>
            Mark each checkpoint OK or report bugs. Grayed out items have been checked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {permanentSections.length === 0 && !sessionOnlySection && (
            <p className="text-center text-muted-foreground py-8">
              No checkpoints found for this session
            </p>
          )}

          {/* Permanent checkpoints grouped by area */}
          {permanentSections.map((section) => (
            <CheckpointSection
              key={`permanent-${section.id}`}
              section={section}
              {...commonSectionProps}
            />
          ))}

          {/* Session-only checkpoints */}
          {sessionOnlySection && (
            <div className="pt-6 border-t">
              <CheckpointSection
                section={sessionOnlySection}
                {...commonSectionProps}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exploration Notes */}
      <ExplorationNotes
        sessionId={session.id}
        initialNotes={testerInfo.notes || ''}
      />

      {/* Add Checkpoint Dialog */}
      <AddCheckpointDialog
        sessionId={session.id}
        areas={session.session_areas?.map((sa: any) => sa.areas) || []}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        open={confirmCompleteDialogOpen}
        onOpenChange={setConfirmCompleteDialogOpen}
        onConfirm={handleMarkComplete}
        title="Mark Testing as Completed"
        description="Are you sure you want to mark your testing as completed? You can still make changes after marking as complete."
        confirmText="Mark as Completed"
      />
    </div>
  );
}
