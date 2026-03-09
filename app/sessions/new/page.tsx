import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CreateSessionForm } from "./create-session-form";
import { getAllAreas, getAllUsers } from "@/lib/actions/sessions";

export default async function NewSessionPage() {
  const [areas, users] = await Promise.all([
    getAllAreas(),
    getAllUsers(),
  ]);

  return (
    <DashboardLayout>
      <div>
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Sessions", href: "/sessions" },
            { label: "New Session" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create New Session</h1>
          <p className="text-muted-foreground">Set up a new manual testing session</p>
        </div>

        <CreateSessionForm areas={areas} users={users} />
      </div>
    </DashboardLayout>
  );
}
