# QA Buddy

Internal tool for the CKSource QA team to manage manual testing sessions for CKEditor 5 and related products.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with GitHub OAuth
- **Styling:** Tailwind CSS + shadcn/ui components
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A GitHub OAuth application

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration script from `supabase-migration.sql`
4. Go to Authentication → Providers and enable GitHub
5. Configure your GitHub OAuth application:
   - Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase GitHub provider settings

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under API.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
qa-buddy/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── auth/callback/     # OAuth callback handler
│   ├── areas/             # Areas & Checklists page
│   ├── sessions/          # Sessions page
│   ├── profile/           # User profile page
│   └── page.tsx           # Dashboard (home page)
├── components/
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components (sidebar, etc.)
├── lib/
│   ├── supabase.ts        # Supabase client (client-side)
│   ├── supabase-server.ts # Supabase client (server-side)
│   └── utils.ts           # Utility functions
└── middleware.ts          # Auth middleware
```

## Features Implemented

✅ Next.js 14+ with TypeScript and Tailwind CSS
✅ shadcn/ui components with CKEditor branding theme
✅ Supabase authentication with GitHub OAuth
✅ Protected routes with middleware
✅ Main layout with collapsible sidebar navigation
✅ Dashboard with placeholder stats
✅ Areas & Checklists page (placeholder)
✅ Sessions page (placeholder)
✅ Profile page with GitHub info and browser preferences
✅ Complete database schema with RLS policies

## Next Steps

The basic infrastructure is ready. You can now implement:

- CRUD operations for Areas, Topics, and Checkpoints
- Session creation and management
- Tester assignment and checkpoint tracking
- Proposed checkpoints workflow
- Session reports and history

See `CLAUDE.md` for the complete feature specification.

## Database Schema

The database includes the following tables:

- **users** - User profiles from GitHub OAuth
- **areas** - Product areas (Lists, Tables, AI, etc.)
- **topics** - Specific themes within areas
- **checkpoints** - Checklist items (general or topic-specific)
- **sessions** - Test sessions
- **session_areas** - Session-Area relationships
- **session_topics** - Session-Topic relationships
- **session_testers** - Tester assignments with browsers
- **session_results** - Checkpoint test results per tester
- **proposed_checkpoints** - Checkpoint suggestions from testers

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Contributing

This is an internal tool for the CKSource QA team. For questions or issues, contact the development team.

## License

Internal use only - CKSource
