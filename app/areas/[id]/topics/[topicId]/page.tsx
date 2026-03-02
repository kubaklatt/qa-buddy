import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { EditTopicDialog } from "@/components/topics/edit-topic-dialog";
import { CheckpointList } from "@/components/checkpoints/checkpoint-list";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getTopic } from "@/lib/actions/topics";
import { getCheckpoints } from "@/lib/actions/checkpoints";
import { notFound } from "next/navigation";

interface TopicPageProps {
  params: Promise<{
    id: string;
    topicId: string;
  }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id, topicId } = await params;

  const [topic, checkpoints] = await Promise.all([
    getTopic(topicId),
    getCheckpoints({ topicId }),
  ]);

  if (!topic) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div>
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Areas", href: "/areas" },
            { label: topic.areas?.name || "Area", href: `/areas/${id}` },
            { label: topic.name },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{topic.name}</h1>
              {topic.description && (
                <p className="text-muted-foreground">{topic.description}</p>
              )}
            </div>
            <EditTopicDialog topic={topic} />
          </div>
        </div>

        {/* Topic-specific checklist */}
        <Card>
          <CardContent className="pt-6">
            <CheckpointList checkpoints={checkpoints} topicId={topicId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
