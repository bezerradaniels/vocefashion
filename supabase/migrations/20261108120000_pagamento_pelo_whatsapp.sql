-- =============================================================================
-- Pagamento combinado pelo WhatsApp / Instagram / painel (sem cobrança no site)
--
-- O pedido do site só reserva as peças; a loja combina o pagamento e muda a situação.
-- Por isso o cancelamento automático fica desligado por padrão (0). A loja pode ligar de novo
-- em Painel → Dados da loja → Prazo para pagar o Pix.
-- =============================================================================

alter table public.store_settings alter column pix_expiry_minutes set default 0;
update public.store_settings set pix_expiry_minutes = 0;

comment on column public.orders.payment is
  'Forma de pagamento preferida pela cliente (nada é cobrado no site).';
