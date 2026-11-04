-- Famille Gros-Stoltz : schéma initial.
-- À coller une fois dans Supabase > SQL Editor > New query, puis « Run ».
--
-- Principe : un « foyer » partagé par Thomas et Julia. Toutes les données de l'app
-- (tâches, achats, jalons, rendez-vous, comparatifs, chat) vivent dans une seule
-- table `docs`, rangées par collection. Seuls les membres du foyer y ont accès.

create extension if not exists pgcrypto;

-- ---------- Foyer ----------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Famille Gros-Stoltz',
  due_date date not null default '2027-07-03',
  city text default 'Paris 18e',
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
  seed_version int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  member text not null check (member in ('thomas', 'julia')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------- Données ----------
create table if not exists public.docs (
  household_id uuid not null references public.households on delete cascade,
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (household_id, collection, id)
);

create index if not exists docs_household_collection on public.docs (household_id, collection);

create or replace function public.touch_doc() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs
  for each row execute function public.touch_doc();

-- ---------- Droits d'accès ----------
create or replace function public.is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = h and user_id = auth.uid());
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.docs enable row level security;

drop policy if exists "membres lisent leur foyer" on public.households;
create policy "membres lisent leur foyer" on public.households
  for select using (public.is_member(id));

drop policy if exists "membres modifient leur foyer" on public.households;
create policy "membres modifient leur foyer" on public.households
  for update using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "membres voient les membres" on public.household_members;
create policy "membres voient les membres" on public.household_members
  for select using (public.is_member(household_id));

drop policy if exists "membres gèrent les données" on public.docs;
create policy "membres gèrent les données" on public.docs
  for all using (public.is_member(household_id)) with check (public.is_member(household_id));

-- ---------- Créer ou rejoindre un foyer ----------
create or replace function public.create_household(p_member text) returns uuid
language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'Vous faites déjà partie d''un foyer';
  end if;
  insert into households default values returning id into h;
  insert into household_members (household_id, user_id, member) values (h, auth.uid(), p_member);
  return h;
end $$;

create or replace function public.join_household(p_code text, p_member text) returns uuid
language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  select id into h from households where invite_code = upper(trim(p_code));
  if h is null then raise exception 'Code d''invitation inconnu'; end if;
  insert into household_members (household_id, user_id, member)
    values (h, auth.uid(), p_member)
    on conflict (household_id, user_id) do update set member = excluded.member;
  return h;
end $$;

revoke all on function public.create_household(text) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;

-- ---------- Temps réel ----------
alter table public.docs replica identity full;
do $$
begin
  begin alter publication supabase_realtime add table public.docs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.households; exception when duplicate_object then null; end;
end $$;
