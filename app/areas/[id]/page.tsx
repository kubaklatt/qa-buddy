import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { EditAreaDialog } from "@/components/areas/edit-area-dialog";
import { CheckpointList } from "@/components/checkpoints/checkpoint-list";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getArea } from "@/lib/actions/areas";
import { getCheckpoints } from "@/lib/actions/checkpoints";
import { notFound } from "next/navigation";

interface AreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { id } = await params;

  const [area, checkpoints] = await Promise.all([
    getArea(id),
    getCheckpoints({ areaId: id }),
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

        {/* Permanent Checklist */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Permanent Checklist</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These checkpoints will be included in every session that tags this area.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <CheckpointList checkpoints={checkpoints} areaId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
