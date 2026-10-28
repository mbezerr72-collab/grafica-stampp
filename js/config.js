// Dados da loja. TROQUE os valores marcados com TODO antes de publicar.
export const SITE = {
  name: 'Gráfica Estamp',
  whatsapp: '5500000000000', // TODO: DDI + DDD + número, só dígitos (ex.: 5584999998888)
  instagram: 'graficaestamp', // TODO: confirmar @
  address: 'Rua Exemplo, 123 — Centro', // TODO
  city: 'Sua Cidade — UF', // TODO
  mapsQuery: 'Gráfica Estamp', // TODO: endereço completo para o mapa
  // [dia da semana (0=dom), abre, fecha] — horários em 24h. TODO: confirmar
  hours: [
    [1, '08:00', '18:00'], [2, '08:00', '18:00'], [3, '08:00', '18:00'],
    [4, '08:00', '18:00'], [5, '08:00', '18:00'], [6, '08:00', '12:00'],
  ],
};

export const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export function hoursTable() {
  return DAYS.map((d, i) => {
    const h = SITE.hours.find((x) => x[0] === i);
    return [d, h ? `${h[1]} – ${h[2]}` : 'Fechado'];
  });
}
export function isOpenNow(now = new Date()) {
  const h = SITE.hours.find((x) => x[0] === now.getDay());
  if (!h) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  const toMin = (s) => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
  return m >= toMin(h[1]) && m < toMin(h[2]);
}
