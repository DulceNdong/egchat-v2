-- EGPay - Lote C-2: el candado de los asientos cerrados estaba huero.
--
-- Que esta pasando: la funcion `ledger_journals_immutable` existe en el esquema y su
-- cuerpo es correcto ("no se admiten borrados", "un asiento publicado no se
-- modifica"), pero NINGUN disparador la llama. Medido en la base de pruebas:
--
--   select tgname from pg_trigger where tgrelid='public.ledger_journals'::regclass;
--     trg_ledger_flag_wallet_apply
--     trg_ledger_journal_apply_wallets
--     trg_ledger_journal_chain_immutable
--     trg_ledger_journal_chain_on_close
--     trg_ledger_journal_post_guard
--     trg_ledger_journal_source_guard
--
-- `ledger_entries` si tiene el suyo (`trg_ledger_entries_immutable`). O sea: las
-- lineas de un asiento cerrado no se pueden borrar mientras el asiento siga
-- cerrado, pero el estado del asiento se puede cambiar a mano y entonces el candado
-- de las lineas deja de aplicar. Comprobado aqui mismo:
--
--   update public.ledger_journals set status='draft' where user_id = <prueba>;  --> UPDATE 4
--
-- Cuatro asientos `posted` reabiertos con un update corriente. A partir de ahi sus
-- lineas se borran, el asiento desaparece y el dinero que registro deja de existir
-- sin dejar rastro. La unica correccion legitima de un asiento es el abono
-- (`ledger_reverse_journal`), que añade uno nuevo enfrente y marca el original como
-- `reversed`.
--
-- Este lote reescribe la funcion con esas cuatro reglas --la version que estaba
-- escrita bajaba cualquier update de una fila cerrada, lo que hubiese roto el abono,
-- que tambien toca filas de un asiento ya cerrado-- y le engrana el disparador que
-- faltaba. Reglas despues del lote:
--   1. Ningun asiento se borra.
--   2. Un asiento `posted` no cambia de estado salvo a `reversed`.
--   3. La identidad contable (reference, idempotency_key, hash, prev_hash,
--      chain_seq, total_amount) de un asiento cerrado no se toca.
--   4. Un asiento `reversed` ya no se vuelve a mover.
--
-- Idempotente: `create or replace function` y el disparador se crea solo si no
-- existe. Se puede pegar dos veces.

begin;

create or replace function public.ledger_journals_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'ledger_journals es inmutable: un asiento no se borra, se corrige con ledger_reverse_journal';
  end if;

  if old.status = 'reversed' then
    raise exception 'el asiento % ya esta revertido y no se vuelve a tocar', old.id;
  end if;

  if old.status = 'posted' then
    if new.status is distinct from old.status and new.status <> 'reversed' then
      raise exception 'el asiento % no se reabre (% -> %): se corrige con un abono',
        old.id, old.status, new.status;
    end if;
    if new.reference        is distinct from old.reference
       or new.idempotency_key is distinct from old.idempotency_key
       or new.hash            is distinct from old.hash
       or new.prev_hash       is distinct from old.prev_hash
       or new.chain_seq       is distinct from old.chain_seq
       or new.total_amount    is distinct from old.total_amount
       or new.user_id         is distinct from old.user_id then
      raise exception 'la identidad contable del asiento % no se modifica', old.id;
    end if;
  end if;

  return new;
end;
$$;

-- El disparador que faltaba. BEFORE UPDATE OR DELETE sobre toda la fila.
do $$ begin
  if not exists (select 1 from pg_trigger
                 where tgrelid = 'public.ledger_journals'::regclass
                   and tgname  = 'trg_ledger_journals_immutable') then
    create trigger trg_ledger_journals_immutable
      before update or delete on public.ledger_journals
      for each row execute function public.ledger_journals_immutable();
  end if;
end $$;

-- Autocomprobacion: `disparador` vale 1 cuando el candado esta engranado, y
-- `reapertura_bloqueada` vale 1 cuando intentar abrir un asiento cerrado falla.
-- Esta ultima prueba se hace dentro de una transaccion de ahorro que se deshace,
-- asi que no deja ninguna fila tocada.
do $$
declare
  j   record;
  n   int;
begin
  select count(*) into n from pg_trigger
    where tgrelid = 'public.ledger_journals'::regclass and tgname = 'trg_ledger_journals_immutable';
  raise notice 'LOTE C-2: disparador = %', n;

  select * into j from public.ledger_journals where status = 'posted' order by chain_seq desc limit 1;
  if j.id is null then
    raise notice 'LOTE C-2: no hay ningun asiento cerrado todavia; nada que intentar reabrir';
    return;
  end if;

  -- El bloque con exception hace de transaccion de ahorro: el update de prueba se
  -- deshace solo y no queda ninguna fila tocada.
  begin
    update public.ledger_journals set status = 'draft' where id = j.id;
    raise notice 'LOTE C-2: reapertura_bloqueada = 0 -- el candado NO aplica, revisa el disparador';
  exception when others then
    raise notice 'LOTE C-2: reapertura_bloqueada = 1 -- %', left(sqlerrm, 90);
  end;

  begin
    delete from public.ledger_journals where id = j.id;
    raise notice 'LOTE C-2: borrado_bloqueado = 0 -- se puede borrar un asiento cerrado';
  exception when others then
    raise notice 'LOTE C-2: borrado_bloqueado = 1 -- %', left(sqlerrm, 90);
  end;
end $$;

commit;
