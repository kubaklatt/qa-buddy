'use client';

import { CheckpointRow } from "./checkpoint-row";

interface CheckpointSectionProps {
  section: {
    type: 'area' | 'topic';
    id: string;
    name: string;
    checkpoints: any[];
  };
  sessionId: string;
  results: any[];
}

export function CheckpointSection({ section, sessionId, results }: CheckpointSectionProps) {
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
          {section.type === 'area' ? '📂' : '📌'}
          {section.name}
          {section.type === 'area' && <span className="text-sm font-normal text-muted-foreground">— General</span>}
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
                const result = results.find((r) => r.checkpoint_id === checkpoint.id);
                return (
                  <CheckpointRow
                    key={checkpoint.id}
                    checkpoint={checkpoint}
                    sessionId={sessionId}
                    result={result}
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
