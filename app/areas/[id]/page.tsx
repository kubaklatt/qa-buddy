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
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Areas", href: "/areas" },
            { label: area.name },
          ]}
        />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{area.name}</h1>
            {area.description && (
              <p className="text-muted-foreground text-sm mt-1">{area.description}</p>
            )}
          </div>
          <EditAreaDialog area={area} />
        </div>

        <Card>
          <CardContent className="pt-6">
            <CheckpointList checkpoints={checkpoints} areaId={id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
