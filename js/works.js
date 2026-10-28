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
  'arte-divulgacao': [
    ['01.jpg', 'Arte para stories de ótica', 'cover'],
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
  'kits-empresas': [
    ['01.jpg', 'Cadernos kraft com caneta', 'contain'],
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
  'camisas-personalizadas': [
    ['01.jpg', 'Logo na frente e nas costas', 'contain'],
  ],
  'camisas-polo': [
    ['01.jpg', 'Polo com logo frente e costas', 'contain'],
    ['02.jpg', 'Polos com bordado', 'contain'],
    ['03.jpg', 'Polos para equipe', 'cover'],
  ],
  canecas: [
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
  'cartazes-folders': [
    ['01.jpg', 'Cartaz de oferta', 'contain'],
  ],
  'cartao-fotografico': [
    ['01.jpg', 'Cartões fotográficos', 'contain'],
  ],
  chaveiros: [
    ['01.jpg', 'Chaveiros redondos', 'contain'],
    ['02.jpg', 'Chaveiro de couro e metal', 'cover'],
    ['03.jpg', 'Chaveiros emborrachados', 'cover'],
    ['04.jpg', 'Chaveiros de acrílico', 'contain'],
    ['05.jpg', 'Chaveiro de MDF', 'contain'],
  ],
  'criacao-logotipo': [
    ['01.jpg', 'Criação de logotipo', 'cover'],
  ],
  'fachadas-letreiros': [
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
  panfletos: [
    ['01.jpg', 'Panfletos 10×15 cm', 'contain'],
  ],
  'placas-personalizadas': [
    ['01.jpg', 'Placa 60×40 cm', 'contain'],
    ['02.jpg', 'Placas em aço escovado', 'contain'],
    ['03.jpg', 'Plaquinhas de identificação', 'cover'],
  ],
};

export const worksOf = (id) => (WORKS[id] || []).map(([f, cap, fit]) => ({ src: `img/trabalhos/${id}/${f}`, cap, fit, id }));
