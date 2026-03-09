'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
    <div className="space-y-6">
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

      {/* Areas grid */}
      {filteredAreas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No areas found matching "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAreas.map((area) => (
            <Link key={area.id} href={`/areas/${area.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{area.name}</h3>
                      {area.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {area.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>{area.checkpoint_count} permanent checkpoints</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
