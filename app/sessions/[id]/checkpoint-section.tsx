'use client';

import { CheckpointRow } from "./checkpoint-row";

interface CheckpointSectionProps {
  section: {
    type: 'permanent' | 'session_only';
    id: string;
    name: string;
    checkpoints: any[];
  };
  sessionId: string;
  myResults: any[];
  allResults: any[];
  allBugs: any[];
  sessionTesters: any[];
  currentUserId: string;
}

export function CheckpointSection({
  section,
  sessionId,
  myResults,
  allResults,
  allBugs,
  sessionTesters,
  currentUserId,
}: CheckpointSectionProps) {
  // Group checkpoints by category
  const groupedCheckpoints = section.checkpoints.reduce((acc: any, checkpoint: any) => {
    const category = checkpoint.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(checkpoint);
    return acc;
  }, {});

  const categories = Object.keys(groupedCheckpoints);

  return (
    <div className="border-l-2 border-l-purple-200 pl-4">
      {/* Section Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {section.type === 'permanent' ? '📂' : '📝'}
          {section.name}
          {section.type === 'permanent' && <span className="text-sm font-normal text-muted-foreground">— Permanent Checklist</span>}
        </h3>
      </div>

      {/* Checkpoints by category */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            {categories.length > 1 && (
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h4>
            )}
            <div className="space-y-2">
              {groupedCheckpoints[category].map((checkpoint: any) => {
                const myResult = myResults.find((r) => r.session_checkpoint_id === checkpoint.id);
                const checkpointAllResults = allResults.filter((r) => r.session_checkpoint_id === checkpoint.id);
                const checkpointAllBugs = allBugs.filter((b) => b.session_checkpoint_id === checkpoint.id);
                const myBugs = checkpointAllBugs.filter((b) => b.user_id === currentUserId);

                return (
                  <CheckpointRow
                    key={checkpoint.id}
                    checkpoint={checkpoint}
                    sessionId={sessionId}
                    myResult={myResult}
                    myBugs={myBugs}
                    allOkResults={checkpointAllResults}
                    allBugs={checkpointAllBugs}
                    sessionTesters={sessionTesters}
                    currentUserId={currentUserId}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
