# Gráfica Estamp — site de vendas

Loja virtual da Gráfica Estamp (Cruzeiro do Sul, AC), feita a partir da *Especificação do site de vendas e do formulário de pedidos personalizados*.

> Projeto de demonstração. Preços marcados como conhecidos vêm do catálogo do WhatsApp Business da Estamp; os demais são exemplos. Confira tudo com a loja antes de vender de verdade.

## Como o site funciona

**5 categorias:** impressos gráficos, camisas e uniformes, brindes, comunicação visual, design e criação.

**Dois tipos de produto** (seção 3 da especificação):

| Tipo | Exemplos | O que o cliente faz |
|---|---|---|
| **A — Compra direta** | Cartões, panfletos, adesivos, canecas, troféus | Escolhe as opções, vê o preço calculado, coloca no carrinho e paga online (Mercado Pago) ou finaliza pelo WhatsApp |
| **B — Sob encomenda** | Camisas, fachadas, banners, brindes especiais, design | Preenche o formulário em etapas e envia a solicitação. A equipe responde com preço, prazo e condições, e o cliente só paga depois de aprovar |

Os formulários mudam conforme o produto (`js/forms.js`): camisas (modelo, tecido, cor, gola, local da estampa, técnica, arte, quantidade por tamanho, prazo), impressos (formato, papel, acabamento), comunicação visual (medidas, material, instalação), brindes e design.

A solicitação recebe um número (ex.: `EST-261028-AB12`) e vai para o WhatsApp da gráfica já organizada. Ela também fica guardada no navegador e entra no **painel de gestão** (`/painel`), na aba Orçamentos (veja abaixo o limite disso na demonstração).

## Painel de gestão (`/painel`)

O painel é o **Escala Business** (o mesmo visual e o mesmo layout do painel modelo), com as abas trocadas para o que uma gráfica precisa:

| Grupo | Abas |
|---|---|
| Dia a dia | Início, Vender no balcão (xerox, impressão, pronta entrega), Vendas feitas, Calendário |
| Produção | **Pedidos** (quadro: novo → arte → aprovação → produção → pronto → entregue, com grade de tamanhos, sinal e ficha de produção em PDF), **Orçamentos** (o que chega do site e do WhatsApp; vira pedido em 1 toque), **Fila de produção** (por setor: arte, sublimação, DTF, silk, impressão…) |
| Produtos e insumos | Produtos e preços (opções, setor, prazo, pronta entrega ou sob encomenda), **Insumos** (camisas lisas, papel, tinta, lona, brindes em branco, com mínimo e pedido ao fornecedor), Compras |
| Financeiro | Contas e despesas, Metas, Relatórios |
| Relacionamento | **Criar anúncio** (7 modelos de arte: oferta, promoção, feito aqui, tabela de preços, pronto rápido, data comemorativa e aviso; formatos de publicação, story e quadrado; fotos dos trabalhos ou do celular; legenda pronta), Clientes (empresas e grupos, pedido do ano passado, pedido pronto), Equipe e comissões (atendimento, designer, produção) |
| Gráfica | Configurações (dados, pagamento, % do sinal, cópia de segurança, histórico) |

Os nomes do painel são de uso do dia a dia (ex.: "Material em estoque" em vez de insumos, "Entrada" em vez de sinal, "Total vendido" em vez de faturamento, "Saldo" em vez de caixa). Cada tela tem o "?" com a explicação e um guia na primeira vez.

Login da demonstração: `dono@graficaestamp.demo`, senha `demonstracao` (ou "Entrar como funcionário"). Os dados de exemplo (6 meses) são gerados no primeiro acesso e ficam no navegador.

**Limite importante:** ainda não há servidor. Os dados do painel ficam no `localStorage` do aparelho, e o pedido feito no site só chega ao painel **se for aberto no mesmo navegador**. Para uso real (vários aparelhos, cliente em outro celular), é preciso um banco de dados (ex.: Supabase) e trocar `js/painel-ponte.js` e `painel-src/src/data/store.ts` por chamadas à API.

Código-fonte em `painel-src/` (React + TypeScript + Vite). Para mudar:

```bash
cd painel-src
npm install
npm run build
```

O build sai em `painel/` (é essa pasta que a Vercel publica; `painel-src/` não vai para o ar).

## Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Página inicial: vitrine, categorias, mais pedidos, como comprar, sobre e contato |
| `produtos.html` | Catálogo com filtro por categoria (`?cat=camisas`) e busca (`?q=caneca`) |
| `produto.html?id=…` | Página do produto: opções e preço (Tipo A) ou formulário em etapas (Tipo B) |
| `carrinho.html` | Carrinho com retirada/entrega, dados do cliente e pagamento |
| `pedido.html` | Retorno do Mercado Pago |
| `api/checkout.js` | Função da Vercel que recalcula os preços e cria o pagamento |
| `painel/` | Painel de gestão (gerado a partir de `painel-src/`) |
| `js/painel-ponte.js` | Guarda cada orçamento/pedido do site para o painel importar |

## Onde mudar as coisas

- **Contato, endereço e horário:** `js/config.js`
- **Produtos, opções e preços:** `data/products.js`. O servidor usa o mesmo arquivo, então o preço nunca vem do navegador.
- **Campos dos formulários de orçamento:** `js/forms.js`
- **Cores e visual:** variáveis no início de `css/style.css`

## Rodar no computador

```bash
python -m http.server 8080
```

Abra http://localhost:8080. Para testar também o pagamento, use `npm run dev` (CLI da Vercel). Testes:

```bash
npm test
```

## Mercado Pago (modo de teste)

1. Em https://www.mercadopago.com.br/developers, crie em **Contas de teste** uma conta **vendedora** e uma **compradora**.
2. Entre com a vendedora (janela anônima), crie uma aplicação e copie o **Access Token**.
3. Na Vercel, em *Settings → Environment Variables*, crie `MP_ACCESS_TOKEN` com esse token. Opcional: `SITE_URL`.
4. Pague logado com a conta compradora, usando os cartões de teste.

Sem o token, o botão de pagamento avisa que não está disponível e o cliente finaliza pelo WhatsApp.

## Imagens

- **Fotos** (camisas, polos, canecas, adesivos, fachada, design, sobre): [Unsplash](https://unsplash.com/license). Uso livre, inclusive comercial.
- **Chaveiro, canetas, ecobag, troféu e medalha:** [pngimg.com](https://pngimg.com), licença CC BY-NC 4.0 (**não comercial**: troque antes de usar comercialmente).
- **Cartões, panfletos, cartaz, bloco, banner e placa:** mockups criados para o projeto com a marca Estamp.

**O ideal é trocar pelas fotos reais dos trabalhos da Estamp** (o Instagram tem várias). Basta salvar com o mesmo nome em `img/p/`.
