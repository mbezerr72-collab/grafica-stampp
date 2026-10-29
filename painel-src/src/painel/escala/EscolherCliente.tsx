import { useState } from 'react'
import { negocio, type Cliente } from '../../data/store'
import { Icone } from '../ui'
import { clienteCombina, clientePeloTelefone, formatarTelefone, soDigitos } from './automatico'
import { BotaoCamera, LerCodigo } from './LerCodigo'

/** Quem clicou em "Quero esse" no site naquele produto (vira sugestão de cliente em 1 toque). */
export type Sugerido = { nome: string; telefone: string; clienteId?: string; motivo: string }

/**
 * Escolher o cliente: busca por nome, telefone (com ou sem DDD e 9) ou CPF; "Cliente pelo WhatsApp"
 * (cola ou lê o número; se não existir, cadastra só com nome + telefone); e os interessados do site.
 */
export function EscolherCliente({ clientes, cliente, mudar, sugeridos = [] }: { clientes: Cliente[]; cliente?: Cliente; mudar: (id?: string) => void; sugeridos?: Sugerido[] }) {
  const [q, setQ] = useState('')
  const [zap, setZap] = useState(false)
  const [tel, setTel] = useState('')
  const [nome, setNome] = useState('')
  const [lendo, setLendo] = useState(false)
  if (cliente)
    return (
      <div className="cli">
        <span className="avatar" aria-hidden="true">
          {cliente.nome
            .split(' ')
            .map((x) => x[0])
            .slice(0, 2)
            .join('')}
        </span>
        <span className="cli-txt">
          <b>{cliente.nome}</b>
          <small>
            {cliente.telefone}, cliente desde {cliente.criadoEm.slice(0, 4)}
          </small>
        </span>
        <button type="button" className="link-bt" onClick={() => mudar(undefined)}>
          Trocar
        </button>
      </div>
    )

  const cadastrar = (n: string, t: string) => mudar(negocio.salvarCliente({ nome: n.trim(), telefone: formatarTelefone(t), cidade: 'Cruzeiro do Sul', origem: 'loja', obs: '' }))
  const escolherSugerido = (x: Sugerido) => {
    const ja = x.clienteId ? clientes.find((c) => c.id === x.clienteId) : clientePeloTelefone(clientes, x.telefone)
    if (ja) mudar(ja.id)
    else mudar(negocio.salvarCliente({ nome: x.nome, telefone: x.telefone, cidade: 'Cruzeiro do Sul', origem: 'site', obs: x.motivo }))
  }

  if (zap) {
    const ja = clientePeloTelefone(clientes, tel)
    const completo = soDigitos(tel).length >= 10
    return (
      <form
        className="cli-novo"
        onSubmit={(e) => {
          e.preventDefault()
          if (ja) mudar(ja.id)
          else if (completo && nome.trim()) cadastrar(nome, tel)
          else return
          setZap(false)
        }}
      >
        <div className="imei-caixa">
          <input placeholder="WhatsApp do cliente" aria-label="WhatsApp do cliente" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} autoFocus />
          {'clipboard' in navigator && (
            <button
              type="button"
              className="bt bt-leve bt-pequeno"
              onClick={async () => {
                const t = await navigator.clipboard.readText().catch(() => '')
                if (soDigitos(t).length >= 8) setTel(t.trim())
              }}
            >
              Colar
            </button>
          )}
          <BotaoCamera abrir={() => setLendo(true)} rotulo="Ler o QR do WhatsApp do cliente" />
        </div>
        {ja ? (
          <p className="ok-linha pequeno">Já é cliente: {ja.nome}. Toque em Usar.</p>
        ) : (
          completo && <input placeholder="Nome do cliente" aria-label="Nome do cliente" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        )}
        <div className="cli-novo-acoes">
          <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setZap(false)}>
            Cancelar
          </button>
          <button type="submit" className="bt bt-forte bt-pequeno" disabled={!ja && !(completo && nome.trim())}>
            {ja ? 'Usar' : 'Cadastrar'}
          </button>
        </div>
        {lendo && (
          <LerCodigo
            titulo="Leia o QR do WhatsApp do cliente"
            dica="No WhatsApp do cliente: Configurações › QR code. Ou a etiqueta com o número."
            aceitar={(t) => soDigitos(t).length >= 10}
            fechar={() => setLendo(false)}
            lido={(t) => setTel(soDigitos(t.replace(/^https?:\/\/wa\.me\//, '')))}
          />
        )}
      </form>
    )
  }

  const achados = q.trim().length > 1 ? clientes.filter((c) => clienteCombina(c, q)).slice(0, 5) : []
  return (
    <div className="cli-busca">
      {sugeridos.length > 0 && (
        <div className="cli-sugeridos">
          <p className="mut pequeno">Clicaram em “Quero esse” no site:</p>
          <div className="fichas">
            {sugeridos.slice(0, 3).map((x) => (
              <button key={x.telefone} type="button" className="ficha ficha--dupla" onClick={() => escolherSugerido(x)}>
                {x.nome.split(' ').slice(0, 2).join(' ')}
                <small>{x.motivo}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="entrada entrada--p">
        <Icone nome="cliente" tamanho={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente: nome, telefone ou CPF" aria-label="Buscar cliente" />
      </label>
      {achados.length > 0 && (
        <ul className="cli-lista">
          {achados.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => mudar(c.id)}>
                <b>{c.nome}</b>
                <small>{c.telefone}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length > 1 && !achados.length && <p className="mut pequeno">Ninguém com “{q.trim()}”.</p>}
      <div className="cli-novo-acoes cli-acoes">
        <button
          type="button"
          className="bt bt-leve bt-pequeno"
          onClick={() => {
            setTel(soDigitos(q).length >= 8 ? q : '')
            setNome(soDigitos(q).length >= 8 ? '' : q)
            setZap(true)
          }}
        >
          <Icone nome="whats" tamanho={16} />
          Cliente pelo WhatsApp
        </button>
      </div>
    </div>
  )
}
