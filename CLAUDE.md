# QA Buddy

## Project Overview

QA Buddy is an internal tool for the CKSource QA team (13 people) to manage manual testing sessions.
The team tests CKEditor 5 and related products (Drupal integration, AI features, etc.).

Currently, testing requests come via Slack from developers. Testers do exploratory testing
and report bugs on GitHub/Slack. There is no structured way to track what was tested,
by whom, and what was missed. This tool solves that by providing:

- **Living checklists** that grow organically over time as testers discover new scenarios
- **Test sessions** where testers mark what they checked, found bugs, and wrote notes
- **A dashboard** for session managers to see coverage gaps
- **Searchable history** of past sessions for regression investigation

The tool must be lightweight and non-invasive — it supports the existing exploratory
testing workflow, it does NOT replace it with formal test cases.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with GitHub OAuth provider
- **Styling:** Tailwind CSS + shadcn/ui components
- **Hosting:** Vercel

## Design System & UI Guidelines

### Style
- **Theme:** Light mode only
- **Style:** GitHub/Linear-inspired — compact, functional, dev-friendly, but with CKEditor brand personality
- **Typography:** System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", etc.)

### Color Palette (inspired by CKEditor 5 branding)
- **Primary / Accent:** Deep purple-indigo (~#6C3EC1 or similar) — used for primary buttons, active states, links
- **Secondary accent:** Teal/turquoise (~#00C4B4) — used for success states, secondary highlights
- **Background:** White (#FFFFFF) with very light gray sections (#F8F9FA) for contrast
- **Text:** Dark charcoal (#1A1A2E) for headings, (#4A4A68) for body text
- **Borders:** Subtle light gray (#E5E7EB)
- **Status colors:** Green (#22C55E) for passed/OK, Red (#EF4444) for bugs, Amber (#F59E0B) for warnings/uncovered, Gray (#9CA3AF) for skipped/N/A
- **Cards and sections:** White with subtle border and very light shadow, rounded corners (border-radius ~8px)

Configure the shadcn/ui theme to use the deep purple as the primary color (--primary HSL value).

### Principles
- Clean, minimal, no unnecessary decoration
- Compact information density — avoid wasted whitespace, but give elements room to breathe
- Use shadcn/ui components: Card, Button, Badge, Dialog, Select, Checkbox, Tabs, DropdownMenu, Sheet, Table
- Status badges: green for OK/passed, red for bug, amber/yellow for uncovered/warning, gray for skipped, muted for N/A
- Sidebar navigation on the left (collapsible), with deep purple/indigo background or white with purple accents
- Tables and lists should feel like GitHub Issues — scannable, with subtle row borders
- Primary buttons: filled deep purple. Secondary buttons: outlined or ghost style
- Interactive elements should have clear hover states
- Use icons sparingly — lucide-react icons where helpful (Bug, CheckCircle, SkipForward, Minus, Plus, etc.)
- Rounded, modern feel — consistent with CKEditor 5 landing page aesthetic

## Permissions

- No roles or permission system. Everyone can do everything (create sessions, edit checklists, add checkpoints, complete sessions).
- The team operates on trust.

## Data Model

### Users
- Authenticated via GitHub OAuth
- Fields: id, github_username, display_name, avatar_url

### Areas (product domains)
- Represent broad product areas like "Lists", "Tables", "Paste from Office", "Track Changes", "AI", "Drupal"
- Fields: id, name, description, created_at
- Each area has a **permanent checklist** — checkpoints that get pulled into EVERY session tagging this area
- This is a flat structure. There are NO nested topics/themes within areas.

### Checkpoints (checklist items)
Two types of checkpoints exist:

**Permanent checkpoints** — belong to an Area's permanent checklist.
- These are reusable and get pulled (as a snapshot) into every session that tags the area.
- They represent things worth checking every time this area is touched (e.g. "RTL support", "Track Changes interaction", "Paste from Word").
- Fields: id, area_id (FK), description, category (optional grouping label), created_by, created_at
- A checkpoint is a short reminder/scenario, NOT a formal step-by-step test case.
- Can optionally have a category for grouping (e.g. "Paste", "Edge cases", "Interactions").

**Session-only checkpoints** — created by testers during a session.
- They live only in that session and are NOT part of any area's permanent checklist.
- They represent scenario-specific things for this particular testing (e.g. "Tab/Shift+Tab changes indentation by 40px").
- After the session is completed, they remain visible in the session history but don't appear in future sessions automatically.
- Fields: id, session_id (FK), description, category (optional), created_by, created_at

**Promoting session-only to permanent:** When adding a checkpoint during a session, the tester has a simple choice:
- "This session only" — lives only in current session
- "This session + add to {Area} permanent checklist" — lives in current session AND becomes a permanent checkpoint for the area

### Sessions (test sessions)
- Fields: id, name, description, branch, external_link (Slack/PR URL), status (active/completed), created_by, created_at, completed_at
- Many-to-many with areas (session_areas)
- Each session = one specific testing topic/request. Do NOT combine multiple unrelated topics in one session.
- When a session is created, the permanent checkpoints from selected areas are **snapshotted** — copied into the session. Changes to area checklists after session creation do not affect existing sessions.
- Exception: new checkpoints added by testers DURING the session do appear for everyone in that session.
- When a session is marked as "completed", it is **frozen** — no further edits allowed, read-only.

### Session Testers (assignment)
- Fields: id, session_id, user_id, browsers (array), tester_status (in_progress/completed), notes (free text exploration notes)
- Any user can join a session (self-assign), not just people assigned at creation.
- When creating a session, the creator assigns testers and their browsers.

### Session Results (checkpoint outcomes per tester)
- Fields: id, session_id, checkpoint_id, user_id, status (passed/bug/skipped/not_applicable), bug_link (optional URL), bug_description (optional short text), created_at, updated_at
- Each tester independently marks each checkpoint (both permanent and session-only).
- Each tester marks checkpoints once (not per browser). Their assigned browsers are visible, so it's understood they tested on those browsers.
- Show who marked each checkpoint (avatar/name next to the status).

## Key Pages / Views

### 1. Dashboard (/)
- Overview: active sessions, recent sessions, quick stats
- Quick access to create new session

### 2. Areas & Checklists (/areas)
- List of all areas
- Click into area → see its permanent checklist
- CRUD for areas and checkpoints

### 3. Area Detail (/areas/[id])
- Area name + description (editable)
- Permanent checklist — list of checkpoints grouped by category (if category exists)
- Each checkpoint shows: description, category badge (if any), created by (avatar), date
- "Add Checkpoint" button
- Checkpoints can be edited and deleted

### 4. Create Session (/sessions/new)
- Form: name, description, branch, external link
- Select areas (multi-select) → shows preview of how many permanent checkpoints will be loaded
- Assign testers from user list → for each tester, select browsers (pre-filled from previous sessions if possible)

### 5. Session View (/sessions/[id])
Two tabs: "My Testing" and "Dashboard"

Any user can join the session ("Join Session" button if not yet assigned, with browser selection).

**Session header (visible on both tabs):**
- Session name, branch (monospace badge), external link, status badge
- List of assigned testers with their browsers and status (in_progress / completed)

**My Testing tab (tester view):**
1. Permanent checkpoints (snapshotted from area checklists), grouped by area:
   - "📂 {Area name}" with its checkpoints
   - Each checkpoint row: description, category badge, status buttons (✅ OK | 🐛 Bug | ⏭️ Skip | ➖ N/A), who marked it (avatar)
   - When "Bug" is selected → expand inline: bug_link input + bug_description input
   - Gray out / mute checkpoints already marked (so unchecked ones stand out)
2. Session-only checkpoints section:
   - Separate section below permanent checkpoints
   - Same UI as above (status buttons, bug fields)
   - These were added during this session by any tester
3. Exploration notes:
   - Large textarea for free-form notes
   - Auto-saves (debounced) or has a save button
4. "Add Checkpoint" button:
   - Dialog: description, optional category
   - Choice: "This session only" or "This session + add to {Area} permanent checklist"
   - No approval needed — immediately visible to all testers in the session
5. "Mark as Completed" button with confirmation dialog
6. Progress indicator: "X/Y checkpoints marked"

Checklist state saves immediately on each status click (optimistic updates).

**Dashboard tab (overview):**
1. Coverage Overview: X/Y checkpoints covered (progress bar), per-area breakdown, color-coded (green/red/gray)
2. Per-Tester Breakdown: table with Tester | Browser | Status | Checked | Bugs Found (expandable rows)
3. Uncovered Checkpoints: list of checkpoints no tester has marked, highlighted in warning style
4. Bugs Found: compact table with checkpoint description, bug description, bug link, reported by
5. Complete Session: button to freeze the session (warning if not all testers are done)

### 6. Session History (/sessions)
- List of all sessions (filterable by area, status, date)
- Click into completed session → read-only view with all results

### 7. Profile (/profile)
- GitHub info (read-only)
- Default browsers setting

## Phase 2 Features (NOT for initial build)

### Session Suggestions Panel
When a session is created with an area (e.g. "Lists"), the app looks at past completed sessions that also tagged "Lists". If those past sessions had session-only checkpoints, it displays them as suggestions.

UI: A collapsible panel/section in the session view showing:
- List of past sessions for the same area(s), with their session-only checkpoints
- Each past session is expandable — click to see its session-only checkpoints
- Each checkpoint has an "Add to this session" button
- Clicking it copies the checkpoint into the current session as a session-only checkpoint
- Does NOT add it to the permanent checklist

This feature only makes sense once there's history of past sessions, so it's not needed for MVP.

### Report Generation
Report generation (Slack copy-paste, integrations) may be added later.

## Development Guidelines

- Use Next.js App Router with server components where possible
- Use Supabase client libraries (@supabase/supabase-js, @supabase/ssr)
- All database operations through Supabase client (no raw SQL in components)
- Use React Server Components for data fetching, Client Components for interactivity
- Form handling with React state (useState) — keep it simple
- Responsive design but desktop-first (this is an internal tool used on laptops)
- Error handling: show toast notifications for errors (shadcn/ui Toast component)
- Loading states: use Skeleton components from shadcn/ui
- Jeżeli coś zmieniamy co dotyczy zmiany w bazy danych i cokolwiek takiego to aktualizuj schema bazy danych w taki sposób, abym mógł wszystko nadpisać, bo aktualnie i tak działamy na testowych danych. Po aktualnej zmianie dostaję w Supabase błąd: "Error: Failed to run sql query: ERROR: 42P07: relation "users" already exists".