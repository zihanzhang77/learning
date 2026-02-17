-- Create ai_encouragements table
create table if not exists public.ai_encouragements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  diary_date date not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, diary_date)
);

-- Enable RLS
alter table public.ai_encouragements enable row level security;

-- Create policies
create policy "Users can view their own encouragements"
  on public.ai_encouragements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own encouragements"
  on public.ai_encouragements for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own encouragements"
  on public.ai_encouragements for update
  using (auth.uid() = user_id);
