# Gráfica Estamp — site de vendas

Site da Gráfica Estamp (Cruzeiro do Sul, AC): loja com catálogo, carrinho, estúdio 3D de uniformes e pagamento por Mercado Pago (modo de teste).

> Projeto de demonstração. Os preços vêm do catálogo do WhatsApp Business da Estamp; confira com a loja antes de vender de verdade.

## Páginas

| Arquivo | O que faz |
|---|---|
| `index.html` | Abertura animada da logo, uniforme 3D no topo, loja com filtros, como funciona, inspirações, medidas e contato |
| `personalizar.html` | **Estúdio 3D**: tecido, short, estampa, cores, nome, número, patrocinador, escudo e lista do time |
| `pedido.html` | Página de retorno do Mercado Pago (aprovado, pendente ou recusado) |
| `api/checkout.js` | Função serverless que recalcula os preços e cria o pagamento no Mercado Pago |

## Onde mudar as coisas

- **Contato, horário, endereço e fotos do portfólio:** `js/config.js`
- **Produtos e preços:** `data/products.js`. O servidor usa o mesmo arquivo, então o preço nunca vem do navegador.
- **Fotos dos produtos:** `img/produtos/<id-do-produto>.png`, de preferência PNG sem fundo. Se a foto faltar, aparece um ícone.
- **Portfólio:** coloque fotos em `img/portfolio/` e liste em `SITE.portfolio` no `js/config.js`.

## Rodar no computador

Só o site (sem pagamento):

```bash
python -m http.server 8080
```

Abra http://localhost:8080. Precisa ser por servidor; abrir o arquivo com dois cliques não carrega o 3D.

Com o pagamento (usa a CLI da Vercel):

```bash
npm run dev
```

Testes do checkout:

```bash
npm test
```

## Mercado Pago em modo de teste

1. Em https://www.mercadopago.com.br/developers, crie uma aplicação e, em **Contas de teste**, crie duas: **vendedor** e **comprador**.
2. Entre com a conta de teste **vendedora** (janela anônima), crie uma aplicação e copie o **Access Token**.
3. Na Vercel: *Settings → Environment Variables* → `MP_ACCESS_TOKEN` = esse token. Opcional: `SITE_URL` = endereço do site.
4. Para pagar, entre com a conta de teste **compradora** e use os cartões de teste do Mercado Pago.

Sem `MP_ACCESS_TOKEN`, o botão "Pagar com Pix ou cartão" avisa que o pagamento não está disponível e o cliente finaliza pelo WhatsApp.

## Publicar na Vercel

Importe o repositório em https://vercel.com/new. Não precisa de build. Os cabeçalhos de segurança estão em `vercel.json`.

## Créditos das imagens

As fotos de camisas, polo, canecas, troféu e medalha são do [pngimg.com](https://pngimg.com), licença **CC BY-NC 4.0** (uso não comercial). **Se o site for usado comercialmente, troque por fotos próprias.** Uniformes, colete, cartões, panfletos, adesivos, placa e letreiro foram gerados para o projeto.
