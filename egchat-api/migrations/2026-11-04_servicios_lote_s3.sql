-- EGPay - Lote S3: la prima del seguro la fija la tabla y la póliza queda escrita.
--
-- Lo que cierra:
--   - `/api/seguros/companias/:id/productos` (index.js:6364) fabricaba el precio
--     con `price: (i+1)*5000`: el catálogo dependía del orden del array de
--     JavaScript, no de ningún acuerdo con la aseguradora.
--   - `/api/seguros/solicitar` (index.js:6375) guardaba `amount: 0` y
--     `status: 'pending'`. No se cobraba la prima y no quedaba póliza en ningún
--     sitio: el cliente pulsaba "contratar", veía el ticket de éxito y la
--     cartera no se enteraba.
--
-- A partir de aquí la prima vive en `service_tariffs` (service = compañía,
-- variant = producto), el alta se asienta con `insurance_take_out()` por lo que
-- dice esa tabla, y la póliza es una fila en `insurance_policies` con su
-- `journal_id`. La contrapartida vuelve a ser SYS-SUSPENSE: el operador retiene
-- la prima hasta liquidarla con la aseguradora. No se inventa caja.
--
-- Los siniestros (`insurance_claims`) son solo registro: abrir una reclamación
-- no devuelve dinero al usuario. La liquidación la hace el operador y ese asiento
-- irá en su propio lote, con su propia clave de idempotencia.
--
-- Idempotente: el asiento lleva clave `INS-<compañía>-<referencia>` y la póliza
-- tiene `policy_ref` único, así que un doble clic devuelve la póliza ya emitida
-- en vez de cobrar dos primas. La semilla usa `on conflict do nothing` para no
-- pisar primas que el operador ya haya corregido.

begin;

create table if not exists public.insurance_policies (
  id          uuid primary key default gen_random_uuid(),
  policy_ref  text   not null unique,
  user_id     uuid   not null references public.users(id) on delete cascade,
  company     text   not null,
  product     text   not null,
  premium     numeric(14,2) not null check (premium > 0),
  currency    text   not null default 'XAF',
  status      text   not null default 'active'
                     check (status in ('active','cancelled','expired')),
  insured     jsonb,
  journal_id  uuid   references public.ledger_journals(id),
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.insurance_claims (
  id             uuid primary key default gen_random_uuid(),
  claim_ref      text   not null unique,
  policy_id      uuid   not null references public.insurance_policies(id) on delete cascade,
  user_id        uuid   not null references public.users(id) on delete cascade,
  amount_claimed numeric(14,2) not null check (amount_claimed > 0),
  status         text   not null default 'abierto'
                        check (status in ('abierto','en_revision','liquidado','rechazado')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ix_insurance_polizas_usuario
  on public.insurance_policies (user_id, created_at desc);
create index if not exists ix_insurance_siniestros_poliza
  on public.insurance_claims (policy_id, created_at desc);

insert into public.service_tariffs (service, variant, amount, concept) values
  ('coge',    'vida',         25000, 'COGE Seguros - Vida, 12 meses'),
  ('coge',    'salud',        40000, 'COGE Seguros - Salud, 12 meses'),
  ('coge',    'auto',         60000, 'COGE Seguros - Auto, 12 meses'),
  ('coge',    'hogar',        18000, 'COGE Seguros - Hogar, 12 meses'),
  ('siat',    'auto',         55000, 'SIAT Guinea - Auto, 12 meses'),
  ('siat',    'empresarial', 120000, 'SIAT Guinea - Empresarial, 12 meses'),
  ('siat',    'transporte',  90000, 'SIAT Guinea - Transporte, 12 meses'),
  ('allianz', 'vida',         28000, 'Allianz GE - Vida, 12 meses'),
  ('allianz', 'salud',        45000, 'Allianz GE - Salud, 12 meses'),
  ('allianz', 'viaje',        15000, 'Allianz GE - Viaje, 12 meses')
on conflict (service, variant) do nothing;

create or replace function public.insurance_take_out(
  p_user_id uuid,
  p_company text,
  p_product text,
  p_ref     text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t     public.service_tariffs;
  pol   public.insurance_policies;
  r     jsonb;
begin
  if p_user_id is null then
    raise exception 'insurance_take_out necesita el usuario que contrata';
  end if;
  if nullif(p_ref, '') is null then
    raise exception 'insurance_take_out necesita la referencia de la poliza';
  end if;

  select * into pol from public.insurance_policies where policy_ref = p_ref;
  if found then
    return jsonb_build_object('ok', true, 'idempotent', true,
      'policy_id', pol.id, 'policy_ref', pol.policy_ref,
      'company', pol.company, 'product', pol.product,
      'premium', pol.premium, 'currency', pol.currency,
      'journal_id', pol.journal_id, 'status', pol.status);
  end if;

  select * into t from public.service_tariffs
   where service = p_company and variant = p_product and active;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'TARIFF_NOT_FOUND',
      'company', p_company, 'product', p_product);
  end if;

  r := public.ledger_post(
    p_user_id,
    'pago_servicio',
    'INS-' || upper(p_company) || '-' || upper(p_ref),
    coalesce(t.concept, p_company || ' ' || p_product),
    jsonb_build_array(
      jsonb_build_object('wallet_user_id', p_user_id, 'entry_type', 'debit',  'amount', t.amount),
      jsonb_build_object('account', 'SYS-SUSPENSE',    'entry_type', 'credit', 'amount', t.amount)
    ),
    p_company || ':' || p_ref
  );

  insert into public.insurance_policies
    (policy_ref, user_id, company, product, premium, currency, journal_id, expires_at)
  values
    (p_ref, p_user_id, p_company, p_product, round(t.amount * 100) / 100, t.currency,
     (r->>'journal_id')::uuid, now() + interval '12 months')
  returning * into pol;

  return jsonb_build_object(
    'ok', true,
    'policy_id', pol.id,
    'policy_ref', pol.policy_ref,
    'company', pol.company,
    'product', pol.product,
    'premium', pol.premium,
    'currency', pol.currency,
    'journal_id', pol.journal_id,
    'status', pol.status,
    'expires_at', to_char(pol.expires_at, 'YYYY-MM-DD')
  );
end;
$$;

alter table public.insurance_policies enable row level security;
alter table public.insurance_claims  enable row level security;

revoke all on public.insurance_policies, public.insurance_claims from anon, authenticated;
grant select, insert, update, delete on public.insurance_policies, public.insurance_claims to service_role;

revoke all on function public.insurance_take_out(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.insurance_take_out(uuid, text, text, text) to service_role;

select
  (select count(*) from information_schema.tables
     where table_schema = 'public'
       and table_name in ('insurance_policies','insurance_claims')) as tablas,
  (select count(*) from public.service_tariffs
     where service in ('coge','siat','allianz')) as primas,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'insurance_take_out') as funciones,
  (select (v->>'rotos')::int from public.ledger_verify_chain() v) as cadenas_rotas;

commit;
