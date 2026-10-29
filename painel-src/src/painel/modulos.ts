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
  operacao: 'Operação',
  producao: 'Produção',
  produtos: 'Produtos e insumos',
  financeiro: 'Financeiro',
  relacionamento: 'Relacionamento',
  loja: 'Gráfica',
}

export const MODULOS: Modulo[] = [
  {
    id: 'inicio',
    nome: 'Início',
    frase: 'Faturamento, lucro, pedidos e o que pede atenção hoje.',
    ajuda: [
      'Troque o período no cabeçalho: Hoje, 7 dias, 30 dias, Este mês, Este ano, Desde o início ou datas suas.',
      'A setinha verde ou vermelha compara com o período anterior do mesmo tamanho.',
      'Lucro é o faturamento menos o custo dos produtos e as despesas da gráfica. Compra de insumo não entra no lucro, entra no Caixa.',
    ],
    icone: 'inicio',
    permissao: 'produtos',
    grupo: 'operacao',
    etapa: 1,
    periodo: true,
  },
  { id: 'pdv', nome: 'Balcão', frase: 'Venda rápida: cópia, impressão, plastificação e produtos prontos.', ajuda: ['Busque o produto, toque nele e escolha a opção. Mude a quantidade no carrinho.', "Para dividir o pagamento (parte no Pix, parte no cartão), toque em 'Dividir em duas formas'.", 'Pedido que precisa de arte ou produção não é feito aqui: abra em Pedidos.', 'Depois de finalizar, baixe o recibo em PDF e mande a mensagem pelo WhatsApp.'], icone: 'pdv', permissao: 'vendas', grupo: 'operacao', etapa: 1 },
  { id: 'vendas', nome: 'Vendas', frase: 'Vendas do balcão e pedidos entregues, com recibo.', ajuda: ['Busque pelo número, nome do cliente ou produto.', 'Toque na venda para baixar o recibo de novo, mandar no WhatsApp, cancelar ou registrar devolução.'], icone: 'vendas', permissao: 'vendas', grupo: 'operacao', etapa: 1, periodo: true },
  {
    id: 'calendario',
    nome: 'Calendário',
    frase: 'Entregas do mês e o que entrou e saiu em cada dia.',
    ajuda: ['A cor do dia mostra o resultado: verde deu lucro, vermelho deu prejuízo. Quanto mais forte, maior o valor.', 'Os pontinhos marcam venda, despesa paga, conta a vencer e conta atrasada.', 'Use as setas do cabeçalho para ver outros meses.'],
    icone: 'calendario',
    permissao: 'financeiro',
    grupo: 'operacao',
    etapa: 1,
  },

  { id: 'pedidos', nome: 'Pedidos', frase: 'Quadro da produção, do pedido novo à entrega.', ajuda: ['Cada pedido anda no quadro: Novo pedido, Fazendo a arte, Aguardando aprovação, Em produção, Pronto e Entregue.', 'O botão do cartão leva para a próxima etapa e já abre a mensagem do WhatsApp para o cliente (arte para aprovar, pedido pronto).', 'Toque no pedido para ver a grade de tamanhos, as cores, as imagens que o cliente mandou e receber o sinal.', 'Na entrega, o resto é cobrado e o pedido vira venda.'], icone: 'os', permissao: 'vendas', grupo: 'producao', etapa: 1 },
  { id: 'orcamentos', nome: 'Orçamentos', frase: 'Pedidos de orçamento do site e do WhatsApp, até virar pedido.', ajuda: ['Os pedidos feitos no site chegam aqui sozinhos, com tudo o que o cliente preencheu.', 'Responda com o valor e o prazo: o WhatsApp abre com a mensagem pronta.', 'Quando o cliente aprovar, toque em “Virou pedido”: ele entra no quadro de Pedidos.'], icone: 'mensagem', permissao: 'vendas', grupo: 'producao', etapa: 1 },
  { id: 'producao', nome: 'Fila de produção', curto: 'Produção', frase: 'O que cada máquina tem para fazer, pelo prazo.', ajuda: ['Cada setor (sublimação, DTF, silk, impressão, plotter…) mostra os pedidos em produção, do prazo mais curto ao mais longo.', 'Vermelho é atrasado; amarelo vence hoje ou amanhã.', 'Toque em “Pronto” quando terminar: o pedido anda no quadro e o cliente pode ser avisado.'], icone: 'pincel', permissao: 'vendas', grupo: 'producao', etapa: 1 },

  {
    id: 'produtos',
    nome: 'Produtos e preços',
    curto: 'Produtos',
    frase: 'Tabela de preços, opções, custo e prazo de cada produto.',
    ajuda: [
      'Toque num produto para mudar preço, custo e opções.',
      'Desligar um produto tira ele do balcão sem apagar.',
      'Reajuste vários de uma vez marcando e escolhendo a %.',
    ],
    icone: 'produtos',
    permissao: 'produtos',
    grupo: 'produtos',
    etapa: 1,
  },
  { id: 'insumos', nome: 'Insumos', frase: 'Camisas lisas, papel, tinta, canecas, lona: o que tem e o que comprar.', ajuda: ['Vermelho é o que está abaixo do mínimo: precisa comprar.', 'Toque no + ou no − para dar entrada ou baixa rápida.', 'Para comprar com nota e conta a pagar, use Compras e fornecedores.'], icone: 'estoque', permissao: 'produtos', grupo: 'produtos', etapa: 1 },
  { id: 'compras', ajuda: ['Escolha o fornecedor, os insumos e as quantidades.', 'O custo médio do insumo se ajusta sozinho e a conta a pagar é criada no prazo do fornecedor.'], nome: 'Compras e fornecedores', curto: 'Compras', frase: 'Entrada de insumos com custo médio e conta a pagar.', icone: 'compras', permissao: 'custo', grupo: 'produtos', etapa: 1 },

  { id: 'despesas', ajuda: ["“Já paguei” lança a despesa na hora. “Conta a pagar” agenda e avisa no sino quando vence.","Ao marcar uma conta como paga, ela vira despesa. Conta que repete todo mês já agenda a próxima.","Compra de insumo fica fora do lucro: ela vira custo quando o produto é vendido."], nome: 'Contas e despesas', frase: 'A pagar, a receber e o que já saiu.', icone: 'carteira', permissao: 'despesas', grupo: 'financeiro', etapa: 1, periodo: true },
  { id: 'metas', ajuda: ["A projeção é o ritmo do mês até hoje levado até o último dia.","A barrinha escura mostra quanto do mês já passou: se a barra colorida está à frente, a meta está no ritmo.","A meta de cada atendente fica em Equipe e comissões."], nome: 'Metas', frase: 'Meta do mês e projeção de fechamento.', icone: 'meta', permissao: 'financeiro', grupo: 'financeiro', etapa: 1 },
  { id: 'relatorios', ajuda: ["Escolha o relatório à esquerda (no celular, em cima) e o período no cabeçalho.","“Baixar para imprimir” serve para guardar e imprimir; “Baixar planilha”, para o contador.","Toque no título de uma coluna para ordenar."], nome: 'Relatórios', frase: 'Vendas dia a dia, lucro por produto, pedidos, formas e resumo.', icone: 'relatorio', permissao: 'financeiro', grupo: 'financeiro', etapa: 1, periodo: true },

  { id: 'clientes', ajuda: ["Toque numa lista (empresas e times, aniversário, sumidos) para ver quem está nela.","O botão do WhatsApp ao lado de cada pessoa abre a mensagem pronta daquela lista.","Toque no cliente para ver a ficha com tudo o que ele comprou e os pedidos."], nome: 'Clientes', frase: 'Ficha do cliente, pedidos e listas inteligentes.', icone: 'cliente', permissao: 'vendas', grupo: 'relacionamento', etapa: 1 },
  { id: 'equipe', ajuda: ["A comissão é a % do valor vendido em cada linha (impressos, camisas, brindes, comunicação visual e design).","A meta do período é a meta do mês proporcional aos dias escolhidos.","Toque no lápis para mudar a meta ou a comissão de alguém."], nome: 'Equipe e comissões', frase: 'Pessoas, acesso, meta, comissão e ranking.', icone: 'equipe', permissao: 'financeiro', grupo: 'relacionamento', etapa: 1, periodo: true },

  { id: 'loja', ajuda: ["Informações e horário da gráfica aparecem no recibo e nas mensagens.","Pagamento muda o parcelamento no balcão.","Baixe a cópia de segurança de vez em quando e guarde no Drive.","Toda mudança em produto fica no Histórico e pode ser desfeita."], nome: 'Configurações da gráfica', curto: 'Configurações', frase: 'Pagamento, sinal, histórico e cópia de segurança.', icone: 'engrenagem', permissao: 'configuracoes', grupo: 'loja', etapa: 1 },
  { id: 'comissao', nome: 'Minha comissão', frase: 'Quanto você vendeu e quanto ganhou de comissão no mês.', ajuda: ['A comissão conta as vendas em que você é o atendente, no mês de agora.', 'A barra mostra quanto falta para a sua meta do mês.'], icone: 'carteira', permissao: 'vendas', grupo: 'operacao', etapa: 1 },
]

/** O que o funcionário vê, nesta ordem. O resto (financeiro, site, configurações) nem aparece. */
export const DO_VENDEDOR = ['inicio', 'pdv', 'pedidos', 'orcamentos', 'producao', 'insumos', 'produtos', 'comissao']
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
