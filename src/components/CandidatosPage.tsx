import { Fragment, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, ChevronDown, ChevronRight, FileText, Info, Trash2, Users } from 'lucide-react'
import type { Candidato } from '../types'
import { getToken } from '../auth'
import { abrirCurriculo } from '../curriculo'

interface Props {
    /** Sessão expirada: derruba para a tela de login. */
    onSessaoExpirada: () => void
}

function dataCurta(iso: string): string {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

/** Foto de perfil do candidato (busca autenticada), com a inicial como fallback. */
function AvatarCandidato({ c, versao }: { c: Candidato; versao: number }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!c.fotoArquivo) {
            setUrl(null)
            return
        }
        const token = getToken()
        if (!token) return
        let ativo = true
        let objectUrl: string | null = null
        fetch(`/api/candidatos/${c.id}/foto`, { headers: { Authorization: `Bearer ${token}` } })
            .then((resp) => (resp.ok ? resp.blob() : null))
            .then((blob) => {
                if (blob && ativo) {
                    objectUrl = URL.createObjectURL(blob)
                    setUrl(objectUrl)
                }
            })
            .catch(() => {
                // sem foto o avatar cai na inicial
            })
        return () => {
            ativo = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [c.id, c.fotoArquivo, versao])

    // alt vazio: a imagem é decorativa dentro do botão que já carrega o nome
    if (url) return <img className="avatar avatar--foto" src={url} alt="" />
    const inicial = (c.nome ?? '?').trim().charAt(0) || '?'
    return (
        <span className="avatar" aria-hidden="true">
            {inicial}
        </span>
    )
}

interface DetalheProps {
    c: Candidato
    onVerCurriculo: (c: Candidato) => void
    onEnviarFoto: (c: Candidato, arquivo: File) => void
    onExcluir: (c: Candidato) => void
}

function Detalhe({ c, onVerCurriculo, onEnviarFoto, onExcluir }: DetalheProps) {
    const inputFoto = useRef<HTMLInputElement>(null)
    // Exclusão em duas etapas: o primeiro clique só pede a confirmação.
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

    return (
        <tr className="detalhe">
            <td colSpan={5}>
                <div className="detalhe-acoes">
                    {c.curriculoArquivo ? (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onVerCurriculo(c)}
                        >
                            <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                            Ver currículo
                        </button>
                    ) : (
                        <span className="detalhe-sem-arquivo">
                            Currículo não disponível (importado antes do armazenamento de arquivos)
                        </span>
                    )}
                    <input
                        ref={inputFoto}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="input-oculto"
                        aria-label={`Foto de perfil de ${c.nome}`}
                        onChange={(e) => {
                            const arquivo = e.target.files?.[0]
                            if (arquivo) onEnviarFoto(c, arquivo)
                            e.target.value = ''
                        }}
                    />
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => inputFoto.current?.click()}
                    >
                        <Camera size={15} strokeWidth={1.75} aria-hidden="true" />
                        {c.fotoArquivo ? 'Trocar foto' : 'Adicionar foto'}
                    </button>

                    {confirmandoExclusao ? (
                        <span className="excluir-confirmacao">
                            <span>Excluir este candidato e todo o histórico dele?</span>
                            <button type="button" className="btn-danger" onClick={() => onExcluir(c)}>
                                Confirmar exclusão
                            </button>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => setConfirmandoExclusao(false)}
                            >
                                Cancelar
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="btn-secondary btn-excluir"
                            onClick={() => setConfirmandoExclusao(true)}
                        >
                            <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                            Excluir
                        </button>
                    )}
                </div>

                {c.resumo && <p className="resumo">{c.resumo}</p>}
                <div className="colunas">
                    {c.experiencias.length > 0 && (
                        <div>
                            <h4>Experiências</h4>
                            <ul>
                                {c.experiencias.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.formacao.length > 0 && (
                        <div>
                            <h4>Formação</h4>
                            <ul>
                                {c.formacao.map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.pontosFortes.length > 0 && (
                        <div>
                            <h4>Pontos fortes</h4>
                            <ul>
                                {c.pontosFortes.map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {c.habilidades.length > 0 && (
                        <div>
                            <h4>Habilidades</h4>
                            <div className="chips">
                                {c.habilidades.map((h) => (
                                    <span key={h} className="chip">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {c.historico.length > 0 && (
                        <div>
                            <h4>Histórico de análises</h4>
                            <ul>
                                {c.historico.map((h, i) => (
                                    <li key={i}>
                                        {dataCurta(h.dataUtc)} · {h.vaga || 'Vaga sem título'} · {h.score}%
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

export default function CandidatosPage({ onSessaoExpirada }: Props) {
    const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [aberto, setAberto] = useState<string | null>(null)
    // Versão por candidato: só o avatar de quem trocou a foto rebusca a imagem
    // (o nome do arquivo pode não mudar ao trocar).
    const [fotoVersoes, setFotoVersoes] = useState<Record<string, number>>({})
    // Invalida respostas atrasadas de cargas anteriores.
    const geracaoRef = useRef(0)

    function carregar() {
        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }
        const geracao = ++geracaoRef.current
        fetch('/api/candidatos', { headers: { Authorization: `Bearer ${token}` } })
            .then(async (resp) => {
                if (resp.status === 401) {
                    onSessaoExpirada()
                    return
                }
                if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`)
                const data: Candidato[] = await resp.json()
                if (geracao === geracaoRef.current) setCandidatos(data)
            })
            .catch((err) => {
                if (geracao === geracaoRef.current) setErro(err.message ?? 'Erro desconhecido')
            })
    }

    useEffect(() => {
        carregar()
        // ponytail: busca uma vez ao abrir a página; recarregar = navegar de novo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function verCurriculo(c: Candidato) {
        setErro(null)
        try {
            if ((await abrirCurriculo(c.id, c.nomeArquivo)) === 'sem-sessao') onSessaoExpirada()
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        }
    }

    async function enviarFoto(c: Candidato, arquivo: File) {
        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }
        setErro(null)
        try {
            const fd = new FormData()
            fd.append('foto', arquivo)
            const resp = await fetch(`/api/candidatos/${c.id}/foto`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            })
            if (resp.status === 401) {
                onSessaoExpirada()
                return
            }
            if (!resp.ok) {
                let mensagem = `HTTP ${resp.status}`
                try {
                    const data = await resp.json()
                    if (data?.erro) mensagem = data.erro
                } catch {
                    // corpo não-JSON — fica a mensagem com o status
                }
                throw new Error(mensagem)
            }
            setFotoVersoes((m) => ({ ...m, [c.id]: (m[c.id] ?? 0) + 1 }))
            carregar()
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        }
    }

    async function excluirCandidato(c: Candidato) {
        const token = getToken()
        if (!token) {
            onSessaoExpirada()
            return
        }
        setErro(null)
        try {
            const resp = await fetch(`/api/candidatos/${c.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (resp.status === 401) {
                onSessaoExpirada()
                return
            }
            if (!resp.ok) {
                let mensagem = `HTTP ${resp.status}`
                try {
                    const data = await resp.json()
                    if (data?.erro) mensagem = data.erro
                } catch {
                    // corpo não-JSON — fica a mensagem com o status
                }
                throw new Error(mensagem)
            }
            setAberto(null)
            carregar()
        } catch (err: any) {
            setErro(err.message ?? 'Erro desconhecido')
        }
    }

    return (
        <>
            <div className="breadcrumb">
                <span>Candidatos</span>
                <span>/</span>
                <strong>Cadastro</strong>
            </div>

            <div className="result-head">
                <div>
                    <h1>Candidatos</h1>
                    <p>
                        Perfis salvos automaticamente a cada currículo analisado, com as áreas em que
                        cada candidato se destaca.
                    </p>
                </div>
            </div>

            {erro && (
                <div className="alert alert--erro" role="alert">
                    <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span>{erro}</span>
                </div>
            )}

            {!erro && candidatos === null && <p className="page-sub">Carregando candidatos…</p>}

            {candidatos !== null && candidatos.length === 0 && (
                <div className="card table-card vazio-card">
                    <Users size={20} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                    <p>
                        Nenhum candidato salvo ainda. Importe currículos em <strong>Análises</strong>{' '}
                        e os perfis aparecem aqui automaticamente.
                    </p>
                </div>
            )}

            {candidatos !== null && candidatos.length > 0 && (
                <>
                    <div className="card table-card">
                        <div className="tabela-scroll">
                            <table className="tabela">
                                <thead>
                                    <tr>
                                        <th>Candidato</th>
                                        <th>Bom para</th>
                                        <th>Contato</th>
                                        <th>Cidade</th>
                                        <th>Última análise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidatos.map((c) => {
                                        const expandido = aberto === c.id
                                        const ultima = c.historico[c.historico.length - 1]
                                        return (
                                            <Fragment key={c.id}>
                                                <tr>
                                                    <td className="col-candidato">
                                                        <button
                                                            type="button"
                                                            aria-expanded={expandido}
                                                            onClick={() => setAberto(expandido ? null : c.id)}
                                                        >
                                                            {expandido ? (
                                                                <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
                                                            ) : (
                                                                <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" />
                                                            )}
                                                            <AvatarCandidato c={c} versao={fotoVersoes[c.id] ?? 0} />
                                                            {c.nome}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        {c.areasAptidao.length > 0 ? (
                                                            <div className="chips">
                                                                {c.areasAptidao.map((a) => (
                                                                    <span key={a} className="chip chip--area">
                                                                        {a}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="col-muted">
                                                        {[c.email, c.telefone].filter(Boolean).join(' · ') || '—'}
                                                    </td>
                                                    <td className="col-muted">{c.cidade || '—'}</td>
                                                    <td className="col-muted">
                                                        {ultima
                                                            ? `${dataCurta(ultima.dataUtc)} · ${ultima.score}%`
                                                            : '—'}
                                                    </td>
                                                </tr>
                                                {expandido && (
                                                    <Detalhe
                                                        c={c}
                                                        onVerCurriculo={verCurriculo}
                                                        onEnviarFoto={enviarFoto}
                                                        onExcluir={excluirCandidato}
                                                    />
                                                )}
                                            </Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="result-count">
                        {candidatos.length} candidato{candidatos.length === 1 ? '' : 's'} no cadastro
                    </p>
                </>
            )}

            <div className="result-nota">
                <Info size={15} strokeWidth={1.75} color="#98a2b3" aria-hidden="true" />
                <p>As áreas de aptidão são sugeridas pela IA a partir do currículo e não substituem a avaliação do recrutador.</p>
            </div>
        </>
    )
}
