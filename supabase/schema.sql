-- Supabase Task Manager schema and RLS policies
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'normal', 'high');
  end if;
end
$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  is_complete boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  description text,
  priority public.task_priority not null default 'normal',
  due_date date
);

create index if not exists tasks_user_id_created_at_idx
  on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks
  for delete
  using (auth.uid() = user_id);

