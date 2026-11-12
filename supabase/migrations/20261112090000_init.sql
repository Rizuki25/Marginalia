-- Marginalia · Tahap 1 MVP
-- Schema follows PRD.md section 5. Column names and types are unchanged.
-- USERS is a profile mirror of auth.users: password_hash lives in
-- auth.users.encrypted_password and is never duplicated in public schema.

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed here.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  author text not null,
  cover_url text,
  category text,
  total_pages integer not null check (total_pages > 0),
  current_page integer not null default 0 check (current_page >= 0),
  status text not null default 'WANT_TO_READ'
    check (status in ('WANT_TO_READ', 'READING', 'FINISHED', 'DNF')),
  rating integer check (rating between 1 and 5),
  review text,
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  constraint books_current_page_within_total check (current_page <= total_pages)
);

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  log_date date not null,
  start_page integer not null check (start_page >= 0),
  end_page integer not null check (end_page >= 0),
  pages_read integer not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  daily_note text,
  created_at timestamptz not null default now(),
  constraint reading_logs_pages_match check (pages_read = end_page - start_page),
  constraint reading_logs_page_order check (end_page >= start_page)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  page_number integer check (page_number is null or page_number > 0),
  chapter text,
  personal_note text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color_hex text
);

create table if not exists public.quote_tags (
  quote_id uuid not null references public.quotes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (quote_id, tag_id)
);

create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  year integer not null check (year between 1900 and 3000),
  target_books integer not null check (target_books >= 0),
  target_pages_per_day integer not null check (target_pages_per_day >= 0),
  unique (user_id, year)
);

create index if not exists books_user_id_idx on public.books (user_id);
create index if not exists books_user_status_idx on public.books (user_id, status);
create index if not exists reading_logs_book_date_idx
  on public.reading_logs (book_id, log_date desc);
create index if not exists quotes_book_id_idx on public.quotes (book_id);
create index if not exists quote_tags_tag_id_idx on public.quote_tags (tag_id);
create index if not exists reading_goals_user_year_idx
  on public.reading_goals (user_id, year);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Every row is reachable only through auth.uid(). Books are checked directly;
-- reading_logs, quotes and quote_tags are checked through the owning book.
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.reading_logs enable row level security;
alter table public.quotes enable row level security;
alter table public.tags enable row level security;
alter table public.quote_tags enable row level security;
alter table public.reading_goals enable row level security;

drop policy if exists "users read own profile" on public.users;
create policy "users read own profile" on public.users
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "users insert own profile" on public.users;
create policy "users insert own profile" on public.users
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile" on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "books are owned by user" on public.books;
create policy "books are owned by user" on public.books
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "reading logs follow book owner" on public.reading_logs;
create policy "reading logs follow book owner" on public.reading_logs
  for all to authenticated
  using (
    exists (
      select 1 from public.books b
      where b.id = reading_logs.book_id
        and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.books b
      where b.id = reading_logs.book_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "quotes follow book owner" on public.quotes;
create policy "quotes follow book owner" on public.quotes
  for all to authenticated
  using (
    exists (
      select 1 from public.books b
      where b.id = quotes.book_id
        and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.books b
      where b.id = quotes.book_id
        and b.user_id = (select auth.uid())
    )
  );

-- Tags are a shared label dictionary: any signed-in reader can read and add
-- a label, because the PRD schema gives tags no user_id.
drop policy if exists "tags readable by signed in users" on public.tags;
create policy "tags readable by signed in users" on public.tags
  for select to authenticated
  using (true);

drop policy if exists "tags insertable by signed in users" on public.tags;
create policy "tags insertable by signed in users" on public.tags
  for insert to authenticated
  with check (true);

drop policy if exists "quote tags follow quote owner" on public.quote_tags;
create policy "quote tags follow quote owner" on public.quote_tags
  for all to authenticated
  using (
    exists (
      select 1
      from public.quotes q
      join public.books b on b.id = q.book_id
      where q.id = quote_tags.quote_id
        and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.quotes q
      join public.books b on b.id = q.book_id
      where q.id = quote_tags.quote_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "reading goals are owned by user" on public.reading_goals;
create policy "reading goals are owned by user" on public.reading_goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Profile row for every new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges (RLS still decides which rows are visible)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
