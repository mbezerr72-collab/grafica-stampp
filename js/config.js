// Carrinho e pagamento online (Mercado Pago). Desligado: todo produto vira pedido de projeto sob medida.
export const VENDA_ONLINE = false;

// Dados da loja (tirados do WhatsApp Business e do Instagram @graficaestampczs).
export const SITE = {
  name: 'Gráfica Estamp',
  whatsapp: '5568999967316',
  phone: '(68) 99996-7316',
  instagram: 'graficaestampczs',
  since: 2013,
  address: 'R. 17 de Novembro, 1471 — Telégrafo',
  city: 'Cruzeiro do Sul — AC, 69980-000',
  mapsQuery: 'R. 17 de Novembro, 1471, Cruzeiro do Sul - AC, 69980-000',
  // [dia da semana (0=dom), abre, fecha]
  hours: [
    [1, '07:30', '17:30'], [2, '07:30', '17:30'], [3, '07:30', '17:30'],
    [4, '07:30', '17:30'], [5, '07:30', '17:30'], [6, '07:30', '11:30'],
  ],
};

export const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function hoursTable() {
  return [1, 2, 3, 4, 5, 6, 0].map((i) => {
    const d = DAYS[i];
    const h = SITE.hours.find((x) => x[0] === i);
    return [d, h ? `${h[1]} – ${h[2]}` : 'Fechado'];
  });
}
// Usa o horário do Acre (UTC-5), não o do visitante
export function isOpenNow(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Rio_Branco', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const h = SITE.hours.find((x) => x[0] === day);
  if (!h) return false;
  const m = Number(p.hour) * 60 + Number(p.minute);
  const toMin = (s) => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
  return m >= toMin(h[1]) && m < toMin(h[2]);
}
