"use client";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error logging in:", error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">QA Buddy</CardTitle>
          <CardDescription>
            Internal tool for CKSource QA team to manage manual testing sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
