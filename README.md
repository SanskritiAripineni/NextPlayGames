# NextPlay Games Task Manager

Simple web task manager using Supabase with anonymous guest auth. Each guest user sees only their own tasks through Row Level Security (RLS).

Repository: [https://github.com/SanskritiAripineni/NextPlayGames.git](https://github.com/SanskritiAripineni/NextPlayGames.git)

## Features

- Anonymous guest session auto-created on first launch
- Task creation with required `title`
- Task listing from Supabase
- Check task complete/incomplete
- Loading and error states
- Bonus fields: `description`, `priority`, `due_date`
- RLS policies so each guest can only access their own rows

## Tech Stack

- Frontend: Vanilla web app (`index.html`, `app.js`, `styles.css`)
- Database/Auth: Supabase free tier
- Version control: GitHub

## Project Structure

- `index.html` - UI structure
- `styles.css` - styling
- `app.js` - Supabase auth + task operations + UI state
- `config.js` - Supabase project URL and anon key
- `supabase/schema.sql` - table + policies

## Supabase Setup

1. Create a Supabase project (free tier).
2. Enable anonymous auth:
   - Dashboard -> Authentication -> Providers -> Anonymous
   - Toggle `Enable sign in with anonymous users`.
3. Open SQL Editor and run:
   - `supabase/schema.sql`
4. In Supabase Dashboard, copy:
   - Project URL (`Settings -> API -> Project URL`)
   - Public anon key (`Settings -> API -> Project API keys -> anon public`)
5. Update `config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Required Database Fields

Implemented in `supabase/schema.sql`:

- `id` (uuid, primary key)
- `title` (text, required)
- `is_complete` (boolean, default false)
- `created_at` (timestamp with timezone)
- `user_id` (uuid, linked to authenticated guest user)

Bonus fields also implemented:

- `description` (text)
- `priority` (`low | normal | high`, enum)
- `due_date` (date)

## Guest Isolation + RLS Behavior

- App creates anonymous guest session automatically.
- Every task insert includes `user_id` = current guest user id.
- RLS policies enforce `auth.uid() = user_id` for select/insert/update/delete.
- Result:
  - User A sees only User A tasks.
  - User B sees only User B tasks.
