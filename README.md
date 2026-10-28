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

A solicitação recebe um número (ex.: `EST-261028-AB12`) e vai para o WhatsApp da gráfica já organizada. **Ainda não há banco de dados nem painel administrativo**: foi decidido deixar isso para uma segunda fase. Por enquanto, o registro do pedido é a conversa no WhatsApp.

## Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Página inicial: vitrine, categorias, mais pedidos, como comprar, sobre e contato |
| `produtos.html` | Catálogo com filtro por categoria (`?cat=camisas`) e busca (`?q=caneca`) |
| `produto.html?id=…` | Página do produto: opções e preço (Tipo A) ou formulário em etapas (Tipo B) |
| `carrinho.html` | Carrinho com retirada/entrega, dados do cliente e pagamento |
| `pedido.html` | Retorno do Mercado Pago |
| `api/checkout.js` | Função da Vercel que recalcula os preços e cria o pagamento |

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
