# Handoff: Você Fashion — Loja virtual mobile (Vitrine, Produto, Checkout)

## Visão geral
Interface mobile-first da loja de moda feminina **Você Fashion** (Bom Jesus da Lapa, BA). Mais de 90% do tráfego chega pelo navegador interno do Instagram, então tudo é pensado para uma mão só: ações principais na base da tela, alvos de toque ≥ 44px, campos com fonte de 16px (evita zoom no iOS).

Três telas conectadas:
1. **Vitrine** (listagem com filtro por categoria)
2. **Produto** (PDP com carrossel, tamanhos e CTA fixo)
3. **Checkout** (acordeão em 3 etapas: Identificação → Entrega → Pagamento, Pix em destaque)

**Todo texto visível deve estar em português do Brasil (PT-BR).**

## Sobre os arquivos de design
Os arquivos deste pacote são **referências de design feitas em HTML**: protótipos que mostram o visual e o comportamento esperados, **não código de produção para copiar**. A tarefa é **recriar estes designs no ambiente do projeto** (React/Next.js, Vue, etc.) usando os padrões e bibliotecas já existentes. Se ainda não existir projeto, recomendação: **Next.js (App Router) + Tailwind CSS**, com os tokens abaixo em `tailwind.config`.

Para abrir o protótipo: sirva a pasta com qualquer servidor estático (ex.: `npx serve .`) e abra `Voce Fashion MIV v2.dc.html`. Ele precisa do `support.js` ao lado. Toda a lógica de estado está na classe `Component` no final do arquivo — ela é a referência mais precisa de comportamento.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios e interações são finais. Recriar pixel a pixel. Única exceção: as **fotos de produto são placeholders listrados** — substituir por fotos reais (proporção 4:5).

---

## Design tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| `charcoal` | `#2C2C2C` | Texto principal, ícones, botão secundário, tamanho selecionado, badge de etapa aberta, botão "Calcular", toast |
| `copper` | `#B87353` | CTA primário, pill ativa, etiqueta de promoção, favorito ativo, foco de campo, radio selecionado, preço Pix |
| `copper-hover` | `#A6654A` | Hover do CTA primário |
| `copper-active` | `#94583F` | Pressionado do CTA primário |
| `copper-tint` | `#FAF4F1` | Fundo de opção selecionada (frete/pagamento) |
| `alabaster` | `#F8F8F8` | Fundo do app (Vitrine, Checkout) |
| `white` | `#FFFFFF` | Cards, header, barras fixas, fundo da PDP |
| `border-light` | `#E5E5E5` | Bordas de 1px e divisores |
| `chip` | `#F1EFEC` | Pill de categoria inativa (fundo e borda) |
| `icon-btn` | `#F3F2F0` | Fundo dos botões circulares do header |
| `muted` | `#707070` | Texto secundário, legendas, rótulo de campo em repouso |
| `body-2` | `#4A4A4A` | Texto de apoio (descrição, parcelamento) |
| `strike` | `#8A8A8A` | Preço antigo (riscado), título de etapa bloqueada |
| `disabled-bg` / `disabled-fg` | `#EDEDED` / `#8A8A8A` | Botão desabilitado |
| `out-bg` / `out-fg` / `out-line` | `#FAFAFA` / `#B0B0B0` / `#C4C4C4` | Tamanho esgotado |
| `error` | `#A3432A` | Borda, rótulo e mensagem de erro |
| `placeholder-a` / `placeholder-b` | `#EEE9E3` / `#E7E1DA` | Listras do placeholder de foto (135°, 8px) |

**Sem sombras em lugar nenhum.** A hierarquia vem de superfície (branco sobre alabastro), bordas de 1px e tipografia.

Nota de acessibilidade: branco sobre `#B87353` tem contraste ≈ 3,6:1 — mantido por decisão de marca; usar sempre texto ≥ 16px peso 600 nos botões cobre.

### Tipografia (Google Fonts)
- **Títulos:** `Plus Jakarta Sans` (600–700)
- **Corpo / UI / preços:** `Geist` (400, 500, 600, 700)
- **Rótulos de placeholder:** `Geist Mono` 400 (só no protótipo)

| Estilo | Fonte | Tamanho/altura | Peso | Extra |
|---|---|---|---|---|
| H1 (nome na PDP) | Plus Jakarta Sans | 30/36 | 700 | letter-spacing −0.02em |
| H2 (título da vitrine) | Plus Jakarta Sans | 24/30 | 700 | −0.02em |
| Título de etapa do checkout | Plus Jakarta Sans | 18/22 | 600 | |
| Título do header do checkout | Plus Jakarta Sans | 19 | 600 | |
| Nome no card | Plus Jakarta Sans | 16/21 | 600 | |
| Preço PDP | Geist | 24 | 700 | |
| Total checkout | Geist | 21 | 700 | |
| Preço card | Geist | 15 | 700 | |
| Corpo | Geist | 16/24 (desc. PDP 15/23) | 400 | |
| Apoio | Geist | 14/20 | 400 | |
| Botão | Geist | 16 | 600 (primário) / 500 (secundário) | |
| Pill | Geist | 14 | 500 | |
| Legenda / categoria | Geist | 10–11/14 | 500 | MAIÚSCULAS, letter-spacing 0.1em, `#707070` |
| Rótulo flutuante | Geist | 15 → 11 | 400 → 500 | |

### Raios
| Elemento | Raio |
|---|---|
| Botões (primário, secundário, Calcular), pills, botões de ícone, badges, etiquetas | `999px` (pílula/círculo) |
| Cards (checkout, MIV), opções de frete/pagamento, toast | `18px` |
| Card de produto (vitrine) | `22px` (externo) / `18px` (foto interna) |
| Campos de formulário, botões de tamanho | `14px` |
| Miniatura na sacola | `12px` |
| Carrossel da PDP | `0 0 32px 32px` (só cantos de baixo) |

### Espaçamento
Escala usada: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28. Margem lateral padrão das telas: **16px** (vitrine: 14px no grid). Gap do grid de produtos: **10px**.

### Ícones
Traço fino **1,5px**, `stroke-linecap/linejoin: round`, sem preenchimento por padrão, 20–24px. Preenchido só em estado ativo (coração favorito: fill + stroke `#B87353`). Ícones: menu, sacola, coração, voltar, fechar, Pix (losango), cartão, caminhão (frete), cadeado (seguro), loja, troca, check, chevron. Os paths SVG exatos estão no HTML — pode usar `lucide-react` com `strokeWidth={1.5}` como equivalente.

---

## Telas

Frame de referência: **390 × 812** (iPhone). No protótipo cada tela tem barra de status (44px) e uma barra simulada do navegador do Instagram (40px) — **essas duas não devem ser implementadas**, são só contexto.

### 1. Vitrine (listagem)
**Propósito:** navegar e filtrar peças, favoritar, abrir produto.

**Layout** (fundo `#F8F8F8`, coluna única com scroll):
- **Header fixo (sticky top, z 5)**, fundo branco, borda inferior 1px `#E5E5E5`:
  - Linha 60px, grid `48px 1fr 48px`: botão menu (esq.), logo central (46×46, `assets/logo-voce-fashion.jpg`, `object-fit: cover`), botão sacola (dir.).
  - Botões: círculo 44×44, fundo `#F3F2F0`, ícone 24px `#2C2C2C`.
  - Badge da sacola: posicionado em top −2px / right −3px, min 17×17, pílula `#B87353`, texto branco Geist 600 10px. Só aparece se quantidade > 0.
  - **Pills de categoria**: linha com scroll horizontal (sem barra visível), padding `4px 16px 12px`, gap 8px. Pill: altura 36px, padding 0 16px, pílula. Ativa: fundo/borda `#B87353`, texto branco. Inativa: fundo/borda `#F1EFEC`, texto `#2C2C2C`, hover borda `#2C2C2C`.
  - Categorias: **Novidades, Vestidos, Blusas, Saias, Conjuntos, Promoção**.
- **Título da seção:** padding `20px 16px 14px`, linha com H2 (nome da categoria ativa) à esquerda e contagem à direita (“6 peças” / “1 peça”, Geist 13 `#707070`).
- **Grid:** 2 colunas, gap 10px, padding lateral 14px.
- **Card de produto:** fundo branco, raio 22px, padding 6px, sem sombra, inteiro clicável (abre a PDP).
  - Foto: proporção **4:5**, raio 18px.
  - Etiqueta de desconto (se houver preço antigo): top/left 10px, pílula `#B87353`, texto branco Geist 600 11px, padding 5×6px. Texto: `−19%` (calculado: `round((1 − preço/antigo) × 100)`).
  - Botão favorito: top/right 8px, círculo branco 36×36, coração 20px. Clicar **não** abre o produto (`stopPropagation`).
  - Bloco de texto (padding `10px 8px 10px`, gap 4px): categoria (legenda maiúscula) → nome (Jakarta 600 16/21) → preço (Geist 700 15) + preço antigo riscado (Geist 12 `#8A8A8A`).
  - **Sem botão “Comprar” no card.**
- **Rodapé:** texto centralizado Geist 13 `#707070`: “Loja física no Centro de Bom Jesus da Lapa · Retire em até 2h”.

### 2. Produto (PDP)
**Propósito:** ver fotos, escolher tamanho, adicionar à sacola.

**Layout** (fundo branco, scroll):
- **Carrossel:** altura 420px (~55% da área visível), largura total, cantos inferiores 32px. Scroll horizontal com `scroll-snap-type: x mandatory`, 3 slides (frente, costas, detalhe).
  - Sobreposto no topo (12px das bordas): botão voltar (esq.); favorito + sacola com badge (dir.). Todos círculos brancos 44×44, gap 8px.
  - **Paginação:** centralizada a 14px da base, gap 6px; ponto 6×6 pílula `rgba(44,44,44,.28)`; ativo vira 18×6 `#2C2C2C`, transição de largura 0.2s. Índice = `round(scrollLeft / clientWidth)`.
- **Informações** (padding `20px 20px 140px`, gap 20px):
  - Categoria (legenda) → H1 nome → preço (Geist 700 24) + antigo riscado (15) → “ou 3x de R$ 63,30 sem juros” → “**R$ 180,40** no Pix” (valor em `#B87353` 600; preço × (1 − desconto Pix)).
  - **Tamanho:** linha “Tamanho · M” (o “· M” só aparece após escolher, peso 400 `#707070`) + link “Guia de medidas” sublinhado à direita. Botões P, M, G, GG: 56×48, raio 14px, gap 8px, Geist 500 15.
    - Disponível: borda `#E5E5E5`, fundo branco.
    - Selecionado: fundo e borda `#2C2C2C`, texto branco.
    - **Esgotado:** fundo `#FAFAFA`, texto `#B0B0B0`, `disabled`, cursor not-allowed, **risco diagonal** (linha 1px `#C4C4C4`, rotação −40°, atravessando o botão, `overflow: hidden`).
    - Erro (tentou adicionar sem tamanho): “Escolha um tamanho para continuar.” Geist 500 13 `#A3432A`.
    - Nota de estoque (Geist 13 `#707070`): sem seleção “Tamanhos riscados estão esgotados.”; estoque 1 “Última peça neste tamanho.”; senão “N peças disponíveis.”
  - **Descrição:** divisor superior, título “Descrição” (Geist 600 14), parágrafo (Geist 15/23 `#4A4A4A`). Botão texto “Ler mais” / “Ler menos” (sublinhado) expande juntando `description + descriptionMore`.
  - **Selos:** lista com divisores: ícone caminhão + “Entrega grátis em Bom Jesus da Lapa acima de R$ 199”; ícone troca + “Primeira troca grátis em até 7 dias”.
- **Barra de ação fixa (position fixed bottom, z 9):** fundo branco, borda superior 1px, padding `12px 16px 30px` (usar `env(safe-area-inset-bottom)` na implementação). Botão primário largura total, altura 54px, pílula, `#B87353`, ícone sacola 20px + “Adicionar à Sacola” (alternativa configurável: “Comprar Agora”).
- **Toast** (ao adicionar): acima da barra (bottom 104px, laterais 16px), fundo `#2C2C2C`, raio 18px, padding 14×16, ícone check + “Tamanho M adicionado” + link “Ver sacola”. Some após **2,6s**.

### 3. Checkout
**Propósito:** finalizar o pedido com o mínimo de atrito.

**Layout** (fundo `#F8F8F8`, scroll; conteúdo padding `12px 12px 150px`, gap 8px):
- **Header fixo:** 56px, branco, borda inferior; grid `48px 1fr auto`: voltar (círculo 44 `#F3F2F0`), título “Finalizar pedido”, selo cadeado 16px + “Compra segura” (Geist 500 12 `#4A4A4A`).
- **Card “Sua sacola · 2 itens”** (recolhível, aberto por padrão): cabeçalho 52px com subtotal + chevron (gira 180° aberto). Itens: grid `52px 1fr auto` — miniatura 52×65 raio 12 → nome (Jakarta 600 15/19), “Tamanho M” (12 `#707070`), total do item (Geist 700 14) → seletor de quantidade (borda 1px, raio 18, altura 36, botões − / + de 34px). Quantidade 0 remove o item. Vazio: “Sua sacola está vazia. Adicione peças na tela de produto.”
- **Etapas em acordeão** (cards brancos, raio 18, borda 1px `#E5E5E5`; **etapa aberta = borda `#2C2C2C`**). Cabeçalho 60px: badge circular 26px + título + (quando concluída e fechada) resumo em uma linha + link “Editar”.
  - Badge: aberta → fundo `#2C2C2C` texto branco com número; concluída → fundo `#B87353` com “✓”; pendente → branco, borda `#E5E5E5`, número `#707070`.
  - Só é possível abrir a etapa N se a N−1 estiver concluída (título fica `#8A8A8A` enquanto bloqueada).
  - **1. Identificação:** campos em grid de 2 colunas, gap 12: Nome completo (2 col), E-mail (2 col), Celular (WhatsApp) (1 col), CPF (1 col). Botão secundário “Continuar para entrega”. Resumo: “Nome · e-mail”.
  - **2. Entrega:** CEP + botão “Calcular” (56px, pílula, `#2C2C2C`). Dica antes do cálculo: “Em Bom Jesus da Lapa? Use 47600-000 para ver retirada e entrega no mesmo dia.” Após calcular: cidade (“Bom Jesus da Lapa — BA” ou “Envio pelos Correios”) + opções de frete como radio cards (min 64px, grid `20px 1fr auto`, nome Geist 600 14, sub 12 `#707070`, preço Geist 700 14; “Grátis” em `#B87353`). Se a opção não for “Retirar na loja”, mostrar endereço: Rua / Avenida (2 col), Número (1), Bairro (1), Complemento (opcional) (2). Botão “Continuar para pagamento”. Resumo: “Entrega Você Fashion · Grátis”.
  - **3. Pagamento:** dois radio cards:
    - **Pix** (primeiro, em destaque): ícone losango cobre, etiqueta pílula “RECOMENDADO” (`#B87353`, Geist 600 10, maiúsculas), linha “5% de desconto · aprovação na hora”. Selecionado por padrão.
    - **Cartão de crédito:** “Até 3x de R$ X sem juros”. Ao selecionar, mostra: Número do cartão (2), Nome impresso no cartão (2), Validade (1), CVV (1).
    - Rodapé: cadeado + “Pagamento criptografado. Não guardamos os dados do seu cartão.”
  - Radio card selecionado: borda `#B87353`, fundo `#FAF4F1`, anel 20px `#B87353` com ponto interno 10px. Não selecionado: borda `#E5E5E5`, anel `#B5B5B5`.
- **Card de valores:** Subtotal; Frete (“Informe o CEP” / valor / “Grátis”); “Desconto Pix (5%)” em `#B87353` (só com Pix).
- **Barra fixa inferior:** grid `auto 1fr`, gap 16: à esquerda “Total” (12 `#707070`), valor (Geist 700 21), nota (11 `#B87353`: “Economia de R$ 13,99 no Pix” ou “em até 3x sem juros”); à direita botão primário “Finalizar Compra” (54px, pílula).
- **Tela de sucesso** (sobrepõe o checkout): ícone check em círculo cobre 56px, título, texto. Pix: “Quase lá!” + “Pague R$ X com o Pix para confirmar seu pedido #VF-2611. Enviamos os detalhes no seu WhatsApp.” + QR Code (184×184) + botão “Copiar código Pix” (vira “Código copiado ✓”) + “O código expira em 30 minutos.” Cartão: “Pedido confirmado!” + “Pagamento aprovado. Pedido #VF-2611 — acompanhe tudo pelo WhatsApp.” Botão secundário “Voltar para a loja”.

---

## Componentes

### Botões
- **Primário:** altura 52–54px, largura total, pílula, fundo `#B87353`, texto branco Geist 600 16, sem sombra. Hover `#A6654A`, active `#94583F`.
- **Secundário:** altura 52px, pílula, borda 1px `#2C2C2C`, fundo transparente, texto `#2C2C2C` Geist 500 16. Hover: fundo `#2C2C2C`, texto branco.
- **Desabilitado:** fundo `#EDEDED`, texto `#8A8A8A`.

### Campo com rótulo flutuante
- Input: altura 56px, padding `22px 14px 6px`, borda 1px, raio 14px, Geist 400 16 `#2C2C2C`, sem outline, transição de borda 0.15s.
- Rótulo: absoluto, left 15px. Repouso (vazio e sem foco): top 18px, 15px/400 `#707070`. Flutuando (foco ou com valor): top 8px, 11px/500. Transição `all .15s`. `pointer-events: none`.
- Estados de borda/rótulo: repouso `#E5E5E5`/`#707070`; foco `#B87353`/`#B87353`; erro `#A3432A`/`#A3432A`.
- Placeholder (exemplo) só aparece com foco, cor `#A8A8A8`.
- Mensagem de erro abaixo: Geist 500 12 `#A3432A`, gap 4px.
- Usar `type="tel"` / `inputMode="numeric"` nos numéricos, `type="email"` no e-mail, `autocomplete` adequado.

---

## Interações e comportamento

- **Vitrine → PDP:** tocar no card abre o produto (no protótipo atualiza a tela ao lado; na implementação, rota `/produto/[slug]`). Ao trocar de produto: tamanho, erro e descrição resetam; carrossel e scroll voltam ao início.
- **Filtro:** Novidades = todas; Promoção = produtos com `oldPrice`; demais = `category` igual.
- **Favoritos:** compartilhados entre vitrine e PDP (persistir em `localStorage`).
- **Adicionar à sacola:** sem tamanho → mostra erro. Com tamanho → se já existe o mesmo produto+tamanho, soma 1; senão adiciona. Mostra toast e atualiza badge.
- **Máscaras:**
  - Celular: `(77) 99999-9999` (11 dígitos)
  - CPF: `000.000.000-00`
  - CEP: `00000-000`
  - Cartão: `0000 0000 0000 0000`
  - Validade: `MM/AA`
  - CVV: 3–4 dígitos
- **Validação** (ao clicar em “Continuar” ou “Finalizar Compra”; erro do campo some ao digitar):
  - Nome: ao menos duas palavras → “Informe nome e sobrenome”
  - E-mail: `/^\S+@\S+\.\S{2,}$/` → “Confira seu e-mail”
  - Celular: 11 dígitos → “Celular com DDD”
  - CPF: 11 dígitos → “CPF incompleto” (na produção, validar dígitos verificadores)
  - CEP: 8 dígitos → “CEP com 8 dígitos”; sem calcular → “Calcule o frete pelo CEP”
  - Endereço (exceto retirada): “Informe a rua”, “Informe o nº”, “Informe o bairro”
  - Cartão: “Número incompleto”, “Como está no cartão”, “MM/AA”, “3 dígitos”
- **Frete:** CEP começando com `476` (Bom Jesus da Lapa) → mostra Retirar na loja (grátis), Entrega Você Fashion (R$ 7,00, **grátis se subtotal ≥ R$ 199**), PAC, SEDEX; pré-seleciona Entrega Você Fashion. Outros CEPs → só PAC (pré-selecionado) e SEDEX. Alterar o CEP depois de calcular invalida frete e etapa 2. Na produção: ViaCEP para endereço + API de frete (Melhor Envio/Correios).
- **Totais:** `subtotal = Σ preço × qtd`; `descontoPix = subtotal × 5%` (só produtos, não frete); `total = subtotal + frete − descontoPix`; parcelamento = `(subtotal + frete) / 3`.
- **Finalizar Compra:** valida etapas 1→3; na primeira com erro, abre essa etapa e mostra os erros. Tudo ok → tela de sucesso. Sacola vazia → não faz nada (na produção, desabilitar).
- **Transições:** rótulo flutuante e borda 0.15s; pontos do carrossel (largura) 0.2s; chevron da sacola 0.2s. Nada além disso — priorizar velocidade.

## Estado (referência)
```
cat: string                       // categoria ativa
wish: Record<productId, boolean>  // favoritos
pdpId, slide, selSize, sizeErr, descOpen
bag: { pid, size, qty }[]         // sacola (persistir)
toast: string
values: Record<campo, string>, focus: campo|null, errors: Record<campo, string>
open: 0|1|2|3, done: {1?,2?,3?}   // acordeão
cepDone, cepLocal, ship: 'retirada'|'moto'|'pac'|'sedex'|null
pay: 'pix'|'card', summaryOpen, success, copied
```
Dados de exemplo (produtos, frete, pagamento): `data/products.json`.

## Ativos
- `assets/logo-voce-fashion.jpg` — logo enviado pela cliente (monograma “VC” + “Você Fashion Loja”). Fundo cinza claro; no header é aplicado com `filter: brightness(1.05) contrast(1.15); mix-blend-mode: multiply`. **Pedir à cliente uma versão SVG/PNG com fundo transparente.**
- Fotos de produto: **não fornecidas** — placeholders. Usar 4:5, mín. 1080×1350, WebP/AVIF com `next/image` (lazy, `sizes` correto) — performance é crítica no navegador do Instagram.
- Ícones: SVG inline traço 1,5px (ou `lucide-react`).

## Arquivos
- `Voce Fashion MIV v2.dc.html` — **design de referência** (manual de identidade + as 3 telas interativas). Lógica completa na classe `Component` no fim do arquivo.
- `support.js` — runtime necessário só para abrir o protótipo.
- `data/products.json` — dados de exemplo.
- `assets/logo-voce-fashion.jpg` — logo.
- `brief_original.md` — briefing original da cliente (o v2 substitui a fonte serifada por Plus Jakarta Sans e os cantos retos por arredondados, a pedido da cliente).

## Notas para implementação
- Mobile-first; no desktop, centralizar a coluna em até ~480px ou adaptar o grid para 3–4 colunas.
- Barras fixas com `padding-bottom: env(safe-area-inset-bottom)`; testar dentro do navegador do Instagram (iOS e Android).
- Formatar moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- `lang="pt-BR"` no `<html>`.
