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

- **Backend (Supabase):** trocar a implementação de `src/lib/db.ts` por chamadas ao Supabase (mesmos hooks e ações), login real com Supabase Auth (apagar `demo-credentials.ts`), fotos no Supabase Storage e regras de acesso (RLS).
- **Produtos de demonstração:** os 7 produtos usam as fotos reais da cliente, mas nomes, preços, estoque e descrições são ilustrativos. Conferir com a loja (inclusive se as blusas capa são vendidas em conjunto com o short).
- **Logo:** pedir à cliente o logo em PNG/SVG com fundo transparente.
- **Frete:** ViaCEP + API de frete (Melhor Envio/Correios). Hoje a regra é pelo início do CEP configurado no painel.
- **Pagamento:** gateway (QR Code e copia-e-cola do Pix, cartão). Hoje o pedido é registrado, mas nada é cobrado.
- **Estoque:** a sacola e o pedido já respeitam o estoque deste navegador; com o Supabase, a baixa precisa ser feita no servidor (transação), para duas clientes não comprarem a mesma última peça.
- **Páginas de produto geradas no build:** usam o catálogo inicial. Peças criadas ou alteradas só no painel não ganham prévia própria até haver backend.
- **Sem desenho ainda:** "Guia de medidas" (o link foi retirado da página de produto até existir a tabela).
