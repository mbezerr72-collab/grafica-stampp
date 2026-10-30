// Modelos que a Estamp faz, mostrados nas fileiras da página inicial e na página de cada produto.
// Fotos em img/trabalhos/<produto>/ — [arquivo, legenda, encaixe ('cover' = foto inteira na moldura, 'contain' = produto sobre fundo branco)].
// Hoje são imagens de referência; troque pelas fotos reais dos trabalhos da gráfica quando tiver.
export const WORKS = {
  'adesivos-etiquetas': [
    ['01.jpg', 'Rótulos e adesivos redondos', 'contain'],
  ],
  'adesivos-vitrine': [
    ['01.jpg', 'Adesivo de vitrine', 'cover'],
    ['02.jpg', 'Adesivo com logo 50×50 cm', 'cover'],
    ['03.jpg', 'Aplicação de adesivo promocional', 'cover'],
  ],
  'banners-lonas': [
    ['01.jpg', 'Banner com tripé', 'contain'],
    ['02.jpg', 'Banner com bastão e corda', 'contain'],
    ['03.jpg', 'Wind banners', 'contain'],
    ['04.jpg', 'Backdrop 230×200 cm', 'contain'],
  ],
  'blocos-receituarios': [
    ['01.jpg', 'Blocos com espiral', 'contain'],
    ['02.jpg', 'Bloquinhos kraft', 'contain'],
  ],
  'uniformes-esportivos': [
    ['01.jpg', 'Camisa de futebol com nome e número', 'contain'],
    ['02.jpg', 'Camisa sublimada com mascote', 'contain'],
    ['03.jpg', 'Camisa esportiva com patrocínio', 'contain'],
    ['04.jpg', 'Camisa de futsal com patrocinadores', 'contain'],
    ['05.jpg', 'Camisa sublimada azul e laranja', 'contain'],
    ['06.jpg', 'Camisa com número dourado', 'contain'],
    ['07.jpg', 'Uniforme completo azul e amarelo', 'contain'],
    ['08.jpg', 'Uniforme completo verde-água', 'contain'],
    ['09.jpg', 'Uniforme completo azul', 'contain'],
    ['10.jpg', 'Uniforme completo vermelho e preto', 'contain'],
    ['11.jpg', 'Uniforme completo creme e azul', 'contain'],
    ['12.jpg', 'Camisa listrada degradê', 'contain'],
  ],
  'camisas-eventos': [
    ['01.jpg', 'Camisa de corrida', 'contain'],
    ['02.jpg', 'Camisa de meia maratona', 'contain'],
    ['03.jpg', 'Camisa de corrida beneficente', 'contain'],
    ['04.jpg', 'Camisa de evento de corrida', 'contain'],
    ['05.jpg', 'Camisa degradê roxa', 'contain'],
    ['06.jpg', 'Camisa degradê laranja e azul', 'contain'],
  ],
  'uniformes-profissionais': [
    ['01.jpg', 'Camiseta preta com logo', 'contain'],
    ['02.jpg', 'Camisa social com recortes', 'contain'],
    ['03.jpg', 'Camiseta com logo no peito', 'contain'],
    ['04.jpg', 'Camisas sociais com bordado', 'contain'],
    ['05.jpg', 'Camisas de botão', 'contain'],
  ],
  'camisas-polo': [
    ['01.jpg', 'Polo com logo frente e costas', 'contain'],
    ['02.jpg', 'Polos com bordado', 'contain'],
    ['03.jpg', 'Polos para equipe', 'cover'],
  ],
  canecas: [
    ['04.webp', 'Caneca branca lisa', 'cover', { x: 70, y: 57, s: 16 }],
    ['05.webp', 'Caneca branca de cerâmica', 'cover', { x: 48, y: 48, s: 22 }],
    ['01.jpg', 'Caneca com foto', 'contain'],
    ['02.jpg', 'Canecas com frases', 'contain'],
    ['03.jpg', 'Caneca com nome e monograma', 'contain'],
  ],
  canetas: [
    ['01.jpg', 'Canetas metálicas gravadas', 'contain'],
    ['02.jpg', 'Canetas coloridas com logo', 'contain'],
    ['03.jpg', 'Canetas brancas com marca', 'contain'],
    ['04.jpg', 'Canetas ecológicas kraft', 'contain'],
  ],
  chaveiros: [
    ['06.webp', 'Chaveiro liso para gravar', 'cover', { x: 43, y: 58, s: 16, r: -14 }],
    ['01.jpg', 'Chaveiros redondos', 'contain'],
    ['02.jpg', 'Chaveiro de couro e metal', 'cover'],
    ['03.jpg', 'Chaveiros emborrachados', 'cover'],
    ['04.jpg', 'Chaveiros de acrílico', 'contain'],
    ['05.jpg', 'Chaveiro de MDF', 'contain'],
  ],
  'fachadas-letreiros': [
    ['06.webp', 'Fachada pronta para a sua marca', 'cover', { x: 27, y: 50, s: 22 }],
    ['07.webp', 'Painel na parede', 'cover', { x: 47, y: 57, s: 22 }],
    ['01.jpg', 'Fachada em ACM com letras', 'cover'],
    ['02.jpg', 'Letreiro em letra caixa', 'cover'],
    ['03.jpg', 'Letreiro iluminado', 'cover'],
    ['04.jpg', 'Letras em relevo', 'cover'],
    ['05.jpg', 'Luminoso redondo', 'cover'],
  ],
  'trofeus-medalhas': [
    ['01.jpg', 'Medalhas personalizadas', 'contain'],
    ['02.jpg', 'Medalhas em MDF', 'contain'],
    ['03.jpg', 'Medalha de corrida', 'contain'],
    ['04.jpg', 'Medalha de 1º lugar', 'contain'],
    ['05.jpg', 'Troféus em acrílico', 'contain'],
    ['06.jpg', 'Troféus artilheiro e goleiro', 'contain'],
    ['07.jpg', 'Troféus em MDF', 'contain'],
    ['08.jpg', 'Troféus coloridos', 'contain'],
    ['09.jpg', 'Troféu em acrílico espelhado', 'cover'],
  ],
  'placas-personalizadas': [
    ['01.jpg', 'Placa 60×40 cm', 'contain'],
    ['02.jpg', 'Placas em aço escovado', 'contain'],
    ['03.jpg', 'Plaquinhas de identificação', 'cover'],
  ],
  'cartao-visita': [
    ['02.webp', 'Cartões pretos lisos', 'cover', { x: 38, y: 58, s: 14, t: 'claro' }],
    ['03.webp', 'Cartões pretos sobre mármore', 'cover', { x: 45, y: 23, s: 13, t: 'claro' }],
    ['01.jpg', 'Cartão preto com nome em prata', 'cover'],
  ],
  'abadas': [
    ['01.jpg', 'Regata estampada', 'cover'],
  ],
  'ecobags': [
    ['01.jpg', 'Ecobag de algodão cru', 'cover'],
  ],
  'arte-camisas': [
    ['01.jpg', 'Arte de camisa feita no computador', 'cover'],
  ],
  'identidade-visual': [
    ['01.jpg', 'Papelaria da mesma marca', 'cover'],
  ],
  'ajustes-arquivos': [
    ['01.jpg', 'Arquivo conferido antes de imprimir', 'cover'],
    ['02.jpg', 'Cores e provas na mesa', 'cover'],
  ],
  'panfletos': [
    ['01.jpg', 'Panfletos 10×15 cm', 'contain'],
    ['02.jpg', 'Panfleto em papel couchê', 'cover'],
  ],
  'cartazes-folders': [
    ['01.jpg', 'Cartaz de oferta', 'contain'],
    ['02.jpg', 'Cartaz em papel kraft', 'cover'],
  ],
  'cartao-fotografico': [
    ['01.jpg', 'Cartões fotográficos', 'contain'],
    ['02.jpg', 'Fotos impressas', 'cover'],
    ['03.jpg', 'Fotos no estilo instantânea', 'cover'],
  ],
  'camisas-personalizadas': [
    ['01.jpg', 'Logo na frente e nas costas', 'contain'],
    ['04.webp', 'Camiseta branca lisa', 'cover', { x: 46, y: 36, s: 18 }],
    ['05.webp', 'Camiseta preta lisa', 'cover', { x: 44, y: 38, s: 16, t: 'claro' }],
    ['02.jpg', 'Camiseta branca com estampa colorida', 'cover'],
    ['03.jpg', 'Camiseta preta com estampa', 'cover'],
  ],
  'kits-empresas': [
    ['01.jpg', 'Cadernos kraft com caneta', 'contain'],
    ['02.jpg', 'Caderno, caneta e caneca', 'cover'],
  ],
  'criacao-logotipo': [
    ['01.jpg', 'Criação de logotipo', 'cover'],
    ['02.jpg', 'Esboços do logotipo', 'cover'],
  ],
  'arte-divulgacao': [
    ['01.jpg', 'Arte para stories de ótica', 'cover'],
    ['02.jpg', 'Post para redes sociais', 'cover'],
  ],
};

// logo: onde vai o selo "Seu logo aqui" nas fotos de produto liso (x/y = centro em %, s = largura em %, r = giro, t = 'claro' em produto escuro)
export const worksOf = (id) => (WORKS[id] || []).map(([f, cap, fit, logo]) => ({ src: `img/trabalhos/${id}/${f}`, cap, fit, id, logo }));
