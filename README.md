# Você Fashion — loja virtual (mobile-first) + painel

Vite + React + TypeScript, Tailwind CSS 4 e React Router. Implementação do handoff em `docs/design/` (Vitrine, Produto, Checkout) e painel administrativo em `/admin`.

```bash
npm install
npm run dev       # http://localhost:5173  ·  painel: http://localhost:5173/admin
npm run build            # dist/ para a raiz de um domínio (ex.: vocefashion.com.br)
npm run build:mintcode   # dist/ para a subpasta mintcode.digital/voce-fashion/
npm run preview   # serve o dist/ localmente
```

## Dados: Supabase ou modo demonstração

`src/lib/db.ts` tem duas implementações com os mesmos hooks (`useProducts`…) e ações (`dbActions`, assíncronas):

- **Supabase (padrão):** com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (já em `.env`), a loja lê e grava no banco (`src/lib/db-supabase.ts`), o painel usa o login do Supabase Auth e as fotos vão para o Storage.
- **Modo demonstração:** sem essas variáveis (ex.: `.env.local` com as duas linhas vazias), tudo fica no localStorage do navegador, a partir de `src/data/catalog.ts` e `src/data/seed-orders.ts`. O login é o de teste (`src/admin/demo-credentials.ts`, conferido no navegador: **não protege nada**).

## Banco de dados (Supabase)

Projeto: [`vigxmmeiqjhbcujvsjge`](https://supabase.com/dashboard/project/vigxmmeiqjhbcujvsjge). Migração e seed aplicados; o site já usa o banco.

| Arquivo | O que é |
|---|---|
| `supabase/migrations/20261107120000_estrutura_inicial.sql` | Tabelas, regras de acesso (RLS), funções do checkout e bucket de fotos |
| `supabase/migrations/20261108090000_cancelar_pix_nao_pago.sql` | Cancelamento automático de pedidos Pix não pagos (pg_cron a cada 5 min) |
| `supabase/migrations/20261108120000_pagamento_pelo_whatsapp.sql` | Desliga o cancelamento automático por padrão (pagamento combinado pelo WhatsApp) |
| `supabase/seed.sql` | Catálogo inicial (gerado de `src/data/catalog.ts` com `npm run db:seed-sql`) |
| `src/lib/supabase.ts` | Cliente do Supabase (liga com as variáveis do `.env`) |
| `src/lib/db-supabase.ts` | Leitura/gravação no banco e conversão para os tipos da loja |
| `.mcp.json` | Servidor MCP do Supabase para o Claude Code deste projeto |

**Regras principais**
- Visitante lê só a vitrine (categorias e produtos ativos, estoque, dados da loja, entregas, banner). Não lê cupons nem pedidos.
- O pedido é criado pela função `place_order`, que **recalcula tudo no servidor** (preço, frete, cupom, Pix) e trava o estoque na mesma transação: duas clientes não levam a mesma última peça.
- `check_coupon` valida um cupom sem expor a lista de cupons.
- Cancelar um pedido devolve as peças ao estoque; reativar baixa de novo (e é bloqueado se não houver peça).
- **Não há pagamento pelo site.** O checkout registra o pedido (reservando as peças) com a forma de pagamento *preferida* e abre o WhatsApp da loja (Dados da loja → Telefone / WhatsApp) com o resumo; sem WhatsApp, copia o resumo e abre o Direct do Instagram. O pagamento é combinado lá e a loja muda a situação no painel.
- Cancelamento automático (opcional, desligado por padrão): pedido Pix "Aguardando pagamento" há mais tempo que o prazo da loja (Dados da loja → Prazo para pagar o Pix) é cancelado sozinho e as peças voltam. Roda a cada 5 minutos (`pg_cron`) e também antes de cada novo pedido. Ao receber o Pix, mude o pedido para "Pago".
- Só administradoras (tabela `admin_users`) alteram catálogo, cupons, loja e situação dos pedidos, e enviam fotos ao bucket `produtos`.

**Aplicar no projeto (uma vez)**
1. Supabase → SQL Editor: rodar as migrações (em ordem de data) e depois o `seed.sql` (ou `npx supabase link --project-ref vigxmmeiqjhbcujvsjge && npx supabase db push`).
2. Authentication → Users: criar a usuária da loja. No SQL Editor:
   `insert into public.admin_users (user_id) select id from auth.users where email = 'email-da-loja';`
3. Gerar os tipos (opcional): `npm run db:types`.

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

### Deploy automático na Hostinger (vocefashion.com.br)

O workflow `.github/workflows/deploy-hostinger.yml` faz o build da raiz (`npm run build`) e envia `dist/` por FTP a cada push na `main` (ou manualmente em Actions → *Deploy na Hostinger* → *Run workflow*).

Configure uma vez em GitHub → Settings → Secrets and variables → Actions → *New repository secret*:

| Secret | Valor (hPanel → Arquivos → Contas FTP) |
|---|---|
| `FTP_SERVER` | host FTP (ex.: `ftp.vocefashion.com.br` ou o IP mostrado no hPanel) |
| `FTP_USERNAME` | usuário FTP |
| `FTP_PASSWORD` | senha FTP |
| `FTP_DIR` | (opcional) pasta do site; padrão `public_html/`. Termina com `/` |

Se o FTPS der erro de conexão, troque `protocol: ftps` por `ftp` no workflow.

## Pendências para produção

- **Fotos antigas no Storage:** remover uma foto no painel não apaga o arquivo do bucket (só deixa de ser usado).
- **Produtos de demonstração:** os 7 produtos usam as fotos reais da cliente, mas nomes, preços, estoque e descrições são ilustrativos. Conferir com a loja (inclusive se as blusas capa são vendidas em conjunto com o short).
- **Logo:** pedir à cliente o logo em PNG/SVG com fundo transparente.
- **Frete:** ViaCEP + API de frete (Melhor Envio/Correios). Hoje a regra é pelo início do CEP configurado no painel.
- **Pagamento:** decidido que **não haverá cobrança pelo site**: valores são informativos e o pagamento é combinado pelo WhatsApp, Instagram ou painel.
- **Estoque:** a sacola e o pedido já respeitam o estoque deste navegador; com o Supabase, a baixa precisa ser feita no servidor (transação), para duas clientes não comprarem a mesma última peça.
- **Páginas de produto geradas no build:** usam o catálogo inicial. Peças criadas ou alteradas só no painel não ganham prévia própria até haver backend.
- **Sem desenho ainda:** "Guia de medidas" (o link foi retirado da página de produto até existir a tabela).
