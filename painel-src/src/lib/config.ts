/**
 * Informações da loja. Todo link e texto de contato do site sai daqui. O painel do dono troca
 * estes valores (em "Informações da loja"); sem painel, valem os de baixo.
 */
export type HorarioDia = { dia: string; abre: string; fecha: string; fechado: boolean }

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export const LOJA = {
  nome: 'Gráfica Estamp',
  whatsapp: '5568999967316',
  instagram: 'graficaestampczs',
  endereco: ['R. 17 de Novembro, 1471', 'Telégrafo', 'Cruzeiro do Sul, AC, 69980-000'],
  horarios: DIAS.map((dia): HorarioDia => ({ dia, abre: '07:30', fecha: dia === 'Sábado' ? '11:30' : '17:30', fechado: dia === 'Domingo' })),
  prazoEntrega: 'Retirada na gráfica ou entrega em Cruzeiro do Sul, valor a combinar.',
}

export const waLink = (message: string) => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(message)}`

export const instagramLink = () => `https://instagram.com/${LOJA.instagram}`
