/**
 * Leitor de código pela câmera: código de barras do produto, número do WhatsApp ou o QR da ficha de produção.
 * Usa o leitor do próprio navegador (Chrome no Android tem). Sem ele (iPhone), a câmera não lê
 * sozinha: fica o campo de digitar e, na demonstração, o botão de simular a leitura.
 */
import { useEffect, useRef, useState } from 'react'
import { Icone } from '../ui'

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type ClasseDetector = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> }
const Classe = () => (globalThis as unknown as { BarcodeDetector?: ClasseDetector }).BarcodeDetector

/** O aparelho tem o leitor de código do navegador e câmera? */
export const podeLerCodigo = () => !!Classe() && !!navigator.mediaDevices?.getUserMedia

export type LerProps = {
  fechar: () => void
  /** Cada código lido. No modo contínuo, a janela continua aberta para o próximo. */
  lido: (texto: string) => void
  titulo?: string
  dica?: string
  /** Aceita o que a câmera leu? (ex.: só o QR de um pedido). */
  aceitar?: (texto: string) => boolean
  /** Bipar vários em seguida. */
  continuo?: boolean
  /** "12 de 20 lidos" no modo contínuo. */
  contagem?: string
  /** Na demonstração: gera um código de exemplo como se a câmera tivesse lido. */
  simular?: () => string
}

export function LerCodigo({ fechar, lido, titulo = 'Aponte a câmera para o código', dica = 'O código de barras do produto ou o QR da ficha de produção.', aceitar = (t) => t.trim().length > 3, continuo, contagem, simular }: LerProps) {
  const video = useRef<HTMLVideoElement>(null)
  const dlg = useRef<HTMLDialogElement>(null)
  const [erro, setErro] = useState('')
  const [semLeitor] = useState(() => !Classe())
  const [digitado, setDigitado] = useState('')
  const [ultimo, setUltimo] = useState('')
  // As funções mudam a cada desenho da tela; o laço da câmera lê sempre a mais nova.
  const atual = useRef({ lido, aceitar, fechar, continuo })
  atual.current = { lido, aceitar, fechar, continuo }

  const entregar = (t: string) => {
    atual.current.lido(t)
    setUltimo(t)
    if (!atual.current.continuo) atual.current.fechar()
  }

  useEffect(() => {
    dlg.current?.showModal()
    let fluxo: MediaStream | null = null
    let parar = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este aparelho não abre a câmera aqui. Digite o código abaixo.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        fluxo = s
        if (parar || !video.current) return
        video.current.srcObject = s
        await video.current.play().catch(() => {})
        const C = Classe()
        if (!C) return
        const formatos = (await C.getSupportedFormats?.().catch(() => null)) ?? ['code_128', 'ean_13', 'code_39', 'qr_code']
        const detector = new C({ formats: formatos })
        let repetido = ''
        while (!parar) {
          const r = await detector.detect(video.current!).catch(() => [])
          const t = r.map((x) => x.rawValue.trim()).find((x) => atual.current.aceitar(x))
          if (t && t !== repetido) {
            repetido = t
            entregar(t)
            if (!atual.current.continuo) return
            navigator.vibrate?.(60)
          }
          await new Promise((ok) => setTimeout(ok, 220))
        }
      })
      .catch(() => setErro('Não deu para abrir a câmera. Libere a câmera para este site ou digite o código abaixo.'))
    return () => {
      parar = true
      fluxo?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <dialog ref={dlg} className="ler" onCancel={fechar} aria-label={titulo}>
      <div className="ler-caixa">
        <div className="folha-topo">
          <h2>{titulo}</h2>
          <button type="button" className="icone-bt icone-bt--leve" aria-label="Fechar" onClick={fechar}>
            <Icone nome="fechar" />
          </button>
        </div>
        {erro ? <p className="erro">{erro}</p> : <video ref={video} muted playsInline />}
        {contagem && <p className="ler-contagem num">{contagem}</p>}
        {ultimo && continuo && <p className="mut pequeno">Último lido: {ultimo}</p>}
        {semLeitor || erro ? (
          <p className="pag-falta ate">A câmera deste aparelho não lê o código sozinha. No iPhone, digite os números de baixo do código.</p>
        ) : (
          <p className="mut pequeno">{dica}</p>
        )}
        <form
          className={'ler-manual' + (semLeitor || erro ? ' ler-manual--destaque' : '')}
          onSubmit={(e) => {
            e.preventDefault()
            if (!digitado.trim()) return
            entregar(digitado.trim())
            setDigitado('')
          }}
        >
          <input value={digitado} onChange={(e) => setDigitado(e.target.value)} placeholder={semLeitor || erro ? 'Números de baixo do código' : 'Ou digite o código'} aria-label="Digitar o código" inputMode={semLeitor || erro ? 'numeric' : 'text'} autoComplete="off" autoFocus={semLeitor || !!erro} />
          <button type="submit" className="btn btn-o" disabled={!digitado.trim()}>
            Usar
          </button>
        </form>
        {simular && (
          <button type="button" className="link-bt" onClick={() => entregar(simular())}>
            Simular a leitura (demonstração)
          </button>
        )}
        {continuo && (
          <button type="button" className="btn btn-p largo" onClick={fechar}>
            Terminei
          </button>
        )}
      </div>
    </dialog>
  )
}

/** O botão da câmera que fica ao lado de todo campo de número ou código. */
export function BotaoCamera({ abrir, rotulo = 'Ler com a câmera' }: { abrir: () => void; rotulo?: string }) {
  return (
    <button type="button" className="icone-bt icone-bt--leve bt-camera" aria-label={rotulo} title={rotulo} onClick={abrir}>
      <Icone nome="camera" />
    </button>
  )
}
