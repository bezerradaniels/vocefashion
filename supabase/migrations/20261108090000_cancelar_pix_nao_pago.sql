-- =============================================================================
-- Cancelamento automático de pedidos Pix não pagos
--
-- Pedido Pix "Aguardando pagamento" há mais tempo que store_settings.pix_expiry_minutes
-- vira "Cancelado" e as peças voltam ao estoque (gatilho orders_status_stock).
-- Roda de duas formas:
--   * a cada 5 minutos pelo pg_cron (tarefa "cancelar-pix-nao-pagos");
--   * no início de cada place_order, para a peça vencida já estar livre na compra seguinte.
-- pix_expiry_minutes = 0 desliga o cancelamento automático.
-- =============================================================================

alter table public.store_settings
  add column pix_expiry_minutes integer not null default 120
    check (pix_expiry_minutes between 0 and 10080);

comment on column public.store_settings.pix_expiry_minutes is
  'Minutos para pagar um pedido Pix antes do cancelamento automático (0 = desligado).';

-- Quando o pedido foi cancelado pelo sistema (null = não foi cancelado automaticamente).
alter table public.orders add column auto_cancelled_at timestamptz;

create index orders_pix_waiting_idx on public.orders (created_at)
  where status = 'aguardando_pagamento' and payment = 'pix';

/**
 * Cancela os pedidos Pix vencidos e devolve quantos foram cancelados.
 * security definer: roda também a partir de place_order, chamado por visitantes.
 */
create function public.cancel_expired_pix_orders()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  minutes integer;
  cancelled integer;
begin
  select pix_expiry_minutes into minutes from public.store_settings where id;
  if coalesce(minutes, 0) <= 0 then
    return 0;
  end if;
  -- skip locked: se outra chamada já está cancelando um pedido, não espera por ele.
  with expired as (
    select id from public.orders
    where status = 'aguardando_pagamento'
      and payment = 'pix'
      and created_at < now() - make_interval(mins => minutes)
    for update skip locked
  )
  update public.orders o
  set status = 'cancelado', auto_cancelled_at = now()
  from expired
  where o.id = expired.id;
  get diagnostics cancelled = row_count;
  return cancelled;
end;
$$;

revoke execute on function public.cancel_expired_pix_orders() from public, anon, authenticated;

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  st public.store_settings;
  ship public.shipping_methods;
  cust jsonb := coalesce(payload -> 'customer', '{}'::jsonb);
  deliv jsonb := coalesce(payload -> 'delivery', '{}'::jsonb);
  pay public.payment_method;
  cep text := regexp_replace(coalesce(deliv ->> 'cep', ''), '\D', '', 'g');
  is_local boolean;
  item record;
  missing text[] := '{}';
  subtotal numeric := 0;
  coupon jsonb;
  coupon_discount numeric := 0;
  coupon_code text;
  base numeric;
  shipping_cost numeric;
  pix_discount numeric := 0;
  total numeric;
  new_order public.orders;
begin
  -- Pedidos Pix vencidos devolvem as peças antes de conferir o estoque (não depende só do agendamento).
  perform public.cancel_expired_pix_orders();

  -- Cliente
  if coalesce(cust ->> 'nome', '') !~ '\S+\s+\S+' then
    raise exception 'Informe nome e sobrenome' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;
  if coalesce(cust ->> 'email', '') !~ '^\S+@\S+\.\S{2,}$' then
    raise exception 'Confira seu e-mail' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;
  if length(regexp_replace(coalesce(cust ->> 'cel', ''), '\D', '', 'g')) < 11 then
    raise exception 'Celular com DDD' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;
  if not public.is_valid_cpf(cust ->> 'cpf') then
    raise exception 'CPF inválido' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;

  -- Pagamento
  select * into st from public.store_settings where id;
  if not found then
    raise exception 'Loja sem configuração' using errcode = 'P0001', hint = 'pagamento';
  end if;
  begin
    pay := (payload ->> 'payment')::public.payment_method;
  exception when others then
    pay := null;
  end;
  if pay is null or (pay = 'pix' and not st.pix_enabled) or (pay = 'card' and not st.card_enabled) then
    raise exception 'Forma de pagamento indisponível' using errcode = 'P0001', hint = 'pagamento';
  end if;

  -- Itens: junta repetidos, trava o estoque em ordem fixa (evita deadlock) e confere.
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'Sua sacola está vazia' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;

  if to_regclass('pg_temp._items') is not null then
    drop table pg_temp._items;
  end if;
  create temporary table _items on commit drop as
  select
    (i ->> 'product_id')::bigint as product_id,
    (i ->> 'size')::public.product_size as size,
    sum((i ->> 'qty')::integer)::integer as qty
  from jsonb_array_elements(payload -> 'items') as i
  group by 1, 2;

  if exists (select 1 from _items where qty is null or qty <= 0 or product_id is null) then
    raise exception 'Quantidade inválida na sacola' using errcode = 'P0001', hint = 'dados_invalidos';
  end if;

  perform 1
  from public.product_stock s
  join _items i on i.product_id = s.product_id and i.size = s.size
  order by s.product_id, s.size
  for update of s;

  for item in
    select i.product_id, i.size, i.qty, p.name, p.price, p.active, coalesce(s.qty, 0) as available
    from _items i
    left join public.products p on p.id = i.product_id
    left join public.product_stock s on s.product_id = i.product_id and s.size = i.size
    order by i.product_id, i.size
  loop
    if item.name is null or not item.active or item.available < item.qty then
      missing := missing || (coalesce(item.name, 'Peça indisponível') || ' (' || item.size || ')');
    else
      subtotal := subtotal + item.price * item.qty;
    end if;
  end loop;

  if array_length(missing, 1) > 0 then
    raise exception 'Sem estoque suficiente: %. Ajuste a sacola para continuar.', array_to_string(missing, ', ')
      using errcode = 'P0001', hint = 'sem_estoque';
  end if;

  -- Cupom
  if nullif(trim(coalesce(payload ->> 'coupon_code', '')), '') is not null then
    coupon := public.evaluate_coupon(payload ->> 'coupon_code', subtotal);
    if not (coupon ->> 'ok')::boolean then
      raise exception '%', coupon ->> 'error' using errcode = 'P0001', hint = 'cupom';
    end if;
    coupon_code := coupon ->> 'code';
    coupon_discount := (coupon ->> 'discount')::numeric;
    update public.coupons set used = used + 1 where code = coupon_code;
  end if;

  -- Entrega
  if length(cep) <> 8 then
    raise exception 'CEP com 8 dígitos' using errcode = 'P0001', hint = 'entrega';
  end if;
  is_local := st.local_cep_prefix <> '' and cep like st.local_cep_prefix || '%';
  select * into ship from public.shipping_methods
  where id = deliv ->> 'method_id' and enabled and (is_local or scope = 'national');
  if not found then
    raise exception 'Forma de entrega indisponível para este CEP' using errcode = 'P0001', hint = 'entrega';
  end if;
  if not ship.pickup and (
    trim(coalesce(deliv ->> 'rua', '')) = ''
    or trim(coalesce(deliv ->> 'num', '')) = ''
    or trim(coalesce(deliv ->> 'bairro', '')) = ''
  ) then
    raise exception 'Informe rua, número e bairro' using errcode = 'P0001', hint = 'entrega';
  end if;
  shipping_cost := case when ship.free_above is not null and subtotal >= ship.free_above then 0 else ship.price end;

  -- Valores (mesma conta do checkout)
  base := subtotal - coupon_discount;
  if pay = 'pix' then
    pix_discount := (round(base * st.pix_discount_percent) / 100)::numeric(10, 2);
  end if;
  total := (base + shipping_cost - pix_discount)::numeric(10, 2);

  insert into public.orders (
    customer_name, customer_email, customer_phone, customer_cpf,
    shipping_method_id, shipping_method_name, pickup, cep, city,
    street, street_number, district, complement,
    payment, subtotal, shipping_cost, coupon_code, coupon_discount, pix_discount, total
  ) values (
    trim(cust ->> 'nome'), lower(trim(cust ->> 'email')), cust ->> 'cel', cust ->> 'cpf',
    ship.id, ship.name, ship.pickup,
    substr(cep, 1, 5) || '-' || substr(cep, 6), case when is_local then st.local_city_label else '' end,
    case when ship.pickup then '' else trim(deliv ->> 'rua') end,
    case when ship.pickup then '' else trim(deliv ->> 'num') end,
    case when ship.pickup then '' else trim(deliv ->> 'bairro') end,
    case when ship.pickup then '' else trim(coalesce(deliv ->> 'comp', '')) end,
    pay, subtotal, shipping_cost, coupon_code, coupon_discount, pix_discount, total
  )
  returning * into new_order;

  insert into public.order_items (order_id, product_id, name, size, qty, price)
  select new_order.id, i.product_id, p.name, i.size, i.qty, p.price
  from _items i
  join public.products p on p.id = i.product_id;

  update public.product_stock s
  set qty = s.qty - i.qty
  from _items i
  where s.product_id = i.product_id and s.size = i.size;

  return jsonb_build_object(
    'id', new_order.id,
    'number', new_order.number,
    'subtotal', subtotal,
    'shipping_cost', shipping_cost,
    'coupon_code', coupon_code,
    'coupon_discount', coupon_discount,
    'pix_discount', pix_discount,
    'total', total
  );
exception
  when invalid_text_representation then
    raise exception 'Sacola com item inválido' using errcode = 'P0001', hint = 'dados_invalidos';
end;
$$;

-- Agendamento: a cada 5 minutos. (pg_cron já vem no Supabase; aqui só é ativado.)
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cancelar-pix-nao-pagos',
  '*/5 * * * *',
  'select public.cancel_expired_pix_orders()'
);
