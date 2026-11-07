# Você Fashion — loja virtual (mobile-first) + painel

Vite + React + TypeScript, Tailwind CSS 4 e React Router. Implementação do handoff em `docs/design/` (Vitrine, Produto, Checkout) e painel administrativo em `/admin`.

```bash
npm install
npm run dev       # http://localhost:5173  ·  painel: http://localhost:5173/admin
npm run build            # dist/ para a raiz de um domínio (ex.: vocefashion.com.br)
npm run build:mintcode   # dist/ para a subpasta mintcode.digital/voce-fashion/
npm run preview   # serve o dist/ localmente
```

## Modo demonstração (sem backend)

Ainda não há servidor. Produtos, categorias, cupons, pedidos e dados da loja ficam no **localStorage do navegador** (`src/lib/db.ts`), começando com os dados de exemplo de `src/data/catalog.ts` e `src/data/seed-orders.ts`.

- O que é alterado no painel aparece na loja **aberta no mesmo navegador**. Outras pessoas não veem.
- O login do painel é de demonstração: o e-mail e a senha de teste estão em `src/admin/demo-credentials.ts` (e a tela de login tem o botão "Preencher acesso de demonstração"). A senha é conferida no navegador, então **não protege nada**.
- "Dados da loja → Restaurar dados de demonstração" volta tudo ao exemplo inicial.

## Banco de dados (Supabase) — em andamento

Projeto: [`vigxmmeiqjhbcujvsjge`](https://supabase.com/dashboard/project/vigxmmeiqjhbcujvsjge). O banco já está desenhado e testado, mas **o site ainda usa o localStorage**: a troca de `src/lib/db.ts` é o próximo passo.

| Arquivo | O que é |
|---|---|
| `supabase/migrations/20261107120000_estrutura_inicial.sql` | Tabelas, regras de acesso (RLS), funções do checkout e bucket de fotos |
| `supabase/seed.sql` | Catálogo inicial (gerado de `src/data/catalog.ts` com `npm run db:seed-sql`) |
| `src/lib/supabase.ts` | Cliente do Supabase (só liga com as variáveis do `.env.example`) |
| `.mcp.json` | Servidor MCP do Supabase para o Claude Code deste projeto |

**Regras principais**
- Visitante lê só a vitrine (categorias e produtos ativos, estoque, dados da loja, entregas, banner). Não lê cupons nem pedidos.
- O pedido é criado pela função `place_order`, que **recalcula tudo no servidor** (preço, frete, cupom, Pix) e trava o estoque na mesma transação: duas clientes não levam a mesma última peça.
- `check_coupon` valida um cupom sem expor a lista de cupons.
- Cancelar um pedido devolve as peças ao estoque; reativar baixa de novo (e é bloqueado se não houver peça).
- Só administradoras (tabela `admin_users`) alteram catálogo, cupons, loja e situação dos pedidos, e enviam fotos ao bucket `produtos`.

**Aplicar no projeto (uma vez)**
1. Supabase → SQL Editor: rodar a migração e depois o `seed.sql` (ou `npx supabase link --project-ref vigxmmeiqjhbcujvsjge && npx supabase db push`).
2. Authentication → Users: criar a usuária da loja. No SQL Editor:
   `insert into public.admin_users (user_id) select id from auth.users where email = 'email-da-loja';`
3. Copiar `.env.example` para `.env.local` e colar a chave publicável (Project Settings → API Keys).
4. Gerar os tipos: `npm run db:types`.

**MCP no Claude Code (máquina local):** o `.mcp.json` já aponta para o projeto. Rode `claude /mcp` num terminal, escolha `supabase` → Authenticate.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/main.tsx` | Entrada do app e rotas (o painel é carregado sob demanda) |
| `src/routes/` | Páginas da loja: vitrine, produto, checkout, 404 |
| `src/index.css` | Tokens do design (`@theme`): cores, raios, fontes |
| `src/data/catalog.ts` | Tipos, dados iniciais e regras (vitrines, frete, cupons) |
| `src/lib/db.ts` | "Banco" da loja (hooks `useProducts`, `useOrders`… e `dbActions`) |
| `src/lib/store.ts` | Sacola e favoritos da cliente |
| `src/components/` | Telas da loja (vitrine, produto, sacola, checkout, banner) |
| `src/admin/` | Painel: login, layout, componentes e páginas em `pages/` |
| `public/produtos/<slug>/` | Fotos dos produtos de demonstração em WebP (`01.webp` = capa), feitas a partir das fotos da cliente (3:4, 960×1280) |
| `public/banner/campanha.webp` | Foto 4:5 do banner da home |
| `public/produtos/<slug>/og.jpg`, `public/og-home.jpg` | Fotos JPG para a prévia de links compartilhados |
| `vite/seo.ts` | Tags de compartilhamento e páginas de produto geradas no build |
| `docs/design/` | Handoff original: README, briefing, protótipo HTML e logo |

## Painel (`/admin`)

- **Início:** faturamento, pedidos pagos, ticket médio, pendentes de pagamento, vendas por dia, pedidos recentes, estoque baixo, mais vendidos.
- **Pedidos:** filtro por situação e busca; detalhe com itens, cliente (atalho de WhatsApp), entrega e troca de situação (cancelar devolve ao estoque).
- **Produtos:** cadastro, edição, fotos 4:5, preço promocional, estoque por tamanho, mostrar/ocultar na loja.
- **Categorias:** criar, renomear, ordenar, ocultar e excluir (só se estiver vazia).
- **Cupons e promoções:** cupons (% ou R$, mínimo, validade, limite de usos), banner da home com prévia e preços promocionais.
- **Dados da loja:** nome, logo, descrição, endereço, WhatsApp, Instagram, formas de pagamento (Pix com desconto, cartão com parcelas) e formas de entrega.

## Publicação

É um site estático: envie o conteúdo de `dist/` para a pasta do site na hospedagem.

- **Gere o build para a pasta certa.** O endereço da pasta entra no build (`base` do Vite): use `npm run build` para a raiz do domínio e `npm run build:mintcode` para `/voce-fashion/`. Para outra subpasta: `npx vite build --base=/nome-da-pasta/`. Build da raiz numa subpasta = página em branco (CSS e JS com erro 404).
- O build gera um `.htaccess` (Apache/LiteSpeed, ex.: Hostinger) com a pasta certa, para que `/produto/...`, `/checkout` e `/admin` abram ao recarregar. Ele é um arquivo oculto: confira se foi enviado.
- **Prévia de links (WhatsApp, Instagram) e Google:** `vite/seo.ts` coloca título, descrição e tags Open Graph no `index.html` e gera `produto/<slug>.html` para cada peça do catálogo inicial (foto, preço e dados estruturados de Product). O domínio vem de `VITE_SITE_URL` em `.env.production` (build da raiz) e `.env.mintcode` (build da subpasta): **confirme o domínio definitivo** antes de publicar. A foto de compartilhamento de cada peça é `public/produtos/<slug>/og.jpg` (JPG 600×800); a da home é `public/og-home.jpg`.

## Pendências para produção

- **Backend (Supabase):** banco, RLS e funções prontos (ver "Banco de dados"). Falta: aplicar no projeto, trocar `src/lib/db.ts` por chamadas ao Supabase (mesmos hooks e ações), login com Supabase Auth (apagar `demo-credentials.ts`) e upload das fotos para o Storage.
- **Pedidos Pix não pagos:** `place_order` já baixa o estoque; falta cancelar sozinho o pedido "Aguardando pagamento" depois de um prazo (ex.: `pg_cron` a cada 15 min), para a peça voltar à vitrine.
- **Produtos de demonstração:** os 7 produtos usam as fotos reais da cliente, mas nomes, preços, estoque e descrições são ilustrativos. Conferir com a loja (inclusive se as blusas capa são vendidas em conjunto com o short).
- **Logo:** pedir à cliente o logo em PNG/SVG com fundo transparente.
- **Frete:** ViaCEP + API de frete (Melhor Envio/Correios). Hoje a regra é pelo início do CEP configurado no painel.
- **Pagamento:** gateway (QR Code e copia-e-cola do Pix, cartão). Hoje o pedido é registrado, mas nada é cobrado.
- **Estoque:** a sacola e o pedido já respeitam o estoque deste navegador; com o Supabase, a baixa precisa ser feita no servidor (transação), para duas clientes não comprarem a mesma última peça.
- **Páginas de produto geradas no build:** usam o catálogo inicial. Peças criadas ou alteradas só no painel não ganham prévia própria até haver backend.
- **Sem desenho ainda:** "Guia de medidas" (o link foi retirado da página de produto até existir a tabela).
