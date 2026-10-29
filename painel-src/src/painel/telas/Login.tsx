import { useState, type FormEvent } from 'react'
import { sessao } from '../../data/store'
import { Icone } from '../ui'
import { LogoEscala, MARCA, SinalEmpresa } from '../escala/marca'

/** Login da Escala Business (demonstração: já vem preenchido e aceita qualquer coisa). */
export function Login() {
  const [email, setEmail] = useState('dono@graficaestamp.demo')
  const [senha, setSenha] = useState('demonstracao')
  const [ver, setVer] = useState(false)
  const entrar = (e: FormEvent) => {
    e.preventDefault()
    sessao.entrar('dono', email)
  }
  return (
    <div className="lg">
      <section className="lg-marca">
        <span className="grande" aria-hidden="true">
          <LogoEscala tamanho={620} fundo={false} />
        </span>
        <div className="lg-logo">
          <LogoEscala tamanho={52} />
          <div>
            <b>ESCALA</b>
            <small>BUSINESS</small>
          </div>
        </div>
        <div className="lg-frase">
          <h2>A gráfica inteira na palma da mão.</h2>
          <p>Pedidos do orçamento à entrega, fila de produção, insumos, balcão e clientes. No celular ou no computador.</p>
        </div>
        <ul className="lg-lista" aria-label="O que tem no sistema">
          <li>Pedidos e orçamentos</li>
          <li>Fila de produção</li>
          <li>Insumos e compras</li>
          <li>Metas e comissões</li>
        </ul>
      </section>

      <main className="lg-form">
        <form className="lg-caixa" onSubmit={entrar}>
          <h1>Entrar</h1>
          <p className="sub">Painel de gestão da gráfica</p>
          <div className="lg-empresa">
            <SinalEmpresa />
            <div>
              <b>
                {MARCA.empresa.nome}
                <i>.</i>
              </b>
              <small>
                {MARCA.empresa.local}, {MARCA.empresa.cidade}
              </small>
            </div>
          </div>
          <label className="campo-e">
            <span>E-mail</span>
            <span className="entrada">
              <Icone nome="email" tamanho={20} />
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </span>
          </label>
          <label className="campo-e">
            <span>Senha</span>
            <span className="entrada">
              <Icone nome="cadeado" tamanho={20} />
              <input type={ver ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
              <button type="button" className="entrada-bt" aria-label={ver ? 'Esconder a senha' : 'Mostrar a senha'} aria-pressed={ver} onClick={() => setVer(!ver)}>
                <Icone nome="olho" tamanho={20} />
              </button>
            </span>
          </label>
          <button type="submit" className="btn btn-p btn-grande">
            Entrar
          </button>
          <p className="lg-ou">ou</p>
          <button type="button" className="btn btn-o btn-grande" onClick={() => sessao.entrar('funcionario', 'atendimento@graficaestamp.demo')}>
            Entrar como funcionário
          </button>
          <p className="lg-nota">
            <Icone nome="info" tamanho={18} />
            Demonstração: qualquer e-mail e senha entram. O que mudar aqui vale só neste aparelho e não muda o site para os clientes.
          </p>
          <div className="lg-pe">
            <span>{MARCA.sistema}</span>
            <span>Precisa de ajuda? {MARCA.ajuda}</span>
          </div>
        </form>
      </main>
    </div>
  )
}
