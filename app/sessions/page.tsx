import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getSessions } from "@/lib/actions/sessions";
import { SessionsList } from "./sessions-list";

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sessions</h1>
            <p className="text-muted-foreground">View and manage test sessions</p>
          </div>
          <Button asChild>
            <Link href="/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Link>
          </Button>
        </div>

        <SessionsList sessions={sessions} />
      </div>
    </DashboardLayout>
  );
}
