# Private Gym & Cardio Discipline Tracker

A private, mobile-first accountability app protected by one shared app password. After entering the password, each person creates an app profile with their photo, name, current weight, target weight, target date, goal mode, routines, and reading target.

The group is capped at 13 profiles.

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
RESEND_API_KEY=
WEEKLY_SUMMARY_FROM=
CRON_SECRET=
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
5. Run `supabase/migrations/0004_reading_recommendations_and_group_limit.sql` to add reading proof, completed books, recommendations, and expanded group support.
6. Run `supabase/migrations/0005_general_recommendations.sql` if your recommendations table was created before category/link/photo support.
7. Run `supabase/migrations/0006_profile_login_credentials.sql` to add username/password login to existing profiles.
8. Run `supabase/migrations/0007_profile_email_and_weekly_summary.sql` to add profile email addresses for weekly summaries.
9. Confirm the private `checkin-uploads` bucket exists.
10. No Supabase Auth setup is needed.
11. No allowed-email setup is needed.

## Vercel Setup

Add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
APP_ACCESS_PASSWORD=choose-a-private-password
RESEND_API_KEY=your-resend-api-key
WEEKLY_SUMMARY_FROM=Discipline Tracker <summary@your-domain.com>
CRON_SECRET=choose-a-long-random-secret
```

Redeploy after saving the variables.

`vercel.json` schedules `/api/weekly-summary` every Sunday at `02:00 UTC`. That is Sunday morning in Thailand. Weekly email uses Resend, so `WEEKLY_SUMMARY_FROM` should be a verified Resend sender/domain.

## App Flow

1. Visitor opens the Vercel app.
2. Visitor enters the shared app password.
3. Existing profile users log in with their profile username/password.
4. Existing profiles without login credentials are prompted to create username/password once.
5. New users fill out profile setup:
   - name
   - email for weekly summaries
   - current weight
   - target weight
   - target date
   - cutting or bulking
   - gym routine
   - cardio routine
   - current book
   - total pages in that book
6. Visitor presses Save profile.
7. The app saves a private profile cookie and opens the dashboard.

## Routes

- `/access` shared password gate
- `/login` profile username/password login
- `/login-setup` link an existing profile to username/password
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

Run `supabase/reset_all_profiles.sql` in Supabase SQL Editor, or paste:

```sql
delete from public.recommendations;
delete from public.completed_books;
delete from public.reading_entries;
delete from public.challenges;
delete from public.audit_log;
delete from public.cardio_entries;
delete from public.weight_entries;
delete from public.checkin_items;
delete from public.daily_checkins;
delete from public.profiles;
```
