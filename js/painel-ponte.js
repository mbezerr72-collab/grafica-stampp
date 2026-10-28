// Ponte site → painel: cada orçamento ou pedido enviado pelo site fica guardado neste navegador,
// e o painel de gestão (/painel, mesmo endereço) importa para a aba Orçamentos.
// Na versão com servidor, isto vira um POST para a API do painel.
const CHAVE = 'estamp:site:pedidos';

export const protocolo = () => `EST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export function registrarNoPainel(pedido) {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    lista.push({ data: new Date().toISOString(), ...pedido });
    localStorage.setItem(CHAVE, JSON.stringify(lista.slice(-50)));
  } catch { /* sem armazenamento: o pedido segue só pelo WhatsApp */ }
}
