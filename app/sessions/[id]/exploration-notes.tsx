'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateTesterNotes } from "@/lib/actions/sessions";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface ExplorationNotesProps {
  sessionId: string;
  initialNotes: string;
}

export function ExplorationNotes({ sessionId, initialNotes }: ExplorationNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedNotes = useDebounce(notes, 1000);

  const saveNotes = useCallback(async (notesToSave: string) => {
    setIsSaving(true);
    try {
      await updateTesterNotes(sessionId, notesToSave);
    } catch (error) {
      toast.error('Failed to save notes');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (debouncedNotes !== initialNotes) {
      saveNotes(debouncedNotes);
    }
  }, [debouncedNotes, initialNotes, saveNotes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exploration Notes</CardTitle>
        <CardDescription>
          Free-form notes about your testing session. Auto-saves as you type.
          {isSaving && <span className="ml-2 text-purple-600">Saving...</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Document interesting findings, edge cases, or anything noteworthy during testing..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
