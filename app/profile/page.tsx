import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase-server";
import { ProfileForm } from "./profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>GitHub Account</CardTitle>
            <CardDescription>Your GitHub account information (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user.display_name?.charAt(0) || user.github_username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.display_name}</p>
                <p className="text-sm text-muted-foreground">@{user.github_username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Default Browsers</CardTitle>
            <CardDescription>
              Select your default browsers for testing. These will be pre-selected when you are assigned to a test session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm userId={user.id} defaultBrowsers={user.default_browsers || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
