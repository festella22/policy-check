-- Firms (one per client organization)
create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- User profiles (linked to Supabase Auth)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Connector configurations per firm
create table if not exists connectors (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references firms(id) on delete cascade,
  type text not null check (type in ('confluence', 'sharepoint', 'justworks')),
  name text not null,
  config jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Audit log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  firm_id uuid references firms(id) on delete cascade,
  question text not null,
  sources_queried jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Row-level security
alter table firms enable row level security;
alter table user_profiles enable row level security;
alter table connectors enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table audit_log enable row level security;

-- RLS policies: users see only their firm's data
create policy "Users see own profile" on user_profiles for select using (id = auth.uid());

create policy "Users see firm connectors" on connectors for select
  using (firm_id = (select firm_id from user_profiles where id = auth.uid()));

create policy "Users see own conversations" on conversations for all
  using (user_id = auth.uid());

create policy "Users see own messages" on messages for all
  using (conversation_id in (select id from conversations where user_id = auth.uid()));

create policy "Admins manage connectors" on connectors for all
  using (firm_id = (select firm_id from user_profiles where id = auth.uid() and role = 'admin'));

create policy "Admins see firm audit log" on audit_log for select
  using (firm_id = (select firm_id from user_profiles where id = auth.uid() and role = 'admin'));

create policy "System can insert audit log" on audit_log for insert with check (true);
