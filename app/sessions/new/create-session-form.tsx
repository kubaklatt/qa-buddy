'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createSession, getCheckpointCounts } from '@/lib/actions/sessions';
import { AreaWithTopics, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateSessionFormProps {
  areas: AreaWithTopics[];
  users: User[];
}

const BROWSER_OPTIONS = ['Chrome', 'Firefox', 'Safari', 'Edge'];

export function CreateSessionForm({ areas, users }: CreateSessionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTesters, setSelectedTesters] = useState<Record<string, string[]>>({});
  const [checkpointCounts, setCheckpointCounts] = useState<Record<string, { general: number; topics: Record<string, number> }>>({});

  // Update checkpoint counts when areas or topics change
  useEffect(() => {
    if (selectedAreaIds.length === 0 && selectedTopicIds.length === 0) {
      setCheckpointCounts({});
      return;
    }

    const fetchCounts = async () => {
      const counts = await getCheckpointCounts(selectedAreaIds, selectedTopicIds);
      setCheckpointCounts(counts);
    };

    fetchCounts();
  }, [selectedAreaIds, selectedTopicIds]);

  const toggleArea = (areaId: string) => {
    setSelectedAreaIds((prev) => {
      if (prev.includes(areaId)) {
        // Remove area and all its topics
        const area = areas.find((a) => a.id === areaId);
        const topicIdsToRemove = area?.topics.map((t) => t.id) || [];
        setSelectedTopicIds((prevTopics) =>
          prevTopics.filter((id) => !topicIdsToRemove.includes(id))
        );
        return prev.filter((id) => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const toggleTester = (userId: string) => {
    setSelectedTesters((prev) => {
      if (prev[userId]) {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      } else {
        const user = users.find((u) => u.id === userId);
        return {
          ...prev,
          [userId]: user?.default_browsers || ['Chrome'],
        };
      }
    });
  };

  const toggleBrowser = (userId: string, browser: string) => {
    setSelectedTesters((prev) => {
      const userBrowsers = prev[userId] || [];
      const newBrowsers = userBrowsers.includes(browser)
        ? userBrowsers.filter((b) => b !== browser)
        : [...userBrowsers, browser];

      return {
        ...prev,
        [userId]: newBrowsers,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    if (selectedAreaIds.length === 0) {
      toast.error('Please select at least one area');
      return;
    }

    if (Object.keys(selectedTesters).length === 0) {
      toast.error('Please assign at least one tester');
      return;
    }

    setLoading(true);

    try {
      const session = await createSession({
        name: name.trim(),
        description: description.trim() || null,
        branch: branch.trim() || null,
        external_link: externalLink.trim() || null,
        area_ids: selectedAreaIds,
        topic_ids: selectedTopicIds,
        testers: Object.entries(selectedTesters).map(([user_id, browsers]) => ({
          user_id,
          browsers,
        })),
      });

      toast.success('Session created successfully');
      router.push(`/sessions/${session.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      setLoading(false);
    }
  };

  const getTotalCheckpoints = () => {
    let total = 0;
    Object.values(checkpointCounts).forEach((areaCounts) => {
      total += areaCounts.general;
      Object.values(areaCounts.topics).forEach((topicCount) => {
        total += topicCount;
      });
    });
    return total;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Basic information about the test session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name *</Label>
              <Input
                id="name"
                placeholder="e.g. List indentation regression testing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what needs to be tested..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="e.g. feature/list-improvements"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external-link">External Link</Label>
                <Input
                  id="external-link"
                  placeholder="Slack thread or PR URL"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Area & Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Areas & Topics</CardTitle>
            <CardDescription>
              Select areas to test and optionally specific topics within those areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {areas.length === 0 ? (
              <p className="text-muted-foreground text-sm">No areas available. Create areas first.</p>
            ) : (
              <div className="space-y-4">
                {areas.map((area) => {
                  const isAreaSelected = selectedAreaIds.includes(area.id);
                  const areaTopics = area.topics || [];
                  const selectedTopicsInArea = areaTopics.filter((t) =>
                    selectedTopicIds.includes(t.id)
                  );

                  return (
                    <div key={area.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`area-${area.id}`}
                          checked={isAreaSelected}
                          onCheckedChange={() => toggleArea(area.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Label
                              htmlFor={`area-${area.id}`}
                              className="text-base font-semibold cursor-pointer"
                            >
                              {area.name}
                            </Label>
                            {isAreaSelected && checkpointCounts[area.id] && (
                              <Badge variant="secondary" className="text-xs">
                                {checkpointCounts[area.id].general} general
                                {selectedTopicsInArea.length > 0 &&
                                  ` + ${Object.values(checkpointCounts[area.id].topics).reduce(
                                    (sum, count) => sum + count,
                                    0
                                  )} from topics`}
                              </Badge>
                            )}
                          </div>
                          {area.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {area.description}
                            </p>
                          )}

                          {/* Topics */}
                          {isAreaSelected && areaTopics.length > 0 && (
                            <div className="mt-3 pl-6 space-y-2 border-l-2 border-muted">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Optional Topics
                              </p>
                              {areaTopics.map((topic) => (
                                <div key={topic.id} className="flex items-start gap-2">
                                  <Checkbox
                                    id={`topic-${topic.id}`}
                                    checked={selectedTopicIds.includes(topic.id)}
                                    onCheckedChange={() => toggleTopic(topic.id)}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`topic-${topic.id}`}
                                      className="text-sm cursor-pointer font-normal"
                                    >
                                      {topic.name}
                                      {selectedTopicIds.includes(topic.id) &&
                                        checkpointCounts[area.id]?.topics[topic.id] && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs"
                                          >
                                            {checkpointCounts[area.id].topics[topic.id]}
                                          </Badge>
                                        )}
                                    </Label>
                                    {topic.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {topic.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {selectedAreaIds.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <p className="text-sm font-medium">Total checkpoints:</p>
                    <Badge variant="default">{getTotalCheckpoints()}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tester Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Testers</CardTitle>
            <CardDescription>
              Select testers and their browsers for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users available.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const isSelected = !!selectedTesters[user.id];
                  const selectedBrowsers = selectedTesters[user.id] || [];

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleTester(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name || user.github_username)
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Label
                          htmlFor={`user-${user.id}`}
                          className="cursor-pointer font-medium"
                        >
                          {user.display_name || user.github_username}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          @{user.github_username}
                        </p>
                      </div>

                      {/* Browser selection */}
                      {isSelected && (
                        <div className="flex gap-2">
                          {BROWSER_OPTIONS.map((browser) => (
                            <Badge
                              key={browser}
                              variant={
                                selectedBrowsers.includes(browser)
                                  ? 'default'
                                  : 'outline'
                              }
                              className="cursor-pointer"
                              onClick={() => toggleBrowser(user.id, browser)}
                            >
                              {browser}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sessions')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Session'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
