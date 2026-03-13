import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveSessions, getRecentCompletedSessions, getDashboardStats } from "@/lib/actions/sessions";
import Link from "next/link";
import { Plus, ExternalLink, Bug, TrendingUp } from "lucide-react";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function Home() {
  const [activeSessions, recentSessions, stats] = await Promise.all([
    getActiveSessions(),
    getRecentCompletedSessions(5),
    getDashboardStats(),
  ]);

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/sessions/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </Link>
        </div>

        {/* Active Sessions */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Active Sessions
              {activeSessions.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-xs text-primary-foreground font-medium">
                  {activeSessions.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">No active sessions.</p>
                <Link href="/sessions/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSessions.map((session: any) => {
                  const testers = session.session_testers || [];
                  const completedCount = testers.filter((t: any) => t.tester_status === 'completed').length;

                  return (
                    <Link key={session.id} href={`/sessions/${session.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{session.name}</span>
                              {session.external_link && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            {session.branch && (
                              <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                {session.branch}
                              </code>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="flex -space-x-1.5">
                            {testers.slice(0, 4).map((t: any) => (
                              t.users?.avatar_url ? (
                                <img
                                  key={t.id}
                                  src={t.users.avatar_url}
                                  alt={t.users.github_username}
                                  className="w-6 h-6 rounded-full border-2 border-background"
                                  title={t.users.github_username}
                                />
                              ) : (
                                <div
                                  key={t.id}
                                  className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
                                  title={t.users?.github_username}
                                >
                                  {t.users?.github_username?.[0]?.toUpperCase()}
                                </div>
                              )
                            ))}
                            {testers.length > 4 && (
                              <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{testers.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {completedCount}/{testers.length} done
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

        {/* Recently Completed Sessions */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No completed sessions yet.</p>
            ) : (
              <div className="divide-y">
                {recentSessions.map((session: any) => (
                  <Link key={session.id} href={`/sessions/${session.id}`}>
                    <div className="flex items-center justify-between py-2 hover:text-foreground text-sm transition-colors">
                      <span className="text-muted-foreground hover:text-foreground truncate">{session.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatRelativeDate(session.completed_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="flex gap-6 px-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span><strong className="text-foreground">{stats.sessionsThisMonth}</strong> sessions this month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bug className="h-3.5 w-3.5" />
            <span><strong className="text-foreground">{stats.bugsThisMonth}</strong> bugs this month</span>
          </div>
          {stats.mostActiveAreas[0] && (
            <div className="flex items-center gap-1.5">
              <span>Top area: <strong className="text-foreground">{stats.mostActiveAreas[0].name}</strong></span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
