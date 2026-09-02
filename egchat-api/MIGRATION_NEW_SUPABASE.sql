-- ══════════════════════════════════════════════════════════════════
-- EGCHAT — Schema completo para proyecto nuevo Supabase
-- Proyecto: egchat-production (leonddkyrwgihgwgufqa)
-- Pegar TODO esto en: Supabase > SQL Editor > New Query > Run
-- ══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── USUARIOS ──────────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(20) unique not null,
  full_name varchar(100) not null,
  password_hash varchar(255) not null,
  avatar_url text,
  status varchar(20) default 'offline',
  online_status boolean default false,
  last_seen timestamptz,
  created_at timestamptz default now(),
  last_login timestamptz,
  is_active boolean default true,
  app_version varchar(20) default '2.5.0',
  city varchar(100),
  e2e_public_key text,
  e2e_key_backup jsonb,
  e2e_backup_updated timestamptz
);

-- ── WALLETS ───────────────────────────────────────────────────────
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  balance numeric(15,2) default 5000,
  currency varchar(3) default 'XAF',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TRANSACCIONES ─────────────────────────────────────────────────
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type varchar(30) not null,
  amount numeric(15,2) not null,
  method varchar(100),
  reference text,
  status varchar(20) default 'completed',
  created_at timestamptz default now()
);

-- ── CODIGOS DE RECARGA ────────────────────────────────────────────
create table if not exists recharge_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) unique not null,
  amount numeric(15,2) not null,
  used boolean default false,
  is_used boolean default false,
  used_by uuid references users(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ── CONTACTOS ─────────────────────────────────────────────────────
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  contact_user_id uuid references users(id) on delete cascade,
  contact_id uuid references users(id) on delete cascade,
  nickname varchar(100),
  name varchar(100),
  phone varchar(20),
  is_blocked boolean default false,
  is_favorite boolean default false,
  user_id_min text,
  user_id_max text,
  created_at timestamptz default now(),
  unique(user_id, contact_user_id)
);

-- ── CHATS ─────────────────────────────────────────────────────────
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  type text default 'private',
  name text,
  avatar_url text,
  description text,
  created_by uuid references users(id) on delete set null,
  participants jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PARTICIPANTES DE CHAT ─────────────────────────────────────────
create table if not exists chat_participants (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  unread_count integer default 0,
  wallpaper_type varchar(30),
  wallpaper_value text,
  wallpaper_settings jsonb,
  unique(chat_id, user_id)
);

-- ── MENSAJES ──────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  text text,
  type text default 'text',
  status text default 'sent',
  reply_to uuid,
  file_url text,
  edited boolean default false,
  edited_at timestamptz,
  created_at timestamptz default now()
);

alter table messages
  drop constraint if exists messages_reply_to_fkey;
alter table messages
  add constraint messages_reply_to_fkey
  foreign key (reply_to) references messages(id) on delete set null;

-- ── LECTURAS DE MENSAJES ──────────────────────────────────────────
create table if not exists message_reads (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  last_read_message_id uuid references messages(id) on delete set null,
  read_at timestamptz default now(),
  unique(chat_id, user_id)
);

-- ── ELIMINACIONES DE MENSAJES (para mí) ──────────────────────────
create table if not exists message_deletions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  deleted_at timestamptz default now(),
  unique(message_id, user_id)
);

-- ── REACCIONES A MENSAJES ─────────────────────────────────────────
create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  user_id uuid references users(id) on delete cascade,
  emoji varchar(10) not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

-- ── LIA CONVERSACIONES ────────────────────────────────────────────
create table if not exists lia_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  message text not null,
  reply text not null,
  created_at timestamptz default now()
);

-- ── LEDGER ────────────────────────────────────────────────────────
create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  code varchar(40) unique not null,
  name varchar(120) not null,
  account_type varchar(30) not null,
  currency varchar(3) default 'XAF',
  is_system boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists ledger_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  reference varchar(80),
  concept text not null,
  total_amount numeric(15,2) not null default 0,
  status varchar(20) not null default 'draft',
  requires_approval boolean default false,
  created_by uuid references users(id) on delete set null,
  approved_by uuid references users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid references ledger_journals(id) on delete cascade,
  account_id uuid references ledger_accounts(id) on delete restrict,
  entry_type varchar(6) not null check (entry_type in ('debit','credit')),
  amount numeric(15,2) not null check (amount > 0),
  currency varchar(3) default 'XAF',
  memo text,
  counterparty_user_id uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists ledger_approvals (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid references ledger_journals(id) on delete cascade,
  requested_by uuid references users(id) on delete set null,
  approved_by uuid references users(id) on delete set null,
  status varchar(20) not null default 'pending',
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(journal_id)
);

-- ── TAXI ──────────────────────────────────────────────────────────
create table if not exists taxi_rides (
  id uuid primary key default gen_random_uuid(),
  ride_ref varchar(60) unique not null,
  user_id uuid references users(id) on delete cascade not null,
  origin text not null,
  destination text not null,
  ride_type varchar(20) default 'taxi',
  fare decimal(10,2),
  distance_km decimal(6,2),
  eta_minutes integer default 4,
  status varchar(20) default 'searching',
  payment_method varchar(20) default 'wallet',
  driver jsonb,
  driver_name varchar(100),
  driver_rating decimal(2,1),
  driver_plate varchar(20),
  driver_vehicle varchar(80),
  driver_phone varchar(30),
  rating smallint check (rating between 1 and 5),
  rating_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── SERVICIOS ─────────────────────────────────────────────────────
create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  order_ref varchar(60) unique not null,
  user_id uuid references users(id) on delete cascade,
  provider varchar(30) not null,
  service_type varchar(40) not null,
  contract_ref varchar(80),
  amount numeric(15,2) default 0,
  status varchar(30) not null default 'pending',
  payload jsonb default '{}'::jsonb,
  response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TRANSFERENCIAS CEMAC ──────────────────────────────────────────
create table if not exists cemac_transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_ref varchar(80) unique not null,
  user_id uuid references users(id) on delete cascade,
  from_country varchar(4) not null,
  to_country varchar(4) not null,
  beneficiary_name varchar(120) not null,
  beneficiary_account varchar(60) not null,
  amount numeric(15,2) not null,
  fee numeric(15,2) not null default 0,
  status varchar(30) not null default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action varchar(80) not null,
  module varchar(40) not null,
  entity_id varchar(80),
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ── SEGUROS ───────────────────────────────────────────────────────
create table if not exists insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  insurance_type varchar(30) not null,
  coverage_amount numeric(15,2) not null,
  duration_months integer not null,
  monthly_premium numeric(15,2) not null,
  total_premium numeric(15,2) not null,
  status varchar(20) default 'active',
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references insurance_policies(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  claim_type varchar(50) not null,
  description text,
  amount numeric(15,2),
  status varchar(20) default 'pending',
  submitted_at timestamptz default now()
);

-- ── NOTICIAS FAVORITAS ────────────────────────────────────────────
create table if not exists user_news_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  news_id text not null,
  created_at timestamptz default now(),
  unique(user_id, news_id)
);

-- ── PUSH SUBSCRIPTIONS ────────────────────────────────────────────
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  endpoint text not null,
  p256dh text default '',
  auth text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- ── EXPO PUSH TOKENS ──────────────────────────────────────────────
create table if not exists expo_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  token varchar(200) unique not null,
  platform varchar(10) default 'android',
  updated_at timestamptz default now()
);

-- ── SESIONES DE LLAMADAS WEBRTC ───────────────────────────────────
create table if not exists call_sessions (
  call_id varchar(100) primary key,
  offer text,
  answer text,
  caller_candidates text default '[]',
  callee_candidates text default '[]',
  type varchar(10) default 'audio',
  caller_id text not null,
  target_user_id text not null,
  ended boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── STORIES / ESTADOS ─────────────────────────────────────────────
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  media jsonb not null,
  type text default 'text',
  views integer default 0,
  reactions jsonb default '[]',
  replies jsonb default '[]',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- ── SPACES (Canales/Comunidades) ──────────────────────────────────
create table if not exists spaces (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) not null,
  description text,
  type varchar(20) default 'publico' check (type in ('publico','comunidad')),
  cover text,
  emoji varchar(10) default '📢',
  owner_id uuid references users(id) on delete cascade,
  followers_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists space_follows (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(space_id, user_id)
);

create table if not exists space_posts (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade,
  author_id uuid references users(id) on delete cascade,
  text text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists space_post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references space_posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create table if not exists space_post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references space_posts(id) on delete cascade,
  author_id uuid references users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ── STICKERS ──────────────────────────────────────────────────────
create table if not exists sticker_packs (
  id varchar(100) primary key,
  name varchar(100) not null,
  author varchar(100) default 'EGChat',
  cover_url text,
  stickers jsonb default '[]',
  download_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists user_sticker_packs (
  user_id uuid references users(id) on delete cascade,
  pack_id varchar(100) not null,
  installed_at timestamptz default now(),
  primary key(user_id, pack_id)
);

create table if not exists user_custom_stickers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  file_url text not null,
  created_at timestamptz default now()
);

create table if not exists user_sticker_favorites (
  user_id uuid references users(id) on delete cascade,
  sticker_id varchar(200) not null,
  sticker_url text not null,
  sticker_label varchar(50),
  favorited_at timestamptz default now(),
  primary key(user_id, sticker_id)
);

-- ── SESIONES MULTI-DISPOSITIVO ────────────────────────────────────
create table if not exists user_sessions (
  id text primary key,
  user_id uuid references users(id) on delete cascade not null,
  device_name varchar(150),
  device_type varchar(30),
  platform varchar(80),
  last_seen timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── PAGOS EXTERNOS ────────────────────────────────────────────────
create table if not exists payment_transactions (
  id text primary key,
  user_id uuid references users(id) on delete cascade not null,
  type varchar(20) not null,
  amount decimal(15,2) not null,
  currency varchar(10) default 'XAF',
  gateway varchar(30) not null,
  gateway_txn_id text,
  status varchar(20) default 'pending',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INDICES ───────────────────────────────────────────────────────
create index if not exists idx_contacts_user on contacts(user_id);
create index if not exists idx_contacts_contact on contacts(contact_user_id);
create index if not exists idx_wallets_user on wallets(user_id);
create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_created on transactions(created_at desc);
create index if not exists idx_chats_updated_at on chats(updated_at desc);
create index if not exists idx_chat_participants_user on chat_participants(user_id);
create index if not exists idx_messages_chat on messages(chat_id);
create index if not exists idx_messages_created on messages(created_at desc);
create index if not exists idx_reads_chat_user on message_reads(chat_id, user_id);
create index if not exists idx_message_deletions_user on message_deletions(user_id);
create index if not exists idx_message_deletions_message on message_deletions(message_id);
create index if not exists idx_ledger_accounts_user on ledger_accounts(user_id);
create index if not exists idx_ledger_journals_user on ledger_journals(user_id, created_at desc);
create index if not exists idx_ledger_entries_journal on ledger_entries(journal_id);
create index if not exists idx_ledger_approvals_status on ledger_approvals(status);
create index if not exists idx_taxi_rides_user on taxi_rides(user_id, created_at desc);
create index if not exists idx_taxi_rides_ref on taxi_rides(ride_ref);
create index if not exists idx_service_orders_user on service_orders(user_id, created_at desc);
create index if not exists idx_cemac_transfers_user on cemac_transfers(user_id, created_at desc);
create index if not exists idx_audit_logs_user on audit_logs(user_id, created_at desc);
create index if not exists idx_stories_user_id on stories(user_id);
create index if not exists idx_stories_expires_at on stories(expires_at);
create index if not exists idx_call_sessions_target on call_sessions(target_user_id, ended);
create index if not exists idx_call_sessions_created on call_sessions(created_at);
create index if not exists idx_push_subscriptions_user on push_subscriptions(user_id);
create index if not exists idx_expo_push_tokens_user on expo_push_tokens(user_id);
create index if not exists idx_spaces_type on spaces(type);
create index if not exists idx_space_follows_user on space_follows(user_id);
create index if not exists idx_space_posts_space on space_posts(space_id);
create index if not exists idx_space_posts_created on space_posts(created_at desc);
create index if not exists idx_space_comments_post on space_post_comments(post_id);
create index if not exists idx_custom_stickers_user on user_custom_stickers(user_id);
create index if not exists idx_user_sessions_user_active on user_sessions(user_id, is_active);
create index if not exists idx_payment_txns_user on payment_transactions(user_id, created_at desc);
create index if not exists idx_reactions_message_id on message_reactions(message_id);

-- ── DATOS INICIALES ───────────────────────────────────────────────
insert into recharge_codes (code, amount, expires_at) values
  ('EGCHAT-2026-RESET', 5000, now() + interval '365 days'),
  ('EGCHAT-2026-PROMO', 10000, now() + interval '365 days'),
  ('1234-5678-9012-3456', 5000, now() + interval '365 days'),
  ('ABCD-EFGH-IJKL-MNOP', 10000, now() + interval '365 days'),
  ('TEST-CODE-2026-EGCH', 25000, now() + interval '365 days')
on conflict (code) do nothing;

insert into sticker_packs (id, name, author, cover_url, stickers, download_count) values
  ('egchat_classic', 'EGChat Clásico', 'EGChat',
   'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif',
   '[{"id":"eg_hi","url":"https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif","label":"👋"},{"id":"eg_love","url":"https://media.tenor.com/bLyaMAGQg-MAAAAi/heart-love.gif","label":"❤️"}]',
   0),
  ('guinea_eq', 'Guinea Ecuatorial', 'EGChat',
   'https://media.tenor.com/KWBXqCNb-0AAAAAi/party-celebration.gif',
   '[{"id":"ge1","url":"https://media.tenor.com/KWBXqCNb-0AAAAAi/party-celebration.gif","label":"🇬🇶"}]',
   0)
on conflict (id) do nothing;

insert into spaces (name, description, type, cover, emoji, followers_count) values
  ('Gobierno GE', 'Noticias y comunicados oficiales del Gobierno de Guinea Ecuatorial', 'publico', 'linear-gradient(135deg,#1e3a5f,#0369a1)', '🏛️', 48200),
  ('Musica GQ', 'Lo mejor de la musica de Guinea Ecuatorial y Africa Central', 'comunidad', 'linear-gradient(135deg,#7c3aed,#db2777)', '🎵', 12800),
  ('Mercado Malabo', 'Compra, vende e intercambia en Guinea Ecuatorial', 'comunidad', 'linear-gradient(135deg,#059669,#0d9488)', '🛒', 31500),
  ('Deportes GQ', 'Futbol, baloncesto y todos los deportes de Guinea Ecuatorial', 'publico', 'linear-gradient(135deg,#dc2626,#f59e0b)', '⚽', 22100),
  ('Tecnologia GE', 'Innovacion, startups y tecnologia en Guinea Ecuatorial', 'comunidad', 'linear-gradient(135deg,#1e40af,#7c3aed)', '💻', 8900)
on conflict do nothing;

-- ══════════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA — EGCHAT egchat-production
-- ══════════════════════════════════════════════════════════════════
