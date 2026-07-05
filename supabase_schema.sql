-- ============================================================
-- Golf Rank App — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- Profiles: one row per user, linked to Supabase auth
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  created_at timestamptz default now()
);

-- Golf courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  country text default 'USA',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (name, city, state)
);

-- Ratings: one per user per course, three sub-scores + comment
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  service_score int not null check (service_score between 1 and 10),
  course_score int not null check (course_score between 1 and 10),
  price_score int not null check (price_score between 1 and 10),
  average_score numeric generated always as (
    round(((service_score + course_score + price_score)::numeric / 3), 2)
  ) stored,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, course_id)
);

-- Friendships (bidirectional via status)
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table ratings enable row level security;
alter table friendships enable row level security;

-- Profiles: anyone signed in can read all profiles (needed for search/friends);
-- users can only edit their own.
create policy "profiles are readable by authenticated users"
  on profiles for select to authenticated using (true);
create policy "users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- Courses: readable by everyone signed in; anyone signed in can add a course.
create policy "courses are readable by authenticated users"
  on courses for select to authenticated using (true);
create policy "authenticated users can add courses"
  on courses for insert to authenticated with check (auth.uid() = created_by);

-- Ratings: readable by everyone signed in (powers course aggregate scores &
-- friends' top 10 lists). Users can only write/edit/delete their own rating.
create policy "ratings are readable by authenticated users"
  on ratings for select to authenticated using (true);
create policy "users can insert their own ratings"
  on ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update their own ratings"
  on ratings for update to authenticated using (auth.uid() = user_id);
create policy "users can delete their own ratings"
  on ratings for delete to authenticated using (auth.uid() = user_id);

-- Friendships: users can see requests involving them, and manage their own requests.
create policy "users see their own friendships"
  on friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "users can send friend requests"
  on friendships for insert to authenticated with check (auth.uid() = requester_id);
create policy "users can respond to requests sent to them"
  on friendships for update to authenticated
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "users can delete their own friendships"
  on friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- Auto-create a profile row whenever a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Handy view: aggregate rating per course across all users
-- ============================================================
create or replace view course_aggregates as
select
  c.id as course_id,
  c.name,
  c.city,
  c.state,
  c.country,
  count(r.id) as review_count,
  round(avg(r.service_score)::numeric, 2) as avg_service,
  round(avg(r.course_score)::numeric, 2) as avg_course,
  round(avg(r.price_score)::numeric, 2) as avg_price,
  round(avg(r.average_score)::numeric, 2) as avg_overall
from courses c
left join ratings r on r.course_id = c.id
group by c.id;
