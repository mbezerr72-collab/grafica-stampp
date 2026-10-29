import { pode, type Permissao, type Sessao } from '../data/store'

/** Todas as partes do painel: onde aparecem no menu, quem pode abrir e a ajuda do "?". */
export type Modulo = {
  id: string
  nome: string
  /** Nome curto do menu lateral (quando o nome inteiro não cabe). */
  curto?: string
  /** Uma frase do que se faz ali (aparece no "Mais", na busca e no "?"). */
  frase: string
  /** Dicas do "?" da tela. */
  ajuda?: string[]
  icone: string
  permissao: Permissao
  grupo: Grupo
  /** Entrega em que fica pronto (enquanto a demonstração é montada). */
  etapa: number
  /** A tela mostra números: tem o seletor de período no cabeçalho. */
  periodo?: boolean
}

export type Grupo = 'operacao' | 'producao' | 'produtos' | 'financeiro' | 'relacionamento' | 'loja'

export const GRUPOS: Record<Grupo, string> = {
  operacao: 'Dia a dia',
  producao: 'Encomendas',
  produtos: 'Produtos e material',
  financeiro: 'Dinheiro',
  relacionamento: 'Clientes e equipe',
  loja: 'Ajustes',
}

export const MODULOS: Modulo[] = [
  {
    id: 'inicio',
    nome: 'Início',
    frase: 'Resumo: quanto vendeu, quanto sobrou e o que precisa de atenção hoje.',
    ajuda: [
      'Escolha de quando quer ver os números, no alto da tela: Hoje, 7 dias, Este mês…',
      'A setinha verde ou vermelha mostra se melhorou ou piorou em relação ao período anterior.',
      '“Lucro” é o que sobrou: o que vendeu, menos o que custou fazer, menos as contas da gráfica (aluguel, salários, energia).',
    ],
    icone: 'inicio',
    permissao: 'produtos',
    grupo: 'operacao',
    etapa: 1,
    periodo: true,
  },
  { id: 'pdv', nome: 'Vender no balcão', curto: 'Vender', frase: 'Venda na hora: cópia, impressão, plastificação e produtos prontos.', ajuda: ['Digite o nome do produto (ex.: cópia), toque nele, escolha a opção e a quantidade.', 'O cliente vai pagar parte no Pix e parte no cartão? Toque em “Dividir em duas formas”.', 'O que precisa de arte ou de produção (camisa, banner, caneca) não é vendido aqui: abra em Pedidos.', 'Depois de finalizar, mande o recibo pelo WhatsApp ou baixe para imprimir.'], icone: 'pdv', permissao: 'vendas', grupo: 'operacao', etapa: 1 },
  { id: 'vendas', nome: 'Vendas feitas', curto: 'Vendas', frase: 'Tudo o que foi vendido, com o recibo de cada venda.', ajuda: ['Procure pelo número da venda, pelo nome do cliente ou pelo produto.', 'Toque na venda para mandar o recibo de novo, cancelar ou registrar que o cliente devolveu.'], icone: 'vendas', permissao: 'vendas', grupo: 'operacao', etapa: 1, periodo: true },
  {
    id: 'calendario',
    nome: 'Calendário',
    frase: 'O mês num calendário: o que entrou e saiu de dinheiro em cada dia.',
    ajuda: ['Verde: o dia deu lucro. Vermelho: deu prejuízo. Quanto mais forte a cor, maior o valor.', 'Os pontinhos mostram venda, conta paga, conta para vencer e conta atrasada.', 'Use as setas no alto para ver outros meses.'],
    icone: 'calendario',
    permissao: 'financeiro',
    grupo: 'operacao',
    etapa: 1,
  },

  { id: 'pedidos', nome: 'Pedidos', frase: 'Encomendas, do pedido novo até a entrega ao cliente.', ajuda: ['Cada pedido passa pelas colunas, da esquerda para a direita: Novo, Fazendo a arte, Esperando o cliente aprovar, Produzindo, Pronto e Entregue.', 'O botão embaixo de cada pedido leva para a próxima etapa e já prepara a mensagem do WhatsApp para o cliente.', 'Toque no pedido para ver os tamanhos, as cores, as imagens do cliente e receber a entrada (sinal).', 'Na entrega, você recebe o que falta e o pedido entra nas Vendas.'], icone: 'os', permissao: 'vendas', grupo: 'producao', etapa: 1 },
  { id: 'orcamentos', nome: 'Orçamentos', frase: 'Clientes pedindo preço, pelo site e pelo WhatsApp.', ajuda: ['Quem pede preço pelo site aparece aqui sozinho, com tudo o que preencheu.', 'Toque em “Responder”, ponha o valor e o prazo: o WhatsApp abre com a mensagem pronta.', 'O cliente topou? Toque em “Cliente fechou” e ele vira um pedido.'], icone: 'mensagem', permissao: 'vendas', grupo: 'producao', etapa: 1 },
  { id: 'producao', nome: 'O que produzir', curto: 'Produzir', frase: 'O que tem para fazer, do mais urgente para o menos urgente.', ajuda: ['Escolha a parte da gráfica (impressão, estampa, recorte…) para ver só o que é dela.', 'Vermelho é atrasado. O que vence primeiro fica em cima.', 'Terminou? Toque em “Terminei: pronto”. O pedido anda e o cliente pode ser avisado.'], icone: 'pincel', permissao: 'vendas', grupo: 'producao', etapa: 1 },

  {
    id: 'produtos',
    nome: 'Produtos e preços',
    curto: 'Produtos',
    frase: 'O que a gráfica vende, com preço, opções e prazo.',
    ajuda: [
      'Toque num produto para mudar o preço, o custo e as opções.',
      'Não quer vender um produto por um tempo? Desative em “…”: ele some do balcão sem ser apagado.',
      'Para aumentar o preço de vários de uma vez, use “Preços em lista”, marque os produtos e escolha a %.',
    ],
    icone: 'produtos',
    permissao: 'produtos',
    grupo: 'produtos',
    etapa: 1,
  },
  { id: 'insumos', nome: 'Material em estoque', curto: 'Material', frase: 'Camisa lisa, papel, tinta, caneca, lona: o que tem e o que precisa comprar.', ajuda: ['“Comprar” aparece no que está acabando.', 'Toque no material para tirar o que foi usado ou somar o que chegou.', 'Comprou do fornecedor? Registre em “Compras”: o estoque soma e a conta a pagar já fica marcada.'], icone: 'estoque', permissao: 'produtos', grupo: 'produtos', etapa: 1 },
  { id: 'compras', ajuda: ['Chegou material? Toque em “Chegou material”, escolha o fornecedor, o material e a quantidade.', 'O estoque soma sozinho e a conta a pagar é marcada para o dia que o fornecedor dá.'], nome: 'Compras de material', curto: 'Compras', frase: 'O que chegou dos fornecedores e quanto ainda falta pagar.', icone: 'compras', permissao: 'custo', grupo: 'produtos', etapa: 1 },

  { id: 'despesas', ajuda: ["“Já paguei” registra o gasto na hora. “Conta a pagar” guarda para depois e avisa no sino quando estiver vencendo.","Conta que se repete todo mês (aluguel, energia) já deixa a do mês seguinte marcada.","Compra de material não diminui o lucro na hora: ela conta quando o produto feito com ele é vendido."], nome: 'Contas a pagar', curto: 'Contas', frase: 'Aluguel, energia, salários: o que já pagou e o que vai vencer.', icone: 'carteira', permissao: 'despesas', grupo: 'financeiro', etapa: 1, periodo: true },
  { id: 'metas', ajuda: ["A previsão é quanto o mês vai fechar se continuar vendendo no ritmo de hoje.","A barrinha escura mostra quanto do mês já passou. Se a barra colorida estiver na frente, está no caminho certo.","A meta de cada funcionário fica em Funcionários."], nome: 'Metas do mês', curto: 'Metas', frase: 'Quanto quer vender no mês e se vai chegar lá.', icone: 'meta', permissao: 'financeiro', grupo: 'financeiro', etapa: 1 },
  { id: 'relatorios', ajuda: ["Escolha o relatório na lista e o período no alto da tela.","“Baixar para imprimir” gera um PDF. “Baixar planilha” gera um arquivo para o contador.","Toque no nome de uma coluna para colocar em ordem."], nome: 'Relatórios', frase: 'Os números do período para imprimir ou mandar para o contador.', icone: 'relatorio', permissao: 'financeiro', grupo: 'financeiro', etapa: 1, periodo: true },

  { id: 'anuncios', ajuda: ['Escolha o modelo olhando as prévias: oferta, promoção, feito aqui, tabela de preços, pronto rápido, data comemorativa ou aviso.', 'Troque a foto pelas fotos dos trabalhos ou use uma sua do celular.', 'Baixe a imagem e copie a legenda: é só postar no Instagram ou no status do WhatsApp.', 'O preço da arte é o preço de agora em Produtos.'], nome: 'Criar anúncio', curto: 'Anúncios', frase: 'Artes prontas para Instagram e WhatsApp, em vários modelos.', icone: 'anuncio', permissao: 'anuncios', grupo: 'relacionamento', etapa: 1 },
  { id: 'clientes', ajuda: ["Toque numa lista (empresas e times, aniversário, sumidos) para ver quem está nela.","O botão do WhatsApp ao lado de cada pessoa abre a mensagem pronta daquela lista.","Toque no cliente para ver a ficha com tudo o que ele comprou e os pedidos."], nome: 'Clientes', frase: 'Cada cliente, o que comprou e listas para chamar no WhatsApp.', icone: 'cliente', permissao: 'vendas', grupo: 'relacionamento', etapa: 1 },
  { id: 'equipe', ajuda: ["A comissão é uma % do que cada um vendeu, separada por tipo de produto (impressos, camisas, brindes…).","Toque no lápis para mudar a meta ou a comissão de alguém.","Lá embaixo você escolhe quem pode entrar no painel."], nome: 'Funcionários e comissões', curto: 'Funcionários', frase: 'Quem trabalha na gráfica, quanto vendeu, meta, comissão e acesso ao painel.', icone: 'equipe', permissao: 'financeiro', grupo: 'relacionamento', etapa: 1, periodo: true },

  { id: 'loja', ajuda: ["Endereço, WhatsApp e horário da gráfica aparecem no recibo e nas mensagens.","Em “Pagamento” você muda o parcelamento e a % de entrada dos pedidos.","Baixe a cópia de segurança de vez em quando e guarde no Google Drive.","Mudou um produto e se arrependeu? Em “O que foi mudado” dá para voltar como estava."], nome: 'Configurações', frase: 'Dados da gráfica, formas de pagamento, entrada dos pedidos e cópia de segurança.', icone: 'engrenagem', permissao: 'configuracoes', grupo: 'loja', etapa: 1 },
  { id: 'comissao', nome: 'Minha comissão', frase: 'Quanto você vendeu e quanto ganhou de comissão no mês.', ajuda: ['A comissão conta as vendas em que você atendeu, no mês de agora.', 'A barra mostra quanto falta para a sua meta do mês.'], icone: 'carteira', permissao: 'vendas', grupo: 'operacao', etapa: 1 },
]

/** O que o funcionário vê, nesta ordem. O resto (financeiro, site, configurações) nem aparece. */
export const DO_VENDEDOR = ['inicio', 'pdv', 'pedidos', 'orcamentos', 'producao', 'insumos', 'produtos', 'anuncios', 'comissao']
export const ehVendedor = (s: Sessao) => s.papel !== 'dono'

/** Aparece no menu (lateral, "Mais" e busca) para esta pessoa? */
export function noMenu(s: Sessao, m: Modulo) {
  if (ehVendedor(s)) return DO_VENDEDOR.includes(m.id)
  return m.id !== 'comissao' && (m.id === 'inicio' || pode(s, m.permissao))
}
/** Os módulos do menu desta pessoa (o vendedor vê na ordem do dia a dia dele). */
export const menuDe = (s: Sessao) => (ehVendedor(s) ? DO_VENDEDOR.map((id) => MODULOS.find((m) => m.id === id)!) : MODULOS.filter((m) => noMenu(s, m)))
export const nomeMenu = (_s: Sessao, m: Modulo) => m.curto ?? m.nome

/** Entrega já publicada (sobe a cada entrega; os módulos de etapa maior mostram "em breve"). */
export const ETAPA_PRONTA = 1

export const modulo = (id: string) => MODULOS.find((m) => m.id === id)
