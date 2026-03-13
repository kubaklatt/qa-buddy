import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getSession, getSessionCheckpoints, getSessionResults, getAllSessionResults, getSessionBugs } from "@/lib/actions/sessions";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SessionHeader } from "./session-header";
import { TesterView } from "./tester-view";

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    notFound();
  }

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if current user is an assigned tester
  const isAssignedTester = session.session_testers?.some(
    (tester: any) => tester.users.id === user?.id
  );

  // Get checkpoints and results if user is a tester
  let checkpoints: { permanentCheckpoints: any[]; sessionOnlyCheckpoints: any[] } = {
    permanentCheckpoints: [],
    sessionOnlyCheckpoints: []
  };
  let myResults: any[] = [];
  let allResults: any[] = [];
  let allBugs: any[] = [];
  let testerInfo = null;

  if (isAssignedTester && user) {
    [checkpoints, myResults, allResults, allBugs] = await Promise.all([
      getSessionCheckpoints(id),
      getSessionResults(id, user.id),
      getAllSessionResults(id),
      getSessionBugs(id),
    ]);
    testerInfo = session.session_testers?.find(
      (tester: any) => tester.users.id === user.id
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Sessions", href: "/sessions" },
            { label: session.name },
          ]}
        />

        <SessionHeader session={session} />

        {isAssignedTester && testerInfo && user && (
          <TesterView
            session={session}
            checkpoints={checkpoints}
            myResults={myResults}
            allResults={allResults}
            allBugs={allBugs}
            testerInfo={testerInfo}
            currentUserId={user.id}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
