'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, CheckCircle } from "lucide-react";
import { CheckpointSection } from "./checkpoint-section";
import { ExplorationNotes } from "./exploration-notes";
import { ProposeCheckpointDialog } from "./propose-checkpoint-dialog";
import { useState, useMemo } from "react";
import { updateTesterStatus } from "@/lib/actions/sessions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TesterViewProps {
  session: any;
  checkpoints: {
    areaCheckpoints: any[];
    topicCheckpoints: any[];
  };
  results: any[];
  testerInfo: any;
}

export function TesterView({ session, checkpoints, results, testerInfo }: TesterViewProps) {
  const router = useRouter();
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [confirmCompleteDialogOpen, setConfirmCompleteDialogOpen] = useState(false);

  // Organize checkpoints by area and topic
  const organizedCheckpoints = useMemo(() => {
    const sections: any[] = [];
    const areas = session.session_areas?.map((sa: any) => sa.areas) || [];
    const topics = session.session_topics?.map((st: any) => st.topics) || [];

    // Add area general sections
    areas.forEach((area: any) => {
      const areaCheckpointsList = checkpoints.areaCheckpoints.filter(
        (cp: any) => cp.area_id === area.id
      );
      if (areaCheckpointsList.length > 0) {
        sections.push({
          type: 'area',
          id: area.id,
          name: area.name,
          checkpoints: areaCheckpointsList,
        });
      }
    });

    // Add topic sections
    topics.forEach((topic: any) => {
      const topicCheckpointsList = checkpoints.topicCheckpoints.filter(
        (cp: any) => cp.topic_id === topic.id
      );
      if (topicCheckpointsList.length > 0) {
        sections.push({
          type: 'topic',
          id: topic.id,
          name: topic.name,
          checkpoints: topicCheckpointsList,
        });
      }
    });

    return sections;
  }, [session, checkpoints]);

  // Calculate progress
  const totalCheckpoints = useMemo(() => {
    return organizedCheckpoints.reduce((sum, section) => sum + section.checkpoints.length, 0);
  }, [organizedCheckpoints]);

  const completedCheckpoints = useMemo(() => {
    return results.length;
  }, [results]);

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
                onClick={() => setIsProposeDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Propose Checkpoint
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
            Mark each checkpoint with its status. Grayed out items have been checked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {organizedCheckpoints.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No checkpoints found for this session
            </p>
          )}
          {organizedCheckpoints.map((section) => (
            <CheckpointSection
              key={`${section.type}-${section.id}`}
              section={section}
              sessionId={session.id}
              results={results}
            />
          ))}
        </CardContent>
      </Card>

      {/* Exploration Notes */}
      <ExplorationNotes
        sessionId={session.id}
        initialNotes={testerInfo.notes || ''}
      />

      {/* Propose Checkpoint Dialog */}
      <ProposeCheckpointDialog
        sessionId={session.id}
        areas={session.session_areas?.map((sa: any) => sa.areas) || []}
        topics={session.session_topics?.map((st: any) => st.topics) || []}
        open={isProposeDialogOpen}
        onOpenChange={setIsProposeDialogOpen}
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
