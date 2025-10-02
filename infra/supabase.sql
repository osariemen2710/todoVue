-- Supabase schema for todos
-- Run in Supabase SQL editor or via psql

create table if not exists public.todos (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  completed boolean default false,
  inserted_at timestamptz default now(),
  updated_at timestamptz
);

-- Enable Row Level Security
alter table public.todos enable row level security;

-- Allow authenticated users to insert/select/update/delete only their rows
create policy "users can manage their todos" on public.todos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
