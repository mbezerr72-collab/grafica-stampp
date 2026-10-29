/**
 * Fotos que o dono tira no painel. Ficam no IndexedDB deste navegador (texto e números ficam no
 * localStorage). O produto guarda só o endereço 'idb:<id>'; quem mostra a foto pede o arquivo aqui.
 * Na versão com servidor, este arquivo vira o envio para o armazenamento de imagens.
 */

const BANCO = 'estamp-fotos'
const TABELA = 'fotos'
export const PREFIXO = 'idb:'

let aberto: Promise<IDBDatabase> | null = null

function abrir(): Promise<IDBDatabase> {
  aberto ??= new Promise((ok, erro) => {
    try {
      const r = indexedDB.open(BANCO, 1)
      r.onupgradeneeded = () => r.result.createObjectStore(TABELA)
      r.onsuccess = () => ok(r.result)
      r.onerror = () => erro(r.error)
    } catch (e) {
      erro(e)
    }
  })
  return aberto
}

async function pedido<T>(modo: IDBTransactionMode, fazer: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir()
  return new Promise((ok, erro) => {
    const r = fazer(db.transaction(TABELA, modo).objectStore(TABELA))
    r.onsuccess = () => ok(r.result)
    r.onerror = () => erro(r.error)
  })
}

const novoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Guarda a foto e devolve o endereço que vai no produto. */
export async function guardarFoto(arquivo: Blob): Promise<string> {
  const id = novoId()
  await pedido('readwrite', (t) => t.put(arquivo, id))
  return PREFIXO + id
}

export async function apagarFoto(endereco: string) {
  if (!endereco.startsWith(PREFIXO)) return
  try {
    await pedido('readwrite', (t) => t.delete(endereco.slice(PREFIXO.length)))
  } catch {
    /* sem banco: nada a apagar */
  }
  const u = urls.get(endereco)
  if (u) URL.revokeObjectURL(u)
  urls.delete(endereco)
}

export async function apagarTodasFotos() {
  try {
    await pedido('readwrite', (t) => t.clear())
  } catch {
    /* sem banco */
  }
  urls.forEach((u) => URL.revokeObjectURL(u))
  urls.clear()
}

/** Todas as fotos (para o backup). */
export async function listarFotos(): Promise<{ id: string; blob: Blob }[]> {
  try {
    const db = await abrir()
    return await new Promise((ok, erro) => {
      const saida: { id: string; blob: Blob }[] = []
      const r = db.transaction(TABELA).objectStore(TABELA).openCursor()
      r.onsuccess = () => {
        const c = r.result
        if (!c) return ok(saida)
        saida.push({ id: PREFIXO + String(c.key), blob: c.value as Blob })
        c.continue()
      }
      r.onerror = () => erro(r.error)
    })
  } catch {
    return []
  }
}

export async function gravarFotoComId(endereco: string, blob: Blob) {
  await pedido('readwrite', (t) => t.put(blob, endereco.slice(PREFIXO.length)))
}

const urls = new Map<string, string>()

/** Endereço que o <img> entende (blob:), ou undefined se a foto sumiu deste navegador. */
export async function urlDaFoto(endereco: string): Promise<string | undefined> {
  if (!endereco.startsWith(PREFIXO)) return endereco
  const pronto = urls.get(endereco)
  if (pronto) return pronto
  try {
    const blob = await pedido<Blob | undefined>('readonly', (t) => t.get(endereco.slice(PREFIXO.length)))
    if (!blob) return undefined
    const u = URL.createObjectURL(blob)
    urls.set(endereco, u)
    return u
  } catch {
    return undefined
  }
}

/** Já resolvida antes (sem esperar): evita piscar ao trocar de cor. */
export const urlPronta = (endereco: string) => (endereco.startsWith(PREFIXO) ? urls.get(endereco) : endereco)
