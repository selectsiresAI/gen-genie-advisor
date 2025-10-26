-- Create role enum
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamp with time zone default now(),
    unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "Only admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Update support_tickets policies to use has_role
drop policy if exists "Admins can view all tickets" on public.support_tickets;
drop policy if exists "Admins can update ticket status" on public.support_tickets;
drop policy if exists "Admins can update tickets" on public.support_tickets;

create policy "Admins and users can view their tickets"
on public.support_tickets
for select
to authenticated
using (public.has_role(auth.uid(), 'admin') or user_id = auth.uid());

create policy "Only admins can update tickets"
on public.support_tickets
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Update support_ticket_responses policies
drop policy if exists "Admins can view all responses" on public.support_ticket_responses;
drop policy if exists "Users can view responses for their tickets or admins can view all" on public.support_ticket_responses;
drop policy if exists "Admins can insert responses" on public.support_ticket_responses;

create policy "Users and admins can view ticket responses"
on public.support_ticket_responses
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin') or 
  (
    exists (
      select 1 from public.support_tickets 
      where support_tickets.id = support_ticket_responses.ticket_id 
      and support_tickets.user_id = auth.uid()
    ) 
    and not support_ticket_responses.is_internal
  )
);

create policy "Only admins can create responses"
on public.support_ticket_responses
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));