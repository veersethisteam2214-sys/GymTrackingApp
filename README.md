# Private Gym & Cardio Discipline Tracker

A private, mobile-first accountability app protected by one shared app password. After entering the password, each person creates an app profile with their photo, name, current weight, target weight, target date, goal mode, routines, and reading target.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres and private Storage
- Recharts for lightweight analytics
- Vercel deployment

## Environment Variables

Add these in Vercel and in `.env.local` for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_ACCESS_PASSWORD=
```

Optional local alias:

```env
SUPABASE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` must stay secret. It is only used by server-side API routes.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_private_gym_tracker.sql` in Supabase SQL Editor for a fresh setup.
3. If you already ran the original setup before target goals existed, also run `supabase/migrations/0002_profile_goals_and_weight_entry.sql`.
4. Run `supabase/migrations/0003_challenges.sql` to add the shared challenges board.
5. Run `supabase/migrations/0004_reading_recommendations_and_group_limit.sql` to add reading proof, completed books, recommendations, and max-10 profile support.
6. Run `supabase/migrations/0005_general_recommendations.sql` if your recommendations table was created before category/link/photo support.
7. Confirm the private `checkin-uploads` bucket exists.
8. No Supabase Auth setup is needed.
9. No allowed-email setup is needed.

## Vercel Setup

Add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
APP_ACCESS_PASSWORD=choose-a-private-password
```

Redeploy after saving the variables.

## App Flow

1. Visitor opens the Vercel app.
2. Visitor enters the shared app password.
3. Visitor fills out profile setup:
   - name
   - current weight
   - target weight
   - target date
   - cutting or bulking
   - gym routine
   - cardio routine
   - current book
   - total pages in that book
4. Visitor presses Save profile.
5. The app saves a private profile cookie and opens the dashboard.

## Routes

- `/access` shared password gate
- `/profile-setup` profile setup form
- `/dashboard` profile cards, today split, task completion, calendar entry, recommendations
- `/today` daily upload flow
- `/calendar` current month status grid
- `/analytics` stats and charts
- `/challenges` shared group challenges
- `/user/[userId]` per-user progress dashboard
- `/settings` edit profile and sign out

## Design / UX

- Top navigation, no bottom taskbar
- Dark/light theme toggle in Settings
- Main page shows profile cards first; detailed data opens after tapping a profile
- Daily proof photos stay hidden until a specific data point is opened
- Calendar opens from its own route with all-user or per-user filtering
- Recommendations can be anything: books, gear, videos, links, supplements, or ideas

## Daily Criteria

- Progress picture proof
- Cardio proof
- Weight entry, no photo required
- Protein proof
- Reading proof, 10 pages minimum with photo and current page number

## Privacy

Supabase tables have Row Level Security enabled and no public table policies. The app uses server-side routes with the service role key after the shared password gate. Uploaded images are stored in the private `checkin-uploads` bucket and displayed using signed URLs.

## Data Reset

```sql
delete from public.recommendations;
delete from public.completed_books;
delete from public.reading_entries;
delete from public.challenges;
delete from public.cardio_entries;
delete from public.weight_entries;
delete from public.checkin_items;
delete from public.daily_checkins;
delete from public.profiles;
```
