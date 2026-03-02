import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Update or create user in users table
      const { user } = data;
      const userMetadata = user.user_metadata;

      await supabase.from("users").upsert({
        id: user.id,
        github_username: userMetadata.user_name || userMetadata.preferred_username,
        display_name: userMetadata.full_name || userMetadata.name,
        avatar_url: userMetadata.avatar_url,
        default_browsers: ["Chrome"], // Default to Chrome
      });
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
