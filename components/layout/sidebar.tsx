"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Home, FolderKanban, ClipboardList, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface SidebarProps {
  user: {
    id: string;
    display_name: string | null;
    github_username: string | null;
    avatar_url: string | null;
  } | null;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Areas & Checklists",
    href: "/areas",
    icon: FolderKanban,
  },
  {
    title: "Sessions",
    href: "/sessions",
    icon: ClipboardList,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchActiveSessionsCount = async () => {
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setActiveSessionsCount(count || 0);
    };

    fetchActiveSessionsCount();

    // Subscribe to changes in sessions
    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        () => {
          fetchActiveSessionsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - runs only once on mount

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">QA Buddy</h1>
        <p className="text-xs text-muted-foreground mt-1">CKSource QA Team</p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          const isSessionsItem = item.href === "/sessions";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
              {isSessionsItem && activeSessionsCount > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-auto h-5 px-2 text-xs",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {activeSessionsCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      {user && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.display_name?.charAt(0) || user.github_username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.display_name || user.github_username}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.github_username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
