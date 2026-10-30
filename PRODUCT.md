# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clientes mistos da Gráfica Estamp em Cruzeiro do Sul (AC) e no Vale do Juruá: pequenas empresas e comércio local, igrejas, escolas, times e pessoas físicas (camisas de evento, canecas, presentes). Quase todos chegam pelo celular, muitas vezes vindos do Instagram ou do WhatsApp. O trabalho deles: descobrir se a gráfica faz o que precisam, entender opções e preço, e mandar um pedido ou orçamento organizado sem depender de resposta imediata no WhatsApp.

Público secundário: a equipe da gráfica, que entra no painel pelo link "Área da equipe" no rodapé.

## Product Purpose

Site de vendas da Gráfica Estamp. Ataca o problema de atendimento ruim pelo WhatsApp (clientes sem resposta, vendas perdidas): o cliente vê os produtos, monta o pedido ou o orçamento sozinho e envia tudo organizado. Sucesso = mais pedidos e orçamentos completos chegando, menos conversa de ida e volta.

## Positioning

Gráfica completa local (desde 2013) que faz de cartão de visita a fachada, com criação de arte própria e aprovação antes da produção, e que agora deixa o cliente montar o pedido sozinho, com preço na hora para produtos de compra direta e formulário guiado para sob encomenda.

## Operating Context

- Dois tipos de produto: compra direta (opções, preço calculado, carrinho, Mercado Pago ou WhatsApp) e sob encomenda (formulário em etapas, protocolo EST-AAMMDD-XXXX, abre o WhatsApp com tudo organizado).
- Atendimento somente por mensagem no WhatsApp (68) 99996-7316. Instagram @graficaestampczs.
- Endereço: R. 17 de Novembro, 1471, Telégrafo, Cruzeiro do Sul, AC, 69980-000. Seg–sex 7h30–17h30, sáb 7h30–11h30, domingo fechado.
- Páginas: index, produtos (filtro e busca), produto?id=, carrinho, pedido (retorno do pagamento).

## Capabilities and Constraints

- HTML, CSS e JavaScript puro, sem etapa de compilação; Vercel (plano Hobby). tools/versao.py carimba ?v= nos arquivos.
- Catálogo em data/products.js: 27 produtos, 5 categorias (impressos gráficos, camisas e uniformes, brindes, comunicação visual, design e criação).
- api/checkout.js cria o pagamento no Mercado Pago (modo teste); tests/checkout.test.js deve continuar passando.
- js/painel-ponte.js guarda o pedido no navegador para o painel importar; não pode quebrar.
- A abertura animada GRÁFICA / ESTAMP fica (decisão do dono do projeto), adaptada ao visual.

## Brand Commitments

- Nome Gráfica Estamp; logo em assets/ (logo-nav.png, logo-dark.png, favicon.svg); o "A" do ESTAMP com triângulo laranja.
- Preto e laranja #ff6a00 são a marca; em texto pequeno sobre claro usar #b34700 por contraste.
- Voz: português direto e simples, para quem não entende de sistema.

## Evidence on Hand

- 72 fotos reais de trabalhos feitos em img/trabalhos/<produto>/; img/hero.jpg (produtos com a marca).
- "Desde 2013", "+1 mil seguidores no Instagram".
- Não há depoimentos, avaliações nem números de clientes: não inventar.
- Preços: parte vem do catálogo do WhatsApp Business, parte é exemplo.

## Product Principles

1. O cliente resolve sozinho: cada página termina numa ação clara (pedir, orçar, falar no WhatsApp).
2. Trabalho real prova mais que promessa: mostrar fotos dos trabalhos feitos.
3. Celular primeiro: 390px é o caso principal; 1366px também precisa estar impecável.
4. Simples para leigo: palavras do dia a dia, nada de jargão.

## Accessibility & Inclusion

WCAG 2.1 AA (axe-core com 0 violações hoje; manter). Formulários com rótulo visível, obrigatório marcado, dica e erro por campo lido pelo leitor de tela.
