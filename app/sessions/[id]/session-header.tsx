import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import Link from "next/link";

interface SessionHeaderProps {
  session: any;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const areas = session.session_areas?.map((sa: any) => sa.areas) || [];
  const topics = session.session_topics?.map((st: any) => st.topics) || [];
  const testers = session.session_testers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{session.name}</h1>
          <Badge
            variant={session.status === 'active' ? 'default' : 'secondary'}
            className={session.status === 'active' ? 'bg-[#6C3EC1] hover:bg-[#5A32A3]' : ''}
          >
            {session.status}
          </Badge>
        </div>
        {session.description && (
          <p className="text-muted-foreground">{session.description}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span>Created {format(new Date(session.created_at), 'PPP')}</span>
          {session.branch && (
            <>
              <span>•</span>
              <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                {session.branch}
              </code>
            </>
          )}
          {session.external_link && (
            <>
              <span>•</span>
              <Link
                href={session.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6C3EC1] hover:underline"
              >
                View in Slack →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Areas & Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Areas & Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {areas.map((area: any) => {
              const areaTopics = topics.filter((t: any) => t.area_id === area.id);
              return (
                <div key={area.id} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">
                    📂 {area.name}
                  </Badge>
                  {areaTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {areaTopics.map((topic: any) => (
                        <Badge key={topic.id} variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          📌 {topic.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Testers */}
      <Card>
        <CardHeader>
          <CardTitle>Testers</CardTitle>
          <CardDescription>Assigned testers and their browsers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testers.map((tester: any) => (
              <div key={tester.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={tester.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {(tester.users.display_name || tester.users.github_username)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {tester.users.display_name || tester.users.github_username}
                    </p>
                    <p className="text-xs text-muted-foreground">@{tester.users.github_username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tester.browsers.map((browser: string) => (
                    <Badge key={browser} variant="outline" className="text-xs">
                      {browser}
                    </Badge>
                  ))}
                  <Badge
                    variant={tester.tester_status === 'completed' ? 'default' : 'secondary'}
                    className={tester.tester_status === 'completed'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }
                  >
                    {tester.tester_status === 'completed' ? '✓ Completed' : 'In Progress'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
