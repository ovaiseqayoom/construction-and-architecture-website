-- Supabase migration: Add blog views, likes, and comments engagement system
-- File: supabase/migrations/20261123000000_add_blog_engagement.sql

-- 1. Add views_count and likes_count columns to blogs
alter table public.blogs 
  add column if not exists views_count integer not null default 0,
  add column if not exists likes_count integer not null default 0;

-- 2. Create blog_likes table
create table if not exists public.blog_likes (
  id uuid primary key default gen_random_uuid(),
  blog_slug text not null,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  constraint unique_blog_like unique (blog_slug, email)
);

create index if not exists idx_blog_likes_slug on public.blog_likes(blog_slug);
create index if not exists idx_blog_likes_email on public.blog_likes(lower(email));

-- 3. Create blog_comments table
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  blog_slug text not null,
  author_name text not null,
  author_email text not null,
  content text not null,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  is_team_reply boolean not null default false,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_comments_slug on public.blog_comments(blog_slug, created_at desc);

-- 4. Enable Row Level Security
alter table public.blog_likes enable row level security;
alter table public.blog_comments enable row level security;

-- 5. Drop existing policies if any
drop policy if exists "Allow public select blog_comments" on public.blog_comments;
drop policy if exists "Allow public insert blog_comments" on public.blog_comments;
drop policy if exists "Allow public select blog_likes" on public.blog_likes;
drop policy if exists "Allow public insert blog_likes" on public.blog_likes;
drop policy if exists "Allow public delete blog_likes" on public.blog_likes;

-- RLS Policies
create policy "Allow public select blog_comments"
  on public.blog_comments for select
  to anon, authenticated
  using (status = 'approved');

create policy "Allow public insert blog_comments"
  on public.blog_comments for insert
  to anon, authenticated
  with check (
    length(trim(content)) > 0 and 
    length(trim(author_name)) > 0 and 
    author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

create policy "Allow public select blog_likes"
  on public.blog_likes for select
  to anon, authenticated
  using (true);

create policy "Allow public insert blog_likes"
  on public.blog_likes for insert
  to anon, authenticated
  with check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

create policy "Allow public delete blog_likes"
  on public.blog_likes for delete
  to anon, authenticated
  using (true);

-- 6. RPC functions
create or replace function public.increment_blog_views(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views integer;
begin
  update public.blogs
  set views_count = coalesce(views_count, 0) + 1
  where slug = p_slug
  returning views_count into v_new_views;

  return coalesce(v_new_views, 0);
end;
$$;

create or replace function public.toggle_blog_like(p_slug text, p_email text, p_name text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_email text := lower(trim(p_email));
  v_exists boolean;
  v_new_likes integer;
  v_liked boolean;
begin
  if v_clean_email is null or v_clean_email = '' then
    raise exception 'Valid email is required to like';
  end if;

  select exists(
    select 1 from public.blog_likes 
    where blog_slug = p_slug and lower(email) = v_clean_email
  ) into v_exists;

  if v_exists then
    delete from public.blog_likes 
    where blog_slug = p_slug and lower(email) = v_clean_email;

    update public.blogs
    set likes_count = greatest(0, coalesce(likes_count, 1) - 1)
    where slug = p_slug
    returning likes_count into v_new_likes;

    v_liked := false;
  else
    insert into public.blog_likes (blog_slug, email, name)
    values (p_slug, v_clean_email, trim(coalesce(p_name, '')))
    on conflict (blog_slug, email) do nothing;

    update public.blogs
    set likes_count = coalesce(likes_count, 0) + 1
    where slug = p_slug
    returning likes_count into v_new_likes;

    v_liked := true;
  end if;

  return json_build_object(
    'liked', v_liked,
    'likes_count', coalesce(v_new_likes, 0)
  );
end;
$$;

create or replace function public.get_blog_engagement(p_slug text, p_email text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_views integer := 0;
  v_likes integer := 0;
  v_comments_count integer := 0;
  v_user_liked boolean := false;
  v_clean_email text := lower(trim(coalesce(p_email, '')));
begin
  select coalesce(views_count, 0), coalesce(likes_count, 0)
  into v_views, v_likes
  from public.blogs
  where slug = p_slug;

  select count(*)
  into v_comments_count
  from public.blog_comments
  where blog_slug = p_slug and status = 'approved';

  if v_clean_email <> '' then
    select exists(
      select 1 from public.blog_likes
      where blog_slug = p_slug and lower(email) = v_clean_email
    ) into v_user_liked;
  end if;

  return json_build_object(
    'views_count', coalesce(v_views, 0),
    'likes_count', coalesce(v_likes, 0),
    'comments_count', coalesce(v_comments_count, 0),
    'user_liked', v_user_liked
  );
end;
$$;

grant execute on function public.increment_blog_views(text) to anon, authenticated;
grant execute on function public.toggle_blog_like(text, text, text) to anon, authenticated;
grant execute on function public.get_blog_engagement(text, text) to anon, authenticated;
grant select, insert on public.blog_comments to anon, authenticated;
grant select, insert, delete on public.blog_likes to anon, authenticated;
