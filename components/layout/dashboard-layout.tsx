import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "./sidebar";
import { cache } from "react";

// Cache user data to avoid refetching on every navigation
const getCachedUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("id, github_username, display_name, avatar_url")
    .eq("id", authUser.id)
    .single();

  return data;
});

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
