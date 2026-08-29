# Handoff — Quota dashboard redesign

Continuation notes for a new Claude Code session rooted at
`/home/tirson/Projects/quota-smart-pay`. The previous session was rooted at the
old path and has been shut down.

---

## 1. Running the dev server (read this first)

Two things bite on a fresh shell:

- **`bun` is not on `PATH`** — it lives at `~/.bun/bin`.
- **`node` defaults to v14.16.0** via nvm, which cannot parse Vite 7
  (`SyntaxError: Unexpected token '??='`). Node **v24.18.0** is installed and is what it needs.

```bash
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$HOME/.bun/bin:$PATH"
bun run dev
```

Serves on **http://localhost:8080/** (not 3000/5173 — set in `vite.config.ts`).
`package.json` is at the repo root, not in `src/`.

Worth doing at some point: add `.nvmrc` containing `24.18.0` so the v14 default stops recurring.

---

## 2. What this project is

"Quota" — a fintech billing/invoicing SaaS for Mozambican SMEs. Portuguese UI.
TanStack Start + React 19 + Tailwind v4 + shadcn/ui. Frontend only; invoices persist
to `localStorage` via `src/lib/invoices-store.ts`. No backend, no real MVP yet —
**the current focus is UX, not features.**

Design tokens live in `src/styles.css`: indigo primary `oklch(0.52 0.24 258)`,
Sora (display) + Manrope (body), white/light-grey surfaces, full dark mode.

---

## 3. The task and the decision

The `/dashboard` overview was cluttered: **9 stacked containers** in an 8/4 split
needing 2–3 viewport heights of scrolling. Four of those nine were just different
ways of presenting a number.

Three redesigns were mocked up as a standalone local file:

```
design/dashboard-layouts.html      ← open with file://, no build step
```

- **A · Cockpit** — merge, 9→4 containers
- **B · Lista de trabalho** — prioritize, 9→3
- **C · Segmentado** — defer behind tabs, 9→2 visible

**The user chose A (Cockpit).** It is implemented and working.

> Note: the user does **not** want Claude Artifacts — their account is for business
> use. Deliver HTML as plain local files in the repo.

---

## 4. What was implemented (uncommitted)

```
 M src/routes/dashboard.index.tsx   (rewritten — the Cockpit layout)
 M src/routes/dashboard.tsx         (height-locking, ~24 lines)
 ?? design/                          (the 3-iteration mockup)
```

### `dashboard.index.tsx` — new structure

1. **KPI rail** (`shrink-0`) — one bordered card, 4 cells split by dividers. Absorbs
   what used to be the hero card, 3 spark cards, and the distribution bar.
   - Saldo a receber (large) + `% liquidado` pill + hand-rolled SVG `<Sparkline>`
   - Facturas emitidas · Clientes activos · Em atraso
2. **Work zone** (`flex-1 min-h-0`, grid `1.62fr / 1fr`) — Documentos recentes on the
   left; Movimentos + a Quota AI nudge stacked on the right. Lists scroll **inside**
   their panels.
3. **Action dock** (`shrink-0`) — 4 tiles: Nova factura / Novo cliente / Cotação / Cobrar.

**Deviation from the mockup, deliberate:** the mockup's cells 2–4 showed invented
numbers (92 emitidas, 38 clientes, 82% WhatsApp). The implementation wires all four
cells to **real data** derived from the invoice store — invoice count, paid count,
unique clients, clients with an open balance, overdue count and amount. The only
remaining mock is the 8-month `trend` array feeding the sparkline, because the store
holds no monthly history. Look for `const trend` if you want to replace it.

### `dashboard.tsx` — height locking

Removing page scroll globally would have broken `/dashboard/facturas`, `/clientes`
etc., which legitimately need to scroll. So it is **opt-in per route**:

```tsx
const pathname = useRouterState({ select: (s) => s.location.pathname });
const fitsViewport = pathname === "/dashboard" || pathname === "/dashboard/";
```

`fitsViewport` switches `<main>` to `md:overflow-hidden` + `md:h-full` flex column.
**Mobile still scrolls** — a no-scroll dense grid is not realistic on a phone.

---

## 5. Verified

- `npx tsc --noEmit` — clean, no errors.
- `/dashboard` returns 200; HTML contains Saldo a receber, Documentos recentes,
  Em atraso, Movimentos, Clientes activos, Nova factura, and the sparkline gradient.
- Vite HMR applied both files with no warnings.

### Visual pass (done, headless Chrome via playwright-core)

Screenshotted `/dashboard` at 1440×768, 1920×1080 and 390×844, light and dark.

- **No page scroll** at either desktop height, in both themes — the height lock holds.
- **Dark mode** renders correctly across the KPI rail, panels, sparkline and dock.
- **Mobile** reflows properly (KPI 2×2, dock 2×2, bottom nav) and scrolls. Note the
  scroll container is `<main>`, not the document, so `window.scrollY` stays 0 —
  measure `main.scrollTop` if you script this.

**Fixed:** the local `toneClass.warning` in `dashboard.index.tsx` was
`text-warning-foreground` with no dark variant, so the "Parcial" badge rendered
near-black (L≈3.6) on a dark surface. Now mirrors `StatusBadge` with
`dark:text-warning` (L≈78.8, in line with the other three badges).

### Open, not fixed — judgement calls for the user

1. **The work zone looks hollow on tall viewports.** `flex-1` stretches the panels to
   fill the height, so with the 4-invoice demo dataset there is ~250px of empty panel
   at 768px and ~550px at 1080px. Real data fills it; a brand-new user would not.
   Options: cap the work zone with a `max-h` and top-align, or give short lists an
   end-of-list affordance.
2. **Status badges are hidden below `sm`** (`hidden … sm:inline-block`, ~line 341).
   Paga/Vencida/Enviada/Parcial is arguably the highest-value column on a phone.

Note: `formatMZN` omits the currency symbol by design across the whole app — the bare
`217 092` on the dashboard is the project convention, not a dashboard bug.

## 6. Novo documento — Bancada (implementado)

`/dashboard/documentos/novo` sofria do mesmo mal: **sete contentores, 1559 px numa
viewport de 712 px (2,2 ecrãs)**. Mas o scroll era o sintoma. A doença era repetição —
o **total aparecia 3×** no mesmo ecrã, o tipo de documento 3×, o cliente 2×, a
referência 2×. E o indicador de etapas não controlava nada: só mudava de cor conforme
os campos eram preenchidos.

Três iterações em `design/documento-novo-layouts.html` (abas A/B/C, teclas 1/2/3):
**A · Bancada** (7→4), **B · Documento vivo** (7→2, edição in-place no próprio
documento), **C · Fluxo focado** (7→2, um passo por ecrã).

**O utilizador escolheu A, com a condição de o total aparecer uma só vez.**

### A regra que daí resultou

> **À esquerda o que se escreve. À direita o que isso produz.**

O painel esquerdo só tem entradas; todos os valores calculados (subtotal, IVA, total)
vivem exclusivamente no documento. O rodapé do editor ficou só com o desconto — que é
uma entrada — e a contagem de linhas. Verificado por contagem no DOM: `91 640,00`,
`79 000,00` e `12 640,00` aparecem **1× cada**.

Pela mesma regra, em ecrãs `<sm` o total por linha desaparece do editor (o documento
tem-no), libertando a largura que a descrição precisa no telemóvel.

### Estrutura

1. **Barra de contexto** (`shrink-0`) — recolhe o PageHeader, as etapas e o selector de
   tipo numa só linha: voltar · tipo segmentado (5 opções) · referência clicável com
   ponto de estado · PDF · Emitir e enviar.
2. **Bancada** (`flex-1 min-h-0`, `xl:1.1fr/1fr`) — editor à esquerda, documento à
   direita. Ambos rolam **dentro** do próprio painel.
3. **Notas** (`shrink-0`) — uma linha que abre para textarea + chips.

O indicador de etapas e o `PageHeader` foram removidos. As células das linhas não têm
moldura até hover/foco, para baixar o ruído.

### Alterações fora da rota

- `dashboard.tsx` — o `fitsViewport` era uma comparação a `/dashboard`; passou a
  `FITS_VIEWPORT`, um `Set`. **Acrescente aqui cada rota nova que deva caber num ecrã.**
- `styles.css` — `color-scheme: light` / `.dark { color-scheme: dark }`. Não estava
  definido, por isso as scrollbars e o date picker nativos renderizavam claros em tema
  escuro. Passou a importar agora que este layout depende de scroll interno.
- `documentos.novo.tsx` — o documento mostrava a data ISO crua (`2026-07-27`); passou a
  `formatDate` (`27/07/2026`). O `<input type="date">` continua a seguir a locale do
  browser, o que é comportamento nativo.

### Verificado

- `npx tsc --noEmit` limpo.
- Sem scroll de página a 1440×768, 1440×768 escuro e 1920×1080.
- **Com 8 linhas continua sem scroll de página** — a lista rola dentro do painel.
- `?tipo=cotv` (cotação visual) mantém as miniaturas no editor e a grelha de cartões no
  documento, também sem scroll.
- Telemóvel a 390×844 rola normalmente e as linhas são legíveis.

---

## 7. Documentos — Lista + documento (implementado)

`/dashboard/documentos` já rolava por dentro, mas a lista **é** a página e só cabiam
**7 das 36 linhas**. A altura estava presa a `max-h-[calc(100dvh-24rem)]`, um número
mágico que assumia 384 px de chrome e ainda transbordava 12 px.

Três colunas eram peso morto: `Tipo` repetia o prefixo do número (REC/FT/COT), `Abrir`
era ~70% travessões (só as facturas têm rota de detalhe) e a contagem estava impressa
duas vezes. E a coluna `Estado` **misturava três coisas**: estado de pagamento
(Paga/Vencida), estado de proposta (Aceite/Expirada) e *método* de pagamento
(M-Pesa/Numerário/Cartão) — que não é um estado. "Enviada" aparecia em cotações e
facturas a significar coisas diferentes.

Iterações em `design/documentos-lista-layouts.html`: **A · Tabela densa** (13 linhas),
**B · Agrupado por data** (11, com soma por grupo), **C · Lista + documento** (14).
**O utilizador escolheu C.**

### Como ficou

Barra de contexto (filtro segmentado com contagens · procura · Novo documento), depois
a lista à esquerda e o documento à direita — o mesmo papel que a Bancada usa. Sem
número mágico: a altura vem do `flex-1`. **16 linhas a 768 px, 25 a 1080 px.**

- `Estado` passou a conter só estado. Um recibo é dinheiro recebido, por isso lê
  **Pago**, e o método mudou-se para junto do cliente, a cinzento.
- Caíram as colunas `Tipo` (o prefixo ganhou cor) e `Abrir` (a selecção abre o painel;
  Enter ou duplo-clique navega).
- `↑`/`↓` percorrem a lista com o papel a acompanhar; a selecção recupera sozinha
  quando um filtro remove a linha seleccionada.
- Rodapé com contagem e **soma do que está filtrado**.

### O painel para os outros tipos

Só as facturas guardam linhas — cotações e recibos têm apenas totais. Em vez de
inventar linhas, o painel mantém o mesmo papel e mostra o que existe: cotação →
validade, probabilidade, estado; recibo → método, factura que liquida, estado. Assim
nenhuma das 32 linhas não-factura abre um painel vazio.

As acções são específicas do tipo: **Cobrar** só aparece numa factura por liquidar
(`enviada`/`vencida`/`parcial`) — não faz sentido cobrar um recibo já pago nem um
rascunho — e **Abrir** só onde há rota de detalhe.

### Alterações fora da rota

- `dashboard.tsx` — `/dashboard/documentos` acrescentado ao `FITS_VIEWPORT`.
- `invoices-store.ts` — `statusToneClass.warning` tinha o mesmo bug de contraste que a
  visão geral: `text-warning-foreground` sem variante escura. Este é o mapa
  **partilhado**, e esta página usa-o. Corrigido com `dark:text-warning`.
- O botão "Novo documento" apontava para `/dashboard/facturacao`; passou a
  `/dashboard/documentos/novo`, que é para onde a barra lateral já apontava.

### Verificado

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página a 1440×768 (claro e escuro) e 1920×1080.
- Navegação por teclado testada: `↓` percorre e o painel acompanha; ao filtrar para
  Facturas a selecção salta para uma linha válida.
- Telemóvel a 390×844: o cliente passa para baixo do número, o painel esconde-se e o
  número deixou de ser truncado — melhor do que a lista mobile anterior.

---

## 8. Clientes — Linhas de contacto (implementado)

Aqui o problema era o inverso das outras páginas: **a base tem 3 clientes**, logo
densidade não era o assunto. A página estava sobre-instrumentada e sub-equipada.

- **~270 px de cabeçalho e KPIs antes do primeiro nome** — eyebrow "CRM", título de
  36 px, e três cartões de métrica para contar três fichas. "Top cliente" lê-se
  directamente numa lista de 3 linhas.
- Linhas de ~88 px que **não eram clicáveis** — só três botões pequenos à direita —
  com NUIT, email, telefone e morada despejados numa corrida de texto cinzento.
- **Editar abria um modal** que tapava a lista, e confirmar a eliminação expandia
  *dentro* da linha, empurrando o layout.

Iterações em `design/clientes-layouts.html`. **O utilizador escolheu B, mas em linhas
horizontais em vez de cartões** — a grelha de cartões foi refeita como lista e o
ficheiro de design reflecte a decisão.

### Como ficou

Barra de contexto (procura + Novo cliente) e **um único contentor** de linhas. Cada
linha: avatar, nome + NUIT, email e telefone **como links** (`mailto:` / `tel:`),
cidade, facturado + n.º de documentos, e as acções — WhatsApp (`wa.me`), editar,
Facturar. Rodapé com contagem e total facturado.

**Editar acontece na própria linha.** O formulário expande no lugar, a lista continua
visível e nada mais se mexe. Sem modal. "Novo cliente" expande o mesmo formulário no
topo. Eliminar mudou-se para dentro do formulário e passou a **dois passos**
(Eliminar → "Sim, eliminar" / "Não"), o que tira o confirm que empurrava o layout e
protege dados reais em `localStorage`.

A cidade na linha é derivada do `address` (último segmento após a vírgula) — o store
não tem campo de cidade, por isso o formulário edita `address`, que é o campo real.

### Responsivo

- `lg` para baixo escondem-se os contactos, `xl` para baixo a cidade.
- Em telemóvel o avatar (decorativo) sai para dar largura ao nome, e **Facturar fica
  como ícone** em vez de desaparecer — a versão anterior perdia a acção no telemóvel.

### Alterações fora da rota

- `dashboard.tsx` — `/dashboard/clientes` acrescentado ao `FITS_VIEWPORT`.
- Saíram os imports de `KpiCard` e `Field`/`FieldRow` (`FormSection`), já não usados
  aqui — confirmar se `FormSection` ainda tem outros consumidores antes de o remover.

### Verificado

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página a 1440×768 (claro e escuro) nem em telemóvel.
- Fluxos testados em browser: abrir editor, **gravar e ver o nome mudar na linha**,
  confirmar eliminação em dois passos com cancelamento, e abrir o formulário de novo
  cliente.

---

## 9. Acções sobre documentos + exportação CSV (implementado)

As páginas até aqui eram de leitura. Passaram a agir: **selecção múltipla** na lista de
documentos, com exportação CSV, marcar paga, cobrar, duplicar e anular.

### A restrição que molda tudo

**Só as facturas vivem no store.** Cotações e recibos vêm de `mock-data.ts` e são
imutáveis. Por isso a barra de acções diz sempre a quantos documentos se aplica —
`3 seleccionados · 1 factura`, `Marcar paga (3)`, `Duplicar (4)` — e desactiva o que não
se aplica, em vez de falhar em silêncio sobre a selecção toda. O CSV exporta tudo, que
é só dados.

### Store (`invoices-store.ts`)

- `InvoiceStatus` ganhou **`cancelada`**; `statusMeta` mostra-a como "Anulada" (tom
  muted). `derivedStatus` trata-a como o rascunho — **estado congelado**, nunca
  re-derivado para enviada/vencida.
- `settleInvoice(id, method?)` — **regista um pagamento pelo saldo em aberto**, não
  escreve o estado. Isto é deliberado: `invoiceBalance` deriva dos pagamentos, por isso
  marcar "paga" à força deixaria o *Saldo a receber* do painel a mentir. Verificado em
  browser: 217 092 → 0, liquidado 26% → 100%.
- `cancelInvoice(id)` — anula sem apagar, mantendo o rasto fiscal.
- `duplicateInvoice(id)` — clona para rascunho com número novo, data de hoje, prazo
  +15 dias, sem pagamentos nem recibo.

### CSV (`src/lib/csv.ts`, novo)

Duas armadilhas que justificam o módulo, ambas verificadas no ficheiro gerado:

- O **Excel em locale pt usa `;`**. Com `,` despeja tudo numa coluna — e os nomes de
  cliente já têm vírgulas ("João Comercial, Lda").
- **Sem BOM UTF-8**, "Construções" chega como "ConstruÃ§Ãµes". O ficheiro sai com
  `EF BB BF`, CRLF, e números com vírgula decimal.

Campos com `;`, aspas ou quebra de linha são citados com aspas duplicadas.

### Interface

Caixa por linha + caixa de "seleccionar todos os visíveis". A barra de acções aparece
**por cima da lista**, não em rodapé: em telemóvel o rodapé fica depois de 36 linhas,
o que obrigaria a rolar até ao fim para chegar às acções.

- **Cobrar** exige exactamente **uma** factura por liquidar — o `wa.me` abre um
  documento de cada vez e N separadores seriam bloqueados. A mensagem vai pré-preenchida
  com cliente, número, saldo e vencimento.
- **Anular** confirma em dois passos, na própria barra.
- Sem selecção, o rodapé mantém contagem, soma e **Exportar CSV da vista filtrada**;
  com selecção esse botão esconde-se, para não haver dois "Exportar CSV" com âmbitos
  diferentes ao mesmo tempo.

### Verificado (em browser, não só a compilar)

- `npx tsc --noEmit` limpo, sem erros de consola.
- CSV descarregado e inspeccionado: BOM, `;`, CRLF, acentos e vírgula decimal correctos.
- Marcar paga → *Saldo a receber* do painel cai a 0 e liquidado sobe a 100%.
- Anular → aparece "Anulada". Duplicar → cria rascunho novo.
- Cobrar → abre `wa.me` com telefone só de dígitos e texto pré-preenchido.
- Contagens correctas em selecção mista e sem scroll de página em nenhum tamanho.

---

## 10. Catálogo — Produtos e Serviços (implementado)

As duas páginas estavam em estados opostos.

**Produtos era um placeholder** dentro de um produto a ser usado: mostrava
"EM CONSTRUÇÃO — Esta área está a ser preparada", com botões *Ser notificado* e
*Sugerir funcionalidade*, quatro cartões de marketing e um promo do assistente. Os
KPIs eram **inventados** — 184 produtos, 24 serviços, 12 categorias — enquanto
`mock-data.ts` já tinha **12 produtos reais** com SKU, custo, stock, stock mínimo e
IVA que a página nunca desenhava. O título dizia "Produtos & Serviços" apesar de
Serviços ser outra página.

**Serviços estava construído** (dados reais, ordenação, filtros, acções em massa) mas
gastava ~260 px em cabeçalho e quatro cartões para mostrar 8 linhas. Dois números não
eram reais: "Receita recorrente 38 000 MZN/mês" estava escrito à mão, e os deltas
+8% / +3% não tinham histórico que os sustentasse.

Iterações em `design/catalogo-layouts.html` (P/S troca de secção, 1/2/3 as iterações).
**O utilizador escolheu B para Produtos e A para Serviços.**

### Produtos · B — Grelha visual

Reescrito de raiz sobre os dados reais. Barra de contexto com filtro por categoria
(contagens derivadas), procura, Exportar e Novo produto. Grelha de cartões com
placeholder de imagem, nome, SKU · categoria, preço e estado de stock.

O estado sai de `stock` vs. `minStock`, não de um campo à parte: 0 → Esgotado,
abaixo do mínimo → âmbar, resto → verde. O rodapé calcula valor em stock, quantos
estão abaixo do mínimo e quantos esgotados — tudo sobre a **vista filtrada**.

A grelha foi escolhida por ser a única das três com lugar para a imagem do produto, de
que a Cotação visual (COTV) da Bancada depende. As imagens ainda são gradientes com a
inicial — o `Product` não tem campo de imagem. **É esse o próximo passo natural aqui.**

### Serviços · A — Tabela densa

Caiu o `PageHeader` e o `StatGrid`. As médias passaram para a barra de contexto e são
**calculadas**; a receita recorrente inventada e os deltas sem histórico saíram.

Em vez de refazer a tabela à mão — o que perderia ordenação, filtros e selecção — o
`DataTable` ganhou uma prop **`fill`** (opt-in): trava a altura ao contentor, rola as
linhas por dentro e desliga a paginação (rolar dentro de uma página de 10 seria rolar
duas vezes pela mesma lista). `recibos` e `cotacoes` não passam `fill` e ficaram
inalterados — confirmado em browser, continuam a paginar 10/página.

### Exportação CSV

Ambas as páginas reutilizam `src/lib/csv.ts`. Produtos exporta SKU, custo, margem,
stock, stock mínimo, unidade e IVA **da vista filtrada**; Serviços exporta o catálogo
completo. Os dois ficheiros foram descarregados e inspeccionados: BOM, `;`, CRLF.

### Verificado

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página a 1440×768, claro e escuro, nas duas páginas.
- 12 produtos e 8 serviços renderizados; filtro Tecnologia reduz a 4 cartões.
- `Valor em stock 1 585 400` conferido à mão contra os dados.
- CSV das duas páginas descarregado e verificado.
- `recibos` e `cotacoes` sem regressão.

### Nota sobre `formatMZN`

Fica agora bem visível na grelha: `4200` e `9800` saem sem separador enquanto `12 500`
e `68 000` saem com. É o agrupamento `Intl` para pt (não agrupa 4 dígitos), no
formatador partilhado — pré-existente e transversal a toda a app. Um `useGrouping: true`
resolvia, mas muda números em todas as páginas, por isso ficou por decidir.

---

## 11. Design dos documentos — Galeria + folha (implementado)

A página existe para **comparar sete templates e escolher um**, e mostrava **um de cada
vez num carrossel**: comparar exigia sete cliques e memória. A pré-visualização tinha
~360 px de largura — pequena de mais para julgar o que sai impresso — rodeada de ~760 px
de vazio. O formulário de template personalizado, uma acção rara, ocupava tanto espaço
como a escolha, e um painel "Os seus pedidos" vazio ficava fixo com 360 px. A página
rolava 584 px.

Também havia contradição nos metadados: `description` dizia "sete layouts",
`og:description` dizia "Três layouts prontos". São sete — corrigido.

Iterações em `design/design-templates-layouts.html`. **O utilizador escolheu A.**

### Como ficou

Barra de contexto fina, depois galeria de 7 miniaturas à esquerda (300 px) e a folha
seleccionada em grande à direita. O carrossel desapareceu.

As miniaturas e a pré-visualização **renderizam o documento a sério** — o mesmo
`InvoiceDocument` com `templateOverride`, escalado (0,155 na galeria, 0,44 no painel,
0,72 no tamanho real). Não são imagens nem esquemas.

**O pedido personalizado passou a ser o segundo modo do painel direito**, não um bloco
permanente nem um modal: o botão na barra de contexto troca a pré-visualização pelo
formulário + lista de tickets, com a galeria sempre visível. O botão mostra o número de
tickets abertos. O overlay de "Tamanho real" mantém-se — aqui um modal é o certo,
porque o objectivo é mesmo ocupar o ecrã.

### Bug corrigido durante a implementação

A miniatura era um `<button>` e o documento renderizado **contém o seu próprio
`<button>`** (o `QuotaSeal`). Botões aninhados são HTML inválido e partiam a hidratação
— a consola dava `Hydration failed` em todos os tamanhos. Passou a
`div[role="button"]` com `tabIndex`/`onKeyDown`, e a folha vai dentro de um wrapper
`inert` (React 19), que a tira da ordem de tabulação e da árvore de acessibilidade.
**Vale a pena lembrar isto se alguma outra página vier a embrulhar `InvoiceDocument`
num elemento interactivo.**

### Verificado (em browser)

- `npx tsc --noEmit` limpo; **sem erros de consola** (os de hidratação desapareceram).
- Sem scroll de página a 1440×768 claro e escuro, e a 1920×1080.
- 4 das 7 miniaturas visíveis a 768 px de altura, 6 a 1080 — medido, não estimado.
- Fluxos testados: escolher um layout, aplicar (o botão passa a "Layout activo" e o
  selo ACTIVO muda de cartão), abrir e fechar o tamanho real, criar um ticket
  (TPL-0001 listado, formulário limpo, contador a 1) e a validação a recusar
  submissão incompleta.
- Telemóvel a 390×844: galeria a toda a largura com miniaturas maiores, painel por baixo.

---

## 12. Quota AI e Chat da equipa (arrumados)

Pedido explícito: **só arrumar e tirar o scroll**, sem iterações de design.

Ambas já eram interfaces de duas colunas (lista + conversa) e estavam perto do
sítio — a página transbordava ~50 px por causa de alturas mágicas: `min-h-[600px]`
no `assistente` e `min-h-[560px]` na `equipa`. Substituídas por bloqueio real de
altura, com a conversa a rolar dentro do painel.

- **Chat da equipa** tinha ainda o cabeçalho grande — eyebrow "ESPAÇO DE TRABALHO",
  título de 36 px, descrição e botão, ~130 px — que o `assistente` não tinha. Passou
  a barra de contexto fina, como o resto da app; as duas páginas ficaram consistentes.
- Nas duas, a **lista lateral** (conversas / canais) também passou a rolar por dentro,
  em vez de esticar a página.

### `dashboard.tsx` — correspondência por prefixo

Estas rotas redireccionam para filhos dinâmicos (`/dashboard/equipa/ch-empresa`,
`/dashboard/assistente/t-xxxx`), que um `Set` de correspondência exacta nunca
apanharia. Acrescentado `FITS_VIEWPORT_PREFIXES` ao lado do `Set`. **Qualquer rota
nova com filhos dinâmicos precisa de entrar aí, não no `Set`.**

### Verificado (em browser)

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página nas duas, a 1440×768 claro e escuro e a 1920×1080.
- **Contenção testada a sério:** 12 mensagens na equipa → página 0, lista a rolar
  664 px por dentro. 16 no assistente → página 0, conversa a rolar 776 px, com
  auto-scroll para o fim e o compositor fixo em baixo.
- Telemóvel a 390×844: colunas empilham e a página rola, como deve ser.

**Nota, não introduzido por esta alteração:** o Quota AI responde
`Não foi possível responder · Missing LOVABLE_API_KEY` — falta a chave de API no
ambiente. O envio, o histórico e a criação de conversas funcionam; só a resposta do
modelo é que falha.

---

## 13. Perfil, Definições e WhatsApp (arrumados)

Mesmo tratamento directo: arrumar e tirar o scroll de página.

### Perfil e Definições — formulários longos

`perfil` tinha 1478 px de conteúdo, `definicoes` **2398 px (3,4 alturas de ecrã)**. Um
formulário de definições precisa mesmo de rolar — o que não devia era **o botão
Guardar fugir com ele**. Antes, para gravar era preciso voltar 1686 px para cima.

Agora: cabeçalho grande substituído por barra de contexto com as acções
(Guardar/Restaurar) **sempre visíveis**, e o formulário rola dentro do seu painel.
Página travada, botão ao alcance.

Em `definicoes` os blocos de erro e de pré-visualização estavam **fora** do wrapper do
formulário; foram movidos para dentro da zona que rola, senão a `InvoiceDocument` de
pré-visualização rebentava a altura travada.

### WhatsApp — estado honesto em vez de números inventados

Era o mesmo placeholder que Produtos: "EM CONSTRUÇÃO", cartões de marketing, promo do
assistente e **quatro KPIs fabricados** (48 enviadas hoje, 94% taxa de leitura, 27
conversas activas, 3 min de resposta). Ao contrário de Produtos, aqui **não há dados
reais nenhuns** — não existe store nem integração de WhatsApp.

Por isso a página não foi "construída", foi tornada honesta: estado *Conta não ligada*
com um CTA de ligação, quatro capacidades descritas em texto (o que passa a fazer
depois de ligar) e um ponteiro para o que **já funciona hoje** — o botão *Cobrar* em
Documentos, que abre o WhatsApp com a mensagem pronta. Métricas inventadas num
placeholder são pior do que um vazio honesto.

### Verificado (em browser)

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página nas três, a 1440×768 claro e escuro e a 1920×1080.
- **Contenção testada:** o painel interno rola 591 px no perfil e 1595 px nas
  definições, chegando ao fim (a pré-visualização da factura) com o Guardar ainda
  fixo na barra.
- Telemóvel a 390×844: as três empilham e a página rola, como deve ser.

Com isto, **todas as páginas da barra lateral** estão tratadas.

---

## 14. Perfil e Definições — Navegação lateral (implementado)

Depois do arrume da §13, o utilizador pediu iterações a sério para estas duas.
Mockup em `design/perfil-definicoes-layouts.html` (P/D troca de página, 1/2/3 as
iterações): **A · Navegação lateral**, **B · Coluna única + índice**,
**C · Cartões independentes** — e, só para Definições, **B · Formulário + documento
vivo**, com a factura a actualizar enquanto se escreve.

**O utilizador escolheu A para as duas.** Fica a coerência: Perfil e Definições
passam a ser a mesma página com conteúdos diferentes.

### `SettingsShell` (novo, `src/components/app/SettingsShell.tsx`)

Rail de secções à esquerda, secção activa à direita, rodapé com "Secção N de M" e
botão para a seguinte. Usado pelas duas páginas.

**Detalhe que evita perda de dados:** todas as secções ficam **montadas**, e as
inactivas escondem-se com `hidden`. O Perfil usa inputs **não controlados**
(`defaultValue`), por isso desmontar a secção ao trocar de separador apagaria o que
tivesse sido escrito. Testado em browser: escrever no Nome, ir a Segurança e voltar
mantém o valor.

### Nota sobre a pré-visualização

O layout A não previa pré-visualização, e eu tinha assinalado que essa era a perda
mais cara em Definições — cada campo ali imprime numa factura. Em vez de apagar
funcionalidade que a página já tinha, **a pré-visualização passou a ser a 5.ª secção
do rail**. Continua a mostrar dados já guardados (não em directo, que era a proposta
B), mas deixou de estar enterrada no fim de 2398 px.

Se um dia isto voltar a discussão: **a iteração B de Definições continua a ser, na
minha leitura, a mais forte** — mas A/A foi uma escolha consciente de coerência.

### Verificado (em browser)

- `npx tsc --noEmit` limpo, sem erros de consola.
- Sem scroll de página nas duas, claro e escuro; rail com 3 secções no Perfil e 5 nas
  Definições.
- Fluxos: trocar de secção, **valor escrito preservado ao voltar**, botão "Seguinte"
  a avançar, gravar em Definições (passa a "Guardado") e a pré-visualização a mostrar
  a alteração gravada.
- Telemóvel: rail empilha por cima da secção e a página rola.

**Nota:** o campo de 2FA tem `id="2fa"`, que não é um selector CSS válido
(`#2fa` rebenta o `querySelector`). Não foi alterado, mas convém saber se alguém
lhe quiser pegar por CSS ou em testes — usar `[id="2fa"]`.

---

## 15. Deploy para a Hostinger — o que foi verificado

O plano é a **Hostinger Unlimited** ($3.99/mo), e a tabela de preços dessa coluna
lista **Node.js** (o Premium tem traço nessa linha, o Unlimited tem visto).
**Correcção a uma suposição minha anterior:** eu tinha assumido alojamento partilhado
sem Node — está errado, o Unlimited corre Node.

### Testado, não assumido

O build por omissão sai para **Cloudflare Workers** (`preset: cloudflare-module`) e o
`.output/public` **não tem `index.html`** — é SSR puro, logo não serve como site
estático. Mas o alvo muda:

```bash
export NODE_OPTIONS=--max-old-space-size=6144
NITRO_PRESET=node-server bun run build
PORT=3111 node .output/server/index.mjs
```

Isto foi corrido de facto: `preset: node-server`, servidor a arrancar, `/dashboard` e
`/dashboard/documentos` a devolver **200**, e **36 linhas renderizadas** num browser
real sem erros de consola. **O deploy à Hostinger é viável.**

`.output` fica em ~38 MB (21 MB servidor + 17 MB público) — irrelevante para os 50 GB
do plano.

### O build precisa de 6 GB de heap

`bun run build` **falha com out-of-memory** no heap por omissão. Só passa com
`--max-old-space-size=6144`. Causa: o bundle do servidor arrasta `shikijs__langs`
(7,4 MB) e `mermaid` (2,7 MB), da renderização de markdown do chat AI.

Isto **não bloqueia a Hostinger**, porque o build corre na máquina local e só se envia
o `.output`. Mas convém resolver — ou pelo menos deixar a flag no script de build.

### A verificar com quem trata do alojamento

- Versão de Node disponível (precisa de 20+; aqui usa-se a 24).
- Se o gestor de apps Node permite **processo persistente** (é um servidor a correr,
  não PHP por pedido) e qual o limite de memória do processo.

---

## 16. Supabase — dados reais a funcionar

Projecto **Quota** (`qxupxwggnxcpcehfimkh`), Postgres 17. **O `localStorage` deixou
de ser a fonte de verdade** para clientes e facturas.

### Como aplicar migrações

O conector MCP desta sessão está noutra conta, mas **o Supabase CLI está autenticado**
(`supabase login` feito pelo utilizador). A partir daí:

```bash
supabase link --project-ref qxupxwggnxcpcehfimkh   # já feito, sem password
supabase db push                                    # aplica supabase/migrations/
```

`supabase/migrations/20260829202203_init.sql` já foi aplicado.

### Feito

- `.gitignore` **não tinha regra para `.env`** — corrigido antes de escrever chaves.
- `src/lib/supabase.ts` — cliente; `requireSupabase()` falha alto em vez de devolver
  vazio (numa app de facturação, "sem facturas" e "não consegui ler" não podem
  parecer o mesmo).
- **`clients-store.ts` e `invoices-store.ts` migrados para Postgres.** A API
  exportada é a mesma, por isso **nenhuma rota precisou de mudar de forma** — só
  três sítios passaram a `await`.
- Escritas optimistas com reversão em erro, e `toast.error` em qualquer falha.

### Mudança de comportamento deliberada

`nextInvoiceNumber()` passou a vir da sequência do Postgres, e o número é atribuído
**ao gravar**, não ao abrir o formulário. Antes, `facturas/nova` reservava o número
logo à entrada; abrir e desistir gastava um número fiscal. Agora não gasta.

### Verificado contra a base de dados real

- Cliente criado no browser → **está na tabela `clients`** e sobrevive a recarregar.
- Seed automático: 4 facturas, 7 linhas, 2 pagamentos, com números sequenciais
  `FT 2026/00003`–`00006` vindos da sequência.
- Painel a ler do Postgres: Saldo 217 092, facturado 293 596, 4 documentos.
- **Anular** → `status = 'cancelada'` na base de dados, **com as linhas intactas**
  (rasto fiscal preservado, nada apagado).
- **Marcar paga** → criou um **pagamento real** de 146 160 (numerário), não só uma
  mudança de estado. Os pagamentos passaram de 2 para 3.
- `npx tsc --noEmit` limpo, sem erros de consola.

### Falta migrar

`company-store` e `doc-templates` (ainda em `localStorage`). As tabelas `company`,
`products` e `services` já existem no esquema mas ainda não têm código a usá-las —
`produtos` e `servicos` continuam a ler de `mock-data.ts`.

### ⚠️ Segurança — continua por decidir antes de publicar

As políticas RLS são de desenvolvimento (`anon` faz tudo). A chave publicável vai no
bundle do browser: **em produção qualquer pessoa leria e escreveria as facturas.**
Antes do deploy: Supabase Auth com `auth.uid() is not null`, ou falar com o Supabase
só do lado do servidor.

---

## 17. Suggested next steps

1. Decide on the two open dashboard items (hollow work zone, mobile status badges).
   The Bancada has the same hollowness with poucas linhas — mesma decisão se aplica.
2. Decide whether the sidebar (explicitly out of scope so far) gets the same pass.
3. Nothing is committed. Branch is `dev`, clean apart from the entries above.
   Visual verification used `playwright-core` driving `/usr/bin/google-chrome`; it was
   installed ad hoc and then backed out of `package.json`/`bun.lock` to keep the diff
   clean — re-add with `bun add -d playwright-core` if you want it permanently.
   Remote: `github.com/rouninartist-source/quota-smart-pay`.

---

## 18. Project relocation (done)

Moved from `Projects/pickup360/tools/quota/quota-smart-pay` → `Projects/quota-smart-pay`.
`pickup360` was not a git repo, so nothing tracked this as a subdirectory; git history
and remote came through intact. The emptied `tools/quota/` was removed, the stale
`node_modules/.vite` cache was cleared, and no source file referenced the old path.
