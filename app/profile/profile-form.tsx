"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

interface ProfileFormProps {
  userId: string;
  defaultBrowsers: string[];
}

const BROWSERS = [
  { id: "chrome", label: "Chrome" },
  { id: "firefox", label: "Firefox" },
  { id: "safari", label: "Safari" },
  { id: "edge", label: "Edge" },
  { id: "ios-safari", label: "iOS Safari" },
  { id: "android-chrome", label: "Android Chrome" },
];

export function ProfileForm({ userId, defaultBrowsers }: ProfileFormProps) {
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(defaultBrowsers);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleBrowserToggle = (browserId: string) => {
    setSelectedBrowsers((prev) =>
      prev.includes(browserId)
        ? prev.filter((id) => id !== browserId)
        : [...prev, browserId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({ default_browsers: selectedBrowsers })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {BROWSERS.map((browser) => (
          <div key={browser.id} className="flex items-center space-x-2">
            <Checkbox
              id={browser.id}
              checked={selectedBrowsers.includes(browser.id)}
              onCheckedChange={() => handleBrowserToggle(browser.id)}
            />
            <Label
              htmlFor={browser.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {browser.label}
            </Label>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
