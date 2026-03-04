# QA Buddy

## Project Overview

QA Buddy is an internal tool for the CKSource QA team (13 people) to manage manual testing sessions.
The team tests CKEditor 5 and related products (Drupal integration, AI features, etc.).

Currently, testing requests come via Slack from developers. Testers do exploratory testing
and report bugs on GitHub/Slack. There is no structured way to track what was tested,
by whom, and what was missed. This tool solves that by providing:

- **Living checklists** that grow organically over time as testers discover new scenarios
- **Test sessions** where testers mark what they checked, found bugs, and wrote notes
- **A dashboard** for session managers to see coverage gaps and generate reports
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

## Data Model

### Users
- Authenticated via GitHub OAuth
- Fields: id, github_username, display_name, avatar_url

### Areas (product domains)
- Represent broad product areas like "Lists", "Tables", "Paste from Office", "Track Changes", "AI", "Drupal"
- Fields: id, name, description, created_at
- Each area has a **general checklist** — checkpoints relevant to ANY testing session in this area

### Topics (specific themes within an area)
- Nested under areas, e.g. Area "Lists" → Topic "List indentation", Topic "Width attributes"
- Fields: id, area_id, name, description, created_at
- Each topic has a **topic-specific checklist** — checkpoints relevant only when this topic is tested

### Checkpoints (checklist items)
- Belong to either an area (general) or a topic (specific)
- Fields: id, area_id (nullable), topic_id (nullable), description, category (optional grouping label), created_by, created_at
- A checkpoint is a short reminder like "RTL support" or "Paste from Word — lists skipping indentation levels", NOT a formal step-by-step test case
- Can optionally have a category for grouping (e.g. "Paste", "Edge cases", "Interactions")

### Sessions (test sessions)
- Fields: id, name, description, branch, external_link (Slack/PR URL), status (active/completed), created_by, created_at, completed_at
- Many-to-many with areas (session_areas)
- Many-to-many with topics (session_topics)

### Session Testers (assignment)
- Fields: id, session_id, user_id, browsers (array), tester_status (in_progress/completed), notes (free text exploration notes)
- When creating a session, the manager assigns testers and their browsers

### Session Results (checkpoint outcomes per tester)
- Fields: id, session_id, checkpoint_id, user_id, status (passed/bug/skipped/not_applicable), bug_link (optional URL), bug_description (optional short text), created_at, updated_at
- Each tester independently marks each checkpoint

### Proposed Checkpoints (suggestions from testers during a session)
- Fields: id, session_id, proposed_by, description, category, target_type (area/topic), target_area_id, target_topic_id, status (pending/approved/rejected), approved_by, created_at
- Tester proposes a new checkpoint during testing → session manager can approve it → it becomes a permanent checkpoint

## Key Pages / Views

### 1. Dashboard (/)
- Overview: active sessions, recent sessions, quick stats
- Quick access to create new session

### 2. Areas & Checklists (/areas)
- List of all areas
- Click into area → see general checklist + list of topics
- Click into topic → see topic-specific checklist
- CRUD for areas, topics, and checkpoints

### 3. Create Session (/sessions/new)
- Form: name, description, branch, external link
- Select areas (multi-select) → auto-loads general checklists
- Select topics within chosen areas (multi-select) → auto-loads topic checklists
- Assign testers from user list → for each tester, select browsers

### 4. Session View (/sessions/[id])
Two sub-views depending on role:

**Tester view:**
- Combined checklist (general + topic-specific) with status buttons per checkpoint (OK / Bug / Skipped / N/A)
- Bug link + description field appears when "Bug" is selected
- Free-text exploration notes area
- Button to propose new checkpoint
- Button to mark self as "Completed"

**Manager/Dashboard view:**
- Coverage overview: how many checkpoints checked per tester, overall coverage percentage
- Per-checkpoint breakdown: who checked what, what's uncovered
- List of found bugs with links
- Tester statuses (in progress / completed)
- Pending checkpoint proposals to approve/reject
- "Generate Report" button → formatted text ready to copy-paste to Slack

### 5. Session History (/sessions)
- List of all sessions (filterable by area, topic, status, date)
- Click into completed session → read-only view with all results

## Report Generation

Report generation (Slack copy-paste, integrations) is OUT OF SCOPE for now. May be added later.

## Development Guidelines

- Use Next.js App Router with server components where possible
- Use Supabase client libraries (@supabase/supabase-js, @supabase/ssr)
- All database operations through Supabase client (no raw SQL in components)
- Use React Server Components for data fetching, Client Components for interactivity
- Form handling with React state (useState) — keep it simple
- Responsive design but desktop-first (this is an internal tool used on laptops)
- Error handling: show toast notifications for errors (shadcn/ui Toast component)
- Loading states: use Skeleton components from shadcn/ui