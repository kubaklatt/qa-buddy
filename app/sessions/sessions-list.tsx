'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SessionWithRelations } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface SessionsListProps {
  sessions: SessionWithRelations[];
}

type StatusFilter = 'all' | 'active' | 'completed';

export function SessionsList({ sessions }: SessionsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.branch?.toLowerCase().includes(query) ||
          s.session_areas?.some((sa) =>
            sa.areas.name.toLowerCase().includes(query)
          )
      );
    }

    return filtered;
  }, [sessions, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search sessions by name, description, branch, or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All ({sessions.length})
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('active')}
        >
          Active ({sessions.filter((s) => s.status === 'active').length})
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Completed ({sessions.filter((s) => s.status === 'completed').length})
        </Button>
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {searchQuery.trim()
                ? `No sessions found matching "${searchQuery}"`
                : statusFilter === 'all'
                ? 'No sessions found. Create your first session to get started.'
                : `No ${statusFilter} sessions found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const areas = session.session_areas?.map((sa) => sa.areas) || [];
            const testers = session.session_testers || [];
            const testerCount = testers.length;

            return (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{session.name}</CardTitle>
                          <Badge
                            variant={session.status === 'active' ? 'default' : 'secondary'}
                          >
                            {session.status}
                          </Badge>
                        </div>
                        {session.description && (
                          <CardDescription className="mt-1">
                            {session.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {/* Areas */}
                        <div className="flex items-center gap-1.5">
                          {areas.length > 0 ? (
                            areas.map((area) => (
                              <Badge key={area.id} variant="outline" className="text-xs">
                                {area.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No areas</span>
                          )}
                        </div>

                        {/* Branch */}
                        {session.branch && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Branch:</span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {session.branch}
                            </code>
                          </div>
                        )}

                        {/* Testers */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Testers:</span>
                          <div className="flex items-center -space-x-2">
                            {testers.slice(0, 3).map((tester) => (
                              <Avatar key={tester.id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={tester.users.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(
                                    tester.users.display_name || tester.users.github_username
                                  )
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {testerCount > 3 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                +{testerCount - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
