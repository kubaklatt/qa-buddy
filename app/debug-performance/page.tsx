import { createClient } from "@/lib/supabase-server";
import { getAreas } from "@/lib/actions/areas";
import { getActiveSessions } from "@/lib/actions/sessions";

export default async function DebugPerformance() {
  const startTotal = Date.now();

  // Test 1: User fetch
  const startUser = Date.now();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userTime = Date.now() - startUser;

  // Test 2: Areas fetch
  const startAreas = Date.now();
  const areas = await getAreas();
  const areasTime = Date.now() - startAreas;

  // Test 3: Sessions fetch
  const startSessions = Date.now();
  const sessions = await getActiveSessions();
  const sessionsTime = Date.now() - startSessions;

  const totalTime = Date.now() - startTotal;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Performance Debug</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">User Auth</h2>
          <p className="text-2xl font-bold text-blue-600">{userTime}ms</p>
          <p className="text-sm text-muted-foreground">User ID: {user?.id?.slice(0, 8)}...</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Areas Query</h2>
          <p className="text-2xl font-bold text-blue-600">{areasTime}ms</p>
          <p className="text-sm text-muted-foreground">{areas.length} areas loaded</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Active Sessions Query</h2>
          <p className="text-2xl font-bold text-blue-600">{sessionsTime}ms</p>
          <p className="text-sm text-muted-foreground">{sessions.length} sessions loaded</p>
        </div>

        <div className="p-4 border rounded-lg bg-primary/10">
          <h2 className="font-semibold mb-2">TOTAL TIME</h2>
          <p className="text-3xl font-bold text-primary">{totalTime}ms</p>
          <p className="text-sm text-muted-foreground mt-2">
            {totalTime < 500 && "✅ Excellent!"}
            {totalTime >= 500 && totalTime < 1000 && "⚠️ Acceptable"}
            {totalTime >= 1000 && totalTime < 2000 && "🐌 Slow"}
            {totalTime >= 2000 && "🔥 Very slow - Supabase might be far away or have issues"}
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">What this shows:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>How long each database query takes</li>
          <li>If Supabase response time is the bottleneck</li>
          <li>Total server-side rendering time</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          Note: This measures server-side time only. Client-side hydration adds ~200-500ms.
        </p>
      </div>
    </div>
  );
}
