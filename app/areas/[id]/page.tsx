import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditAreaDialog } from "@/components/areas/edit-area-dialog";
import { NewTopicDialog } from "@/components/topics/new-topic-dialog";
import { CheckpointList } from "@/components/checkpoints/checkpoint-list";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getArea } from "@/lib/actions/areas";
import { getTopics } from "@/lib/actions/topics";
import { getCheckpoints } from "@/lib/actions/checkpoints";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";

interface AreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { id } = await params;

  const [area, checkpoints, topics] = await Promise.all([
    getArea(id),
    getCheckpoints({ areaId: id }),
    getTopics(id),
  ]);

  if (!area) {
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
            { label: area.name },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{area.name}</h1>
              {area.description && (
                <p className="text-muted-foreground">{area.description}</p>
              )}
            </div>
            <EditAreaDialog area={area} />
          </div>
        </div>

        {/* Tabs for General Checklist and Topics */}
        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="checklist">General Checklist</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <CheckpointList checkpoints={checkpoints} areaId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Topics in this area</h3>
              <NewTopicDialog areaId={id} />
            </div>

            {topics.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No topics yet</p>
                  <NewTopicDialog areaId={id} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {topics.map((topic) => (
                  <Link key={topic.id} href={`/areas/${id}/topics/${topic.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold mb-1">{topic.name}</h4>
                            {topic.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {topic.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4" />
                              <span>{topic.checkpoint_count} checkpoints</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
