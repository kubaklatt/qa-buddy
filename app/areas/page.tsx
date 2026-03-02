import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewAreaDialog } from "@/components/areas/new-area-dialog";
import { AreasList } from "./areas-list";
import { getAreas } from "@/lib/actions/areas";

export default async function AreasPage() {
  const areas = await getAreas();

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Areas & Checklists</h1>
            <p className="text-muted-foreground">Manage product areas, topics, and checkpoints</p>
          </div>
          <NewAreaDialog />
        </div>

        <AreasList areas={areas} />
      </div>
    </DashboardLayout>
  );
}
