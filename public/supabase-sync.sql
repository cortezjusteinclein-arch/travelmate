-- TravelMate · sync setup. Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- It lets the Administrator read/write every table, lets the website read which listings are published,
-- lets visitors write traffic rows, and switches on Realtime so changes show up instantly.

-- 1) helper functions --------------------------------------------------------------
create or replace function public.tm_is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where auth_id = auth.uid() and "Role" = 'Administrator')
$$;
create or replace function public.tm_user_id() returns text
language sql security definer stable set search_path = public as $$
  select "UserID"::text from public.users where auth_id = auth.uid() limit 1
$$;
grant execute on function public.tm_is_admin(), public.tm_user_id() to anon, authenticated;

-- 2) the Administrator can do everything on every table --------------------------------
do $$
declare t text;
begin
  foreach t in array array['users','listing','hotels','restaurants','attractions','trip_plans','trip_plan_items',
    'bookings','reviews','hotel_reviews','restaurant_reviews','attraction_reviews','forum_posts','photos',
    'forum_replies','audit_log','traffic_visits','traffic_logins','traffic_live'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists tm_admin_all on public.%I', t);
      execute format('create policy tm_admin_all on public.%I for all to authenticated using (public.tm_is_admin()) with check (public.tm_is_admin())', t);
    end if;
  end loop;
end $$;

-- 3) the website (even for guests) can see which listings exist and their status ---------
drop policy if exists tm_listing_public_read on public.listing;
create policy tm_listing_public_read on public.listing for select to anon, authenticated using (true);

-- 4) travelers can create and read their own bookings (so they reach the admin console) ---
drop policy if exists tm_bookings_own_select on public.bookings;
drop policy if exists tm_bookings_own_insert on public.bookings;
drop policy if exists tm_bookings_own_update on public.bookings;
create policy tm_bookings_own_select on public.bookings for select to authenticated using ("UserID"::text = public.tm_user_id());
create policy tm_bookings_own_insert on public.bookings for insert to authenticated with check ("UserID"::text = public.tm_user_id());
create policy tm_bookings_own_update on public.bookings for update to authenticated using ("UserID"::text = public.tm_user_id()) with check ("UserID"::text = public.tm_user_id());

-- 4b) travelers can manage their own trip plan (planner on the website) --------------------
drop policy if exists tm_trips_own on public.trip_plans;
create policy tm_trips_own on public.trip_plans for all to authenticated
  using ("UserID"::text = public.tm_user_id()) with check ("UserID"::text = public.tm_user_id());
drop policy if exists tm_trip_items_own on public.trip_plan_items;
create policy tm_trip_items_own on public.trip_plan_items for all to authenticated
  using (exists (select 1 from public.trip_plans p where p."TripID" = trip_plan_items."TripID" and p."UserID"::text = public.tm_user_id()))
  with check (exists (select 1 from public.trip_plans p where p."TripID" = trip_plan_items."TripID" and p."UserID"::text = public.tm_user_id()));

-- 5) visit / login tracking written by tracker.js --------------------------------------
drop policy if exists tm_visits_insert on public.traffic_visits;
create policy tm_visits_insert on public.traffic_visits for insert to anon, authenticated with check (true);
drop policy if exists tm_logins_insert on public.traffic_logins;
create policy tm_logins_insert on public.traffic_logins for insert to anon, authenticated with check (true);
drop policy if exists tm_live_all on public.traffic_live;
create policy tm_live_all on public.traffic_live for all to anon, authenticated using (true) with check (true);

-- 6) Realtime: push changes to the admin console and the website immediately -------------
do $$
declare t text;
begin
  foreach t in array array['users','listing','hotels','restaurants','attractions','trip_plans','trip_plan_items',
    'bookings','reviews','forum_posts','forum_replies','photos','traffic_visits','traffic_logins','traffic_live'] loop
    if to_regclass('public.' || t) is not null and not exists
       (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
