import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getSession, getSessionCheckpoints, getSessionResults } from "@/lib/actions/sessions";
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
  let results: any[] = [];
  let testerInfo = null;

  if (isAssignedTester && user) {
    checkpoints = await getSessionCheckpoints(id);
    results = await getSessionResults(id, user.id);
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

        {isAssignedTester && testerInfo && (
          <TesterView
            session={session}
            checkpoints={checkpoints}
            results={results}
            testerInfo={testerInfo}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
