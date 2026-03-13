'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Area {
  id: string;
  name: string;
  description: string | null;
  checkpoint_count: number;
}

interface AreasListProps {
  areas: Area[];
}

export function AreasList({ areas }: AreasListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;

    const query = searchQuery.toLowerCase();
    return areas.filter((area) =>
      area.name.toLowerCase().includes(query) ||
      area.description?.toLowerCase().includes(query)
    );
  }, [areas, searchQuery]);

  if (areas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>No areas have been created yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Create your first area to start organizing your test checklists
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search areas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Areas list */}
      {filteredAreas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No areas found matching &quot;{searchQuery}&quot;
        </p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredAreas.map((area) => (
                <Link key={area.id} href={`/areas/${area.id}`}>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{area.name}</span>
                      {area.description && (
                        <span className="text-muted-foreground text-sm ml-3 truncate">
                          {area.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-4">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{area.checkpoint_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
