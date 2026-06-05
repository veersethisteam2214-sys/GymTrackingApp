# Private Gym & Cardio Discipline Tracker

A private, mobile-first accountability app for two approved users. It tracks daily proof uploads for gym progress, cardio, weight, and protein shake completion, with neutral status language and private Supabase Storage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and RLS
- Recharts for lightweight analytics
- Vercel deployment

## Environment Variables

Create `.env.local` for local development and add the same values in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_ACCESS_PASSWORD=
ALLOWED_EMAILS=user1@example.com,user2@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for server-side maintenance tasks. Do not expose it to the browser and do not commit real values.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_private_gym_tracker.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Insert the two approved emails into `public.allowed_emails`:

```sql
insert into public.allowed_emails (email)
values ('user1@example.com'), ('user2@example.com')
on conflict do nothing;
```

4. Add the same two emails to the `ALLOWED_EMAILS` environment variable.
5. Confirm the private `checkin-uploads` bucket exists. The migration creates it with a 10 MB image limit and private access.
6. In Supabase Auth, enable email/password sign-in.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/access` shared app password gate
- `/login` Supabase Auth login/sign-up
- `/dashboard` today's two-person dashboard and month preview
- `/today` current user's daily upload flow
- `/calendar` current month status grid with day detail modal
- `/analytics` weekly/monthly stats and charts
- `/user/[userId]` per-user progress dashboard
- `/settings` account and sign-out controls

## Privacy and Access Control

The app has four layers:

1. Optional shared password gate using `APP_ACCESS_PASSWORD`
2. Supabase Auth email/password login
3. App allowlist using `ALLOWED_EMAILS`
4. Supabase RLS using `public.allowed_emails`

Uploads are stored in the private `checkin-uploads` bucket under:

```txt
{user_id}/{yyyy-mm-dd}/{category}/{timestamp}-{filename}
```

Only the owner can upload, replace, or delete files in their own folder. Both allowlisted users can view private images through signed URLs inside the authenticated app.

## Deployment

The repository is intended to deploy on Vercel. After pushing to GitHub, Vercel should automatically build and deploy if the GitHub repository is linked.

Use these build settings:

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: Next.js default

## Data Reset

For a full reset, delete rows from the app tables and remove objects from `checkin-uploads`. Keep `allowed_emails` unless you also want to reset access.

```sql
delete from public.cardio_entries;
delete from public.weight_entries;
delete from public.checkin_items;
delete from public.daily_checkins;
delete from public.profiles;
```

