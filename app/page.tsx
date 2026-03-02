import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getActiveSessions, getRecentCompletedSessions, getDashboardStats } from "@/lib/actions/sessions";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Plus, Users, Bug, TrendingUp } from "lucide-react";

export default async function Home() {
  const [activeSessions, recentSessions, stats] = await Promise.all([
    getActiveSessions(),
    getRecentCompletedSessions(5),
    getDashboardStats(),
  ]);

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to QA Buddy</p>
          </div>
          <Link href="/sessions/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sessions This Month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.sessionsThisMonth}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Bugs Found This Month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.bugsThisMonth}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Most Active Areas</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.mostActiveAreas.length > 0 ? (
                <div className="space-y-1">
                  {stats.mostActiveAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{area.name}</span>
                      <span className="text-muted-foreground">{area.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sessions yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Currently running test sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No active sessions. Create your first session to get started!
                </p>
                <Link href="/sessions/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session: any) => {
                  const areas = session.session_areas?.map((sa: any) => sa.areas) || [];
                  const testers = session.session_testers || [];
                  const isCurrentUserAssigned = testers.some((t: any) => t.user_id === user?.id);

                  return (
                    <Link key={session.id} href={`/sessions/${session.id}`}>
                      <div
                        className={`p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                          isCurrentUserAssigned ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{session.name}</h3>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {areas.map((area: any) => (
                                <Badge key={area.id} variant="secondary">
                                  {area.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{testers.length} testers</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {testers.filter((t: any) => t.tester_status === 'completed').length} / {testers.length} completed
                              </span>
                            </div>
                          </div>
                        </div>

                        {isCurrentUserAssigned && (
                          <div className="mt-2">
                            <Badge variant="default" className="text-xs">
                              Assigned to you
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed Sessions</CardTitle>
            <CardDescription>Last 5 completed test sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No completed sessions yet. Sessions will appear here once completed.
                </p>
                <Link href="/sessions">
                  <Button variant="outline">View All Sessions</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session: any) => {
                  const areas = session.session_areas?.map((sa: any) => sa.areas) || [];
                  const completedDate = new Date(session.completed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <Link key={session.id} href={`/sessions/${session.id}`}>
                      <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1">{session.name}</h3>
                            <div className="flex flex-wrap gap-1 mb-1">
                              {areas.map((area: any) => (
                                <Badge key={area.id} variant="outline" className="text-xs">
                                  {area.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {completedDate}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
