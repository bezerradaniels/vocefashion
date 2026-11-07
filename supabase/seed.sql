-- Dados iniciais da loja (gerados a partir de src/data/catalog.ts).
-- Nomes, preços, estoque e textos dos produtos são ilustrativos: conferir com a loja.
-- Rodar uma vez, depois de todas as migrações (SQL Editor ou `supabase db reset` no ambiente local).

insert into public.categories (id, name, active, position) values
  ('vestidos', 'Vestidos', true, 0),
  ('blusas', 'Blusas', true, 1),
  ('calcas', 'Calças', true, 2);

insert into public.products (id, slug, category_id, name, price, old_price, description, description_more, photo_label, images, active, created_at) overriding system value values
  (1, 'vestido-longo-frente-unica-listrado-azul', 'vestidos', 'Vestido Longo Frente Única Listrado', 229.9, null, 'Vestido longo frente única, com alças finas amarradas no pescoço e listras em azul e off-white. O recorte baixo abre numa saia rodada com babado, leve para os dias de calor.', 'Costas abertas com amarração. Fica lindo com rasteirinha de dia ou sandália de salto à noite.', 'foto · vestido listrado azul', array['/produtos/vestido-longo-frente-unica-listrado-azul/01.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/02.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/03.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/04.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/05.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/06.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/07.webp', '/produtos/vestido-longo-frente-unica-listrado-azul/08.webp']::text[], true, now() - interval '0 days'),
  (2, 'vestido-curto-frente-unica-chocolate', 'vestidos', 'Vestido Curto Frente Única Chocolate', 179.9, null, 'Vestido curto frente única na cor chocolate, com argola dourada no decote e recorte na cintura baixa. A saia franzida dá movimento e valoriza a silhueta.', 'Costas nuas com laço de amarração. Combina com sandália de amarrar dourada para uma noite especial.', 'foto · vestido curto chocolate', array['/produtos/vestido-curto-frente-unica-chocolate/01.webp', '/produtos/vestido-curto-frente-unica-chocolate/02.webp', '/produtos/vestido-curto-frente-unica-chocolate/03.webp', '/produtos/vestido-curto-frente-unica-chocolate/04.webp', '/produtos/vestido-curto-frente-unica-chocolate/05.webp', '/produtos/vestido-curto-frente-unica-chocolate/06.webp', '/produtos/vestido-curto-frente-unica-chocolate/07.webp', '/produtos/vestido-curto-frente-unica-chocolate/08.webp']::text[], true, now() - interval '1 days'),
  (3, 'vestido-curto-frente-unica-rosa', 'vestidos', 'Vestido Curto Frente Única Rosa', 129.9, 149.9, 'Vestido curto rosa com decote frente única drapeado e gota no centro. Saia em camadas com babado, fresquinho para o dia a dia.', 'Amarração no pescoço para ajustar. Vai bem com rasteirinha dourada.', 'foto · vestido curto rosa', array['/produtos/vestido-curto-frente-unica-rosa/01.webp', '/produtos/vestido-curto-frente-unica-rosa/02.webp', '/produtos/vestido-curto-frente-unica-rosa/03.webp', '/produtos/vestido-curto-frente-unica-rosa/04.webp', '/produtos/vestido-curto-frente-unica-rosa/05.webp', '/produtos/vestido-curto-frente-unica-rosa/06.webp', '/produtos/vestido-curto-frente-unica-rosa/07.webp', '/produtos/vestido-curto-frente-unica-rosa/08.webp']::text[], true, now() - interval '2 days'),
  (4, 'blusa-capa-cropped-off-white', 'blusas', 'Blusa Capa Cropped Off-White', 119.9, null, 'Blusa cropped em tecido fluido, com mangas em capa abertas nas laterais e decote canoa. Caimento leve que deixa qualquer look mais elegante.', 'Na foto, combinada com short de alfaiataria chocolate com cinto.', 'foto · blusa capa off-white', array['/produtos/blusa-capa-cropped-off-white/01.webp', '/produtos/blusa-capa-cropped-off-white/02.webp', '/produtos/blusa-capa-cropped-off-white/03.webp', '/produtos/blusa-capa-cropped-off-white/04.webp', '/produtos/blusa-capa-cropped-off-white/05.webp', '/produtos/blusa-capa-cropped-off-white/06.webp', '/produtos/blusa-capa-cropped-off-white/07.webp', '/produtos/blusa-capa-cropped-off-white/08.webp']::text[], true, now() - interval '3 days'),
  (5, 'blusa-ombro-so-assimetrica-chocolate', 'blusas', 'Blusa Ombro Só Assimétrica Chocolate', 99.9, 119.9, 'Blusa de um ombro só com caimento assimétrico em capa, na cor chocolate. Movimento bonito e visual elegante sem esforço.', 'Na foto, combinada com short de alfaiataria off-white.', 'foto · blusa ombro só chocolate', array['/produtos/blusa-ombro-so-assimetrica-chocolate/01.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/02.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/03.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/04.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/05.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/06.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/07.webp', '/produtos/blusa-ombro-so-assimetrica-chocolate/08.webp']::text[], true, now() - interval '4 days'),
  (6, 'blusa-frente-unica-assimetrica-marinho', 'blusas', 'Blusa Frente Única Assimétrica Marinho', 109.9, null, 'Blusa frente única de gola alta, com babado assimétrico que cai até o quadril. Azul-marinho intenso, ótima com short ou calça de alfaiataria.', 'Costas abertas. Na foto, com short de alfaiataria cinza.', 'foto · blusa marinho', array['/produtos/blusa-frente-unica-assimetrica-marinho/01.webp', '/produtos/blusa-frente-unica-assimetrica-marinho/02.webp', '/produtos/blusa-frente-unica-assimetrica-marinho/03.webp']::text[], true, now() - interval '5 days'),
  (7, 'calca-jeans-wide-leg-recortes', 'calcas', 'Calça Jeans Wide Leg com Recortes', 189.9, null, 'Calça jeans wide leg de cintura alta, com recortes verticais na frente e bolsos embutidos. Lavagem média, confortável e alonga a silhueta.', 'Barra larga que cai sobre o sapato. Na foto, com top branco de alcinha.', 'foto · calça jeans wide leg', array['/produtos/calca-jeans-wide-leg-recortes/01.webp', '/produtos/calca-jeans-wide-leg-recortes/02.webp', '/produtos/calca-jeans-wide-leg-recortes/03.webp', '/produtos/calca-jeans-wide-leg-recortes/04.webp', '/produtos/calca-jeans-wide-leg-recortes/05.webp', '/produtos/calca-jeans-wide-leg-recortes/06.webp', '/produtos/calca-jeans-wide-leg-recortes/07.webp', '/produtos/calca-jeans-wide-leg-recortes/08.webp', '/produtos/calca-jeans-wide-leg-recortes/09.webp']::text[], true, now() - interval '6 days');

select setval(pg_get_serial_sequence('public.products', 'id'), (select max(id) from public.products));

-- O gatilho criou o estoque zerado; aqui entram as quantidades.
update public.product_stock s set qty = v.qty from (values
  (1, 'P'::public.product_size, 2),
  (1, 'M'::public.product_size, 3),
  (1, 'G'::public.product_size, 2),
  (1, 'GG'::public.product_size, 1),
  (2, 'P'::public.product_size, 1),
  (2, 'M'::public.product_size, 2),
  (2, 'G'::public.product_size, 2),
  (2, 'GG'::public.product_size, 0),
  (3, 'P'::public.product_size, 2),
  (3, 'M'::public.product_size, 3),
  (3, 'G'::public.product_size, 1),
  (3, 'GG'::public.product_size, 1),
  (4, 'P'::public.product_size, 3),
  (4, 'M'::public.product_size, 3),
  (4, 'G'::public.product_size, 2),
  (4, 'GG'::public.product_size, 1),
  (5, 'P'::public.product_size, 1),
  (5, 'M'::public.product_size, 2),
  (5, 'G'::public.product_size, 1),
  (5, 'GG'::public.product_size, 0),
  (6, 'P'::public.product_size, 2),
  (6, 'M'::public.product_size, 2),
  (6, 'G'::public.product_size, 1),
  (6, 'GG'::public.product_size, 1),
  (7, 'P'::public.product_size, 2),
  (7, 'M'::public.product_size, 3),
  (7, 'G'::public.product_size, 3),
  (7, 'GG'::public.product_size, 1)
) as v (product_id, size, qty) where s.product_id = v.product_id and s.size = v.size;

insert into public.store_settings (name, logo, description, phone, instagram, address, pix_enabled, pix_discount_percent, pix_expiry_minutes, card_enabled, card_installments, local_cep_prefix, local_city_label) values
  ('Você Fashion', '/logo-voce-fashion.jpg', 'Moda feminina em Bom Jesus da Lapa (BA). Loja física no Centro, com retirada em até 2h e entrega no mesmo dia na cidade.', '', '', 'Centro · Bom Jesus da Lapa — BA', true, 5, 120, true, 3, '476', 'Bom Jesus da Lapa — BA');

insert into public.shipping_methods (id, name, sub, price, enabled, scope, pickup, free_above, position) values
  ('retirada', 'Retirar na loja', 'Centro · Bom Jesus da Lapa · pronto em 2h', 0, true, 'local', true, null, 0),
  ('moto', 'Entrega Você Fashion', 'Motoboy · hoje até 19h', 7, true, 'local', false, 199, 1),
  ('pac', 'Correios PAC', '6 a 9 dias úteis', 22.9, true, 'national', false, null, 2),
  ('sedex', 'Correios SEDEX', '2 a 4 dias úteis', 39.9, true, 'national', false, null, 3);

insert into public.hero (enabled, tag, title, cta, target, image, image_alt) values
  (true, 'Até 17% off', 'Leveza para o calor da Lapa', 'Ver promoções', 'promocao', '/banner/campanha.webp', 'Modelo com vestido longo listrado azul e off-white');

-- Cupons de exemplo (o uso começa do zero).
insert into public.coupons (code, type, value, min_subtotal, active, expires_at, usage_limit) values
  ('BEMVINDA10', 'percent', 10, 0, true, null, null),
  ('LAPA20', 'fixed', 20, 150, true, null, 50);
